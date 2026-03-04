/**
 * @file src/services/golfService.ts
 * @description 라운딩 데이터를 분석하여 통계를 산출하는 서비스 레이어
 */

import { HoleRecord, RoundSummary } from '../domains/golf';

export const golfService = {
    /**
     * 홀 데이터를 기반으로 요약 통계 계산
     */
    calculateSummary(holes: HoleRecord[]): RoundSummary {
        const validHoles = holes.filter(h => h.stroke > 0);

        const summary: RoundSummary = {
            totalScore: 0,
            totalPar: 0,
            totalPutt: 0,
            girRate: 0,
            eagles: 0,
            birdies: 0,
            pars: 0,
            bogeys: 0,
            doubles: 0,
            obCount: 0,
            penaltyCount: 0,
            missShots: {
                '슬라이스': 0, '훅': 0, '탑볼': 0, '뒤땅': 0, '뽕샷': 0, '생크': 0
            }
        };

        if (validHoles.length === 0) return summary;

        let girSuccessCount = 0;

        validHoles.forEach(hole => {
            summary.totalScore += hole.stroke;
            summary.totalPar += hole.par;
            summary.totalPutt += hole.putt;
            summary.obCount += (hole.ob || 0);
            summary.penaltyCount += (hole.penalty || 0);

            if (hole.missShot && hole.missShot !== '없음' && summary.missShots[hole.missShot] !== undefined) {
                summary.missShots[hole.missShot]++;
            }

            // GIR 판정: 온그린 타수(전체-퍼트)가 파-2 이하인 경우
            const isOnGreenInReg = (hole.stroke - hole.putt) <= (hole.par - 2);
            if (isOnGreenInReg) girSuccessCount++;

            // 스코어 타입 판정
            const relativeScore = hole.stroke - hole.par;
            if (relativeScore <= -2) summary.eagles++;
            else if (relativeScore === -1) summary.birdies++;
            else if (relativeScore === 0) summary.pars++;
            else if (relativeScore === 1) summary.bogeys++;
            else if (relativeScore >= 2) summary.doubles++;
        });

        summary.girRate = Math.round((girSuccessCount / validHoles.length) * 100);

        return summary;
    }
};
