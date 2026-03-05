/**
 * @file src/shared/components/useIsAdmin.ts
 * @description Hook to determine administrator privileges.
 * - Compares admin email list against current session email and returns a boolean.
 * - Used for conditional UI rendering (Double defense with DB-level RLS).
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/** Admin email list (lowercase normalized) */
const ADMIN_EMAILS: string[] = ['savior714@gmail.com'];

/**
 * Hook to check whether the currently logged-in user is an admin.
 * @returns isAdmin: admin status, isLoading: whether session lookup is in progress
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

        // Re-evaluate admin status on login/logout in real-time
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
