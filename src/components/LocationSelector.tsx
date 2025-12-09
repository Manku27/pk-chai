'use client';

/**
 * LocationSelector Component
 * Dropdown for selecting delivery hostel block
 */

import { HostelBlock, HOSTEL_BLOCKS } from '@/types/menu';
import { useCart } from '@/contexts/CartContext';
import styles from './LocationSelector.module.css';

interface LocationSelectorProps {
  error?: string;
  onErrorClear?: () => void;
}

export function LocationSelector({ error, onErrorClear }: LocationSelectorProps = {}) {
  const { cart, setLocation } = useCart();

  const handleLocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value) {
      setLocation(value as HostelBlock);
      // Clear error when user makes a selection
      if (onErrorClear) {
        onErrorClear();
      }
    }
  };

  return (
    <div className={styles.locationSelector}>
      <label htmlFor="hostel-block" className={styles.label}>
        Delivery Location
      </label>
      <select
        id="hostel-block"
        className={`${styles.select} ${error ? styles.selectError : ''}`}
        value={cart.selectedBlock || ''}
        onChange={handleLocationChange}
        aria-label="Select delivery hostel block"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'location-error' : undefined}
      >
        <option value="" disabled>
          Select hostel block
        </option>
        {Object.entries(HOSTEL_BLOCKS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {error && (
        <div id="location-error" className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
