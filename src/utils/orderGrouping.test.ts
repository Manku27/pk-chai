/**
 * Tests for order grouping utilities
 * Validates Requirements: 2.5, 4.3, 4.4, 8.1, 8.3, 8.4
 */

import { describe, it, expect } from 'vitest';
import { groupOrdersBySlotAndBlock, HOSTEL_BLOCKS, countOrdersInGroups, sortSlotsByStatus } from './orderGrouping';
import { OrderWithDetails, GroupedOrders } from '@/types/admin';

describe('groupOrdersBySlotAndBlock', () => {
  // Helper to create a test order
  const createOrder = (
    id: string,
    slotTime: Date,
    hostelBlock: string,
    status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED' = 'ACCEPTED'
  ): OrderWithDetails => ({
    id,
    userId: 'user-1',
    targetHostelBlock: hostelBlock,
    slotTime,
    status,
    totalAmount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    user: {
      phone: '1234567890',
      name: 'Test User',
    },
  });

  it('should include all time slots from 11:00 PM to 5:00 AM even when no orders exist', () => {
    // Requirement 8.1: Show all time slots regardless of whether orders exist
    const orders: OrderWithDetails[] = [];
    const currentTime = new Date('2024-01-15T23:30:00'); // 11:30 PM
    
    const grouped = groupOrdersBySlotAndBlock(orders, currentTime);
    
    // Should have 13 slots (11:00 PM, 11:30 PM, 12:00 AM, ..., 4:30 AM, 5:00 AM)
    expect(grouped.length).toBe(13);
    
    // Verify all slots have the slot property
    grouped.forEach(group => {
      expect(group.slot).toBeDefined();
      expect(group.slot?.time).toBeDefined();
      expect(group.slot?.display).toBeDefined();
    });
  });

  it('should include all four hostel blocks for each slot even when empty', () => {
    // Requirement 4.4: Ensure all four hostel blocks appear in grouping structure
    // Requirement 8.4: Display empty state for slots with no orders
    const orders: OrderWithDetails[] = [];
    const currentTime = new Date('2024-01-15T23:30:00');
    
    const grouped = groupOrdersBySlotAndBlock(orders, currentTime);
    
    // Check each slot has all four hostel blocks
    grouped.forEach(group => {
      HOSTEL_BLOCKS.forEach(block => {
        expect(group.blocks[block]).toBeDefined();
        expect(Array.isArray(group.blocks[block])).toBe(true);
        expect(group.blocks[block].length).toBe(0);
      });
    });
  });

  it('should merge orders into the correct slots', () => {
    // Create orders for specific slots
    const slot1 = new Date('2024-01-15T23:00:00'); // 11:00 PM
    const slot2 = new Date('2024-01-16T00:00:00'); // 12:00 AM
    
    const orders: OrderWithDetails[] = [
      createOrder('order-1', slot1, 'Jaadavpur Main Hostel'),
      createOrder('order-2', slot1, 'New block hostel'),
      createOrder('order-3', slot2, 'KPC boys hostel'),
    ];
    
    const currentTime = new Date('2024-01-15T22:00:00'); // 10:00 PM (before delivery window)
    const grouped = groupOrdersBySlotAndBlock(orders, currentTime);
    
    // Find the groups for our slots
    const group1 = grouped.find(g => g.slotTime === slot1.toISOString());
    const group2 = grouped.find(g => g.slotTime === slot2.toISOString());
    
    expect(group1).toBeDefined();
    expect(group2).toBeDefined();
    
    // Verify orders are in correct slots and blocks
    expect(group1!.blocks['Jaadavpur Main Hostel'].length).toBe(1);
    expect(group1!.blocks['New block hostel'].length).toBe(1);
    expect(group1!.blocks['KPC boys hostel'].length).toBe(0);
    expect(group1!.blocks['KPC girls hostel'].length).toBe(0);
    
    expect(group2!.blocks['KPC boys hostel'].length).toBe(1);
    expect(group2!.blocks['Jaadavpur Main Hostel'].length).toBe(0);
  });

  it('should mark slots as past or upcoming based on current time', () => {
    // Requirement 8.2: Mark past slots with isPast property
    const orders: OrderWithDetails[] = [];
    const currentTime = new Date('2024-01-16T01:00:00'); // 1:00 AM
    
    const grouped = groupOrdersBySlotAndBlock(orders, currentTime);
    
    // Slots before 1:00 AM should be marked as past
    const pastSlots = grouped.filter(g => g.slot?.isPast === true);
    const upcomingSlots = grouped.filter(g => g.slot?.isPast === false);
    
    expect(pastSlots.length).toBeGreaterThan(0);
    expect(upcomingSlots.length).toBeGreaterThan(0);
    
    // Verify that past slots are actually before current time
    pastSlots.forEach(group => {
      const slotTime = new Date(group.slotTime);
      expect(slotTime.getTime()).toBeLessThanOrEqual(currentTime.getTime());
    });
    
    // Verify that upcoming slots are after current time
    upcomingSlots.forEach(group => {
      const slotTime = new Date(group.slotTime);
      expect(slotTime.getTime()).toBeGreaterThan(currentTime.getTime());
    });
  });

  it('should preserve all orders when grouping', () => {
    // Property 1: Order grouping preserves all orders
    const slot1 = new Date('2024-01-15T23:00:00');
    const slot2 = new Date('2024-01-16T00:00:00');
    
    const orders: OrderWithDetails[] = [
      createOrder('order-1', slot1, 'Jaadavpur Main Hostel'),
      createOrder('order-2', slot1, 'New block hostel'),
      createOrder('order-3', slot2, 'KPC boys hostel'),
      createOrder('order-4', slot2, 'KPC girls hostel'),
      createOrder('order-5', slot1, 'Jaadavpur Main Hostel'),
    ];
    
    const currentTime = new Date('2024-01-15T22:00:00');
    const grouped = groupOrdersBySlotAndBlock(orders, currentTime);
    
    // Count total orders in grouped structure
    const totalInGroups = countOrdersInGroups(grouped);
    
    expect(totalInGroups).toBe(orders.length);
  });

  it('should sort slots with upcoming first, past last, maintaining chronological order within each group', () => {
    // Requirement 8.3: Sort slots with upcoming and current slots at the top and past slots at the bottom
    // Requirement 4.3: Sort slot times chronologically within each group
    const orders: OrderWithDetails[] = [];
    const currentTime = new Date('2024-01-16T01:00:00'); // 1:00 AM (middle of delivery window)
    
    const grouped = groupOrdersBySlotAndBlock(orders, currentTime);
    
    // Find the index where past slots start
    let firstPastIndex = -1;
    for (let i = 0; i < grouped.length; i++) {
      if (grouped[i].slot?.isPast) {
        firstPastIndex = i;
        break;
      }
    }
    
    // There should be both upcoming and past slots
    expect(firstPastIndex).toBeGreaterThan(0);
    expect(firstPastIndex).toBeLessThan(grouped.length);
    
    // All slots before firstPastIndex should be upcoming (not past)
    for (let i = 0; i < firstPastIndex; i++) {
      expect(grouped[i].slot?.isPast).toBe(false);
    }
    
    // All slots from firstPastIndex onwards should be past
    for (let i = firstPastIndex; i < grouped.length; i++) {
      expect(grouped[i].slot?.isPast).toBe(true);
    }
    
    // Verify upcoming slots are in chronological order
    for (let i = 1; i < firstPastIndex; i++) {
      const prevTime = new Date(grouped[i - 1].slotTime).getTime();
      const currTime = new Date(grouped[i].slotTime).getTime();
      expect(currTime).toBeGreaterThan(prevTime);
    }
    
    // Verify past slots are in chronological order
    for (let i = firstPastIndex + 1; i < grouped.length; i++) {
      const prevTime = new Date(grouped[i - 1].slotTime).getTime();
      const currTime = new Date(grouped[i].slotTime).getTime();
      expect(currTime).toBeGreaterThan(prevTime);
    }
  });

  it('should handle orders with unrecognized hostel blocks gracefully', () => {
    const slot1 = new Date('2024-01-15T23:00:00');
    
    const orders: OrderWithDetails[] = [
      createOrder('order-1', slot1, 'Jaadavpur Main Hostel'),
      createOrder('order-2', slot1, 'Unknown Block'), // Invalid block
    ];
    
    const currentTime = new Date('2024-01-15T22:00:00');
    const grouped = groupOrdersBySlotAndBlock(orders, currentTime);
    
    const group = grouped.find(g => g.slotTime === slot1.toISOString());
    expect(group).toBeDefined();
    
    // Only the valid order should be included
    const totalOrders = Object.values(group!.blocks).reduce(
      (sum, blockOrders) => sum + blockOrders.length,
      0
    );
    expect(totalOrders).toBe(1);
  });
});

describe('sortSlotsByStatus', () => {
  // Helper to create a test grouped order
  const createGroupedOrder = (
    slotTime: string,
    isPast: boolean
  ): GroupedOrders => ({
    slotTime,
    slot: {
      time: slotTime,
      display: new Date(slotTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      isPast,
    },
    blocks: {
      'Jaadavpur Main Hostel': [],
      'New block hostel': [],
      'KPC boys hostel': [],
      'KPC girls hostel': [],
    },
  });

  it('should sort upcoming slots before past slots', () => {
    // Requirement 8.3: Sort slots with upcoming and current slots at the top and past slots at the bottom
    const groupedOrders: GroupedOrders[] = [
      createGroupedOrder('2024-01-15T23:00:00', true),  // past
      createGroupedOrder('2024-01-16T02:00:00', false), // upcoming
      createGroupedOrder('2024-01-16T00:00:00', true),  // past
      createGroupedOrder('2024-01-16T03:00:00', false), // upcoming
    ];
    
    const sorted = sortSlotsByStatus(groupedOrders);
    
    // First two should be upcoming, last two should be past
    expect(sorted[0].slot?.isPast).toBe(false);
    expect(sorted[1].slot?.isPast).toBe(false);
    expect(sorted[2].slot?.isPast).toBe(true);
    expect(sorted[3].slot?.isPast).toBe(true);
  });

  it('should maintain chronological order within upcoming slots', () => {
    // Requirement 4.3: Sort slot times chronologically
    const groupedOrders: GroupedOrders[] = [
      createGroupedOrder('2024-01-16T03:00:00', false), // 3:00 AM
      createGroupedOrder('2024-01-16T01:30:00', false), // 1:30 AM
      createGroupedOrder('2024-01-16T02:00:00', false), // 2:00 AM
    ];
    
    const sorted = sortSlotsByStatus(groupedOrders);
    
    // Should be in chronological order: 1:30 AM, 2:00 AM, 3:00 AM
    expect(sorted[0].slotTime).toBe('2024-01-16T01:30:00');
    expect(sorted[1].slotTime).toBe('2024-01-16T02:00:00');
    expect(sorted[2].slotTime).toBe('2024-01-16T03:00:00');
  });

  it('should maintain chronological order within past slots', () => {
    // Requirement 4.3: Sort slot times chronologically
    const groupedOrders: GroupedOrders[] = [
      createGroupedOrder('2024-01-16T00:00:00', true), // 12:00 AM
      createGroupedOrder('2024-01-15T23:30:00', true), // 11:30 PM
      createGroupedOrder('2024-01-15T23:00:00', true), // 11:00 PM
    ];
    
    const sorted = sortSlotsByStatus(groupedOrders);
    
    // Should be in chronological order: 11:00 PM, 11:30 PM, 12:00 AM
    expect(sorted[0].slotTime).toBe('2024-01-15T23:00:00');
    expect(sorted[1].slotTime).toBe('2024-01-15T23:30:00');
    expect(sorted[2].slotTime).toBe('2024-01-16T00:00:00');
  });

  it('should handle mixed past and upcoming slots correctly', () => {
    // Requirement 8.3: Sort slots with upcoming and current slots at the top and past slots at the bottom
    const groupedOrders: GroupedOrders[] = [
      createGroupedOrder('2024-01-15T23:00:00', true),  // past - 11:00 PM
      createGroupedOrder('2024-01-16T02:00:00', false), // upcoming - 2:00 AM
      createGroupedOrder('2024-01-15T23:30:00', true),  // past - 11:30 PM
      createGroupedOrder('2024-01-16T01:30:00', false), // upcoming - 1:30 AM
      createGroupedOrder('2024-01-16T00:00:00', true),  // past - 12:00 AM
      createGroupedOrder('2024-01-16T03:00:00', false), // upcoming - 3:00 AM
    ];
    
    const sorted = sortSlotsByStatus(groupedOrders);
    
    // First three should be upcoming in chronological order
    expect(sorted[0].slot?.isPast).toBe(false);
    expect(sorted[0].slotTime).toBe('2024-01-16T01:30:00');
    expect(sorted[1].slot?.isPast).toBe(false);
    expect(sorted[1].slotTime).toBe('2024-01-16T02:00:00');
    expect(sorted[2].slot?.isPast).toBe(false);
    expect(sorted[2].slotTime).toBe('2024-01-16T03:00:00');
    
    // Last three should be past in chronological order
    expect(sorted[3].slot?.isPast).toBe(true);
    expect(sorted[3].slotTime).toBe('2024-01-15T23:00:00');
    expect(sorted[4].slot?.isPast).toBe(true);
    expect(sorted[4].slotTime).toBe('2024-01-15T23:30:00');
    expect(sorted[5].slot?.isPast).toBe(true);
    expect(sorted[5].slotTime).toBe('2024-01-16T00:00:00');
  });

  it('should handle all upcoming slots', () => {
    const groupedOrders: GroupedOrders[] = [
      createGroupedOrder('2024-01-16T03:00:00', false),
      createGroupedOrder('2024-01-16T01:30:00', false),
      createGroupedOrder('2024-01-16T02:00:00', false),
    ];
    
    const sorted = sortSlotsByStatus(groupedOrders);
    
    // All should be upcoming and in chronological order
    expect(sorted.every(g => g.slot?.isPast === false)).toBe(true);
    expect(sorted[0].slotTime).toBe('2024-01-16T01:30:00');
    expect(sorted[1].slotTime).toBe('2024-01-16T02:00:00');
    expect(sorted[2].slotTime).toBe('2024-01-16T03:00:00');
  });

  it('should handle all past slots', () => {
    const groupedOrders: GroupedOrders[] = [
      createGroupedOrder('2024-01-16T00:00:00', true),
      createGroupedOrder('2024-01-15T23:30:00', true),
      createGroupedOrder('2024-01-15T23:00:00', true),
    ];
    
    const sorted = sortSlotsByStatus(groupedOrders);
    
    // All should be past and in chronological order
    expect(sorted.every(g => g.slot?.isPast === true)).toBe(true);
    expect(sorted[0].slotTime).toBe('2024-01-15T23:00:00');
    expect(sorted[1].slotTime).toBe('2024-01-15T23:30:00');
    expect(sorted[2].slotTime).toBe('2024-01-16T00:00:00');
  });

  it('should handle empty array', () => {
    const sorted = sortSlotsByStatus([]);
    expect(sorted).toEqual([]);
  });
});
