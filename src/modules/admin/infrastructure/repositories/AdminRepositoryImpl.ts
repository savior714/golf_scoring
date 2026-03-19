/**
 * @file src/modules/admin/infrastructure/repositories/AdminRepositoryImpl.ts
 * @description Implementation of AdminRepository using Supabase.
 */

import { supabase } from '@/src/shared/lib/supabase';
import { logger } from '@/src/shared/utils/logger';
import { UserProfile, CourseRequest } from '../../domain/admin.types';
import { AdminRepository } from '../../domain/repositories/admin.repository';

export class AdminRepositoryImpl implements AdminRepository {
    async getAllUserProfiles(): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }
        return data as UserProfile[];
    }

    async getUserRoundsCount(): Promise<any[]> {
        const { data, error } = await supabase
            .from('rounds')
            .select('user_id');

        if (error) throw error;
        return data;
    }

    async getUserStats(): Promise<{ total: number; activeToday: number; activeThisWeek: number }> {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { count: total } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        const { count: activeToday } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('updated_at', todayStart);
        const { count: activeThisWeek } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('updated_at', weekAgo);

        return {
            total: total || 0,
            activeToday: activeToday || 0,
            activeThisWeek: activeThisWeek || 0,
        };
    }

    async getCourseRequests(): Promise<CourseRequest[]> {
        const { data, error } = await supabase
            .from('course_requests')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }
        return data as CourseRequest[];
    }

    async updateRequestStatus(id: string, status: CourseRequest['status']): Promise<boolean> {
        const { error } = await supabase
            .from('course_requests')
            .update({ status })
            .eq('id', id);

        if (error) {
            logger.error('[AdminRepositoryImpl] updateRequestStatus failed', error);
            return false;
        }
        return true;
    }
}

export const adminRepositoryImpl = new AdminRepositoryImpl();
