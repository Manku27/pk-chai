/**
 * Debug tests to understand slot generation behavior
 */

import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from './slots';

describe('Slot Generation Debug - Understanding the Bug', () => {
  it('should show what happens when current time is 2:00 AM', () => {
    const currentTime = new Date('2024-01-15T02:00:00'); // 2 AM on Jan 15
    const slots = getAvailableSlots(currentTime, false);
    
    console.log('\n=== Current Time: 2:00 AM on Jan 15, 2024 ===');
    console.log('Cutoff time (current + 30 min):', new Date(currentTime.getTime() + 30 * 60 * 1000).toISOString());
    
    slots.forEach((slot, index) => {
      const slotDate = new Date(slot.time);
      console.log(`Slot ${index}: ${slot.display} | ${slot.time} | Available: ${slot.isAvailable} | Date: ${slotDate.getDate()}`);
    });
    
    // The issue: When it's 2 AM on Jan 15, the code generates:
    // - 11:00 PM on Jan 15 (which is 21 hours in the FUTURE)
    // - 12:00 AM on Jan 16 (which is 22 hours in the FUTURE)
    // - 2:00 AM on Jan 16 (which is 24 hours in the FUTURE)
    
    // But logically, if it's 2 AM, we're IN the delivery window (11 PM - 5 AM)
    // So the slots should be for the CURRENT night:
    // - 11:00 PM on Jan 14 (already passed)
    // - 2:00 AM on Jan 15 (current time - should be unavailable)
    // - 5:00 AM on Jan 15 (still in the future)
  });

  it('should show what happens when current time is 11:30 PM', () => {
    const currentTime = new Date('2024-01-15T23:30:00'); // 11:30 PM on Jan 15
    const slots = getAvailableSlots(currentTime, false);
    
    console.log('\n=== Current Time: 11:30 PM on Jan 15, 2024 ===');
    console.log('Cutoff time (current + 30 min):', new Date(currentTime.getTime() + 30 * 60 * 1000).toISOString());
    
    slots.forEach((slot, index) => {
      const slotDate = new Date(slot.time);
      console.log(`Slot ${index}: ${slot.display} | ${slot.time} | Available: ${slot.isAvailable} | Date: ${slotDate.getDate()}`);
    });
  });

  it('should show what happens when current time is 10:00 AM', () => {
    const currentTime = new Date('2024-01-15T10:00:00'); // 10 AM on Jan 15
    const slots = getAvailableSlots(currentTime, false);
    
    console.log('\n=== Current Time: 10:00 AM on Jan 15, 2024 ===');
    console.log('Cutoff time (current + 30 min):', new Date(currentTime.getTime() + 30 * 60 * 1000).toISOString());
    
    slots.forEach((slot, index) => {
      const slotDate = new Date(slot.time);
      console.log(`Slot ${index}: ${slot.display} | ${slot.time} | Available: ${slot.isAvailable} | Date: ${slotDate.getDate()}`);
    });
  });
});
