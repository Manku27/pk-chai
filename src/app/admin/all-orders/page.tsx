'use client';

/**
 * All Orders Page
 * Displays all orders in chronological order without slot-based grouping
 * Requirements: 1.1, 2.2, 2.5
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import OrderStatusManager from '@/components/OrderStatusManager';
import type { OrderWithDetails, OrderStatus } from '@/types/admin';
import styles from './page.module.css';

export default function AllOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all orders from API
   * Requirement 1.4: Fetch all orders without slot or block filtering
   */
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in again.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to load orders.');
        }
      }

      const data = await response.json();
      
      // Requirement 1.3: Sort orders by creation time with newest first
      const sortedOrders = (data.orders || []).sort((a: OrderWithDetails, b: OrderWithDetails) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setOrders(sortedOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load orders. Please check your connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  /**
   * Handle order status update
   * Requirement 3.2: Update status via API call
   * Requirement 3.3: Refresh order list after successful update
   */
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      // Requirement 3.3: Refresh order list to reflect the change
      await fetchOrders();
    } catch (err) {
      // Requirement 3.4: Display error message and maintain previous status
      throw err;
    }
  };

  /**
   * Format date for display
   * Requirement 5.3: Format dates and times in readable format
   */
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format currency for display
   * Requirement 5.2: Format currency values consistently
   */
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <AuthGuard>
      <div className={styles.container}>
        {/* Header with back button - Requirement 2.2 */}
        <header className={styles.header}>
          <button
            onClick={() => router.push('/admin')}
            className={styles.backButton}
            aria-label="Back to admin dashboard"
            type="button"
          >
            ← Back to Dashboard
          </button>
          <h1 className={styles.title}>All Orders</h1>
        </header>

        {/* Loading State - Requirement 4.1 */}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} aria-hidden="true"></div>
            <p>Loading orders...</p>
          </div>
        )}

        {/* Error State - Requirement 4.3 */}
        {error && !isLoading && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button
              onClick={fetchOrders}
              className={styles.retryButton}
              type="button"
              aria-label="Retry loading orders"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State - Requirement 1.5 */}
        {!isLoading && !error && orders.length === 0 && (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyMessage}>No orders yet</p>
            <button
              onClick={() => router.push('/admin')}
              className={styles.backToDashboardButton}
              type="button"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Orders List - Requirements 1.1, 1.2, 5.1 */}
        {!isLoading && !error && orders.length > 0 && (
          <div className={styles.ordersContainer}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                {/* Order Header */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderId}>Order #{order.id}</span>
                    <span className={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Customer Details - Requirement 1.2 */}
                <div className={styles.customerSection}>
                  <h3 className={styles.sectionTitle}>Customer</h3>
                  <div className={styles.customerDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Name:</span>
                      <span className={styles.detailValue}>{order.user.name}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Phone:</span>
                      <span className={styles.detailValue}>{order.user.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Details - Requirement 1.2 */}
                <div className={styles.deliverySection}>
                  <h3 className={styles.sectionTitle}>Delivery</h3>
                  <div className={styles.deliveryDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Block:</span>
                      <span className={styles.detailValue}>{order.targetHostelBlock}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Slot:</span>
                      <span className={styles.detailValue}>
                        {new Date(order.slotTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items - Requirement 1.2, 5.4 */}
                <div className={styles.itemsSection}>
                  <h3 className={styles.sectionTitle}>Items</h3>
                  <div className={styles.itemsList}>
                    {order.items.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <span className={styles.itemName}>
                          {item.menuItem?.name || 'Unknown Item'} × {item.quantity}
                        </span>
                        <span className={styles.itemPrice}>
                          {formatCurrency(item.priceAtOrder * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total - Requirement 1.2 */}
                <div className={styles.totalSection}>
                  <span className={styles.totalLabel}>Total:</span>
                  <span className={styles.totalAmount}>
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>

                {/* Status Management - Requirement 3.1 */}
                <div className={styles.statusSection}>
                  <OrderStatusManager
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
