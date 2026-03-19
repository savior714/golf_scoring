/**
 * @file src/modules/admin/domain/repositories/admin.repository.ts
 * @description Admin repository interface definition.
 */

import { UserProfile, CourseRequest } from '../admin.types';

export interface AdminRepository {
    getAllUserProfiles(): Promise<UserProfile[]>;
    getUserRoundsCount(): Promise<any[]>;
    getUserStats(): Promise<{
        total: number;
        activeToday: number;
        activeThisWeek: number;
    }>;
    getCourseRequests(): Promise<CourseRequest[]>;
    updateRequestStatus(id: string, status: CourseRequest['status']): Promise<boolean>;
}
