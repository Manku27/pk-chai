'use client';

/**
 * HostelDemandChart Component
 * Pie chart visualization for hostel demand distribution
 * Requirements: 5.4
 */

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import styles from './HostelDemandChart.module.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface HostelDemand {
  hostelBlock: string;
  orderCount: number;
  percentage: number;
}

interface HostelDemandChartProps {
  data: HostelDemand[];
}

export default function HostelDemandChart({ data }: HostelDemandChartProps) {
  // Define colors for each hostel block
  const colors = [
    'rgba(76, 175, 80, 0.8)',   // Green
    'rgba(33, 150, 243, 0.8)',  // Blue
    'rgba(255, 152, 0, 0.8)',   // Orange
    'rgba(156, 39, 176, 0.8)',  // Purple
  ];

  const borderColors = [
    'rgba(76, 175, 80, 1)',
    'rgba(33, 150, 243, 1)',
    'rgba(255, 152, 0, 1)',
    'rgba(156, 39, 176, 1)',
  ];

  // Prepare chart data
  const chartData = {
    labels: data.map((demand) => demand.hostelBlock),
    datasets: [
      {
        label: 'Order Count',
        data: data.map((demand) => demand.orderCount),
        backgroundColor: colors.slice(0, data.length),
        borderColor: borderColors.slice(0, data.length),
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc: number, val) => acc + (val as number), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} orders (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
