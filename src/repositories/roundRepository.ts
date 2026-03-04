import AsyncStorage from '@react-native-async-storage/async-storage';
import { GolfRound } from '../domains/golf';
import { supabase } from '../lib/supabase';

const BASE_STORAGE_KEY = '@golf_rounds_data';

/**
 * 현재 로그인된 사용자 ID를 기반으로 저장소 키 생성
 */
async function getStorageKey(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
        return `${BASE_STORAGE_KEY}_${session.user.id}`;
    }
    return BASE_STORAGE_KEY; // Fallback for anonymous or guest
}

export const roundRepository = {
    /**
     * 모든 라운딩 기록 조회
     */
    async getAllRounds(): Promise<GolfRound[]> {
        try {
            const key = await getStorageKey();
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to fetch rounds', e);
            return [];
        }
    },

    /**
     * 새로운 라운딩 저장 또는 업데이트
     */
    async saveRound(newRound: GolfRound): Promise<void> {
        try {
            const key = await getStorageKey();
            const existingRounds = await this.getAllRounds();
            const updatedRounds = [newRound, ...existingRounds.filter(r => r.id !== newRound.id)];
            await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
        } catch (e) {
            console.error('Failed to save round', e);
        }
    },

    /**
     * Supabase 클라우드 동기화
     */
    async syncRoundToSupabase(round: GolfRound): Promise<{ success: boolean; error?: any }> {
        try {
            // 0. 사용자 식별
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            // 1. 라운드 정보 Upsert
            const { error: roundError } = await supabase
                .from('rounds')
                .upsert({
                    id: round.id,
                    user_id: session.user.id, // 명시적으로 포함
                    date: round.date,
                    course_name: round.courseName,
                    course_type: round.courseType,
                    memo: round.memo
                });

            if (roundError) throw roundError;

            // 2. 홀 정보 Upsert (Batch)
            if (round.holes.length > 0) {
                const holesToSync = round.holes.map(h => ({
                    round_id: round.id,
                    hole_no: h.holeNo,
                    par: h.par,
                    stroke: h.stroke,
                    putt: h.putt,
                    is_fairway: h.isFairway,
                    is_gir: h.isGIR,
                    ob: h.ob,
                    penalty: h.penalty,
                    miss_shot: h.missShot
                }));

                const { error: holeError } = await supabase
                    .from('holes')
                    .upsert(holesToSync, { onConflict: 'round_id,hole_no' });

                if (holeError) throw holeError;
            }

            return { success: true };
        } catch (e) {
            console.error('Supabase sync failed', e);
            return { success: false, error: e };
        }
    },

    /**
     * 현재 진행 중인 라운딩 ID 조회
     */
    async getCurrentRoundId(): Promise<string | null> {
        return await AsyncStorage.getItem('@current_round_id');
    },

    /**
     * 현재 진행 중인 라운딩 ID 설정
     */
    async setCurrentRoundId(roundId: string | null): Promise<void> {
        if (roundId === null) {
            await AsyncStorage.removeItem('@current_round_id');
        } else {
            await AsyncStorage.setItem('@current_round_id', roundId);
        }
    },

    /**
     * 모든 로컬 데이터를 Supabase로 일괄 동기화
     */
    async syncAllLocalRounds(): Promise<{ total: number; success: number; errors: any[] }> {
        const rounds = await this.getAllRounds();
        let successCount = 0;
        const errors: any[] = [];

        for (const round of rounds) {
            const result = await this.syncRoundToSupabase(round);
            if (result.success) {
                successCount++;
            } else {
                errors.push({ id: round.id, error: result.error });
            }
        }

        return { total: rounds.length, success: successCount, errors };
    },

    /**
     * 익명 사용자 데이터를 현재 로그인된 사용자로 마이그레이션
     */
    async migrateAnonymousData(): Promise<{ migrated: number; errors: any[] }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { migrated: 0, errors: ['User not logged in'] };

            // 1. 구형 키에서 데이터 로드
            const anonymousDataJson = await AsyncStorage.getItem(BASE_STORAGE_KEY);
            const currentRoundId = await AsyncStorage.getItem('@current_round_id');

            if (!anonymousDataJson && !currentRoundId) {
                return { migrated: 0, errors: [] };
            }

            const anonymousRounds: GolfRound[] = anonymousDataJson ? JSON.parse(anonymousDataJson) : [];

            // 2. 신규 사용자 키로 데이터 병합 및 저장
            const userKey = await getStorageKey();
            const existingUserJson = await AsyncStorage.getItem(userKey);
            const existingUserRounds: GolfRound[] = existingUserJson ? JSON.parse(existingUserJson) : [];

            // 중복 제거 및 병합
            const mergedRounds = [...anonymousRounds];
            existingUserRounds.forEach(ur => {
                if (!mergedRounds.some(mr => mr.id === ur.id)) {
                    mergedRounds.push(ur);
                }
            });

            await AsyncStorage.setItem(userKey, JSON.stringify(mergedRounds));

            // 3. 클라우드 기습 동기화 (가장 소중한 데이터를 서버로!)
            let migratedCount = 0;
            const errors: any[] = [];
            for (const round of anonymousRounds) {
                const res = await this.syncRoundToSupabase(round);
                if (res.success) migratedCount++;
                else errors.push(res.error);
            }

            // 4. 익명 데이터 삭제 (안전하게 동기화 시도 후 또는 이전 완료 후)
            await AsyncStorage.removeItem(BASE_STORAGE_KEY);
            // 진행 중인 라운드 ID는 유지 (이미 다른 로직에서 처리 가능하게)

            return { migrated: anonymousRounds.length, errors };
        } catch (e) {
            console.error('Migration failed', e);
            return { migrated: 0, errors: [e] };
        }
    },

    /**
     * 라운딩 기록 삭제
     */
    async deleteRound(roundId: string): Promise<void> {
        try {
            // 1. 로컬 삭제
            const key = await getStorageKey();
            const existingRounds = await this.getAllRounds();
            const updatedRounds = existingRounds.filter(r => r.id !== roundId);
            await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));

            // 현재 진행 중인 라운드와 같다면 초기화
            const currentId = await this.getCurrentRoundId();
            if (currentId === roundId) {
                await this.setCurrentRoundId(null);
            }

            // 2. 원격 삭제 (Supabase) - cascade 설정으로 holes도 자동 삭제됨
            const { error } = await supabase.from('rounds').delete().eq('id', roundId);
            if (error) throw error;

        } catch (e) {
            console.error('Failed to delete round', e);
            throw e;
        }
    }
};
