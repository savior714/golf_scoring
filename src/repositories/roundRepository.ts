import AsyncStorage from '@react-native-async-storage/async-storage';
import { GolfRound } from '../domains/golf';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = '@golf_rounds_data';

export const roundRepository = {
    /**
     * 모든 라운딩 기록 조회
     */
    async getAllRounds(): Promise<GolfRound[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
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
            const existingRounds = await this.getAllRounds();
            const updatedRounds = [newRound, ...existingRounds.filter(r => r.id !== newRound.id)];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRounds));
        } catch (e) {
            console.error('Failed to save round', e);
        }
    },

    /**
     * Supabase 클라우드 동기화
     */
    async syncRoundToSupabase(round: GolfRound): Promise<{ success: boolean; error?: any }> {
        try {
            // 1. 라운드 정보 Upsert
            const { error: roundError } = await supabase
                .from('rounds')
                .upsert({
                    id: round.id,
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
    }
};
