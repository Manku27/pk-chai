'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { getCurrentWorkingDay, dateInputToWorkingDay, getWorkingDayRange, workingDayToDateInput } from '@/utils/workingDay';
import { AdminProtection } from '@/components/AdminProtection';
import { useAuth } from '@/contexts/AuthContext';

type OrderStatus = 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';

interface StatusCount {
  status: string;
  count: number;
}

interface SlotBlockGroup {
  slotTime: string;
  targetHostelBlock: string;
  count: number;
  totalAmount: number;
  detailedOrders: DetailedOrder[];
}

interface Order {
  id: string;
  userId: string;
  targetHostelBlock: string;
  slotTime: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface DetailedOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  totalAmount: number;
  status: OrderStatus;
  items: Array<{
    itemName: string;
    quantity: number;
    priceAtOrder: number;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [workingDayRevenue, setWorkingDayRevenue] = useState<number>(0);
  const [workingDayLabel, setWorkingDayLabel] = useState<string>('');
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [slotBlockGroups, setSlotBlockGroups] = useState<SlotBlockGroup[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('ACCEPTED');
  const [loading, setLoading] = useState(false);

  // For Orders tab - working day filter
  const [ordersWorkingDayDate, setOrdersWorkingDayDate] = useState<string>('');
  const [ordersWorkingDayLabel, setOrdersWorkingDayLabel] = useState<string>('');

  // For expandable block cards
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // For order status updates
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<{ orderId: string; message: string } | null>(null);

  // For polling during business hours (10pm-5am)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Helper function to get headers with user ID
  const getAuthHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (user?.id) {
      headers['x-user-id'] = user.id;
    }

    return headers;
  };

  // Initialize working day dates - default to today's working day
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    // For Orders tab, default to "today's" working day
    // - If before 5 AM: use yesterday (the working day that's currently ongoing)
    // - If 5 AM or later: use today (the working day that will start tonight)
    let workingDayDate: Date;
    if (hour < 5) {
      // Currently in a working day that started yesterday
      workingDayDate = new Date(now);
      workingDayDate.setDate(workingDayDate.getDate() - 1);
    } else {
      // Use today's working day (starts tonight at 11 PM)
      workingDayDate = new Date(now);
    }

    const dateInput = workingDayToDateInput(workingDayDate);
    const range = getWorkingDayRange(workingDayDate);
    setOrdersWorkingDayDate(dateInput);
    setOrdersWorkingDayLabel(range.label);
  }, []);

  // Setup polling during business hours (10pm-5am)
  useEffect(() => {
    const setupPolling = () => {
      const now = new Date();
      const hour = now.getHours();

      // Check if we're in business hours (10pm-5am)
      const isBusinessHours = hour >= 22 || hour < 5;

      if (isBusinessHours && activeTab === 'overview' && user?.id) {
        // Clear any existing interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        // Set up polling every 30 seconds during business hours
        const interval = setInterval(() => {
          fetchOverviewData();
        }, 30000);

        pollingIntervalRef.current = interval;
        setIsPolling(true);
      } else {
        // Clear polling if not in business hours or not on overview tab
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
      }
    };

    setupPolling();

    // Check every minute if we need to start/stop polling
    const hourlyCheck = setInterval(setupPolling, 60000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearInterval(hourlyCheck);
    };
  }, [activeTab, user?.id]);

  // Fetch overview data
  useEffect(() => {
    if (activeTab === 'overview' && user?.id) {
      fetchOverviewData();
    }
  }, [activeTab, user?.id]);

  // Initial data fetch when user becomes available
  useEffect(() => {
    if (user?.id && activeTab === 'overview') {
      // Small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        fetchOverviewData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  // Fetch orders by status and working day
  useEffect(() => {
    if (activeTab === 'orders' && ordersWorkingDayDate && user?.id) {
      fetchOrdersByStatus();
    }
  }, [activeTab, selectedStatus, ordersWorkingDayDate, user?.id]);

  const fetchOverviewData = async (retryCount = 0) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const currentWD = getCurrentWorkingDay();
      setWorkingDayLabel(currentWD.label);

      const headers = getAuthHeaders();

      // Fetch all data in parallel with timeout
      const fetchWithTimeout = (url: string, options: RequestInit, timeout = 10000) => {
        return Promise.race([
          fetch(url, options),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const [totalRevenueRes, wdRevenueRes, statusCountsRes, slotBlockRes] = await Promise.all([
        fetchWithTimeout('/api/admin/analytics?type=total-revenue', { headers }),
        fetchWithTimeout(
          `/api/admin/analytics?type=working-day-revenue&workingDayStart=${currentWD.start.toISOString()}&workingDayEnd=${currentWD.end.toISOString()}`,
          { headers }
        ),
        fetchWithTimeout(
          `/api/admin/analytics?type=working-day-status-counts&workingDayStart=${currentWD.start.toISOString()}&workingDayEnd=${currentWD.end.toISOString()}`,
          { headers }
        ),
        fetchWithTimeout(
          `/api/admin/analytics?type=working-day-slot-block-groups&workingDayStart=${currentWD.start.toISOString()}&workingDayEnd=${currentWD.end.toISOString()}`,
          { headers }
        )
      ]);

      // Check if all responses are ok
      if (!totalRevenueRes.ok || !wdRevenueRes.ok || !statusCountsRes.ok || !slotBlockRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const [totalRevenueData, wdRevenueData, statusCountsData, slotBlockData] = await Promise.all([
        totalRevenueRes.json(),
        wdRevenueRes.json(),
        statusCountsRes.json(),
        slotBlockRes.json()
      ]);

      setTotalRevenue(totalRevenueData.revenue || 0);
      setWorkingDayRevenue(wdRevenueData.revenue || 0);
      setStatusCounts(statusCountsData.counts || []);
      setSlotBlockGroups(slotBlockData.groups || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch overview data:', error);

      // Retry logic - retry up to 2 times with exponential backoff
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
        setTimeout(() => {
          fetchOverviewData(retryCount + 1);
        }, delay);
        return;
      }

      // Set empty/default values on final failure
      setTotalRevenue(0);
      setWorkingDayRevenue(0);
      setSlotBlockGroups([]);
      setStatusCounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersByStatus = async () => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const workingDay = dateInputToWorkingDay(ordersWorkingDayDate);
      const range = getWorkingDayRange(workingDay);
      setOrdersWorkingDayLabel(range.label);

      const headers = getAuthHeaders();

      const res = await fetch(
        `/api/admin/orders?status=${selectedStatus}&workingDayStart=${range.start.toISOString()}&workingDayEnd=${range.end.toISOString()}`,
        { headers }
      );
      const data = await res.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockExpansion = (slotTime: string, hostelBlock: string) => {
    const blockKey = `${slotTime}-${hostelBlock}`;

    const newExpanded = new Set(expandedBlocks);
    if (expandedBlocks.has(blockKey)) {
      newExpanded.delete(blockKey);
    } else {
      newExpanded.add(blockKey);
    }
    setExpandedBlocks(newExpanded);
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: 'DELIVERED' | 'REJECTED'
  ) => {
    if (!user?.id) {
      setStatusUpdateError({ orderId, message: 'User not authenticated' });
      return;
    }

    setUpdatingOrderId(orderId);
    setStatusUpdateError(null);

    try {
      const headers = getAuthHeaders();

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to update order status');
      }

      // Refresh overview data to reflect changes in the detailed orders
      await fetchOverviewData();

      // Clear error state after successful update
      setStatusUpdateError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
      setStatusUpdateError({ orderId, message: errorMessage });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Group slot-block data by timeslot
  const groupedBySlot = (slotBlockGroups || []).reduce((acc, group) => {
    const slotKey = group.slotTime;
    if (!acc[slotKey]) {
      acc[slotKey] = {
        slotTime: group.slotTime,
        blocks: [],
        totalOrders: 0,
        totalAmount: 0,
      };
    }
    acc[slotKey].blocks.push({
      hostelBlock: group.targetHostelBlock,
      count: group.count,
      amount: group.totalAmount,
      detailedOrders: group.detailedOrders,
    });
    acc[slotKey].totalOrders += group.count;
    acc[slotKey].totalAmount += group.totalAmount;
    return acc;
  }, {} as Record<string, { slotTime: string; blocks: Array<{ hostelBlock: string; count: number; amount: number; detailedOrders: DetailedOrder[] }>; totalOrders: number; totalAmount: number }>);

  // Sort by slotTime (earliest first)
  const slotGroups = Object.values(groupedBySlot).sort((a, b) => {
    return new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime();
  });

  return (
    <AdminProtection>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Admin Dashboard</h1>
          <div className={styles.headerControls}>
            <div className={styles.tabs}>
              <button
                className={activeTab === 'overview' ? styles.activeTab : ''}
                onClick={() => {
                  setActiveTab('overview');
                  // Force refresh when switching to overview
                  if (activeTab !== 'overview' && user?.id) {
                    setTimeout(() => fetchOverviewData(), 100);
                  }
                }}
              >
                Overview
              </button>
              <button
                className={activeTab === 'orders' ? styles.activeTab : ''}
                onClick={() => setActiveTab('orders')}
              >
                Orders
              </button>
            </div>
            {activeTab === 'overview' && (
              <div className={styles.headerActions}>
                <button
                  className={styles.refreshButton}
                  onClick={() => fetchOverviewData()}
                  disabled={loading}
                >
                  {loading ? '⏳' : '🔄'} Refresh
                </button>
                {isPolling && (
                  <div className={styles.pollingIndicator}>
                    🔴 Live (10pm-5am)
                  </div>
                )}
                {lastRefresh && (
                  <div className={styles.lastRefresh}>
                    Last: {lastRefresh.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {loading && <div className={styles.loading}>Loading...</div>}

        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Total Revenue</h3>
                <p className={styles.statValue}>{formatCurrency(totalRevenue)}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Working Day Revenue</h3>
                <p className={styles.statValue}>{formatCurrency(workingDayRevenue)}</p>
                {workingDayLabel && (
                  <p className={styles.workingDayLabel}>{workingDayLabel}</p>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h2>Order Status Counts</h2>
              <div className={styles.statusGrid}>
                {statusCounts.map((item) => (
                  <div key={item.status} className={styles.statusCard}>
                    <span className={styles.statusLabel}>{item.status}</span>
                    <span className={styles.statusCount}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>Orders by Slot & Block (Current Working Day)</h2>
              {slotGroups.length === 0 ? (
                <div className={styles.emptyState}>No orders for current working day</div>
              ) : (
                <div className={styles.slotGroupsContainer}>
                  {slotGroups.map((slotGroup, slotIndex) => (
                    <div key={slotIndex} className={styles.slotGroup}>
                      <div className={styles.slotHeader}>
                        <div className={styles.slotTime}>
                          <span className={styles.slotTimeLabel}>Slot:</span>
                          <span className={styles.slotTimeValue}>{formatDateTime(slotGroup.slotTime)}</span>
                        </div>
                        <div className={styles.slotSummary}>
                          <span className={styles.slotStat}>
                            <strong>{slotGroup.totalOrders}</strong> orders
                          </span>
                          <span className={styles.slotStat}>
                            <strong>{formatCurrency(slotGroup.totalAmount)}</strong>
                          </span>
                        </div>
                      </div>
                      <div className={styles.blocksGrid}>
                        {slotGroup.blocks.map((block, blockIndex) => {
                          const blockKey = `${slotGroup.slotTime}-${block.hostelBlock}`;
                          const isExpanded = expandedBlocks.has(blockKey);
                          const blockDetails = block.detailedOrders;

                          return (
                            <div key={blockIndex} className={styles.blockCard}>
                              <div
                                className={styles.blockHeader}
                                onClick={() => toggleBlockExpansion(slotGroup.slotTime, block.hostelBlock)}
                              >
                                <div className={styles.blockName}>{block.hostelBlock}</div>
                                <div className={styles.blockStats}>
                                  <div className={styles.blockStat}>
                                    <span className={styles.blockStatLabel}>Orders:</span>
                                    <span className={styles.blockStatValue}>{block.count}</span>
                                  </div>
                                  <div className={styles.blockStat}>
                                    <span className={styles.blockStatLabel}>Amount:</span>
                                    <span className={styles.blockStatValue}>{formatCurrency(block.amount)}</span>
                                  </div>
                                </div>
                                <button className={styles.expandButton} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className={styles.blockDetails}>
                                  {blockDetails && blockDetails.length > 0 ? (
                                    <div className={styles.ordersList}>
                                      {blockDetails.map((order) => (
                                        <div key={order.id} className={styles.orderDetail}>
                                          <div className={styles.orderHeader}>
                                            <span className={styles.orderId}>
                                              Order: {order.id.substring(0, 8)}...
                                            </span>
                                            <span className={styles.customerName}>
                                              <span>{order.userName}</span>
                                              <span className={styles.orderAmount}>
                                                {formatCurrency(order.totalAmount)}
                                              </span>
                                            </span>
                                            <a
                                              href={`tel:${order.userPhone}`}
                                              className={styles.customerPhone}
                                            >
                                              {order.userPhone}
                                            </a>
                                          </div>
                                          <div className={styles.orderStatusBadgeContainer}>
                                            <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                                              {order.status}
                                            </span>
                                          </div>
                                          <div className={styles.orderItems}>
                                            {order.items.map((item, idx) => (
                                              <div key={idx} className={styles.orderItem}>
                                                <span className={styles.itemQuantity}>{item.quantity}x</span>
                                                <span className={styles.itemName}>{item.itemName}</span>
                                                <span className={styles.itemPrice}>
                                                  {formatCurrency(item.priceAtOrder)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                          {(order.status === 'ACCEPTED' || order.status === 'ACKNOWLEDGED') && (
                                            <div className={styles.orderActions}>
                                              <button
                                                className={styles.actionButton}
                                                onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                                                disabled={updatingOrderId === order.id}
                                              >
                                                {updatingOrderId === order.id ? (
                                                  <span className={styles.buttonSpinner}>⏳</span>
                                                ) : (
                                                  'Fulfill'
                                                )}
                                              </button>
                                              <button
                                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                                onClick={() => handleUpdateOrderStatus(order.id, 'REJECTED')}
                                                disabled={updatingOrderId === order.id}
                                              >
                                                {updatingOrderId === order.id ? (
                                                  <span className={styles.buttonSpinner}>⏳</span>
                                                ) : (
                                                  'Reject'
                                                )}
                                              </button>
                                            </div>
                                          )}
                                          {statusUpdateError && statusUpdateError.orderId === order.id && (
                                            <div className={styles.errorMessage}>
                                              {statusUpdateError.message}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className={styles.emptyDetails}>No orders found</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={styles.ordersView}>
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <label htmlFor="workingDayDate">Working Day:</label>
                <input
                  type="date"
                  id="workingDayDate"
                  value={ordersWorkingDayDate}
                  onChange={(e) => setOrdersWorkingDayDate(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                >
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            {ordersWorkingDayLabel && (
              <div className={styles.workingDayInfo}>
                Working Day: {ordersWorkingDayLabel}
              </div>
            )}

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Hostel Block</th>
                    <th>Slot Time</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {orders && orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id.substring(0, 8)}...</td>
                        <td>{order.targetHostelBlock}</td>
                        <td>{formatDateTime(order.slotTime)}</td>
                        <td>{formatCurrency(order.totalAmount)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{formatDateTime(order.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={styles.emptyState}>
                        No orders with status {selectedStatus}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminProtection>
  );
}
