'use client';

/**
 * HeatmapChart Component
 * Heatmap visualization for block × slot intensity
 * Requirements: 5.5
 */

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';
import styles from './HeatmapChart.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

interface HeatmapData {
  hostelBlock: string;
  slotTime: string;
  intensity: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
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

  // Get unique hostel blocks and slot times
  const blocks = Array.from(new Set(data.map((d) => d.hostelBlock))).sort();
  const slots = Array.from(new Set(data.map((d) => d.slotTime))).sort();
  const maxIntensity = Math.max(...data.map((d) => d.intensity), 1);

  // Create bubble chart data points
  const bubbleData = data.map((point) => {
    const xIndex = slots.indexOf(point.slotTime);
    const yIndex = blocks.indexOf(point.hostelBlock);
    const radius = point.intensity > 0 ? Math.max(10, (point.intensity / maxIntensity) * 30) : 5;
    
    return {
      x: xIndex,
      y: yIndex,
      r: radius,
      intensity: point.intensity,
      hostelBlock: point.hostelBlock,
      slotTime: point.slotTime,
    };
  });

  // Prepare chart data
  const chartData = {
    datasets: [
      {
        label: 'Order Intensity',
        data: bubbleData,
        backgroundColor: bubbleData.map((point) => {
          const opacity = maxIntensity > 0 ? point.intensity / maxIntensity : 0;
          return `rgba(76, 175, 80, ${Math.max(0.2, opacity)})`;
        }),
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'bubble'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const point = context.raw;
            return [
              `Hostel: ${point.hostelBlock}`,
              `Time: ${formatSlotTime(point.slotTime)}`,
              `Orders: ${point.intensity}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: -0.5,
        max: slots.length - 0.5,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            const index = Math.round(value as number);
            return slots[index] ? formatSlotTime(slots[index]) : '';
          },
        },
        title: {
          display: true,
          text: 'Time Slot',
        },
        grid: {
          display: true,
        },
      },
      y: {
        type: 'linear',
        min: -0.5,
        max: blocks.length - 0.5,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            const index = Math.round(value as number);
            return blocks[index] || '';
          },
        },
        title: {
          display: true,
          text: 'Hostel Block',
        },
        grid: {
          display: true,
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      {data.length > 0 ? (
        <Bubble data={chartData} options={options} />
      ) : (
        <div className={styles.emptyState}>No heatmap data available</div>
      )}
    </div>
  );
}
