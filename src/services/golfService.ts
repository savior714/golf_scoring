/**
 * @file src/services/golfService.ts
 * @description 골프 점수 및 통계 계산 로직을 담당하는 서비스 계층
 */

import { GolfRound, RoundSummary } from '../domains/golf';

export const golfService = {
    /**
     * 단일 라운딩의 통계 요약 계산
     */
    calculateSummary(round: GolfRound): RoundSummary {
        let totalScore = 0;
        let totalPutt = 0;
        let birdies = 0;
        let pars = 0;
        let girCount = 0;
        let obCount = 0;

        // 18홀을 순회하며 데이터 집계
        round.holes.forEach((hole) => {
            totalScore += hole.stroke;
            totalPutt += hole.putt;

            const scoreDiff = hole.stroke - hole.par;
            if (scoreDiff === -1) birdies++;      // Birdie
            if (scoreDiff === 0) pars++;        // Par

            // GIR (Green In Regulation) 로직
            // Par 3: 1온, Par 4: 2온, Par 5: 3온 이하일 때 true
            // 즉, stroke - putt <= par - 2
            if (hole.isGIR) girCount++;

            obCount += hole.penalty;
        });

        const girRate = round.holes.length > 0
            ? Math.round((girCount / round.holes.length) * 100)
            : 0;

        return {
            totalScore,
            totalPutt,
            girRate,
            birdies,
            pars,
            obCount,
        };
    }
};
