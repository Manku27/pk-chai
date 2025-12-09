'use client';

/**
 * AuthGuard Component
 * Protects routes by checking authentication status and admin role
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [authorizationError, setAuthorizationError] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) {
      return;
    }

    // Requirement 1.1: Redirect unauthenticated users to login
    if (!isAuthenticated || !user) {
      router.push('/');
      return;
    }

    // Requirement 1.2: Check if user has ADMIN role
    if (user.role !== 'ADMIN') {
      setAuthorizationError(true);
      return;
    }

    // User is authenticated and has ADMIN role
    setAuthorizationError(false);
  }, [user, isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // Requirement 1.2: Display authorization error for non-admin users
  if (authorizationError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h1>Access Denied</h1>
          <p>You do not have permission to access this page.</p>
          <p className={styles.errorDetail}>
            This page is restricted to administrators only.
          </p>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Requirement 1.3: Display admin dashboard for authenticated admin users
  if (isAuthenticated && user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  // Default: show nothing while redirecting
  return null;
}
