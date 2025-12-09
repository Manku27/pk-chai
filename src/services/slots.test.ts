/**
 * Unit tests for slot generator service
 */

import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from './slots';

describe('Slot Generator Service', () => {
  it('should generate exactly 13 slots from 11:00 PM to 5:00 AM', () => {
    const currentTime = new Date('2024-01-01T09:00:00');
    const slots = getAvailableSlots(currentTime);

    expect(slots).toHaveLength(13);
    expect(slots[0].display).toBe('11:00 PM');
    expect(slots[12].display).toBe('5:00 AM');
  });

  it('should generate slots at 30-minute intervals', () => {
    const currentTime = new Date('2024-01-01T09:00:00');
    const slots = getAvailableSlots(currentTime);

    // Check that each slot is 30 minutes apart
    for (let i = 0; i < slots.length - 1; i++) {
      const currentSlotTime = new Date(slots[i].time);
      const nextSlotTime = new Date(slots[i + 1].time);
      const diffMinutes = (nextSlotTime.getTime() - currentSlotTime.getTime()) / (1000 * 60);

      expect(diffMinutes).toBe(30);
    }
  });

  it('should mark slots within 30 minutes of current time as unavailable', () => {
    // Set current time to 11:15 PM
    const currentTime = new Date('2024-01-01T23:15:00');
    const slots = getAvailableSlots(currentTime);

    // 11:00 PM slot should be unavailable (15 minutes away)
    expect(slots[0].display).toBe('11:00 PM');
    expect(slots[0].isAvailable).toBe(false);

    // 11:30 PM slot should be unavailable (15 minutes away)
    expect(slots[1].display).toBe('11:30 PM');
    expect(slots[1].isAvailable).toBe(false);

    // 12:00 AM slot should be available (45 minutes away)
    expect(slots[2].display).toBe('12:00 AM');
    expect(slots[2].isAvailable).toBe(true);
  });

  it('should mark all slots as available when current time is before night delivery window', () => {
    const currentTime = new Date('2024-01-01T21:00:00'); // 9:00 PM
    const slots = getAvailableSlots(currentTime);

    // All slots should be available
    slots.forEach(slot => {
      expect(slot.isAvailable).toBe(true);
    });
  });

  it('should mark all slots as available when current time is after night delivery window', () => {
    const currentTime = new Date('2024-01-01T06:00:00'); // 6:00 AM
    const slots = getAvailableSlots(currentTime);

    // All slots should be available (they're for the upcoming night)
    slots.forEach(slot => {
      expect(slot.isAvailable).toBe(true);
    });
  });

  it('should handle boundary case at exactly 30 minutes before slot', () => {
    // Set current time to exactly 10:30 PM (30 minutes before first slot)
    const currentTime = new Date('2024-01-01T22:30:00');
    const slots = getAvailableSlots(currentTime);

    // 11:00 PM slot should be unavailable (exactly 30 minutes away)
    expect(slots[0].display).toBe('11:00 PM');
    expect(slots[0].isAvailable).toBe(false);

    // 11:30 PM slot should be available (60 minutes away)
    expect(slots[1].display).toBe('11:30 PM');
    expect(slots[1].isAvailable).toBe(true);
  });

  it('should return ISO timestamp format for time field', () => {
    const currentTime = new Date('2024-01-01T09:00:00');
    const slots = getAvailableSlots(currentTime);

    slots.forEach(slot => {
      // Verify it's a valid ISO string
      expect(() => new Date(slot.time)).not.toThrow();
      expect(slot.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Environment variable support', () => {
    it('should mark all slots as available when enableAllSlots parameter is true', () => {
      // Set current time to after night delivery window when normally all slots would be unavailable
      const currentTime = new Date('2024-01-01T06:00:00'); // 6:00 AM
      const slots = getAvailableSlots(currentTime, true);

      // All slots should be available despite being in the past
      expect(slots).toHaveLength(13);
      slots.forEach(slot => {
        expect(slot.isAvailable).toBe(true);
      });
    });

    it('should maintain normal 30-minute buffer logic when enableAllSlots is false', () => {
      const currentTime = new Date('2024-01-01T23:15:00'); // 11:15 PM
      const slots = getAvailableSlots(currentTime, false);

      // Should follow normal availability rules
      expect(slots[0].isAvailable).toBe(false); // 11:00 PM - unavailable
      expect(slots[1].isAvailable).toBe(false); // 11:30 PM - unavailable
      expect(slots[2].isAvailable).toBe(true);  // 12:00 AM - available
    });

    it('should still generate exactly 13 slots when enableAllSlots is true', () => {
      const currentTime = new Date('2024-01-01T06:00:00'); // 6:00 AM
      const slots = getAvailableSlots(currentTime, true);

      expect(slots).toHaveLength(13);
      expect(slots[0].display).toBe('11:00 PM');
      expect(slots[12].display).toBe('5:00 AM');
    });

    it('should maintain 30-minute intervals when enableAllSlots is true', () => {
      const currentTime = new Date('2024-01-01T06:00:00'); // 6:00 AM
      const slots = getAvailableSlots(currentTime, true);

      // Check that each slot is 30 minutes apart
      for (let i = 0; i < slots.length - 1; i++) {
        const currentSlotTime = new Date(slots[i].time);
        const nextSlotTime = new Date(slots[i + 1].time);
        const diffMinutes = (nextSlotTime.getTime() - currentSlotTime.getTime()) / (1000 * 60);

        expect(diffMinutes).toBe(30);
      }
    });
  });
});
