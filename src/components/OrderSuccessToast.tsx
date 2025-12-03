'use client';

/**
 * OrderSuccessToast Component
 * Shows order confirmation with order ID
 * Neo-brutalist design with celebration feel
 */

import { useEffect } from 'react';
import styles from './OrderSuccessToast.module.css';

interface OrderSuccessToastProps {
  orderId: string;
  onClose: () => void;
}

export function OrderSuccessToast({ orderId, onClose }: OrderSuccessToastProps) {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.toast} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>🎉</div>
        <h3 className={styles.title}>Order Placed Successfully!</h3>
        <p className={styles.message}>
          Your order has been confirmed and will be delivered soon.
        </p>
        <div className={styles.orderId}>
          <span className={styles.label}>Order ID:</span>
          <span className={styles.id}>{orderId}</span>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  );
}
