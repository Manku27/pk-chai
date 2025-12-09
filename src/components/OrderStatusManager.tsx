'use client';

/**
 * OrderStatusManager Component
 * Handles order status workflow transitions with validation
 * Requirements: 3.2, 3.3, 3.4, 7.3, 7.4
 */

import { useState } from 'react';
import type { OrderWithDetails, OrderStatus } from '@/types/admin';
import styles from './OrderStatusManager.module.css';

interface OrderStatusManagerProps {
  order: OrderWithDetails;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

interface StatusAction {
  status: OrderStatus;
  label: string;
  className: string;
}

/**
 * Get available actions based on current order status
 * Requirements 3.2, 3.3, 3.4:
 * - ACCEPTED → ACKNOWLEDGED or REJECTED
 * - ACKNOWLEDGED → DELIVERED or REJECTED
 * - DELIVERED/REJECTED → No actions (terminal states)
 */
function getAvailableActions(currentStatus: OrderStatus): StatusAction[] {
  switch (currentStatus) {
    case 'ACCEPTED':
      return [
        { status: 'ACKNOWLEDGED', label: 'Acknowledge', className: 'acknowledge' },
        { status: 'REJECTED', label: 'Reject', className: 'reject' },
      ];
    case 'ACKNOWLEDGED':
      return [
        { status: 'DELIVERED', label: 'Mark as Delivered', className: 'deliver' },
        { status: 'REJECTED', label: 'Reject', className: 'reject' },
      ];
    case 'DELIVERED':
    case 'REJECTED':
      return []; // Terminal states - no actions available
    default:
      return [];
  }
}

export default function OrderStatusManager({ order, onStatusUpdate }: OrderStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableActions = getAvailableActions(order.status);

  /**
   * Handle status update with error handling and visual feedback
   * Requirement 7.3: Provide visual feedback within 200ms
   * Requirement 7.4: Display error message if update fails
   */
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    // Clear previous messages
    setError(null);
    setSuccessMessage(null);

    // Requirement: Disable buttons during updates to prevent double-clicks
    setIsUpdating(true);

    try {
      // Call the parent's update handler
      await onStatusUpdate(order.id, newStatus);

      // Show success message
      setSuccessMessage(`Order status updated to ${newStatus}`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      // Requirement 7.4: Display error messages for failed updates
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // If no actions available (terminal state), show status only
  if (availableActions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.terminalStatus}>
          <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
            {order.status}
          </span>
          <span className={styles.terminalText}>
            {order.status === 'DELIVERED' ? 'Order completed' : 'Order rejected'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Current status display */}
      <div className={styles.currentStatus}>
        <span className={styles.statusLabel}>Current Status:</span>
        <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
          {order.status}
        </span>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        {availableActions.map((action) => (
          <button
            key={action.status}
            className={`${styles.actionButton} ${styles[action.className]}`}
            onClick={() => handleStatusUpdate(action.status)}
            disabled={isUpdating}
            aria-label={`${action.label} order ${order.id}`}
          >
            {isUpdating ? (
              <span className={styles.loadingSpinner}>⏳</span>
            ) : null}
            {action.label}
          </button>
        ))}
      </div>

      {/* Visual feedback: Success message */}
      {successMessage && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✓</span>
          {successMessage}
        </div>
      )}

      {/* Visual feedback: Error message - Requirement 7.4 */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Loading overlay when updating */}
      {isUpdating && (
        <div className={styles.loadingOverlay}>
          <span className={styles.loadingText}>Updating...</span>
        </div>
      )}
    </div>
  );
}
