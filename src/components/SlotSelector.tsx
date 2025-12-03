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

export function SlotSelector() {
  const { cart, setSlot } = useCart();

  // Generate available slots based on current time
  const slots: TimeSlot[] = useMemo(() => {
    return getAvailableSlots();
  }, []);

  const handleSlotChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value) {
      setSlot(value);
    }
  };

  return (
    <div className={styles.slotSelector}>
      <label htmlFor="delivery-slot" className={styles.label}>
        Delivery Time
      </label>
      <select
        id="delivery-slot"
        className={styles.select}
        value={cart.selectedSlot || ''}
        onChange={handleSlotChange}
        aria-label="Select delivery time slot"
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
    </div>
  );
}
