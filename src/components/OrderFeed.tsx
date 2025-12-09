'use client';

/**
 * OrderFeed Component
 * Real-time order feed with polling-based updates
 * Requirements: 2.1, 2.5, 4.1, 4.2, 4.5
 */

import { useEffect, useState } from 'react';
import { ConnectionManager } from '@/services/connectionManager';
import { groupOrdersBySlotAndBlock, formatSlotTime, HOSTEL_BLOCKS } from '@/utils/orderGrouping';
import type { OrderWithDetails, GroupedOrders, OrderStatus } from '@/types/admin';
import OrderStatusManager from './OrderStatusManager';
import styles from './OrderFeed.module.css';

interface OrderFeedProps {
  pollingInterval?: number; // milliseconds, default 15000 (15 seconds)
}

export default function OrderFeed({ pollingInterval = 15000 }: OrderFeedProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);
  const [connectionManager, setConnectionManager] = useState<ConnectionManager | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(false);

  useEffect(() => {
    console.log('[OrderFeed] Initializing connection manager...');
    
    // Initialize connection manager
    const manager = new ConnectionManager({
      pollingUrl: '/api/admin/orders',
      pollingInterval,
      onOrderUpdate: (newOrders: OrderWithDetails[]) => {
        console.log('[OrderFeed] onOrderUpdate callback triggered with', newOrders.length, 'orders');
        
        // Requirement 2.1: Display orders within 2 seconds (polling provides updates)
        // Convert date strings back to Date objects
        const ordersWithDates = newOrders.map(order => ({
          ...order,
          slotTime: new Date(order.slotTime),
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          items: order.items.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt),
          })),
        }));
        
        console.log('[OrderFeed] Setting orders state with', ordersWithDates.length, 'orders');
        setOrders(ordersWithDates);
        setLastUpdate(new Date());
        setError(null);
      },
      onError: (err: Error) => {
        console.error('[OrderFeed] Connection error:', err);
        setError(err.message);
      },
    });

    setConnectionManager(manager);
    console.log('[OrderFeed] Starting connection manager...');
    manager.start();

    // Check polling status every second to update UI
    const statusCheckInterval = setInterval(() => {
      setIsPollingActive(manager.isPollingActive());
    }, 1000);

    // Cleanup on unmount
    return () => {
      console.log('[OrderFeed] Cleaning up connection manager...');
      manager.stop();
      clearInterval(statusCheckInterval);
    };
  }, [pollingInterval]);

  useEffect(() => {
    console.log('[OrderFeed] Orders state changed, regrouping...', orders.length, 'orders');
    
    // Requirement 2.5: Group orders by slot time and hostel block
    // Requirement 8.1, 8.3: Display all slots and sort by status
    const grouped = groupOrdersBySlotAndBlock(orders);
    console.log('[OrderFeed] Grouped into', grouped.length, 'slot groups');
    setGroupedOrders(grouped);
  }, [orders]);

  useEffect(() => {
    // Requirement 8.5: Implement automatic reordering as time progresses (check every minute)
    const reorderInterval = setInterval(() => {
      // Re-group orders with current time to update slot status and sorting
      const regrouped = groupOrdersBySlotAndBlock(orders);
      setGroupedOrders(regrouped);
    }, 60000); // Check every minute

    return () => {
      clearInterval(reorderInterval);
    };
  }, [orders]);

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  /**
   * Handle order status updates
   * Makes API call to update status and refreshes order list
   */
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
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

      // Trigger immediate refresh of orders
      if (connectionManager) {
        // Force a poll to get updated data immediately
        await connectionManager.forcePoll();
      }
    } catch (err) {
      // Re-throw error to be handled by OrderStatusManager
      throw err;
    }
  };

  return (
    <div className={styles.container}>
      {/* Connection status indicator - Requirement: Add connection status indicator (Polling) */}
      <div className={styles.statusBar}>
        <div className={styles.connectionStatus}>
          <span className={styles.statusDot}></span>
          <span className={styles.statusText}>
            {isPollingActive ? 'Polling' : 'Paused (Outside operational hours: 10 PM - 5 AM)'}
          </span>
        </div>
        {lastUpdate && (
          <div className={styles.lastUpdate}>
            Last updated: {formatDateTime(lastUpdate)}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>Connection error: {error}</span>
        </div>
      )}

      {/* Order feed - Requirement 4.5: Update display without page refresh */}
      <div className={styles.orderFeed}>
        {groupedOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No orders to display</p>
            <p className={styles.emptyStateSubtext}>
              New orders will appear here automatically
            </p>
          </div>
        ) : (
          groupedOrders.map((group) => {
            // Requirement 8.2: Check if slot is in the past
            const isPastSlot = group.slot?.isPast || false;
            
            // Count total orders in this slot
            const totalOrdersInSlot = HOSTEL_BLOCKS.reduce(
              (sum, block) => sum + (group.blocks[block]?.length || 0),
              0
            );

            return (
              <div key={group.slotTime} className={styles.slotGroup}>
                {/* Slot time header - Requirement 8.2: Apply greyed-out styling to past slots */}
                <div className={`${styles.slotHeader} ${isPastSlot ? styles.pastSlotHeader : ''}`}>
                  <h2>{formatSlotTime(group.slotTime)}</h2>
                  <span className={styles.slotDate}>
                    {new Date(group.slotTime).toLocaleDateString('en-IN', {
                      dateStyle: 'medium',
                    })}
                  </span>
                </div>

                {/* Requirement 8.4: Show "No orders for this slot" message for empty slots */}
                {totalOrdersInSlot === 0 ? (
                  <div className={styles.emptySlotMessage}>
                    No orders for this slot
                  </div>
                ) : (
                  /* Hostel blocks */
                  <div className={styles.blocksContainer}>
                    {HOSTEL_BLOCKS.map((block) => {
                      const blockOrders = group.blocks[block] || [];
                      
                      return (
                        <div key={block} className={styles.blockSection}>
                          <div className={styles.blockHeader}>
                            <h3>{block}</h3>
                            <span className={styles.orderCount}>
                              {blockOrders.length} {blockOrders.length === 1 ? 'order' : 'orders'}
                            </span>
                          </div>

                          {blockOrders.length > 0 ? (
                            <div className={styles.ordersList}>
                              {blockOrders.map((order) => (
                                <div key={order.id} className={styles.orderCard}>
                                  {/* Requirement 4.1: Show order ID, customer phone, hostel block, slot time, total, timestamp */}
                                  <div className={styles.orderHeader}>
                                    <div className={styles.orderId}>
                                      Order #{order.id.substring(0, 8)}
                                    </div>
                                    <div className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                                      {order.status}
                                    </div>
                                  </div>

                                  <div className={styles.orderDetails}>
                                    <div className={styles.detailRow}>
                                      <span className={styles.label}>Customer:</span>
                                      <span className={styles.value}>
                                        {order.user.name} ({order.user.phone})
                                      </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                      <span className={styles.label}>Created:</span>
                                      <span className={styles.value}>
                                        {formatDateTime(order.createdAt)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Requirement 4.2: Show all order items with name, quantity, price */}
                                  <div className={styles.itemsList}>
                                    <div className={styles.itemsHeader}>Items:</div>
                                    {order.items.map((item) => (
                                      <div key={item.id} className={styles.itemRow}>
                                        <span className={styles.itemName}>
                                          {item.menuItem?.name || 'Unknown Item'}
                                        </span>
                                        <span className={styles.itemQuantity}>
                                          × {item.quantity}
                                        </span>
                                        <span className={styles.itemPrice}>
                                          {formatCurrency(item.priceAtOrder)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className={styles.orderTotal}>
                                    <span className={styles.totalLabel}>Total:</span>
                                    <span className={styles.totalAmount}>
                                      {formatCurrency(order.totalAmount)}
                                    </span>
                                  </div>

                                  {/* Order Status Manager - Task 9 */}
                                  <OrderStatusManager
                                    order={order}
                                    onStatusUpdate={handleStatusUpdate}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.noOrders}>
                              No orders for this block
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
