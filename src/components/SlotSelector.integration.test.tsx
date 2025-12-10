/**
 * Integration tests for SlotSelector component
 * Tests the integration between SlotSelector and slot generation service
 */

import { describe, it, expect, vi } from 'vitest';
import { getAvailableSlots } from '@/services/slots';

describe('SlotSelector Integration Tests', () => {
  describe('Slot Generation Integration', () => {
    it('should integrate with slot service to get correct timestamps for early morning context', () => {
      // Test scenario: Component rendered at 2:00 AM on Dec 10th
      const currentTime = new Date('2024-12-10T02:00:00');
      const slots = getAvailableSlots(currentTime, true);

      // Verify the component would receive slots with correct timestamps
      expect(slots).toHaveLength(13);

      // Find the 3:00 AM slot that would be displayed
      const threeAmSlot = slots.find(slot => slot.display === '3:00 AM');
      expect(threeAmSlot).toBeDefined();
      expect(threeAmSlot!.isAvailable).toBe(true);

      // Verify the slot timestamp is for the same day (Dec 10th)
      const slotDate = new Date(threeAmSlot!.time);
      expect(slotDate.getFullYear()).toBe(2024);
      expect(slotDate.getMonth()).toBe(11); // December (0-indexed)
      expect(slotDate.getDate()).toBe(10);
      expect(slotDate.getHours()).toBe(3);
      expect(slotDate.getMinutes()).toBe(0);

      // Verify the timestamp format is suitable for HTML select value
      expect(threeAmSlot!.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should integrate with slot service to get correct timestamps for late night context', () => {
      // Test scenario: Component rendered at 11:30 PM on Dec 10th
      const currentTime = new Date('2024-12-10T23:30:00');
      const slots = getAvailableSlots(currentTime, true);

      // Verify cross-midnight slots have correct dates
      const elevenThirtyPmSlot = slots.find(slot => slot.display === '11:30 PM');
      const oneAmSlot = slots.find(slot => slot.display === '1:00 AM');

      expect(elevenThirtyPmSlot).toBeDefined();
      expect(oneAmSlot).toBeDefined();

      // 11:30 PM should be current day
      const elevenThirtyPmDate = new Date(elevenThirtyPmSlot!.time);
      expect(elevenThirtyPmDate.getDate()).toBe(10);
      expect(elevenThirtyPmDate.getHours()).toBe(23);

      // 1:00 AM should be next day
      const oneAmDate = new Date(oneAmSlot!.time);
      expect(oneAmDate.getDate()).toBe(11);
      expect(oneAmDate.getHours()).toBe(1);

      // Both should have valid HTML select values
      expect(elevenThirtyPmSlot!.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(oneAmSlot!.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should integrate with slot service to get correct timestamps for daytime context', () => {
      // Test scenario: Component rendered at 8:00 PM on Dec 10th
      const currentTime = new Date('2024-12-10T20:00:00');
      const slots = getAvailableSlots(currentTime, true);

      // Verify upcoming night slots have correct dates
      const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
      const fiveAmSlot = slots.find(slot => slot.display === '5:00 AM');

      expect(elevenPmSlot).toBeDefined();
      expect(fiveAmSlot).toBeDefined();

      // 11:00 PM should be current day
      const elevenPmDate = new Date(elevenPmSlot!.time);
      expect(elevenPmDate.getDate()).toBe(10);
      expect(elevenPmDate.getHours()).toBe(23);

      // 5:00 AM should be next day
      const fiveAmDate = new Date(fiveAmSlot!.time);
      expect(fiveAmDate.getDate()).toBe(11);
      expect(fiveAmDate.getHours()).toBe(5);
    });
  });

  describe('Slot Availability Integration', () => {
    it('should correctly integrate availability logic with timestamps', () => {
      // Test at 2:00 AM with real availability logic
      const currentTime = new Date('2024-12-10T02:00:00');
      const slots = getAvailableSlots(currentTime, false); // Use real availability

      // Past slots should be unavailable but have correct timestamps
      const oneAmSlot = slots.find(slot => slot.display === '1:00 AM');
      expect(oneAmSlot).toBeDefined();
      expect(oneAmSlot!.isAvailable).toBe(false);

      const oneAmDate = new Date(oneAmSlot!.time);
      expect(oneAmDate.getDate()).toBe(10); // Still correct date
      expect(oneAmDate.getHours()).toBe(1);

      // Future slots should be available with correct timestamps
      const threeAmSlot = slots.find(slot => slot.display === '3:00 AM');
      expect(threeAmSlot).toBeDefined();
      expect(threeAmSlot!.isAvailable).toBe(true);

      const threeAmDate = new Date(threeAmSlot!.time);
      expect(threeAmDate.getDate()).toBe(10);
      expect(threeAmDate.getHours()).toBe(3);
    });

    it('should handle 30-minute buffer correctly with proper timestamps', () => {
      // Test at 11:15 PM (within 30 minutes of 11:30 PM slot)
      const currentTime = new Date('2024-12-10T23:15:00');
      const slots = getAvailableSlots(currentTime, false);

      // 11:00 PM should be unavailable (15 minutes away)
      const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
      expect(elevenPmSlot).toBeDefined();
      expect(elevenPmSlot!.isAvailable).toBe(false);

      // 11:30 PM should be unavailable (15 minutes away)
      const elevenThirtyPmSlot = slots.find(slot => slot.display === '11:30 PM');
      expect(elevenThirtyPmSlot).toBeDefined();
      expect(elevenThirtyPmSlot!.isAvailable).toBe(false);

      // 12:00 AM should be available (45 minutes away)
      const midnightSlot = slots.find(slot => slot.display === '12:00 AM');
      expect(midnightSlot).toBeDefined();
      expect(midnightSlot!.isAvailable).toBe(true);

      // All should have correct timestamps regardless of availability
      const elevenPmDate = new Date(elevenPmSlot!.time);
      const midnightDate = new Date(midnightSlot!.time);

      expect(elevenPmDate.getDate()).toBe(10); // Current day
      expect(elevenPmDate.getHours()).toBe(23);
      expect(midnightDate.getDate()).toBe(11); // Next day
      expect(midnightDate.getHours()).toBe(0);
    });
  });

  describe('Component Data Format Integration', () => {
    it('should provide data in format suitable for HTML select options', () => {
      const currentTime = new Date('2024-12-10T02:00:00');
      const slots = getAvailableSlots(currentTime, true);

      slots.forEach(slot => {
        // Each slot should have required properties for select options
        expect(slot).toHaveProperty('time');
        expect(slot).toHaveProperty('display');
        expect(slot).toHaveProperty('isAvailable');

        // Time should be a valid ISO string suitable for option value
        expect(typeof slot.time).toBe('string');
        expect(slot.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(() => new Date(slot.time)).not.toThrow();

        // Display should be human-readable
        expect(typeof slot.display).toBe('string');
        expect(slot.display).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);

        // isAvailable should be boolean
        expect(typeof slot.isAvailable).toBe('boolean');
      });
    });

    it('should provide consistent data format across different time contexts', () => {
      const contexts = [
        new Date('2024-12-10T02:00:00'), // Early morning
        new Date('2024-12-10T23:30:00'), // Late night
        new Date('2024-12-10T20:00:00'), // Daytime
      ];

      contexts.forEach(currentTime => {
        const slots = getAvailableSlots(currentTime, true);

        // All contexts should return same number of slots
        expect(slots).toHaveLength(13);

        // All slots should have consistent structure
        slots.forEach(slot => {
          expect(slot).toHaveProperty('time');
          expect(slot).toHaveProperty('display');
          expect(slot).toHaveProperty('isAvailable');

          // Time format should be consistent
          expect(slot.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
          
          // Display format should be consistent
          expect(slot.display).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
        });

        // Slots should be in chronological order
        for (let i = 0; i < slots.length - 1; i++) {
          const currentSlotTime = new Date(slots[i].time);
          const nextSlotTime = new Date(slots[i + 1].time);
          expect(nextSlotTime.getTime()).toBeGreaterThan(currentSlotTime.getTime());
        }
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle edge cases in slot generation gracefully', () => {
      // Test at exactly midnight
      const midnightTime = new Date('2024-12-10T00:00:00');
      const slots = getAvailableSlots(midnightTime, true);

      expect(slots).toHaveLength(13);
      expect(slots.every(slot => 
        slot.time && slot.display && typeof slot.isAvailable === 'boolean'
      )).toBe(true);

      // Test at end of month
      const endOfMonthTime = new Date('2024-01-31T02:00:00');
      const endOfMonthSlots = getAvailableSlots(endOfMonthTime, true);

      expect(endOfMonthSlots).toHaveLength(13);
      expect(endOfMonthSlots.every(slot => 
        slot.time && slot.display && typeof slot.isAvailable === 'boolean'
      )).toBe(true);

      // Verify timestamps are valid
      endOfMonthSlots.forEach(slot => {
        expect(() => new Date(slot.time)).not.toThrow();
        expect(isNaN(new Date(slot.time).getTime())).toBe(false);
      });
    });

    it('should maintain data integrity when slots are unavailable', () => {
      // Test during busy period when many slots might be unavailable
      const currentTime = new Date('2024-12-10T23:45:00');
      const slots = getAvailableSlots(currentTime, false);

      // Some slots should be unavailable due to time constraints
      const unavailableSlots = slots.filter(slot => !slot.isAvailable);
      const availableSlots = slots.filter(slot => slot.isAvailable);

      expect(unavailableSlots.length).toBeGreaterThan(0);
      expect(availableSlots.length).toBeGreaterThan(0);

      // All slots (available and unavailable) should have valid data
      slots.forEach(slot => {
        expect(slot.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(slot.display).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
        expect(typeof slot.isAvailable).toBe('boolean');
        expect(() => new Date(slot.time)).not.toThrow();
      });
    });
  });
});