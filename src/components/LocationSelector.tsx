'use client';

/**
 * LocationSelector Component
 * Dropdown for selecting delivery hostel block
 */

import { HostelBlock, HOSTEL_BLOCKS } from '@/types/menu';
import { useCart } from '@/contexts/CartContext';
import styles from './LocationSelector.module.css';

export function LocationSelector() {
  const { cart, setLocation } = useCart();

  const handleLocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value) {
      setLocation(value as HostelBlock);
    }
  };

  return (
    <div className={styles.locationSelector}>
      <label htmlFor="hostel-block" className={styles.label}>
        Delivery Location
      </label>
      <select
        id="hostel-block"
        className={styles.select}
        value={cart.selectedBlock || ''}
        onChange={handleLocationChange}
        aria-label="Select delivery hostel block"
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
    </div>
  );
}
