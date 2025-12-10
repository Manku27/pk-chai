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

  describe('Date Calculation Scenarios', () => {
    describe('Early Morning Context (12:00 AM - 5:00 AM)', () => {
      it('should generate same-day slots when ordering at 2:00 AM', () => {
        // Test scenario: Order placed at 2:00 AM on Dec 10th
        const currentTime = new Date('2024-12-10T02:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // All slots should be for the current day (Dec 10th)
        // The 3:00 AM slot should be 2024-12-10T03:00:00
        const threeAmSlot = slots.find(slot => slot.display === '3:00 AM');
        expect(threeAmSlot).toBeDefined();

        const slotDate = new Date(threeAmSlot!.time);
        expect(slotDate.getFullYear()).toBe(2024);
        expect(slotDate.getMonth()).toBe(11); // December (0-indexed)
        expect(slotDate.getDate()).toBe(10);
        expect(slotDate.getHours()).toBe(3);
        expect(slotDate.getMinutes()).toBe(0);
      });

      it('should generate same-day slots when ordering at 4:00 AM', () => {
        // Test scenario: Order placed at 4:00 AM on Dec 10th
        const currentTime = new Date('2024-12-10T04:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // The 5:00 AM slot should be for the same day (Dec 10th)
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');
        expect(fiveAmSlot).toBeDefined();

        const slotDate = new Date(fiveAmSlot!.time);
        expect(slotDate.getFullYear()).toBe(2024);
        expect(slotDate.getMonth()).toBe(11); // December (0-indexed)
        expect(slotDate.getDate()).toBe(10);
        expect(slotDate.getHours()).toBe(5);
        expect(slotDate.getMinutes()).toBe(0);
      });

      it('should verify 3:00 AM slot selected at 2:00 AM has correct date (Dec 10th scenario)', () => {
        // Specific test case from requirements: 2:00 AM order for 3:00 AM slot
        const currentTime = new Date(2024, 11, 10, 2, 0, 0); // Dec 10, 2024, 2:00 AM local time
        const slots = getAvailableSlots(currentTime, true);

        const threeAmSlot = slots.find(slot => slot.display === '3:00 AM');
        expect(threeAmSlot).toBeDefined();

        // Verify the slot is for December 10th, not December 11th
        const slotDate = new Date(threeAmSlot!.time);
        expect(slotDate.getFullYear()).toBe(2024);
        expect(slotDate.getMonth()).toBe(11); // December (0-indexed)
        expect(slotDate.getDate()).toBe(10);
        expect(slotDate.getHours()).toBe(3);
        expect(slotDate.getMinutes()).toBe(0);
      });

      it('should generate slots spanning from previous day 11:00 PM to current day 5:00 AM when in early morning', () => {
        // Test at 1:00 AM on Dec 10th
        const currentTime = new Date('2024-12-10T01:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // First slot (11:00 PM) should be from previous day (Dec 9th)
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        expect(elevenPmSlot).toBeDefined();

        const elevenPmDate = new Date(elevenPmSlot!.time);
        expect(elevenPmDate.getDate()).toBe(9); // Previous day
        expect(elevenPmDate.getHours()).toBe(23);

        // Last slot (5:00 AM) should be current day (Dec 10th)
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');
        expect(fiveAmSlot).toBeDefined();

        const fiveAmDate = new Date(fiveAmSlot!.time);
        expect(fiveAmDate.getDate()).toBe(10); // Current day
        expect(fiveAmDate.getHours()).toBe(5);
      });
    });

    describe('Late Night Context (11:00 PM - 11:59 PM)', () => {
      it('should generate cross-midnight slots when ordering at 11:30 PM', () => {
        // Test scenario: Order placed at 11:30 PM on Dec 10th
        const currentTime = new Date('2024-12-10T23:30:00');
        const slots = getAvailableSlots(currentTime, true);

        // Should have slots spanning current day and next day
        expect(slots).toHaveLength(13);

        // First slot (11:00 PM) should be current day
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        expect(elevenPmSlot).toBeDefined();

        const elevenPmDate = new Date(elevenPmSlot!.time);
        expect(elevenPmDate.getDate()).toBe(10); // Current day (Dec 10th)
        expect(elevenPmDate.getHours()).toBe(23);

        // Last slot (5:00 AM) should be next day
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');
        expect(fiveAmSlot).toBeDefined();

        const fiveAmDate = new Date(fiveAmSlot!.time);
        expect(fiveAmDate.getDate()).toBe(11); // Next day (Dec 11th)
        expect(fiveAmDate.getHours()).toBe(5);
      });

      it('should verify slots before midnight use current date', () => {
        // Test at 11:45 PM on Dec 10th
        const currentTime = new Date('2024-12-10T23:45:00');
        const slots = getAvailableSlots(currentTime, true);

        // 11:00 PM and 11:30 PM slots should be current day (Dec 10th)
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const elevenThirtyPmSlot = slots.find(slot => slot.display === '11:30 PM');

        expect(elevenPmSlot).toBeDefined();
        expect(elevenThirtyPmSlot).toBeDefined();

        const elevenPmDate = new Date(elevenPmSlot!.time);
        const elevenThirtyPmDate = new Date(elevenThirtyPmSlot!.time);

        expect(elevenPmDate.getDate()).toBe(10);
        expect(elevenThirtyPmDate.getDate()).toBe(10);
      });

      it('should verify slots after midnight use next date', () => {
        // Test at 11:15 PM on Dec 10th
        const currentTime = new Date('2024-12-10T23:15:00');
        const slots = getAvailableSlots(currentTime, true);

        // 12:00 AM, 1:00 AM, etc. should be next day (Dec 11th)
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const oneAmSlot = slots.find(slot => slot.display === '1:00 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(midnightSlot).toBeDefined();
        expect(oneAmSlot).toBeDefined();
        expect(fiveAmSlot).toBeDefined();

        const midnightDate = new Date(midnightSlot!.time);
        const oneAmDate = new Date(oneAmSlot!.time);
        const fiveAmDate = new Date(fiveAmSlot!.time);

        expect(midnightDate.getDate()).toBe(11); // Next day
        expect(oneAmDate.getDate()).toBe(11); // Next day
        expect(fiveAmDate.getDate()).toBe(11); // Next day
      });

      it('should handle cross-midnight transition correctly at 11:00 PM exactly', () => {
        // Test at exactly 11:00 PM on Dec 10th
        const currentTime = new Date('2024-12-10T23:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // Verify the transition from current day to next day
        const elevenPmSlot = slots[0]; // First slot
        const midnightSlot = slots[2]; // Third slot (12:00 AM)

        expect(elevenPmSlot.display).toBe('11:00 PM');
        expect(midnightSlot.display).toBe('12:00 AM');

        const elevenPmDate = new Date(elevenPmSlot.time);
        const midnightDate = new Date(midnightSlot.time);

        expect(elevenPmDate.getDate()).toBe(10); // Current day
        expect(midnightDate.getDate()).toBe(11); // Next day
      });
    });

    describe('Daytime Context (5:01 AM - 10:59 PM)', () => {
      it('should generate upcoming night slots when ordering at 8:00 PM', () => {
        // Test scenario: Order placed at 8:00 PM on Dec 10th
        const currentTime = new Date('2024-12-10T20:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // All slots should be for the upcoming night delivery window
        expect(slots).toHaveLength(13);

        // First slot (11:00 PM) should be current day (Dec 10th)
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        expect(elevenPmSlot).toBeDefined();

        const elevenPmDate = new Date(elevenPmSlot!.time);
        expect(elevenPmDate.getDate()).toBe(10); // Current day
        expect(elevenPmDate.getHours()).toBe(23);

        // Last slot (5:00 AM) should be next day (Dec 11th)
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');
        expect(fiveAmSlot).toBeDefined();

        const fiveAmDate = new Date(fiveAmSlot!.time);
        expect(fiveAmDate.getDate()).toBe(11); // Next day
        expect(fiveAmDate.getHours()).toBe(5);
      });

      it('should verify all slots use appropriate dates for upcoming delivery window', () => {
        // Test at 2:00 PM on Dec 10th
        const currentTime = new Date('2024-12-10T14:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // Slots before midnight should be current day
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const elevenThirtyPmSlot = slots.find(slot => slot.display === '11:30 PM');

        expect(elevenPmSlot).toBeDefined();
        expect(elevenThirtyPmSlot).toBeDefined();

        const elevenPmDate = new Date(elevenPmSlot!.time);
        const elevenThirtyPmDate = new Date(elevenThirtyPmSlot!.time);

        expect(elevenPmDate.getDate()).toBe(10); // Current day
        expect(elevenThirtyPmDate.getDate()).toBe(10); // Current day

        // Slots after midnight should be next day
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const oneAmSlot = slots.find(slot => slot.display === '1:00 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(midnightSlot).toBeDefined();
        expect(oneAmSlot).toBeDefined();
        expect(fiveAmSlot).toBeDefined();

        const midnightDate = new Date(midnightSlot!.time);
        const oneAmDate = new Date(oneAmSlot!.time);
        const fiveAmDate = new Date(fiveAmSlot!.time);

        expect(midnightDate.getDate()).toBe(11); // Next day
        expect(oneAmDate.getDate()).toBe(11); // Next day
        expect(fiveAmDate.getDate()).toBe(11); // Next day
      });

      it('should generate upcoming night slots when ordering at 6:00 AM', () => {
        // Test at 6:00 AM on Dec 10th (just after night delivery window)
        const currentTime = new Date('2024-12-10T06:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // All slots should be for the upcoming night (Dec 10th evening to Dec 11th morning)
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(elevenPmSlot).toBeDefined();
        expect(fiveAmSlot).toBeDefined();

        const elevenPmDate = new Date(elevenPmSlot!.time);
        const fiveAmDate = new Date(fiveAmSlot!.time);

        expect(elevenPmDate.getDate()).toBe(10); // Current day evening
        expect(fiveAmDate.getDate()).toBe(11); // Next day morning
      });

      it('should generate upcoming night slots when ordering at 10:59 PM', () => {
        // Test at 10:59 PM on Dec 10th (just before night delivery window)
        const currentTime = new Date('2024-12-10T22:59:00');
        const slots = getAvailableSlots(currentTime, true);

        // Should generate slots for the upcoming night delivery window
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(elevenPmSlot).toBeDefined();
        expect(fiveAmSlot).toBeDefined();

        const elevenPmDate = new Date(elevenPmSlot!.time);
        const fiveAmDate = new Date(fiveAmSlot!.time);

        expect(elevenPmDate.getDate()).toBe(10); // Current day
        expect(fiveAmDate.getDate()).toBe(11); // Next day
      });
    });
  });

  describe('Time-Based Slot Blocking', () => {
    describe('Active Delivery Window Scenarios', () => {
      it('should block slots before 1:00 AM and make slots after 1:30 AM available when current time is 1:00 AM', () => {
        // Test scenario: Order placed at 1:00 AM during active delivery window
        const currentTime = new Date('2024-12-10T01:00:00');
        const slots = getAvailableSlots(currentTime);

        // Slots before 1:00 AM should be blocked (time-based blocking)
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const elevenThirtyPmSlot = slots.find(slot => slot.display === '11:30 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const twelveThirtyAmSlot = slots.find(slot => slot.display === '12:30 AM');

        expect(elevenPmSlot?.isAvailable).toBe(false);
        expect(elevenThirtyPmSlot?.isAvailable).toBe(false);
        expect(midnightSlot?.isAvailable).toBe(false);
        expect(twelveThirtyAmSlot?.isAvailable).toBe(false);

        // 1:00 AM slot should be blocked (both time-based blocking and 30-minute buffer)
        const oneAmSlot = slots.find(slot => slot.display === '1:00 AM');
        expect(oneAmSlot?.isAvailable).toBe(false);

        // 1:30 AM slot should be blocked (30-minute buffer - only 30 minutes away)
        const oneThirtyAmSlot = slots.find(slot => slot.display === '1:30 AM');
        expect(oneThirtyAmSlot?.isAvailable).toBe(false);

        // Slots from 2:00 AM onwards should be available (after 30-minute buffer)
        const twoAmSlot = slots.find(slot => slot.display === '2:00 AM');
        const twoThirtyAmSlot = slots.find(slot => slot.display === '2:30 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(twoAmSlot?.isAvailable).toBe(true);
        expect(twoThirtyAmSlot?.isAvailable).toBe(true);
        expect(fiveAmSlot?.isAvailable).toBe(true);
      });

      it('should show only 5:00 AM slot potentially available when current time is 4:30 AM', () => {
        // Test scenario: Order placed at 4:30 AM during active delivery window
        const currentTime = new Date('2024-12-10T04:30:00');
        const slots = getAvailableSlots(currentTime);

        // All slots before 4:30 AM should be blocked (time-based blocking)
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const twoAmSlot = slots.find(slot => slot.display === '2:00 AM');
        const fourAmSlot = slots.find(slot => slot.display === '4:00 AM');

        expect(elevenPmSlot?.isAvailable).toBe(false);
        expect(midnightSlot?.isAvailable).toBe(false);
        expect(twoAmSlot?.isAvailable).toBe(false);
        expect(fourAmSlot?.isAvailable).toBe(false);

        // 4:30 AM slot should be blocked (both time-based blocking and 30-minute buffer)
        const fourThirtyAmSlot = slots.find(slot => slot.display === '4:30 AM');
        expect(fourThirtyAmSlot?.isAvailable).toBe(false);

        // 5:00 AM slot should be blocked (30-minute buffer - only 30 minutes away)
        // At 4:30 AM, the 30-minute buffer extends to 5:00 AM, so 5:00 AM slot is not available
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');
        expect(fiveAmSlot?.isAvailable).toBe(false);
      });

      it('should block all slots when current time is 4:45 AM due to time-based blocking and buffer', () => {
        // Test scenario: Order placed at 4:45 AM during active delivery window
        const currentTime = new Date('2024-12-10T04:45:00');
        const slots = getAvailableSlots(currentTime);

        // All slots should be blocked - either by time-based blocking or 30-minute buffer
        slots.forEach(slot => {
          expect(slot.isAvailable).toBe(false);
        });

        // Specifically verify key slots
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const fourAmSlot = slots.find(slot => slot.display === '4:00 AM');
        const fourThirtyAmSlot = slots.find(slot => slot.display === '4:30 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(elevenPmSlot?.isAvailable).toBe(false); // Time-based blocking
        expect(midnightSlot?.isAvailable).toBe(false); // Time-based blocking
        expect(fourAmSlot?.isAvailable).toBe(false); // Time-based blocking
        expect(fourThirtyAmSlot?.isAvailable).toBe(false); // Time-based blocking
        expect(fiveAmSlot?.isAvailable).toBe(false); // 30-minute buffer (5:00 AM < 5:15 AM)
      });
    });

    describe('Shift Reset and Preparation Periods', () => {
      it('should make all slots available for upcoming delivery window when current time is 6:00 AM', () => {
        // Test scenario: Order placed at 6:00 AM (shift reset time)
        const currentTime = new Date('2024-12-10T06:00:00');
        const slots = getAvailableSlots(currentTime);

        // All slots should be available for the upcoming night delivery window
        // Only 30-minute buffer should apply, no time-based blocking
        slots.forEach(slot => {
          expect(slot.isAvailable).toBe(true);
        });

        // Verify specific slots are available
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const twoAmSlot = slots.find(slot => slot.display === '2:00 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(elevenPmSlot?.isAvailable).toBe(true);
        expect(midnightSlot?.isAvailable).toBe(true);
        expect(twoAmSlot?.isAvailable).toBe(true);
        expect(fiveAmSlot?.isAvailable).toBe(true);
      });

      it('should not apply time-based blocking when current time is 8:00 PM', () => {
        // Test scenario: Order placed at 8:00 PM (preparation period)
        const currentTime = new Date('2024-12-10T20:00:00');
        const slots = getAvailableSlots(currentTime);

        // All slots should be available for the upcoming night delivery window
        // No time-based blocking should be applied during preparation period
        slots.forEach(slot => {
          expect(slot.isAvailable).toBe(true);
        });

        // Verify specific slots are available
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const threeAmSlot = slots.find(slot => slot.display === '3:00 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(elevenPmSlot?.isAvailable).toBe(true);
        expect(midnightSlot?.isAvailable).toBe(true);
        expect(threeAmSlot?.isAvailable).toBe(true);
        expect(fiveAmSlot?.isAvailable).toBe(true);
      });

      it('should apply only 30-minute buffer and no time-based blocking when current time is 10:00 PM', () => {
        // Test scenario: Order placed at 10:00 PM (just before delivery window)
        const currentTime = new Date('2024-12-10T22:00:00');
        const slots = getAvailableSlots(currentTime);

        // 30-minute buffer should apply, but no time-based blocking
        // Slots within 30 minutes should be unavailable, others available

        // 10:30 PM cutoff means slots before 10:30 PM should be unavailable
        // But since we're generating night delivery slots (11:00 PM onwards), all should be available
        slots.forEach(slot => {
          expect(slot.isAvailable).toBe(true);
        });

        // Verify specific slots are available (all night delivery slots are > 30 minutes away)
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const twoAmSlot = slots.find(slot => slot.display === '2:00 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(elevenPmSlot?.isAvailable).toBe(true);
        expect(midnightSlot?.isAvailable).toBe(true);
        expect(twoAmSlot?.isAvailable).toBe(true);
        expect(fiveAmSlot?.isAvailable).toBe(true);
      });
    });

    describe('Combined Logic Scenarios', () => {
      it('should verify 30-minute buffer and time-based blocking work together correctly', () => {
        // Test scenario: Order placed at 2:00 AM during active delivery window
        const currentTime = new Date('2024-12-10T02:00:00');
        const slots = getAvailableSlots(currentTime);

        // Slots before 2:00 AM should be blocked by time-based blocking
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const oneAmSlot = slots.find(slot => slot.display === '1:00 AM');
        const oneThirtyAmSlot = slots.find(slot => slot.display === '1:30 AM');

        expect(elevenPmSlot?.isAvailable).toBe(false); // Time-based blocking
        expect(midnightSlot?.isAvailable).toBe(false); // Time-based blocking
        expect(oneAmSlot?.isAvailable).toBe(false); // Time-based blocking
        expect(oneThirtyAmSlot?.isAvailable).toBe(false); // Time-based blocking

        // 2:00 AM and 2:30 AM slots should be blocked by 30-minute buffer
        const twoAmSlot = slots.find(slot => slot.display === '2:00 AM');
        const twoThirtyAmSlot = slots.find(slot => slot.display === '2:30 AM');

        expect(twoAmSlot?.isAvailable).toBe(false); // 30-minute buffer
        expect(twoThirtyAmSlot?.isAvailable).toBe(false); // 30-minute buffer

        // Slots from 3:00 AM onwards should be available (pass both checks)
        const threeAmSlot = slots.find(slot => slot.display === '3:00 AM');
        const fourAmSlot = slots.find(slot => slot.display === '4:00 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(threeAmSlot?.isAvailable).toBe(true);
        expect(fourAmSlot?.isAvailable).toBe(true);
        expect(fiveAmSlot?.isAvailable).toBe(true);
      });

      it('should verify environment variable override bypasses both time-based blocking and buffer', () => {
        // Test scenario: Order placed at 2:00 AM with enableAllSlots = true
        const currentTime = new Date('2024-12-10T02:00:00');
        const slots = getAvailableSlots(currentTime, true);

        // All slots should be available despite being in active delivery window
        // Environment override should bypass both time-based blocking and 30-minute buffer
        slots.forEach(slot => {
          expect(slot.isAvailable).toBe(true);
        });

        // Verify specific slots that would normally be blocked
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const oneAmSlot = slots.find(slot => slot.display === '1:00 AM');
        const twoAmSlot = slots.find(slot => slot.display === '2:00 AM');

        expect(elevenPmSlot?.isAvailable).toBe(true); // Override bypasses time-based blocking
        expect(midnightSlot?.isAvailable).toBe(true); // Override bypasses time-based blocking
        expect(oneAmSlot?.isAvailable).toBe(true); // Override bypasses time-based blocking
        expect(twoAmSlot?.isAvailable).toBe(true); // Override bypasses 30-minute buffer
      });

      it('should handle edge cases around delivery window transitions (5:00 AM to 6:00 AM)', () => {
        // Test scenario: Order placed at 5:30 AM (post-delivery period, before reset)
        const currentTime = new Date('2024-12-10T05:30:00');
        const slots = getAvailableSlots(currentTime);

        // During AFTER_WINDOW state (5:01 AM - 5:59 AM), slots should be available for upcoming night
        // Only 30-minute buffer should apply, no time-based blocking
        slots.forEach(slot => {
          expect(slot.isAvailable).toBe(true);
        });

        // Verify specific slots are available for upcoming delivery window
        const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
        const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
        const threeAmSlot = slots.find(slot => slot.display === '3:00 AM');
        const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

        expect(elevenPmSlot?.isAvailable).toBe(true);
        expect(midnightSlot?.isAvailable).toBe(true);
        expect(threeAmSlot?.isAvailable).toBe(true);
        expect(fiveAmSlot?.isAvailable).toBe(true);

        // Test the exact transition at 6:00 AM
        const sixAmTime = new Date('2024-12-10T06:00:00');
        const sixAmSlots = getAvailableSlots(sixAmTime);

        // At 6:00 AM, all slots should be available for upcoming night
        sixAmSlots.forEach(slot => {
          expect(slot.isAvailable).toBe(true);
        });
      });
    });
  });
});
