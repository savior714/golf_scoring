/**
 * @file src/modules/golf/golf.service.ts
 * @description Service layer that analyzes round data and computes statistics.
 */

import { HoleRecord, RoundSummary, GolfRound } from './golf.types';

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

            // GIR determination
            if (this.isGIR(hole.stroke, hole.putt, hole.par)) girSuccessCount++;

            // Score type determination
            const relativeScore = hole.stroke - hole.par;
            if (relativeScore <= -2) summary.eagles++;
            else if (relativeScore === -1) summary.birdies++;
            else if (relativeScore === 0) summary.pars++;
            else if (relativeScore === 1) summary.bogeys++;
            else if (relativeScore >= 2) summary.doubleBogeys++;
        });

        summary.girRate = Math.round((girSuccessCount / validHoles.length) * 100);

        return summary;
    },

    /**
     * Determine if it's a Green In Regulation (GIR).
     */
    isGIR(stroke: number, putt: number, par: number): boolean {
        return (stroke - putt) <= (par - 2);
    },

    /**
     * Logic for automatically adding/removing 'Three-putt' (쓰리펏) pattern.
     */
    updateMissShotPatterns(currentMissShot: string | undefined, putt: number): string {
        const patterns = (!currentMissShot || currentMissShot === '없음') 
            ? [] 
            : currentMissShot.split(',').map(p => p.trim());
        
        const hasThreePutt = patterns.includes('쓰리펏');

        if (putt >= 3) {
            if (!hasThreePutt) {
                const next = patterns.length >= 2 ? [...patterns.slice(1), '쓰리펏'] : [...patterns, '쓰리펏'];
                return next.join(',');
            }
        } else {
            if (hasThreePutt) {
                const filtered = patterns.filter(p => p !== '쓰리펏');
                return filtered.length > 0 ? filtered.join(',') : '없음';
            }
        }

        return currentMissShot || '없음';
    },

    /**
     * Get initial or existing data for a specific hole.
     */
    getHoleData(holeNo: number, holeRecords: HoleRecord[], combinedPars: number[]): Partial<HoleRecord> {
        const existing = holeRecords.find(r => r.holeNo === holeNo);
        // missShot이 undefined로 저장된 기록은 '없음'으로 정규화하여 컴포넌트 크래시 방지
        if (existing) return { ...existing, missShot: existing.missShot ?? '없음' };

        const defaultPar = combinedPars[holeNo - 1] || 4;
        return {
            holeNo,
            par: defaultPar,
            stroke: defaultPar,
            putt: 2,
            ob: 0,
            penalty: 0,
            missShot: '없음',
            isFairway: true,
        };
    },

    /**
     * Calculate combined pars for a full 18-hole round.
     */
    calculateCombinedPars(outCourseHoles: { par: number }[], inCourseHoles: { par: number }[]): number[] {
        return [
            ...outCourseHoles.map(h => h.par),
            ...inCourseHoles.map(h => h.par)
        ];
    },

    /**
     * Strategy for merging local and remote rounds (Conflict Resolution).
     */
    resolveMergedRounds(local: GolfRound[], remote: GolfRound[]): GolfRound[] {
        const mergedMap = new Map<string, GolfRound>();
        local.forEach(r => mergedMap.set(r.id, r));

        remote.forEach(rem => {
            const loc = mergedMap.get(rem.id);
            if (!loc) {
                mergedMap.set(rem.id, rem);
            } else if (rem.updatedAt > (loc.updatedAt || 0)) {
                mergedMap.set(rem.id, rem);
            } else if (rem.updatedAt === (loc.updatedAt || 0)) {
                if (rem.holes.length > loc.holes.length) {
                    mergedMap.set(rem.id, rem);
                }
            }
        });

        return Array.from(mergedMap.values());
    },

    /**
     * Identify which round should be displayed on the dashboard.
     */
    getDashboardDisplayRound(rounds: GolfRound[], currentId?: string | null, selectedId?: string): GolfRound | null {
        if (!rounds || rounds.length === 0) return null;
        
        if (selectedId) {
            const selected = rounds.find(r => r.id === selectedId);
            if (selected) return selected;
        }
        
        if (currentId) {
            const current = rounds.find(r => r.id === currentId);
            if (current) return current;
        }
        
        return rounds[0]; // Fallback to latest
    }
};