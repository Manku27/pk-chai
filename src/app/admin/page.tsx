'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [dailyRevenue, setDailyRevenue] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [slotBlockGroups, setSlotBlockGroups] = useState<SlotBlockGroup[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('ACCEPTED');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  // Fetch overview data
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    }
  }, [activeTab, selectedDate]);

  // Fetch orders by status
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrdersByStatus();
    }
  }, [activeTab, selectedStatus]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // Fetch total revenue
      const totalRevenueRes = await fetch('/api/admin/analytics?type=total-revenue');
      const totalRevenueData = await totalRevenueRes.json();
      setTotalRevenue(totalRevenueData.revenue);

      // Fetch daily revenue
      const dailyRevenueRes = await fetch(
        `/api/admin/analytics?type=daily-revenue&date=${selectedDate}`
      );
      const dailyRevenueData = await dailyRevenueRes.json();
      setDailyRevenue(dailyRevenueData.revenue);

      // Fetch status counts
      const statusCountsRes = await fetch('/api/admin/analytics?type=status-counts');
      const statusCountsData = await statusCountsRes.json();
      setStatusCounts(statusCountsData.counts);

      // Fetch slot and block groups for selected date
      const slotBlockRes = await fetch(
        `/api/admin/analytics?type=slot-block-groups&date=${selectedDate}`
      );
      const slotBlockData = await slotBlockRes.json();
      setSlotBlockGroups(slotBlockData.groups);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersByStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${selectedStatus}`);
      const data = await res.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <div className={styles.tabs}>
          <button
            className={activeTab === 'overview' ? styles.activeTab : ''}
            onClick={() => setActiveTab('overview')}
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
      </header>

      {loading && <div className={styles.loading}>Loading...</div>}

      {activeTab === 'overview' && (
        <div className={styles.overview}>
          <div className={styles.dateSelector}>
            <label htmlFor="date">Select Date:</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Revenue</h3>
              <p className={styles.statValue}>{formatCurrency(totalRevenue)}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Daily Revenue ({selectedDate})</h3>
              <p className={styles.statValue}>{formatCurrency(dailyRevenue)}</p>
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
            <h2>Orders by Slot & Block ({selectedDate})</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Slot Time</th>
                    <th>Hostel Block</th>
                    <th>Order Count</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {slotBlockGroups.map((group, index) => (
                    <tr key={index}>
                      <td>{formatDateTime(group.slotTime)}</td>
                      <td>{group.targetHostelBlock}</td>
                      <td>{group.count}</td>
                      <td>{formatCurrency(group.totalAmount)}</td>
                    </tr>
                  ))}
                  {slotBlockGroups.length === 0 && (
                    <tr>
                      <td colSpan={4} className={styles.emptyState}>
                        No orders for selected date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className={styles.ordersView}>
          <div className={styles.statusFilter}>
            <label htmlFor="status">Filter by Status:</label>
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
                {orders.map((order) => (
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
                ))}
                {orders.length === 0 && (
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
  );
}
