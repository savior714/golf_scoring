/**
 * @file src/modules/golf/golf.service.ts
 * @description Service layer that analyzes round data and computes statistics.
 */

import { HoleRecord, RoundSummary, GolfRound, AdvancedStats } from './golf.types';
import { validateClubData } from './service/validateClubData';

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
            '뒤땅': '뒤땅/탑볼',   // 기존 '뒤땅' 데이터 → '뒤땅/탑볼'로 집계
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
                    // 전체 집계
                    if (summary.missShots[normalized] !== undefined) {
                        summary.missShots[normalized]++;
                    }
                    // 상황별 집계 (Par 3 vs Par 4+)
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
        };
    },

    /**
     * Normalize club name to a standard format (e.g., '내장산 골프앤리조트' -> '내장산CC').
     */
    normalizeClubName(name: string): string {
        if (!name) return '';
        
        let normalized = name.trim();
        
        // 제거할 접미사 패턴들 (긴 것부터 제거하여 오동작 방지)
        const suffixes = [
            '골프앤리조트', '골프앤드리조트', '골프 & 리조트', 
            '컨트리클럽', '컨트리 클럽', '골프클럽', '골프 클럽',
            '골프장', 'CC', 'GC', 'G.C', 'C.C'
        ];
        
        // 모든 접미사 제거
        suffixes.forEach(suffix => {
            const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`${escaped}$`, 'i');
            normalized = normalized.replace(regex, '');
        });
        
        normalized = normalized.trim();
        
        // 최종적으로 'CC'를 붙임 (단, 이름이 이미 'CC'로 끝나는 경우는 제외 - 위에서 이미 제거됨)
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

        // 날짜 내림차순, 동일 날짜 내에서는 ID 내림차순으로 정렬하여 반환 (안정성 확보)
        return Array.from(mergedMap.values()).sort((a, b) => {
            const dateComp = b.date.localeCompare(a.date);
            return dateComp !== 0 ? dateComp : b.id.localeCompare(a.id);
        });
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
    },

    /**
     * Validate course master data integrity.
     */
    validateClubData(club: unknown) {
        return validateClubData(club);
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
    }
};