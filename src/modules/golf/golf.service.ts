/**
 * @file src/modules/golf/golf.service.ts
 * @description Service layer that analyzes round data and computes statistics.
 */

import { HoleRecord, RoundSummary } from './golf.types';

export const golfService = {
    /**
     * Calculate summary statistics from hole data.
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
            doubleBogeys: 0,
            tripleBogeysOrWorse: 0,
            obCount: 0,
            penaltyCount: 0,
            missShots: {
                '슬라이스': 0, '훅': 0, '뒤땅': 0, '생크': 0, '벙커': 0, '쓰리펏': 0
            }
        };

        const legacyMap: Record<string, string> = {
            'Slice': '슬라이스',
            'Hook': '훅',
            'Fat': '뒤땅',
            'Shank': '생크',
            'Bunker': '벙커',
            'Three-putt': '쓰리펏',
            'Three-Putt': '쓰리펏'
        };

        if (validHoles.length === 0) return summary;

        let girSuccessCount = 0;

        validHoles.forEach(hole => {
            summary.totalScore += hole.stroke;
            summary.totalPar += hole.par;
            summary.totalPutt += hole.putt;
            summary.obCount += (hole.ob || 0);
            summary.penaltyCount += (hole.penalty || 0);

            if (hole.missShot && hole.missShot !== '없음') {
                const patterns = hole.missShot.split(',').map(s => s.trim());
                patterns.forEach(p => {
                    const normalized = legacyMap[p] || p;
                    if (summary.missShots[normalized] !== undefined) {
                        summary.missShots[normalized]++;
                    }
                });
            }

            // GIR determination: use stored isGIR field if available, otherwise compute inline
            if (hole.isGIR ?? ((hole.stroke - hole.putt) <= (hole.par - 2))) girSuccessCount++;

            // Score type determination
            const relativeScore = hole.stroke - hole.par;
            if (relativeScore <= -2) summary.eagles++;
            else if (relativeScore === -1) summary.birdies++;
            else if (relativeScore === 0) summary.pars++;
            else if (relativeScore === 1) summary.bogeys++;
            else if (relativeScore === 2) summary.doubleBogeys++;
            else if (relativeScore >= 3) summary.tripleBogeysOrWorse++;
        });

        summary.girRate = Math.round((girSuccessCount / validHoles.length) * 100);

        return summary;
    }
};
