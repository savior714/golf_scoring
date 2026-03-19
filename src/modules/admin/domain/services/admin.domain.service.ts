/**
 * @file src/modules/admin/domain/services/admin.domain.service.ts
 * @description Admin module domain service for pure business logic.
 */

import { ClubInfo, ClubCourseInfo } from '@/src/modules/golf/domain/golf.types';
import { CourseInput, TeeColorKey, TEE_COLORS } from '../admin.types';

export const adminDomainService = {
    /**
     * 스마트 쿼트·이상 공백 등을 표준 ASCII로 정규화 (웹 붙여넣기 오염 방지)
     */
    normalizeJsonText(raw: string): string {
        return raw
            .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // 좌우 이중 따옴표 계열
            .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // 좌우 단일 따옴표 계열
            .replace(/\u00A0/g, ' ')  // non-breaking space → 일반 공백
            .replace(/\uFEFF/g, '');  // BOM 제거
    },

    /**
     * distanceYard → distanceMeter 자동 변환 (1야드 = 0.9144m)
     * distanceMeter가 이미 있으면 변환하지 않음
     */
    convertYardToMeter(data: any[]): ClubInfo[] {
        return data.map((club: any) => ({
            ...club,
            courses: club.courses?.map((course: any) => ({
                ...course,
                holes: course.holes?.map((hole: any) => ({
                    ...hole,
                    distances: hole.distances?.map((d: any) => {
                        if (d.distanceYard !== undefined && d.distanceMeter === undefined) {
                            return { teeColor: d.teeColor, distanceMeter: Math.round(d.distanceYard * 0.9144) };
                        }
                        return d;
                    }),
                })),
            })),
        })) as ClubInfo[];
    },

    /**
     * ClubInfo를 CourseInput 배열로 변환
     */
    mapClubFullInfoToCourseInputs(fullInfo: ClubInfo): CourseInput[] {
        return fullInfo.courses.map((c: ClubCourseInfo) => {
            const teesInData = [...new Set(
                c.holes.flatMap(h => h.distances.map(d => d.teeColor))
            )] as TeeColorKey[];
            
            const activeTees: TeeColorKey[] = teesInData.length > 0
                ? TEE_COLORS.filter(t => teesInData.includes(t.key)).map(t => t.key)
                : ['White']; // Default if no data
                
            return {
                id: c.id,
                courseName: c.name,
                activeTees,
                holes: c.holes.map(h => ({
                    holeNumber: h.holeNumber,
                    par: String(h.par),
                    distances: Object.fromEntries(
                        h.distances.map(d => [d.teeColor, String(d.distanceMeter)])
                    ) as Partial<Record<TeeColorKey, string>>,
                })),
            };
        });
    },

    /**
     * 도메인 검증용 페이로드 생성
     */
    buildValidationPayload(clubName: string, courses: CourseInput[]) {
        return {
            name: clubName,
            courses: courses.map(c => ({
                name: c.courseName,
                holes: c.holes.map(h => ({
                    holeNumber: h.holeNumber,
                    par: parseInt(h.par, 10) || 0,
                    distances: Object.entries(h.distances)
                        .filter(([, v]) => v !== '' && !isNaN(parseInt(v ?? '', 10)))
                        .map(([teeColor, distanceMeter]) => ({
                            teeColor,
                            distanceMeter: parseInt(distanceMeter ?? '', 10),
                        })),
                })),
            })),
        };
    },

    /**
     * 기본 홀 데이터 생성 (9홀 기준)
     */
    getDefaultHoles(count: number = 9): CourseInput['holes'] {
        return Array.from({ length: count }, (_, i) => ({
            holeNumber: i + 1,
            par: '4',
            distances: {},
        }));
    },

    /**
     * 사용자 프로필과 라운드 수를 매핑하여 반환
     */
    mapUserProfilesWithRounds(profiles: any[], rounds: any[]): any[] {
        const roundStats = (rounds as { user_id: string }[]).reduce(
            (acc: Record<string, number>, cur) => {
                acc[cur.user_id] = (acc[cur.user_id] || 0) + 1;
                return acc;
            },
            {}
        );

        return profiles.map((p) => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name || '이름 없음',
            role: p.role || 'user',
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            last_active_at: p.updated_at || p.created_at,
            rounds_count: roundStats[p.id] || 0,
        }));
    }
};
