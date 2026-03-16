/**
 * @file src/shared/components/useIsAdmin.ts
 * @description Hook to determine administrator privileges.
 * - Refactored to use AdminContext for global state sharing.
 */

import { useAdmin } from "../contexts/AdminContext";

/**
 * Hook to check whether the currently logged-in user is an admin.
 * Uses AdminContext (SSOT) to prevent redundant checks across components.
 * @returns isAdmin: admin status, isLoading: whether session lookup is in progress
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { isAdmin, isLoading } = useAdmin();
  return { isAdmin, isLoading };
}
