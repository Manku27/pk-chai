'use client';

/**
 * SlotSelector Component
 * Dropdown for selecting delivery time slot
 */

import { useCart } from '@/contexts/CartContext';
import { getAvailableSlots } from '@/services/slots';
import { TimeSlot } from '@/types/menu';
import { useMemo } from 'react';
import styles from './SlotSelector.module.css';

interface SlotSelectorProps {
  error?: string;
  onErrorClear?: () => void;
}

export function SlotSelector({ error, onErrorClear }: SlotSelectorProps = {}) {
  const { cart, setSlot } = useCart();

  // Generate available slots based on current time
  const slots: TimeSlot[] = useMemo(() => {
    return getAvailableSlots();
  }, []);

  const handleSlotChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value) {
      setSlot(value);
      // Clear error when user makes a selection
      if (onErrorClear) {
        onErrorClear();
      }
    }
  };

  return (
    <div className={styles.slotSelector}>
      <label htmlFor="delivery-slot" className={styles.label}>
        Delivery Time
      </label>
      <select
        id="delivery-slot"
        className={`${styles.select} ${error ? styles.selectError : ''}`}
        value={cart.selectedSlot || ''}
        onChange={handleSlotChange}
        aria-label="Select delivery time slot"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'slot-error' : undefined}
      >
        <option value="" disabled>
          Select time slot
        </option>
        {slots.map((slot) => (
          <option
            key={slot.time}
            value={slot.time}
            disabled={!slot.isAvailable}
            className={!slot.isAvailable ? styles.disabledOption : ''}
          >
            {slot.display} {!slot.isAvailable ? '(Unavailable)' : ''}
          </option>
        ))}
      </select>
      {error && (
        <div id="slot-error" className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
