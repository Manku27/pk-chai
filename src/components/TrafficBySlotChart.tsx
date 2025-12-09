'use client';

/**
 * TrafficBySlotChart Component
 * Bar chart visualization for traffic by time slot
 * Requirements: 5.3
 */

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './TrafficBySlotChart.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TrafficBySlot {
  slotTime: string;
  orderCount: number;
}

interface TrafficBySlotChartProps {
  data: TrafficBySlot[];
}

export default function TrafficBySlotChart({ data }: TrafficBySlotChartProps) {
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

  // Prepare chart data
  const chartData = {
    labels: data.map((slot) => formatSlotTime(slot.slotTime)),
    datasets: [
      {
        label: 'Order Count',
        data: data.map((slot) => slot.orderCount),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Orders: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Orders',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time Slot',
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
