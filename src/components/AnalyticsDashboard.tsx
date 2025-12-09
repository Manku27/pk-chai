'use client';

/**
 * AnalyticsDashboard Component
 * Display analytics and metrics for admin dashboard
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useEffect, useState } from 'react';
import styles from './AnalyticsDashboard.module.css';
import TrafficBySlotChart from './TrafficBySlotChart';
import HostelDemandChart from './HostelDemandChart';
import HeatmapChart from './HeatmapChart';

interface OrderCounts {
  total: number;
  accepted: number;
  acknowledged: number;
  delivered: number;
  rejected: number;
}

interface TrafficBySlot {
  slotTime: string;
  orderCount: number;
}

interface HostelDemand {
  hostelBlock: string;
  orderCount: number;
  percentage: number;
}

interface HeatmapData {
  hostelBlock: string;
  slotTime: string;
  intensity: number;
}

interface AnalyticsDashboardProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function AnalyticsDashboard({
  selectedDate = new Date(),
  onDateChange,
}: AnalyticsDashboardProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Analytics data state
  const [dailyRevenue, setDailyRevenue] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    total: 0,
    accepted: 0,
    acknowledged: 0,
    delivered: 0,
    rejected: 0,
  });
  const [trafficBySlot, setTrafficBySlot] = useState<TrafficBySlot[]>([]);
  const [hostelDemand, setHostelDemand] = useState<HostelDemand[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [date]);

  /**
   * Fetch all analytics data
   */
  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Fetch all analytics in parallel
      const [
        dailyRevenueRes,
        totalRevenueRes,
        orderCountsRes,
        trafficBySlotRes,
        hostelDemandRes,
        heatmapRes,
      ] = await Promise.all([
        fetch(`/api/admin/analytics?type=daily-revenue&date=${dateStr}`),
        fetch(`/api/admin/analytics?type=total-revenue`),
        fetch(`/api/admin/analytics?type=order-counts&date=${dateStr}`),
        fetch(`/api/admin/analytics?type=traffic-by-slot&date=${dateStr}`),
        fetch(`/api/admin/analytics?type=hostel-demand&date=${dateStr}`),
        fetch(`/api/admin/analytics?type=heatmap&date=${dateStr}`),
      ]);

      // Check for errors
      if (!dailyRevenueRes.ok || !totalRevenueRes.ok || !orderCountsRes.ok || 
          !trafficBySlotRes.ok || !hostelDemandRes.ok || !heatmapRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      // Parse responses
      const dailyRevenueData = await dailyRevenueRes.json();
      const totalRevenueData = await totalRevenueRes.json();
      const orderCountsData = await orderCountsRes.json();
      const trafficBySlotData = await trafficBySlotRes.json();
      const hostelDemandData = await hostelDemandRes.json();
      const heatmapDataRes = await heatmapRes.json();

      // Update state - ensure values are numbers
      setDailyRevenue(Number(dailyRevenueData.revenue) || 0);
      setTotalRevenue(Number(totalRevenueData.revenue) || 0);
      setOrderCounts(orderCountsData.orderCounts);
      setTrafficBySlot(trafficBySlotData.trafficBySlot);
      setHostelDemand(hostelDemandData.hostelDemand);
      setHeatmapData(heatmapDataRes.heatmapData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle date change
   */
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number | null | undefined): string => {
    const value = Number(amount) || 0;
    return `₹${value.toFixed(2)}`;
  };

  /**
   * Format slot time for display
   */
  const formatSlotTime = (slotTime: string): string => {
    const date = new Date(slotTime);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Format date for input
   */
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={styles.container}>
      {/* Date Selector */}
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics Dashboard</h1>
        <div className={styles.dateSelector}>
          <label htmlFor="analytics-date" className={styles.dateLabel}>
            Select Date:
          </label>
          <input
            id="analytics-date"
            type="date"
            value={formatDateForInput(date)}
            onChange={handleDateChange}
            className={styles.dateInput}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading analytics data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>Error: {error}</span>
          <button onClick={fetchAllAnalytics} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {/* Analytics Content */}
      {!loading && !error && (
        <div className={styles.content}>
          {/* Revenue Metrics - Requirement 5.1 */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Daily Revenue</div>
              <div className={styles.metricValue}>{formatCurrency(dailyRevenue)}</div>
              <div className={styles.metricSubtext}>
                {date.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total Revenue</div>
              <div className={styles.metricValue}>{formatCurrency(totalRevenue)}</div>
              <div className={styles.metricSubtext}>All time</div>
            </div>

            {/* Order Counts - Requirement 5.2 */}
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total Orders</div>
              <div className={styles.metricValue}>{orderCounts.total}</div>
              <div className={styles.metricSubtext}>
                {date.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Rejected Orders</div>
              <div className={styles.metricValue}>{orderCounts.rejected}</div>
              <div className={styles.metricSubtext}>
                {orderCounts.total > 0
                  ? `${((orderCounts.rejected / orderCounts.total) * 100).toFixed(1)}% of total`
                  : 'No orders'}
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Order Status Breakdown</h2>
            <div className={styles.statusGrid}>
              <div className={`${styles.statusCard} ${styles.accepted}`}>
                <div className={styles.statusLabel}>Accepted</div>
                <div className={styles.statusValue}>{orderCounts.accepted}</div>
              </div>
              <div className={`${styles.statusCard} ${styles.acknowledged}`}>
                <div className={styles.statusLabel}>Acknowledged</div>
                <div className={styles.statusValue}>{orderCounts.acknowledged}</div>
              </div>
              <div className={`${styles.statusCard} ${styles.delivered}`}>
                <div className={styles.statusLabel}>Delivered</div>
                <div className={styles.statusValue}>{orderCounts.delivered}</div>
              </div>
              <div className={`${styles.statusCard} ${styles.rejected}`}>
                <div className={styles.statusLabel}>Rejected</div>
                <div className={styles.statusValue}>{orderCounts.rejected}</div>
              </div>
            </div>
          </div>

          {/* Traffic by Slot - Requirement 5.3 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Traffic by Time Slot</h2>
            {trafficBySlot.length > 0 ? (
              <>
                {/* Bar Chart Visualization */}
                <div className={styles.chartSection}>
                  <TrafficBySlotChart data={trafficBySlot} />
                </div>

                {/* Table View */}
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Time Slot</th>
                        <th>Order Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trafficBySlot.map((slot) => {
                        const percentage = orderCounts.total > 0
                          ? (slot.orderCount / orderCounts.total) * 100
                          : 0;
                        return (
                          <tr key={slot.slotTime}>
                            <td>{formatSlotTime(slot.slotTime)}</td>
                            <td>{slot.orderCount}</td>
                            <td>
                              <div className={styles.percentageCell}>
                                <div
                                  className={styles.percentageBar}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                                <span className={styles.percentageText}>
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>No traffic data available for this date</div>
            )}
          </div>

          {/* Hostel Demand - Requirement 5.4 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Hostel Demand Distribution</h2>
            {hostelDemand.length > 0 ? (
              <>
                {/* Pie Chart Visualization */}
                <div className={styles.chartSection}>
                  <HostelDemandChart data={hostelDemand} />
                </div>

                {/* Table View */}
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Hostel Block</th>
                        <th>Order Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostelDemand.map((demand) => (
                        <tr key={demand.hostelBlock}>
                          <td>{demand.hostelBlock}</td>
                          <td>{demand.orderCount}</td>
                          <td>
                            <div className={styles.percentageCell}>
                              <div
                                className={styles.percentageBar}
                                style={{ width: `${demand.percentage}%` }}
                              ></div>
                              <span className={styles.percentageText}>
                                {demand.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>No hostel demand data available for this date</div>
            )}
          </div>

          {/* Heatmap - Requirement 5.5 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Consumption Heatmap (Block × Time Slot)</h2>
            {heatmapData.length > 0 ? (
              <>
                {/* Bubble Chart Visualization */}
                <div className={styles.chartSection}>
                  <HeatmapChart data={heatmapData} />
                </div>

                {/* Grid View */}
                <div className={styles.heatmapContainer}>
                  {/* Get unique hostel blocks and slot times */}
                  {(() => {
                    const blocks = Array.from(new Set(heatmapData.map(d => d.hostelBlock)));
                    const slots = Array.from(new Set(heatmapData.map(d => d.slotTime))).sort();
                    const maxIntensity = Math.max(...heatmapData.map(d => d.intensity), 1);

                    return (
                      <div className={styles.heatmap}>
                        {/* Header row with slot times */}
                        <div className={styles.heatmapRow}>
                          <div className={styles.heatmapHeaderCell}></div>
                          {slots.map(slot => (
                            <div key={slot} className={styles.heatmapHeaderCell}>
                              {formatSlotTime(slot)}
                            </div>
                          ))}
                        </div>

                        {/* Data rows */}
                        {blocks.map(block => (
                          <div key={block} className={styles.heatmapRow}>
                            <div className={styles.heatmapLabelCell}>{block}</div>
                            {slots.map(slot => {
                              const dataPoint = heatmapData.find(
                                d => d.hostelBlock === block && d.slotTime === slot
                              );
                              const intensity = dataPoint?.intensity || 0;
                              const opacity = maxIntensity > 0 ? intensity / maxIntensity : 0;

                              return (
                                <div
                                  key={`${block}-${slot}`}
                                  className={styles.heatmapCell}
                                  style={{
                                    backgroundColor: `rgba(76, 175, 80, ${opacity})`,
                                  }}
                                  title={`${block} - ${formatSlotTime(slot)}: ${intensity} orders`}
                                >
                                  {intensity > 0 ? intensity : ''}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>No heatmap data available for this date</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
