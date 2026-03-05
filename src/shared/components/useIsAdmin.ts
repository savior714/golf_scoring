/**
 * @file src/shared/components/useIsAdmin.ts
 * @description 관리자 권한 판별 훅
 * - 관리자 이메일 목록과 현재 세션 이메일을 비교하여 boolean 반환
 * - UI 조건부 렌더링에 사용 (DB 레벨 RLS와 이중 방어)
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/** 관리자 이메일 목록 (소문자 정규화) */
const ADMIN_EMAILS: string[] = ['savior714@gmail.com'];

/**
 * 현재 로그인한 사용자가 관리자인지 확인하는 훅
 * @returns isAdmin: 관리자 여부, isLoading: 세션 조회 중 여부
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkAdmin = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const email = session?.user?.email?.toLowerCase() ?? '';
                if (mounted) {
                    setIsAdmin(ADMIN_EMAILS.includes(email));
                }
            } catch {
                if (mounted) setIsAdmin(false);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        checkAdmin();

        // 로그인/로그아웃 시 실시간 재판정
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const email = session?.user?.email?.toLowerCase() ?? '';
            if (mounted) {
                setIsAdmin(ADMIN_EMAILS.includes(email));
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { isAdmin, isLoading };
}
