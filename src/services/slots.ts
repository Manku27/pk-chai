/**
 * Slot Generator Service
 * Generates available delivery time slots from 11:00 AM to 5:00 PM
 */

import { TimeSlot } from '@/types/menu';

/**
 * Generate available delivery slots for the current day
 * Slots are generated from 11:00 AM to 5:00 PM in 30-minute intervals
 * Slots within 30 minutes of current time are marked as unavailable
 * 
 * @param currentTime - The current time to check slot availability against
 * @param enableAllSlots - If true, mark all slots as available regardless of time (for testing)
 * @returns Array of TimeSlot objects with availability status
 */
export function getAvailableSlots(
  currentTime: Date = new Date(),
  enableAllSlots?: boolean
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Check environment variable if enableAllSlots not explicitly provided
  const shouldEnableAllSlots = enableAllSlots ?? 
    (process.env.NEXT_PUBLIC_ENABLE_ALL_SLOTS === 'true');
  
  // Create a date object for today at 11:00 AM
  const startTime = new Date(currentTime);
  startTime.setHours(11, 0, 0, 0);
  
  // Create a date object for today at 5:00 PM
  const endTime = new Date(currentTime);
  endTime.setHours(17, 0, 0, 0);
  
  // Calculate the cutoff time (current time + 30 minutes)
  const cutoffTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  
  // Generate slots from 11:00 AM to 5:00 PM (30-minute intervals)
  let slotTime = new Date(startTime);
  
  while (slotTime <= endTime) {
    // Check if slot is available
    // If enableAllSlots is true, all slots are available
    // Otherwise, slot must be at least 30 minutes in the future
    const isAvailable = shouldEnableAllSlots || slotTime > cutoffTime;
    
    // Format display time (e.g., "11:00 AM", "11:30 AM")
    const display = formatTimeDisplay(slotTime);
    
    slots.push({
      time: slotTime.toISOString(),
      display,
      isAvailable
    });
    
    // Move to next 30-minute slot
    slotTime = new Date(slotTime.getTime() + 30 * 60 * 1000);
  }
  
  return slots;
}

/**
 * Format a Date object to display format (e.g., "11:00 AM", "2:30 PM")
 * 
 * @param date - The date to format
 * @returns Formatted time string
 */
function formatTimeDisplay(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  // Format minutes with leading zero if needed
  const minutesStr = minutes.toString().padStart(2, '0');
  
  return `${hours}:${minutesStr} ${ampm}`;
}
