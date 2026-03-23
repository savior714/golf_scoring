/**
 * @file src/modules/golf/domain/services/golf.domain.service.ts
 * @description Pure domain service for golf-related business logic and statistics.
 */

import { HoleRecord, RoundSummary, GolfRound, AdvancedStats } from '../golf.types';

export const golfDomainService = {
    /**
     * Determine if it's a Green In Regulation (GIR).
     * Rule: (stroke - putt) <= (par - 2)
     */
    isGIR(stroke: number, putt: number, par: number): boolean {
        return (stroke - putt) <= (par - 2);
    },

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
                '슬라이스': 0, '훅': 0, '뒤땅/탑볼': 0, '생크': 0, '벙커': 0, '쓰리펏': 0
            },
            ironMissShots: {
                '슬라이스': 0, '훅': 0, '뒤땅/탑볼': 0, '생크': 0, '벙커': 0, '쓰리펏': 0
            },
            driverMissShots: {
                '슬라이스': 0, '훅': 0, '뒤땅/탑볼': 0, '생크': 0, '벙커': 0, '쓰리펏': 0
            },
        };

        const legacyMap: Record<string, string> = {
            'Slice': '슬라이스',
            'Hook': '훅',
            'Fat': '뒤땅/탑볼',
            '뒤땅': '뒤땅/탑볼',
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
                    if (hole.par === 3) {
                        if (summary.ironMissShots[normalized] !== undefined) {
                            summary.ironMissShots[normalized]++;
                        }
                    } else {
                        if (summary.driverMissShots[normalized] !== undefined) {
                            summary.driverMissShots[normalized]++;
                        }
                    }
                });
            }

            if (this.isGIR(hole.stroke, hole.putt, hole.par)) girSuccessCount++;

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
     * Calculate advanced statistics for multiple rounds to show trends.
     */
    calculateAdvancedStats(rounds: GolfRound[]): AdvancedStats[] {
        return rounds
            .filter(r => r.holes.length > 0)
            .map(round => {
                const summary = this.calculateSummary(round.holes);
                return {
                    date: round.date,
                    totalScore: summary.totalScore,
                    avgPutt: Number((summary.totalPutt / (round.holes.length || 1)).toFixed(2)),
                    girRate: summary.girRate,
                    missShots: summary.missShots,
                    ironMissShots: summary.ironMissShots,
                    driverMissShots: summary.driverMissShots,
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date));
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
     * Normalize club name to a standard format (e.g., '내장산 골프앤리조트' -> '내장산CC').
     */
    normalizeClubName(name: string): string {
        if (!name) return '';
        
        let normalized = name.trim();
        const suffixes = [
            '골프앤리조트', '골프앤드리조트', '골프 & 리조트', 
            '컨트리클럽', '컨트리 클럽', '골프클럽', '골프 클럽',
            '골프장', 'CC', 'GC', 'G.C', 'C.C'
        ];
        
        suffixes.forEach(suffix => {
            const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`${escaped}$`, 'i');
            normalized = normalized.replace(regex, '');
        });
        
        normalized = normalized.trim();
        return normalized ? `${normalized}CC` : name;
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

        return Array.from(mergedMap.values()).sort((a, b) => {
            const dateComp = b.date.localeCompare(a.date);
            if (dateComp !== 0) return dateComp;
            const timeComp = (b.updatedAt || 0) - (a.updatedAt || 0);
            if (timeComp !== 0) return timeComp;
            return b.id.localeCompare(a.id);
        });
    },

    /**
     * Validate round data (player scores) for anomalies.
     */
    validateRoundData(round: GolfRound) {
        const issues: string[] = [];
        const holes = round.holes;

        if (holes.length === 0) {
            issues.push('입력된 홀 정보가 없습니다.');
            return { isValid: false, issues };
        }

        holes.forEach(h => {
            const prefix = `${h.holeNo}번 홀`;
            if (h.stroke > 15) {
                issues.push(`${prefix}: 비정상적으로 높은 타수(${h.stroke}타)가 입력되었습니다.`);
            }
            if (h.putt > 6) {
                issues.push(`${prefix}: 비정상적으로 높은 퍼트 수(${h.putt}회)가 입력되었습니다.`);
            }
            if (h.stroke <= h.putt && h.par > 0) {
                issues.push(`${prefix}: 타수는 반드시 퍼트 수보다 커야 합니다.`);
            }
        });

        return {
            isValid: issues.length === 0,
            issues
        };
    },

    /**
     * Validate course master data (Club/Course/Hole) for integrity.
     */
    validateClubData(club: any) {
        const issues: string[] = [];
        const warnings: string[] = [];
        
        if (!club.name?.trim()) issues.push('구장명이 누락되었습니다.');
        
        const courses = club.courses || [];
        if (courses.length === 0) issues.push('코스 정보가 없습니다.');
        
        courses.forEach((course: any, cIdx: number) => {
            const courseName = course.name || course.courseName || `코스 ${cIdx + 1}`;
            const prefix = `[${courseName}]`;
            
            const holes = course.holes || [];
            if (holes.length !== 9 && holes.length !== 18) {
                issues.push(`${prefix}: 홀 수가 유효하지 않습니다. (현재 ${holes.length}개, 9홀 또는 18홀 필요)`);
            }
            
            const parSum = holes.reduce((sum: number, h: any) => sum + (Number(h.par) || 0), 0);
            const expectedPar = holes.length === 9 ? 36 : 72;
            if (parSum !== expectedPar && parSum > 0) {
                warnings.push(`${prefix}: 파 합계가 ${expectedPar}이 아닙니다. (현재 ${parSum})`);
            }
            
            holes.forEach((h: any, hIdx: number) => {
                const expectedHoleNum = hIdx + 1;
                // holeNumber might be string or number from inputs
                const holeNum = Number(h.holeNumber || h.holeNo);
                if (holeNum !== expectedHoleNum) {
                    // warnings.push(`${prefix}: ${expectedHoleNum}번 홀의 번호(${holeNum})가 일치하지 않습니다.`);
                }
                
                const distances = h.distances || [];
                const distanceValues = Array.isArray(distances) 
                    ? distances.map(d => d.distanceMeter)
                    : Object.values(distances);
                
                if (distanceValues.length === 0) {
                    issues.push(`${prefix}: ${expectedHoleNum}번 홀의 거리 데이터가 없습니다.`);
                }
                
                distanceValues.forEach((d: any) => {
                    const dist = Number(d);
                    if (isNaN(dist) || dist <= 0) {
                        issues.push(`${prefix}: ${expectedHoleNum}번 홀의 거리가 유효하지 않습니다.`);
                    }
                });
            });
        });
        
        return {
            isValid: issues.length === 0,
            issues,
            warnings
        };
    },

    /**
     * Get initial or existing data for a specific hole.
     */
    getHoleData(holeNo: number, holeRecords: HoleRecord[], combinedPars: number[]): Partial<HoleRecord> {
        const existing = holeRecords.find(r => r.holeNo === holeNo);
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
        };
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
        
        const sorted = [...rounds].sort((a, b) => b.date.localeCompare(a.date));
        return sorted[0] ?? null;
    },

    /**
     * Estimate USGA-style handicap based on recent round data.
     */
    estimateHandicap(rounds: GolfRound[]): number | null {
        if (!rounds || rounds.length < 5) return null;

        const recentRounds = rounds.slice(0, 20);
        const differentials = recentRounds
            .map(r => {
                const summary = this.calculateSummary(r.holes);
                return summary.totalScore - 72;
            })
            .sort((a, b) => a - b);

        const bestNCount = Math.min( bestDifferentialsCount(differentials.length), 5); // simplified match
        const bestDifferentials = differentials.slice(0, bestNCount || 1);
        const averageDiff = bestDifferentials.reduce((acc, val) => acc + val, 0) / (bestDifferentials.length || 1);

        return Math.floor(averageDiff * 0.96 * 10) / 10;
    }
};

function bestDifferentialsCount(total: number): number {
    return Math.ceil(total * 0.25);
}
