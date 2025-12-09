/**
 * Unit tests for slot generation service and analytics grouping
 */

import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from './slots';

describe('Slot Generation', () => {
  it('should generate exactly 13 slots from 11:00 PM to 5:00 AM', () => {
    const currentTime = new Date('2024-01-15T10:00:00'); // 10 AM
    const slots = getAvailableSlots(currentTime);
    
    // Should have 13 slots (11:00 PM, 11:30 PM, 12:00 AM, ..., 5:00 AM)
    expect(slots).toHaveLength(13);
    
    // First slot should be 11:00 PM
    expect(slots[0].display).toBe('11:00 PM');
    
    // Last slot should be 5:00 AM
    expect(slots[slots.length - 1].display).toBe('5:00 AM');
  });

  it('should mark slots within 30 minutes as unavailable', () => {
    // Set current time to 11:00 PM
    const currentTime = new Date('2024-01-15T23:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // 11:00 PM slot should be unavailable (exactly at current time)
    expect(slots[0].isAvailable).toBe(false);
    
    // 11:30 PM slot should be unavailable (within 30 min)
    expect(slots[1].isAvailable).toBe(false);
    
    // 12:00 AM slot should be available (more than 30 min away)
    expect(slots[2].isAvailable).toBe(true);
  });

  it('should mark all slots as available when enableAllSlots is true', () => {
    const currentTime = new Date('2024-01-15T23:00:00');
    const slots = getAvailableSlots(currentTime, true);
    
    // All slots should be available
    slots.forEach(slot => {
      expect(slot.isAvailable).toBe(true);
    });
  });

  it('should format time correctly in 12-hour format', () => {
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // Check various time formats
    const displays = slots.map(s => s.display);
    expect(displays).toContain('11:00 PM');
    expect(displays).toContain('11:30 PM');
    expect(displays).toContain('12:00 AM');
    expect(displays).toContain('12:30 AM');
    expect(displays).toContain('1:00 AM');
    expect(displays).toContain('5:00 AM');
  });

  it('should generate slots for current delivery window when current time is after midnight', () => {
    const currentTime = new Date('2024-01-15T02:00:00'); // 2 AM on Jan 15
    // Explicitly disable enableAllSlots to test time-based availability
    const slots = getAvailableSlots(currentTime, false);
    
    // Should still generate 13 slots
    expect(slots).toHaveLength(13);
    
    // When it's 2 AM, the system shows slots for the CURRENT delivery cycle
    // Slots before 2:30 AM should be unavailable (within 30 min buffer)
    // Slots after 2:30 AM should be available
    const slot2AM = slots.find(s => s.display === '2:00 AM');
    const slot230AM = slots.find(s => s.display === '2:30 AM');
    const slot3AM = slots.find(s => s.display === '3:00 AM');
    
    expect(slot2AM?.isAvailable).toBe(false); // Within 30 min buffer
    expect(slot230AM?.isAvailable).toBe(false); // Exactly at cutoff
    expect(slot3AM?.isAvailable).toBe(true); // More than 30 min away
    
    // Verify the slots are for the correct date range (current delivery cycle)
    const firstSlot = new Date(slots[0].time);
    const lastSlot = new Date(slots[slots.length - 1].time);
    
    // First slot (11 PM) should be on Jan 14 (yesterday)
    expect(firstSlot.getDate()).toBe(14);
    // Last slot (5 AM) should be on Jan 15 (today)
    expect(lastSlot.getDate()).toBe(15);
  });

  it('should generate consistent slot times across different days', () => {
    const day1 = new Date('2024-01-15T10:00:00');
    const day2 = new Date('2024-01-16T10:00:00');
    
    const slots1 = getAvailableSlots(day1);
    const slots2 = getAvailableSlots(day2);
    
    // Should have same number of slots
    expect(slots1.length).toBe(slots2.length);
    
    // Display times should match
    slots1.forEach((slot, index) => {
      expect(slot.display).toBe(slots2[index].display);
    });
  });
});

describe('Slot Time Matching for Analytics', () => {
  it('should generate slot times that match database ISO format', () => {
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // Each slot time should be a valid ISO string
    slots.forEach(slot => {
      expect(() => new Date(slot.time)).not.toThrow();
      expect(slot.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  it('should generate slot times that can be grouped correctly', () => {
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // Simulate orders placed at different slots
    const mockOrders = [
      { slotTime: slots[0].time, hostelBlock: 'A', count: 5 },
      { slotTime: slots[0].time, hostelBlock: 'B', count: 3 },
      { slotTime: slots[1].time, hostelBlock: 'A', count: 2 },
    ];
    
    // Group by slot time (simulating analytics aggregation)
    const slotMap = new Map<string, number>();
    mockOrders.forEach(order => {
      const current = slotMap.get(order.slotTime) || 0;
      slotMap.set(order.slotTime, current + order.count);
    });
    
    // Should correctly aggregate orders by slot
    expect(slotMap.get(slots[0].time)).toBe(8); // 5 + 3
    expect(slotMap.get(slots[1].time)).toBe(2);
  });

  it('should handle slot times spanning midnight correctly', () => {
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // Find slots before and after midnight
    const slot11PM = slots.find(s => s.display === '11:00 PM');
    const slot12AM = slots.find(s => s.display === '12:00 AM');
    const slot1AM = slots.find(s => s.display === '1:00 AM');
    
    expect(slot11PM).toBeDefined();
    expect(slot12AM).toBeDefined();
    expect(slot1AM).toBeDefined();
    
    // Verify they're in chronological order
    const time11PM = new Date(slot11PM!.time);
    const time12AM = new Date(slot12AM!.time);
    const time1AM = new Date(slot1AM!.time);
    
    expect(time12AM.getTime()).toBeGreaterThan(time11PM.getTime());
    expect(time1AM.getTime()).toBeGreaterThan(time12AM.getTime());
  });
});

describe('Analytics Response Structure Simulation', () => {
  it('should match traffic-by-slot API response structure', () => {
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // Simulate the API response structure
    const mockSlotData = [
      { slotTime: new Date(slots[0].time), targetHostelBlock: 'A', count: 5, totalAmount: 500 },
      { slotTime: new Date(slots[0].time), targetHostelBlock: 'B', count: 3, totalAmount: 300 },
      { slotTime: new Date(slots[1].time), targetHostelBlock: 'A', count: 2, totalAmount: 200 },
    ];
    
    // Aggregate by slot time (matching analytics.ts logic)
    const slotMap = new Map<string, number>();
    mockSlotData.forEach(item => {
      const slotTimeStr = item.slotTime.toISOString();
      const currentCount = slotMap.get(slotTimeStr) || 0;
      slotMap.set(slotTimeStr, currentCount + item.count);
    });
    
    // Convert to API response format
    const trafficBySlot = Array.from(slotMap.entries())
      .map(([slotTime, orderCount]) => ({ slotTime, orderCount }))
      .sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());
    
    // Verify response structure
    expect(trafficBySlot).toHaveLength(2);
    expect(trafficBySlot[0]).toHaveProperty('slotTime');
    expect(trafficBySlot[0]).toHaveProperty('orderCount');
    expect(trafficBySlot[0].orderCount).toBe(8); // 5 + 3
    expect(trafficBySlot[1].orderCount).toBe(2);
  });

  it('should match hostel-demand API response structure', () => {
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // Simulate the API response structure
    const mockSlotData = [
      { slotTime: new Date(slots[0].time), targetHostelBlock: 'A', count: 5, totalAmount: 500 },
      { slotTime: new Date(slots[0].time), targetHostelBlock: 'B', count: 3, totalAmount: 300 },
      { slotTime: new Date(slots[1].time), targetHostelBlock: 'A', count: 2, totalAmount: 200 },
    ];
    
    // Aggregate by hostel block (matching analytics.ts logic)
    const blockMap = new Map<string, number>();
    mockSlotData.forEach(item => {
      const currentCount = blockMap.get(item.targetHostelBlock) || 0;
      blockMap.set(item.targetHostelBlock, currentCount + item.count);
    });
    
    // Calculate total orders
    const totalOrders = Array.from(blockMap.values()).reduce((sum, count) => sum + count, 0);
    
    // Convert to API response format
    const hostelDemand = Array.from(blockMap.entries()).map(([hostelBlock, orderCount]) => ({
      hostelBlock,
      orderCount,
      percentage: totalOrders > 0 ? (orderCount / totalOrders) * 100 : 0,
    }));
    
    // Verify response structure
    expect(hostelDemand).toHaveLength(2);
    expect(hostelDemand.find(h => h.hostelBlock === 'A')?.orderCount).toBe(7); // 5 + 2
    expect(hostelDemand.find(h => h.hostelBlock === 'B')?.orderCount).toBe(3);
    expect(hostelDemand.find(h => h.hostelBlock === 'A')?.percentage).toBe(70); // 7/10 * 100
  });

  it('should match heatmap API response structure', () => {
    const currentTime = new Date('2024-01-15T10:00:00');
    const slots = getAvailableSlots(currentTime);
    
    // Simulate the API response structure
    const mockSlotData = [
      { slotTime: new Date(slots[0].time), targetHostelBlock: 'A', count: 5, totalAmount: 500 },
      { slotTime: new Date(slots[0].time), targetHostelBlock: 'B', count: 3, totalAmount: 300 },
      { slotTime: new Date(slots[1].time), targetHostelBlock: 'A', count: 2, totalAmount: 200 },
    ];
    
    // Create heatmap data (matching analytics.ts logic)
    const heatmapData = mockSlotData.map(item => ({
      hostelBlock: item.targetHostelBlock,
      slotTime: item.slotTime.toISOString(),
      intensity: item.count,
    }));
    
    // Verify response structure
    expect(heatmapData).toHaveLength(3);
    expect(heatmapData[0]).toHaveProperty('hostelBlock');
    expect(heatmapData[0]).toHaveProperty('slotTime');
    expect(heatmapData[0]).toHaveProperty('intensity');
    
    // Verify data integrity
    expect(heatmapData.find(h => h.hostelBlock === 'A' && h.slotTime === slots[0].time)?.intensity).toBe(5);
    expect(heatmapData.find(h => h.hostelBlock === 'B' && h.slotTime === slots[0].time)?.intensity).toBe(3);
  });
});
