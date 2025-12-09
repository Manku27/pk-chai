/**
 * Test the specific scenario: 1:30 AM ordering for 2:00 AM same day
 */

import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from './slots';

describe('Real Scenario - 1:30 AM ordering for 2:00 AM', () => {
  it('should show what slots are available at 1:30 AM on Dec 6', () => {
    const currentTime = new Date('2024-12-06T01:30:00'); // 1:30 AM on Dec 6
    const slots = getAvailableSlots(currentTime, false);
    
    console.log('\n=== Current Time: 1:30 AM on Dec 6, 2024 ===');
    console.log('Current time:', currentTime.toISOString());
    console.log('Cutoff time (current + 30 min):', new Date(currentTime.getTime() + 30 * 60 * 1000).toISOString());
    console.log('\nGenerated Slots:');
    
    slots.forEach((slot, index) => {
      const slotDate = new Date(slot.time);
      const dayOfMonth = slotDate.getDate();
      const month = slotDate.getMonth() + 1;
      console.log(`Slot ${index}: ${slot.display} | Date: ${month}/${dayOfMonth} | Available: ${slot.isAvailable}`);
    });
    
    // Find the 2:00 AM slot
    const slot2AM = slots.find(s => s.display === '2:00 AM');
    console.log('\n2:00 AM Slot Details:');
    console.log('Time:', slot2AM?.time);
    console.log('Available:', slot2AM?.isAvailable);
    console.log('Date:', new Date(slot2AM!.time).toISOString());
    
    // The PROBLEM: At 1:30 AM on Dec 6, the system generates:
    // - 11:00 PM on Dec 6 (which is 21.5 hours in the FUTURE)
    // - 2:00 AM on Dec 7 (which is 24.5 hours in the FUTURE)
    
    // But the user WANTS:
    // - 2:00 AM on Dec 6 (which is 0.5 hours in the FUTURE - same night!)
    
    const slot2AMDate = new Date(slot2AM!.time);
    console.log('\nExpected: 2:00 AM on Dec 6');
    console.log('Actual: 2:00 AM on Dec', slot2AMDate.getDate());
    
    // Fixed! Now shows the correct date
    expect(slot2AMDate.getDate()).toBe(6); // Shows Dec 6 (correct!)
    
    // And the 2:00 AM slot should be unavailable (within 30 min buffer)
    expect(slot2AM?.isAvailable).toBe(false);
    
    // But 2:30 AM should be available
    const slot230AM = slots.find(s => s.display === '2:30 AM');
    expect(slot230AM?.isAvailable).toBe(true);
  });

  it('should show the correct behavior we WANT', () => {
    const currentTime = new Date('2024-12-06T01:30:00'); // 1:30 AM on Dec 6
    
    console.log('\n=== DESIRED BEHAVIOR ===');
    console.log('Current time: 1:30 AM on Dec 6');
    console.log('\nWhen current time is WITHIN delivery window (11 PM - 5 AM):');
    console.log('- Show slots for the CURRENT delivery cycle');
    console.log('- 11:00 PM on Dec 5 (already passed)');
    console.log('- 1:30 AM on Dec 6 (current time - unavailable)');
    console.log('- 2:00 AM on Dec 6 (30 min away - AVAILABLE)');
    console.log('- 5:00 AM on Dec 6 (end of current cycle)');
    
    console.log('\nWhen current time is OUTSIDE delivery window (5 AM - 11 PM):');
    console.log('- Show slots for the NEXT delivery cycle');
    console.log('- 11:00 PM on Dec 6 (tonight)');
    console.log('- 5:00 AM on Dec 7 (tomorrow morning)');
  });
});
