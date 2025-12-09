'use client';

/**
 * Admin Dashboard Page
 * Integrated admin interface with real-time order feed and analytics
 * Requirements: 1.3, 2.1, 4.5, 7.4
 */

import { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import OrderFeed from '@/components/OrderFeed';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import styles from './page.module.css';

type TabType = 'orders' | 'analytics';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  /**
   * Show toast notification
   * Requirement 7.4: Display error messages to admin
   */
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  /**
   * Close toast manually
   */
  const closeToast = () => {
    setToastMessage(null);
  };

  return (
    <AuthGuard>
      <div className={styles.container}>
        {/* Header with tab navigation */}
        <header className={styles.header}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.headerActions}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'orders' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                📦 Order Feed
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                📊 Analytics
              </button>
            </div>
            <Link href="/admin/all-orders" className={styles.allOrdersLink}>
              📋 View All Orders
            </Link>
          </div>
        </header>

        {/* Toast Notification - Requirement 7.4 */}
        {toastMessage && (
          <div className={`${styles.toast} ${styles[toastType]}`}>
            <div className={styles.toastContent}>
              <span className={styles.toastIcon}>
                {toastType === 'success' ? '✓' : '⚠'}
              </span>
              <span className={styles.toastMessage}>{toastMessage}</span>
            </div>
            <button className={styles.toastClose} onClick={closeToast}>
              ×
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className={styles.content}>
          {/* Order Feed Tab - Requirements 2.1, 4.5 */}
          {activeTab === 'orders' && (
            <div className={styles.tabPanel}>
              <OrderFeed pollingInterval={15000} />
            </div>
          )}

          {/* Analytics Tab - Requirement 1.3 */}
          {activeTab === 'analytics' && (
            <div className={styles.tabPanel}>
              <AnalyticsDashboard />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
