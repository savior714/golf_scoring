/**
 * @file src/modules/admin/application/services/admin.application.service.ts
 * @description Admin module application service for orchestrating use cases.
 */

import { clubRepository } from '@/src/modules/golf/infrastructure';
import { ClubSummary, ClubInfo } from '@/src/modules/golf/domain/golf.types';
import { adminRepositoryImpl } from '../../infrastructure/repositories/AdminRepositoryImpl';
import { adminDomainService } from '../../domain/services/admin.domain.service';
import { CourseRequest, UserProfile } from '../../domain/admin.types';

export const adminApplicationService = {
    /**
     * 모든 구장 요약 목록 가져오기
     */
    async fetchClubList(): Promise<ClubSummary[]> {
        return await clubRepository.getAllClubsSummary();
    },

    /**
     * 특정 구장의 전체 정보 가져오기
     */
    async getClubFullInfo(clubId: string): Promise<ClubInfo | null> {
        return await clubRepository.getClubFullInfo(clubId);
    },

    /**
     * 구장 저장 (등록/수정)
     */
    async saveClub(clubName: string, isVerified: boolean, courses: any[]): Promise<{ success: boolean; error?: any }> {
        const payload = {
            clubName: clubName.trim(),
            isVerified,
            courses: courses.map(c => ({
                courseName: c.courseName.trim(),
                holes: c.holes.map((h: any) => ({
                    holeNumber: h.holeNumber,
                    par: parseInt(h.par, 10) || 4,
                    distances: Object.entries(h.distances)
                        .filter(([, v]) => v !== '' && !isNaN(parseInt(v as string, 10)))
                        .map(([teeColor, distanceMeter]) => ({
                            teeColor,
                            distanceMeter: parseInt(distanceMeter as string, 10),
                        })),
                })),
            })),
        };

        return await clubRepository.registerClub(payload);
    },

    /**
     * 대량 구장 등록
     */
    async registerClubsBulk(clubs: ClubInfo[]): Promise<{ success: boolean; count: number; error?: any }> {
        return await clubRepository.registerClubsBulk(clubs);
    },

    /**
     * 코스 영구 삭제
     */
    async deleteCourse(courseId: string): Promise<{ success: boolean; error?: any }> {
        return await clubRepository.deleteGolfCourse(courseId);
    },

    /**
     * 모든 사용자 및 라운드 통계 조회 (SDD)
     */
    async getAllUsers(): Promise<UserProfile[]> {
        const [profiles, rounds] = await Promise.all([
            adminRepositoryImpl.getAllUserProfiles(),
            adminRepositoryImpl.getUserRoundsCount()
        ]);
        return adminDomainService.mapUserProfilesWithRounds(profiles, rounds);
    },

    /**
     * 활성 사용자 요약 통계 조회
     */
    async getUserStats(): Promise<{ total: number; activeToday: number; activeThisWeek: number }> {
        return await adminRepositoryImpl.getUserStats();
    },

    /**
     * 모든 구장 요청 목록 조회
     */
    async getCourseRequests(): Promise<CourseRequest[]> {
        return await adminRepositoryImpl.getCourseRequests();
    },

    /**
     * 구장 요청 상태 업데이트
     */
    async updateRequestStatus(id: string, status: CourseRequest['status']): Promise<boolean> {
        return await adminRepositoryImpl.updateRequestStatus(id, status);
    }
};
