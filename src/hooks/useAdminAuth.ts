'use client';

/**
 * Admin Authentication Hook
 * Provides admin role checking functionality for client-side route protection
 */

import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

/**
 * Return type for useAdminAuth hook
 */
export interface UseAdminAuthReturn {
    isAdmin: boolean;
    isLoading: boolean;
    user: User | null;
}

/**
 * Hook for checking if the current user has admin privileges
 * 
 * This hook wraps the AuthContext and provides a convenient way to check
 * if the current user has the ADMIN role. It handles cases where the user
 * is null or the role is undefined.
 * 
 * @returns Object containing admin status, loading state, and user object
 * 
 * @example
 * ```tsx
 * function AdminPage() {
 *   const { isAdmin, isLoading, user } = useAdminAuth();
 *   
 *   if (isLoading) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   if (!isAdmin) {
 *     return <div>Access denied</div>;
 *   }
 *   
 *   return <div>Admin content</div>;
 * }
 * ```
 */
export function useAdminAuth(): UseAdminAuthReturn {
    const { user, isLoading } = useAuth();

    // Check if user has ADMIN role
    // Handle cases where user is null or role is undefined
    const isAdmin = user?.role === 'ADMIN';

    return {
        isAdmin,
        isLoading,
        user,
    };
}
