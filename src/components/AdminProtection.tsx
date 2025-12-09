'use client';

/**
 * AdminProtection Component
 * Wrapper component that protects admin pages from unauthorized access
 * Redirects non-admin users to home page with error message
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import styles from './AdminProtection.module.css';

interface AdminProtectionProps {
  children: React.ReactNode;
}

/**
 * AdminProtection wrapper component
 * 
 * This component protects admin pages by checking if the current user
 * has the ADMIN role. It shows a loading state while authentication is
 * being checked, redirects non-admin users to the home page, and displays
 * an error message when access is denied.
 * 
 * @param children - The admin page content to render if user is authorized
 * 
 * @example
 * ```tsx
 * export default function AdminPage() {
 *   return (
 *     <AdminProtection>
 *       <div>Admin Dashboard Content</div>
 *     </AdminProtection>
 *   );
 * }
 * ```
 */
export function AdminProtection({ children }: AdminProtectionProps) {
  const router = useRouter();
  const { isAdmin, isLoading, user } = useAdminAuth();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) {
      return;
    }

    // If user is not admin, show error and redirect
    if (!isAdmin) {
      setShowError(true);
      
      // Redirect after showing error message briefly
      const timer = setTimeout(() => {
        router.push('/');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoading, router]);

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} aria-hidden="true"></div>
          <span className={styles.loadingText}>Verifying access...</span>
        </div>
      </div>
    );
  }

  // Show error message if user is not admin
  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState} role="alert">
          <div className={styles.errorIcon} aria-hidden="true">⚠️</div>
          <h2 className={styles.errorTitle}>Access Denied</h2>
          <p className={styles.errorMessage}>
            {user 
              ? "You don't have permission to access this page. Admin privileges are required."
              : "Please log in to access admin features."}
          </p>
          <p className={styles.redirectMessage}>Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  // Render children only if user is admin
  return <>{children}</>;
}
