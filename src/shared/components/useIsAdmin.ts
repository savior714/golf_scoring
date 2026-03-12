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

/**
 * Hook to check whether the currently logged-in user is an admin.
 * Uses role field from 'profiles' table (SSOT).
 * @returns isAdmin: admin status, isLoading: whether session lookup is in progress
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) {
          // fall back to email check if profile lookup fails (temporary during migration)
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const email = session?.user?.email?.toLowerCase() ?? "";
          if (mounted) setIsAdmin(ADMIN_EMAILS.includes(email));
          return;
        }

        if (mounted) {
          setIsAdmin(data?.role === "admin");
        }
      } catch {
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await checkAdmin(session.user.id);
      } else {
        if (mounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Re-evaluate admin status on login/logout in real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user?.id) {
        setIsAdmin(false);
        setIsLoading(false);
      } else if (session?.user?.id) {
        checkAdmin(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading };
}
