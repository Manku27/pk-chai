/**
 * Comprehensive tests for the slot generation fix
 */

import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from './slots';

describe('Slot Generation - Comprehensive Scenarios', () => {
  it('10:00 AM - should show slots for tonight (next delivery cycle)', () => {
    const currentTime = new Date('2024-12-06T10:00:00'); // 10 AM
    const slots = getAvailableSlots(currentTime, false);
    
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // Should show tonight's delivery cycle
    expect(firstSlot.getDate()).toBe(6); // 11 PM on Dec 6
    expect(lastSlot.getDate()).toBe(7); // 5 AM on Dec 7
    
    // All slots should be available (many hours away)
    expect(slots.every(s => s.isAvailable)).toBe(true);
  });

  it('11:00 PM - should show slots for current delivery cycle', () => {
    const currentTime = new Date('2024-12-06T23:00:00'); // 11 PM
    const slots = getAvailableSlots(currentTime, false);
    
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // Should show current delivery cycle
    expect(firstSlot.getDate()).toBe(6); // 11 PM on Dec 6
    expect(lastSlot.getDate()).toBe(7); // 5 AM on Dec 7
    
    // 11:00 PM and 11:30 PM should be unavailable (within 30 min)
    expect(slots[0].isAvailable).toBe(false); // 11:00 PM
    expect(slots[1].isAvailable).toBe(false); // 11:30 PM
    expect(slots[2].isAvailable).toBe(true); // 12:00 AM (30 min away)
  });

  it('12:30 AM - should show slots for current delivery cycle', () => {
    const currentTime = new Date('2024-12-06T00:30:00'); // 12:30 AM
    const slots = getAvailableSlots(currentTime, false);
    
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // Should show current delivery cycle (started yesterday)
    expect(firstSlot.getDate()).toBe(5); // 11 PM on Dec 5
    expect(lastSlot.getDate()).toBe(6); // 5 AM on Dec 6
    
    // Slots up to 1:00 AM should be unavailable
    const slot1230AM = slots.find(s => s.display === '12:30 AM');
    const slot1AM = slots.find(s => s.display === '1:00 AM');
    const slot130AM = slots.find(s => s.display === '1:30 AM');
    
    expect(slot1230AM?.isAvailable).toBe(false);
    expect(slot1AM?.isAvailable).toBe(false);
    expect(slot130AM?.isAvailable).toBe(true);
  });

  it('1:30 AM - should show slots for current delivery cycle (YOUR SCENARIO)', () => {
    const currentTime = new Date('2024-12-06T01:30:00'); // 1:30 AM
    const slots = getAvailableSlots(currentTime, false);
    
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // Should show current delivery cycle (started yesterday)
    expect(firstSlot.getDate()).toBe(5); // 11 PM on Dec 5
    expect(lastSlot.getDate()).toBe(6); // 5 AM on Dec 6
    
    // Find the 2:00 AM slot
    const slot2AM = slots.find(s => s.display === '2:00 AM');
    const slot230AM = slots.find(s => s.display === '2:30 AM');
    
    // 2:00 AM should be on Dec 6 (same day)
    expect(new Date(slot2AM!.time).getDate()).toBe(6);
    
    // 2:00 AM should be unavailable (within 30 min)
    expect(slot2AM?.isAvailable).toBe(false);
    
    // 2:30 AM should be available (exactly 1 hour away)
    expect(slot230AM?.isAvailable).toBe(true);
  });

  it('4:30 AM - should show slots for current delivery cycle', () => {
    const currentTime = new Date('2024-12-06T04:30:00'); // 4:30 AM
    const slots = getAvailableSlots(currentTime, false);
    
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // Should show current delivery cycle (started yesterday)
    expect(firstSlot.getDate()).toBe(5); // 11 PM on Dec 5
    expect(lastSlot.getDate()).toBe(6); // 5 AM on Dec 6
    
    // 5:00 AM is only 30 minutes away, so it should be unavailable
    const slot5AM = slots.find(s => s.display === '5:00 AM');
    expect(slot5AM?.isAvailable).toBe(false);
    
    // All slots should be unavailable (all in the past or within 30 min)
    const availableSlots = slots.filter(s => s.isAvailable);
    expect(availableSlots.length).toBe(0);
  });

  it('5:00 AM - should show slots for next delivery cycle (tonight)', () => {
    const currentTime = new Date('2024-12-06T05:00:00'); // 5 AM
    const slots = getAvailableSlots(currentTime, false);
    
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // Should show next delivery cycle (tonight)
    expect(firstSlot.getDate()).toBe(6); // 11 PM on Dec 6
    expect(lastSlot.getDate()).toBe(7); // 5 AM on Dec 7
    
    // All slots should be available (18+ hours away)
    expect(slots.every(s => s.isAvailable)).toBe(true);
  });

  it('6:00 AM - should show slots for next delivery cycle (tonight)', () => {
    const currentTime = new Date('2024-12-06T06:00:00'); // 6 AM
    const slots = getAvailableSlots(currentTime, false);
    
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // Should show next delivery cycle (tonight)
    expect(firstSlot.getDate()).toBe(6); // 11 PM on Dec 6
    expect(lastSlot.getDate()).toBe(7); // 5 AM on Dec 7
    
    // All slots should be available (17+ hours away)
    expect(slots.every(s => s.isAvailable)).toBe(true);
  });
});
