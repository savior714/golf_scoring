import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../shared/lib/supabase';
import { GolfRound } from './golf.types';

const BASE_STORAGE_KEY = '@golf_rounds_data';

/**
 * 사용자 세션 기반 저장소 키 캐싱
 */
let cachedStorageKey: string | null = null;

async function getStorageKey(): Promise<string> {
    if (cachedStorageKey) return cachedStorageKey;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
        cachedStorageKey = `${BASE_STORAGE_KEY}_${session.user.id}`;
        return cachedStorageKey;
    }
    return BASE_STORAGE_KEY; // Fallback for anonymous or guest
}

// 인증 상태 변경 시 캐시 초기화
supabase.auth.onAuthStateChange(() => {
    cachedStorageKey = null;
});

export const roundRepository = {
    /**
     * 모든 라운딩 기록 조회
     */
    async getAllRounds(): Promise<GolfRound[]> {
        try {
            const key = await getStorageKey();
            const jsonValue = await AsyncStorage.getItem(key);
            const localRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
            return localRounds;
        } catch (e) {
            console.error('Failed to fetch rounds from local storage', e);
            return [];
        }
    },

    /**
     * 클라우드(Supabase)에서 모든 라운딩 데이터 가져오기
     */
    async pullRoundsFromSupabase(): Promise<{ success: boolean; count: number; error?: unknown }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            // 1. 라운드 정보 조회
            const { data: roundsData, error: roundsError } = await supabase
                .from('rounds')
                .select('*')
                .eq('user_id', session.user.id)
                .order('date', { ascending: false });

            if (roundsError) throw roundsError;
            if (!roundsData || roundsData.length === 0) return { success: true, count: 0 };

            // 2. 전체 홀 정보 조회 (한 번의 요청으로 최적화)
            const roundIds = roundsData.map(r => r.id);
            const { data: holesData, error: holesError } = await supabase
                .from('holes')
                .select('*')
                .in('round_id', roundIds);

            if (holesError) throw holesError;

            // 3. 데이터 매핑 (DB -> Domain 모델)
            const remoteRounds: GolfRound[] = roundsData.map(r => ({
                id: r.id,
                date: r.date,
                courseName: r.course_name,
                courseType: r.course_type,
                memo: r.memo || '',
                holes: (holesData || [])
                    .filter(h => h.round_id === r.id)
                    .map(h => ({
                        holeNo: h.hole_no,
                        par: h.par,
                        stroke: h.stroke,
                        putt: h.putt,
                        isFairway: h.is_fairway,
                        isGIR: h.is_gir,
                        ob: h.ob,
                        penalty: h.penalty,
                        missShot: h.miss_shot
                    }))
                    .sort((a, b) => a.holeNo - b.holeNo)
            }));

            // 4. 로컬 데이터와 병합 (ID 기준 최신화)
            const key = await getStorageKey();
            const localJson = await AsyncStorage.getItem(key);
            const localRounds: GolfRound[] = localJson ? JSON.parse(localJson) : [];

            // 클라우드 데이터를 기준으로 병합 (클라우드 데이터 우선)
            const mergedRounds = [...remoteRounds];
            localRounds.forEach(lr => {
                if (!mergedRounds.some(rr => rr.id === lr.id)) {
                    mergedRounds.push(lr);
                }
            });

            await AsyncStorage.setItem(key, JSON.stringify(mergedRounds));
            return { success: true, count: remoteRounds.length };
        } catch (e) {
            console.error('Failed to pull from Supabase', e);
            return { success: false, count: 0, error: e };
        }
    },

    /**
     * 새로운 라운딩 저장 또는 업데이트
     */
    async saveRound(newRound: GolfRound): Promise<void> {
        try {
            const key = await getStorageKey();
            const jsonValue = await AsyncStorage.getItem(key);
            const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
            const updatedRounds = [newRound, ...existingRounds.filter(r => r.id !== newRound.id)];
            await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
        } catch (e) {
            console.error('Failed to save round', e);
        }
    },

    /**
     * Supabase 클라우드 동기화
     */
    async syncRoundToSupabase(round: GolfRound): Promise<{ success: boolean; error?: unknown }> {
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
    async syncAllLocalRounds(): Promise<{ total: number; success: number; errors: unknown[] }> {
        const rounds = await this.getAllRounds();
        const results = await Promise.all(rounds.map(round => this.syncRoundToSupabase(round)));

        const errors: unknown[] = results
            .filter(r => !r.success)
            .map((r, i) => ({ id: rounds[i].id, error: r.error }));

        return { total: rounds.length, success: rounds.length - errors.length, errors };
    },

    /**
     * 익명 사용자 데이터를 현재 로그인된 사용자로 마이그레이션
     */
    async migrateAnonymousData(): Promise<{ migrated: number; errors: unknown[] }> {
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
            const syncResults = await Promise.all(anonymousRounds.map(r => this.syncRoundToSupabase(r)));
            const migratedCount = syncResults.filter(r => r.success).length;
            const errors: unknown[] = syncResults.filter(r => !r.success).map(r => r.error);

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
            const jsonValue = await AsyncStorage.getItem(key);
            const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
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
