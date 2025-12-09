/**
 * Unit tests for generateAllSlots function
 * Tests the new isPast property and slot generation for admin dashboard
 */

import { describe, it, expect } from 'vitest';
import { generateAllSlots } from './slots';

describe('generateAllSlots', () => {
  it('should generate exactly 13 slots from 11:00 PM to 5:00 AM', () => {
    const currentTime = new Date('2024-01-15T10:00:00'); // 10 AM
    const slots = generateAllSlots(currentTime);
    
    // Should have 13 slots (11:00 PM, 11:30 PM, 12:00 AM, ..., 5:00 AM)
    expect(slots).toHaveLength(13);
    
    // First slot should be 11:00 PM
    expect(slots[0].display).toBe('11:00 PM');
    
    // Last slot should be 5:00 AM
    expect(slots[slots.length - 1].display).toBe('5:00 AM');
  });

  it('should mark slots before current time as past', () => {
    // Set current time to 1:00 AM
    const currentTime = new Date('2024-01-15T01:00:00');
    const slots = generateAllSlots(currentTime);
    
    // Slots before 1:00 AM should be marked as past
    const slot11PM = slots.find(s => s.display === '11:00 PM');
    const slot1130PM = slots.find(s => s.display === '11:30 PM');
    const slot12AM = slots.find(s => s.display === '12:00 AM');
    const slot1230AM = slots.find(s => s.display === '12:30 AM');
    const slot1AM = slots.find(s => s.display === '1:00 AM');
    const slot130AM = slots.find(s => s.display === '1:30 AM');
    const slot2AM = slots.find(s => s.display === '2:00 AM');
    
    // Past slots
    expect(slot11PM?.isPast).toBe(true);
    expect(slot1130PM?.isPast).toBe(true);
    expect(slot12AM?.isPast).toBe(true);
    expect(slot1230AM?.isPast).toBe(true);
    expect(slot1AM?.isPast).toBe(true);
    
    // Future slots
    expect(slot130AM?.isPast).toBe(false);
    expect(slot2AM?.isPast).toBe(false);
  });

  it('should mark all slots as not past when current time is before delivery window', () => {
    // Set current time to 10:00 AM (before delivery window)
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = generateAllSlots(currentTime);
    
    // All slots should be marked as not past (they're for tonight)
    slots.forEach(slot => {
      expect(slot.isPast).toBe(false);
    });
  });

  it('should handle day boundary crossing correctly', () => {
    // Set current time to 2:00 AM
    const currentTime = new Date('2024-01-15T02:00:00');
    const slots = generateAllSlots(currentTime);
    
    // Verify slots span from yesterday 11 PM to today 5 AM
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // First slot (11 PM) should be on Jan 14 (yesterday)
    expect(firstSlot.getDate()).toBe(14);
    expect(firstSlot.getHours()).toBe(23);
    
    // Last slot (5 AM) should be on Jan 15 (today)
    expect(lastSlot.getDate()).toBe(15);
    expect(lastSlot.getHours()).toBe(5);
    
    // Slots before 2 AM should be past
    const slot11PM = slots.find(s => s.display === '11:00 PM');
    const slot1AM = slots.find(s => s.display === '1:00 AM');
    const slot2AM = slots.find(s => s.display === '2:00 AM');
    const slot3AM = slots.find(s => s.display === '3:00 AM');
    
    expect(slot11PM?.isPast).toBe(true);
    expect(slot1AM?.isPast).toBe(true);
    expect(slot2AM?.isPast).toBe(true);
    expect(slot3AM?.isPast).toBe(false);
  });

  it('should include isPast property for all slots', () => {
    const currentTime = new Date('2024-01-15T23:30:00'); // 11:30 PM
    const slots = generateAllSlots(currentTime);
    
    // All slots should have isPast property defined
    slots.forEach(slot => {
      expect(slot).toHaveProperty('isPast');
      expect(typeof slot.isPast).toBe('boolean');
    });
  });

  it('should correctly mark slots at exact current time as past', () => {
    // Set current time to exactly 12:00 AM
    const currentTime = new Date('2024-01-15T00:00:00');
    const slots = generateAllSlots(currentTime);
    
    const slot12AM = slots.find(s => s.display === '12:00 AM');
    
    // Slot at exact current time should be marked as past (not strictly greater)
    expect(slot12AM?.isPast).toBe(true);
  });

  it('should handle edge case at 11:00 PM start time', () => {
    // Set current time to exactly 11:00 PM
    const currentTime = new Date('2024-01-15T23:00:00');
    const slots = generateAllSlots(currentTime);
    
    const slot11PM = slots.find(s => s.display === '11:00 PM');
    const slot1130PM = slots.find(s => s.display === '11:30 PM');
    
    // 11:00 PM slot should be past (at current time)
    expect(slot11PM?.isPast).toBe(true);
    
    // 11:30 PM slot should not be past
    expect(slot1130PM?.isPast).toBe(false);
  });

  it('should handle edge case at 5:00 AM end time', () => {
    // Set current time to exactly 5:00 AM
    const currentTime = new Date('2024-01-15T05:00:00');
    const slots = generateAllSlots(currentTime);
    
    // At 5:00 AM, we're outside the delivery window, so slots are for NEXT cycle (tonight)
    // All slots should be in the future (not past)
    slots.forEach(slot => {
      expect(slot.isPast).toBe(false);
    });
  });

  it('should maintain isAvailable property alongside isPast', () => {
    // Set current time to 12:00 AM
    const currentTime = new Date('2024-01-15T00:00:00');
    const slots = generateAllSlots(currentTime);
    
    // All slots should have both isPast and isAvailable properties
    slots.forEach(slot => {
      expect(slot).toHaveProperty('isPast');
      expect(slot).toHaveProperty('isAvailable');
    });
    
    // Past slots should not be available
    const slot11PM = slots.find(s => s.display === '11:00 PM');
    expect(slot11PM?.isPast).toBe(true);
    expect(slot11PM?.isAvailable).toBe(false);
    
    // Future slots more than 30 min away should be available
    const slot1AM = slots.find(s => s.display === '1:00 AM');
    expect(slot1AM?.isPast).toBe(false);
    expect(slot1AM?.isAvailable).toBe(true);
  });
});
