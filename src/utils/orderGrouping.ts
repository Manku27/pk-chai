/**
 * Order grouping and sorting utilities for the Admin Dashboard
 * 
 * This module provides functions to group orders by slot time and hostel block,
 * with chronological sorting and guaranteed inclusion of all hostel blocks.
 */

import { OrderWithDetails, GroupedOrders } from '@/types/admin';
import { generateAllSlots } from '@/services/slots';

/**
 * The four hostel blocks that must appear in all groupings
 */
export const HOSTEL_BLOCKS = [
  'Jaadavpur Main Hostel',
  'New block hostel',
  'KPC boys hostel',
  'KPC girls hostel',
] as const;

/**
 * Groups orders by slot time and then by hostel block.
 * Merges orders with all generated slots to ensure all slots are displayed.
 * Sorts slots with upcoming first, past last, maintaining chronological order within each group.
 * 
 * Requirements:
 * - 2.5: Group orders by slot time and hostel block
 * - 4.3: Sort slot times chronologically
 * - 4.4: Ensure all four hostel blocks appear in grouping structure
 * - 8.1: Show all time slots from 11:00 PM to 5:00 AM regardless of whether orders exist
 * - 8.3: Sort slots with upcoming and current slots at the top and past slots at the bottom
 * - 8.4: Display empty state for slots with no orders
 * 
 * @param orders - Array of orders with details to group
 * @param currentTime - The current time to check slot status against (optional, defaults to now)
 * @returns Array of grouped orders, sorted by status (upcoming first, past last) and chronologically within each group
 */
/**
 * Normalize a date to the nearest 30-minute slot
 * This ensures consistent comparison between generated slots and order slot times
 */
function normalizeToSlot(date: Date): string {
  const normalized = new Date(date);
  // Round minutes to nearest 30-minute interval
  const minutes = normalized.getMinutes();
  normalized.setMinutes(minutes < 30 ? 0 : 30);
  normalized.setSeconds(0);
  normalized.setMilliseconds(0);
  return normalized.toISOString();
}

export function groupOrdersBySlotAndBlock(
  orders: OrderWithDetails[],
  currentTime?: Date
): GroupedOrders[] {
  // Step 1: Generate all slots from 11:00 PM to 5:00 AM
  const allSlots = generateAllSlots(currentTime);
  
  // Step 2: Group orders by slot time (normalized)
  const slotTimeMap = new Map<string, OrderWithDetails[]>();
  
  for (const order of orders) {
    // Normalize the order's slot time to match generated slot format
    const slotTimeKey = normalizeToSlot(order.slotTime);
    
    if (!slotTimeMap.has(slotTimeKey)) {
      slotTimeMap.set(slotTimeKey, []);
    }
    
    slotTimeMap.get(slotTimeKey)!.push(order);
  }
  
  // Step 3: For each generated slot, create a grouped order structure
  const groupedOrders: GroupedOrders[] = allSlots.map(slot => {
    // Normalize the generated slot time for consistent comparison
    const slotTimeKey = normalizeToSlot(new Date(slot.time));
    const ordersForSlot = slotTimeMap.get(slotTimeKey) || [];
    
    // Initialize blocks object with all four hostel blocks
    const blocks: { [hostelBlock: string]: OrderWithDetails[] } = {};
    for (const block of HOSTEL_BLOCKS) {
      blocks[block] = [];
    }
    
    // Distribute orders into their respective blocks
    for (const order of ordersForSlot) {
      const block = order.targetHostelBlock;
      
      // Only add to blocks if it's one of the recognized hostel blocks
      if (blocks[block] !== undefined) {
        blocks[block].push(order);
      }
    }
    
    return {
      slotTime: slotTimeKey,
      slot: {
        time: slot.time,
        display: slot.display,
        isPast: slot.isPast,
      },
      blocks,
    };
  });
  
  // Step 4: Sort slots by status (upcoming first, past last)
  return sortSlotsByStatus(groupedOrders);
}

/**
 * Formats a slot time ISO string to a human-readable format
 * 
 * @param slotTimeISO - ISO string representation of the slot time
 * @returns Formatted time string (e.g., "11:30 PM")
 */
export function formatSlotTime(slotTimeISO: string): string {
  const date = new Date(slotTimeISO);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Counts the total number of orders across all groups
 * 
 * @param groupedOrders - Array of grouped orders
 * @returns Total count of orders
 */
export function countOrdersInGroups(groupedOrders: GroupedOrders[]): number {
  let total = 0;
  
  for (const group of groupedOrders) {
    for (const block of HOSTEL_BLOCKS) {
      total += group.blocks[block].length;
    }
  }
  
  return total;
}

/**
 * Sorts grouped orders by slot status (upcoming first, past last)
 * while maintaining chronological order within each group.
 * 
 * Requirements:
 * - 8.3: Sort slots with upcoming and current slots at the top and past slots at the bottom
 * 
 * @param groupedOrders - Array of grouped orders to sort
 * @returns Sorted array with upcoming slots first (chronologically), then past slots (chronologically)
 */
export function sortSlotsByStatus(groupedOrders: GroupedOrders[]): GroupedOrders[] {
  // Separate slots into upcoming and past groups
  const upcomingSlots: GroupedOrders[] = [];
  const pastSlots: GroupedOrders[] = [];
  
  for (const group of groupedOrders) {
    if (group.slot?.isPast) {
      pastSlots.push(group);
    } else {
      upcomingSlots.push(group);
    }
  }
  
  // Sort each group chronologically by slot time
  const sortChronologically = (a: GroupedOrders, b: GroupedOrders): number => {
    const timeA = new Date(a.slotTime).getTime();
    const timeB = new Date(b.slotTime).getTime();
    return timeA - timeB;
  };
  
  upcomingSlots.sort(sortChronologically);
  pastSlots.sort(sortChronologically);
  
  // Return upcoming slots first, then past slots
  return [...upcomingSlots, ...pastSlots];
}
