/**
 * @file src/shared/components/useIsAdmin.ts
 * @description Hook to determine administrator privileges.
 * - Compares admin email list against current session email and returns a boolean.
 * - Used for conditional UI rendering (Double defense with DB-level RLS).
 */

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/** Admin email list (lowercase normalized) - Deprecated in favor of DB role */
const ADMIN_EMAILS: string[] = ["savior714@gmail.com"];

/** Module-level cache to prevent flickering across mounts */
let cachedIsAdmin: boolean | null = null;

/**
 * Hook to check whether the currently logged-in user is an admin.
 * Uses role field from 'profiles' table (SSOT).
 * @returns isAdmin: admin status, isLoading: whether session lookup is in progress
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  // Use cached value for immediate response (SWR pattern)
  const [isAdmin, setIsAdmin] = useState(cachedIsAdmin ?? false);
  const [isLoading, setIsLoading] = useState(cachedIsAdmin === null);

  useEffect(() => {
    let mounted = true;

    /** Updates both internal state and global cache */
    const syncAdminStatus = (status: boolean) => {
      cachedIsAdmin = status;
      if (mounted) {
        setIsAdmin(status);
        setIsLoading(false);
      }
    };

    const checkAdmin = async (userId: string, email?: string, forceLoading?: boolean) => {
      // [Task 3] 캐시가 없거나 로그인 등 상태 변화 시 isLoading을 true로 설정하여 탭 flicker 방지
      if (mounted && (cachedIsAdmin === null || forceLoading)) {
        setIsLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) {
          // fall back to email check (using provided email or current session)
          let finalEmail = email;
          if (!finalEmail) {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            finalEmail = currentSession?.user?.email;
          }
          syncAdminStatus(ADMIN_EMAILS.includes(finalEmail?.toLowerCase() ?? ""));
          return;
        }

        syncAdminStatus(data?.role === "admin");
      } catch {
        syncAdminStatus(false);
      }
    };

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        await checkAdmin(session.user.id, session.user.email);
      } else {
        syncAdminStatus(false);
      }
    };

    initialize();

    // Re-evaluate admin status on login/logout in real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user?.id) {
        syncAdminStatus(false);
      } else if (session?.user?.id) {
        // [Task 3] 로그인 이벤트 시에는 확실히 로딩 상태를 띄워 권한 확인 중 탭이 사라지는 것 방지
        const shouldForceLoading = event === "SIGNED_IN";
        checkAdmin(session.user.id, session.user.email, shouldForceLoading);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading };
}
