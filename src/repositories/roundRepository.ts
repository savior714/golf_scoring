/**
 * @file src/repositories/roundRepository.ts
 * @description AsyncStorage를 사용한 물리 데이터 접근 계층
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GolfRound } from '../domains/golf';

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
    }
};
