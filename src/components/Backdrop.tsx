'use client';

/**
 * Backdrop Component
 * Overlay that dims background content when drawer is open
 */

import { useEffect } from 'react';
import styles from './Backdrop.module.css';

interface BackdropProps {
  isOpen: boolean;
  onClick: () => void;
}

export function Backdrop({ isOpen, onClick }: BackdropProps) {
  // Prevent body scroll when backdrop is visible
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onClick}
      aria-hidden="true"
      role="presentation"
    />
  );
}
