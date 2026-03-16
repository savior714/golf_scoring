/**
 * @file src/modules/golf/service/validateClubData.ts
 * @description 구장 마스터 데이터의 무결성을 100% 검증하는 Zero-Tolerance 검증 엔진
 */

export interface ValidationResult {
    isValid: boolean;
    issues: string[];
    warnings: string[];
}

/**
 * 구장 데이터(Club)의 무결성을 전수 검사합니다.
 * "완벽하지 않은 데이터는 등록하지 않는다"는 원칙(Zero-Tolerance)을 준수하되,
 * 상식적인 범위 내의 비표준 데이터(예: Par 37 코스)는 'Warning'으로 허용합니다.
 */
export function validateClubData(club: unknown): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!club || typeof club !== 'object') {
        issues.push("구장 데이터가 올바르지 않습니다.");
        return { isValid: false, issues, warnings };
    }

    const c = club as Record<string, unknown>;

    // 1. 구장 기본 메타데이터 검증
    if (!c.name || typeof c.name !== "string" || c.name.trim() === "") {
        issues.push("구장명이 누락되었거나 올바르지 않습니다.");
    }

    if (!Array.isArray(c.courses) || c.courses.length === 0) {
        issues.push(`${(c.name as string) || "구장"}: 코스 정보가 최소 1개 이상 필요합니다.`);
        return { isValid: false, issues, warnings };
    }

    // 2. 코스별 검증 (9홀 단위)
    c.courses.forEach((course: unknown, cIdx: number) => {
        if (!course || typeof course !== 'object') return;
        const co = course as Record<string, unknown>;
        const courseName = (co.name as string) || `코스 ${cIdx + 1}`;
        const prefix = `[${courseName}]`;

        if (!co.name || typeof co.name !== "string" || co.name.trim() === "") {
            issues.push(`${prefix}: 코스 이름이 누락되었습니다.`);
        }

        if (!Array.isArray(co.holes)) {
            issues.push(`${prefix}: 홀 정보가 배열 형태가 아닙니다.`);
            return;
        }

        const holes = co.holes as unknown[];

        // 홀 수 강제 (반드시 9홀)
        if (holes.length !== 9) {
            issues.push(`${prefix}: 홀 수가 9개가 아닙니다. (현재 ${holes.length}개)`);
        }

        // Par 합계 계산
        const totalPar = holes.reduce((sum: number, h: unknown) => {
            if (!h || typeof h !== 'object') return sum;
            return sum + (Number((h as Record<string, unknown>).par) || 0);
        }, 0);

        // Par 합계 검증 (36 기준 Soft Validation)
        if (holes.length === 9) {
            if (totalPar < 33 || totalPar > 39) {
                issues.push(`${prefix}: 9홀 Par 합계가 일반적인 범위를 벗어납니다. (33~39 사이 필요, 현재: ${totalPar})`);
            } else if (totalPar !== 36) {
                warnings.push(`${prefix}: 9홀 Par 합계가 표준(36)과 다릅니다. (현재: ${totalPar}). 실제 코스 정보가 맞는지 확인이 필요합니다.`);
            }
        }

        // 3. 홀별/티별 세부 검증
        holes.forEach((hole: unknown, hIdx: number) => {
            if (!hole || typeof hole !== 'object') return;
            const ho = hole as Record<string, unknown>;
            const hNum = (ho.holeNumber as number) || (hIdx + 1);
            const holePrefix = `${prefix} ${hNum}홀`;

            // 홀 번호 순차 체크
            if (ho.holeNumber !== hIdx + 1) {
                issues.push(`${holePrefix}: 홀 번호 순서가 올바르지 않습니다. (기대: ${hIdx + 1}, 실제: ${String(ho.holeNumber)})`);
            }

            // Par 값 범위 체크
            const par = Number(ho.par);
            if (isNaN(par) || par < 3 || par > 6) {
                issues.push(`${holePrefix}: Par 값이 비정상적입니다. (3~6 사이 필요, 현재: ${String(ho.par)})`);
            }

            // 티별 전장(Distance) 검증
            if (!Array.isArray(ho.distances) || ho.distances.length === 0) {
                issues.push(`${holePrefix}: 티별 전장(Distance) 정보가 최소 1개 이상 필요합니다.`);
            } else {
                (ho.distances as unknown[]).forEach((dist: unknown, dIdx: number) => {
                    if (!dist || typeof dist !== 'object') return;
                    const di = dist as Record<string, unknown>;
                    const teeName = (di.teeColor as string) || `티 ${dIdx + 1}`;
                    if (!di.teeColor) {
                        issues.push(`${holePrefix}: 티 색상이 누락되었습니다.`);
                    }
                    if (typeof di.distanceMeter !== "number" || di.distanceMeter <= 0) {
                        issues.push(`${holePrefix} (${teeName}): 전장(m)은 0보다 큰 숫자여야 합니다.`);
                    }
                });
            }
        });
    });

    return {
        isValid: issues.length === 0,
        issues,
        warnings
    };
}
