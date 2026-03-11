/**
 * @file src/modules/golf/service/validateClubData.ts
 * @description 구장 마스터 데이터의 무결성을 100% 검증하는 Zero-Tolerance 검증 엔진
 */

export interface ValidationResult {
    isValid: boolean;
    issues: string[];
}

/**
 * 구장 데이터(Club)의 무결성을 전수 검사합니다.
 * "완벽하지 않은 데이터는 등록하지 않는다"는 원칙(Zero-Tolerance)을 준수합니다.
 */
export function validateClubData(club: any): ValidationResult {
    const issues: string[] = [];

    // 1. 구장 기본 메타데이터 검증
    if (!club.name || typeof club.name !== "string" || club.name.trim() === "") {
        issues.push("구장명이 누락되었거나 올바르지 않습니다.");
    }

    if (!Array.isArray(club.courses) || club.courses.length === 0) {
        issues.push(`${club.name || "구장"}: 코스 정보가 최소 1개 이상 필요합니다.`);
        return { isValid: false, issues };
    }

    // 2. 코스별 검증 (9홀 단위)
    club.courses.forEach((course: any, cIdx: number) => {
        const courseName = course.name || `코스 ${cIdx + 1}`;
        const prefix = `[${courseName}]`;

        if (!course.name || typeof course.name !== "string" || course.name.trim() === "") {
            issues.push(`${prefix}: 코스 이름이 누락되었습니다.`);
        }

        if (!Array.isArray(course.holes)) {
            issues.push(`${prefix}: 홀 정보가 배열 형태가 아닙니다.`);
            return;
        }

        // 홀 수 강제 (반드시 9홀)
        if (course.holes.length !== 9) {
            issues.push(`${prefix}: 홀 수가 9개가 아닙니다. (현재 ${course.holes.length}개)`);
        }

        // Par 합계 검증 (반드시 36)
        const totalPar = course.holes.reduce((sum: number, h: any) => sum + (Number(h.par) || 0), 0);
        if (totalPar !== 36 && course.holes.length === 9) {
            issues.push(`${prefix}: 9홀 Par 합계가 36이 아닙니다. (현재 ${totalPar})`);
        }

        // 3. 홀별/티별 세부 검증
        course.holes.forEach((hole: any, hIdx: number) => {
            const hNum = hole.holeNumber || (hIdx + 1);
            const holePrefix = `${prefix} ${hNum}홀`;

            // 홀 번호 순차 체크
            if (hole.holeNumber !== hIdx + 1) {
                issues.push(`${holePrefix}: 홀 번호 순서가 올바르지 않습니다. (기대: ${hIdx + 1}, 실제: ${hole.holeNumber})`);
            }

            // Par 값 범위 체크
            const par = Number(hole.par);
            if (isNaN(par) || par < 3 || par > 6) {
                issues.push(`${holePrefix}: Par 값이 비정상적입니다. (3~6 사이 필요, 현재: ${hole.par})`);
            }

            // 티별 전장(Distance) 검증
            if (!Array.isArray(hole.distances) || hole.distances.length === 0) {
                issues.push(`${holePrefix}: 티별 전장(Distance) 정보가 최소 1개 이상 필요합니다.`);
            } else {
                hole.distances.forEach((dist: any, dIdx: number) => {
                    const teeName = dist.teeColor || `티 ${dIdx + 1}`;
                    if (!dist.teeColor) {
                        issues.push(`${holePrefix}: 티 색상이 누락되었습니다.`);
                    }
                    if (typeof dist.distanceMeter !== "number" || dist.distanceMeter <= 0) {
                        issues.push(`${holePrefix} (${teeName}): 전장(m)은 0보다 큰 숫자여야 합니다.`);
                    }
                });
            }
        });
    });

    return {
        isValid: issues.length === 0,
        issues
    };
}
