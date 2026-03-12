import { supabase } from '../../shared/lib/supabase';
import { logger } from '../../shared/utils/logger';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    created_at: string;
    last_active_at: string;
    rounds_count?: number;
}

export const adminRepository = {
    /**
     * 모든 사용자 목록과 통계를 가져옵니다.
     * profiles 테이블이 필요합니다.
     */
    async getAllUsers(): Promise<UserProfile[]> {
        try {
            // profiles 테이블에서 기본 정보 조회
            const { data: profiles, error: profileErr } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profileErr) {
                // 테이블이 없는 경우 (마이그레이션 전) 빈 배열 반환
                if (profileErr.code === '42P01') {
                    logger.warn('[Admin] profiles table does not exist yet.');
                    return [];
                }
                throw profileErr;
            }

            // 라운드 수 집계 (성능상 대규모일 땐 RPC 권장)
            const { data: rounds, error: roundsErr } = await supabase
                .from('rounds')
                .select('user_id');

            if (roundsErr) throw roundsErr;

            const roundStats = (rounds as { user_id: string }[]).reduce((acc: Record<string, number>, cur) => {
                acc[cur.user_id] = (acc[cur.user_id] || 0) + 1;
                return acc;
            }, {});

            const typedProfiles = (profiles as unknown as { 
                id: string; 
                email: string; 
                full_name?: string; 
                avatar_url?: string; 
                created_at: string; 
                updated_at?: string; 
            }[]);

            const userStats = typedProfiles.map(p => ({
                id: p.id,
                email: p.email,
                full_name: p.full_name || '이름 없음',
                avatar_url: p.avatar_url,
                created_at: p.created_at,
                last_active_at: p.updated_at || p.created_at,
                rounds_count: roundStats[p.id] || 0
            }));

            return userStats;
        } catch (e: unknown) {
            logger.error('[Admin] getAllUsers failed', e);
            return [];
        }
    },

    /**
     * 활성 사용자 요약을 가져옵니다.
     */
    async getUserStats(): Promise<{
        total: number;
        activeToday: number;
        activeThisWeek: number;
    }> {
        try {
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: activeToday } = await supabase.from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt('updated_at', todayStart);
            const { count: activeThisWeek } = await supabase.from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt('updated_at', weekAgo);

            return {
                total: total || 0,
                activeToday: activeToday || 0,
                activeThisWeek: activeThisWeek || 0
            };
        } catch {
            return { total: 0, activeToday: 0, activeThisWeek: 0 };
        }
    }
};
