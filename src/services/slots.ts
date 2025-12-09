/**
 * Slot Generator Service
 * Generates available delivery time slots from 11:00 PM to 5:00 AM
 */

import { TimeSlot } from '@/types/menu';

/**
 * Generate all delivery slots from 11:00 PM to 5:00 AM with isPast status
 * This function generates all slots regardless of availability, marking each as past or upcoming
 * 
 * @param currentTime - The current time to check slot status against
 * @returns Array of TimeSlot objects with isPast property set
 */
export function generateAllSlots(currentTime: Date = new Date()): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  const currentHour = currentTime.getHours();
  
  // Determine if we're currently in the delivery window (11 PM - 5 AM)
  const isInDeliveryWindow = currentHour >= 23 || currentHour < 5;
  
  // Create a date object for the start of the delivery window (11:00 PM)
  const startTime = new Date(currentTime);
  if (isInDeliveryWindow) {
    // If we're in the delivery window, show slots for the CURRENT cycle
    // If it's after midnight (0-4 AM), go back to yesterday's 11 PM
    if (currentHour < 5) {
      startTime.setDate(startTime.getDate() - 1);
    }
    // If it's 11 PM or later, use today's 11 PM
  }
  // If we're outside the delivery window (5 AM - 11 PM), show slots for NEXT cycle (tonight)
  startTime.setHours(23, 0, 0, 0);
  
  // Create a date object for the end of the delivery window (5:00 AM)
  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);
  endTime.setHours(5, 0, 0, 0);
  
  // Calculate the cutoff time (current time + 30 minutes) for availability
  const cutoffTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  
  // Generate slots from 11:00 PM to 5:00 AM (30-minute intervals)
  let slotTime = new Date(startTime);
  
  while (slotTime <= endTime) {
    // Check if slot is in the past (slot time is before or at current time)
    const isPast = slotTime <= currentTime;
    
    // Check if slot is available (more than 30 minutes in the future)
    const isAvailable = slotTime > cutoffTime;
    
    // Format display time (e.g., "11:00 PM", "11:30 PM")
    const display = formatTimeDisplay(slotTime);
    
    slots.push({
      time: slotTime.toISOString(),
      display,
      isAvailable,
      isPast
    });
    
    // Move to next 30-minute slot
    slotTime = new Date(slotTime.getTime() + 30 * 60 * 1000);
  }
  
  return slots;
}

/**
 * Generate available delivery slots for the current day
 * Slots are generated from 11:00 PM to 5:00 AM in 30-minute intervals
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
  
  const currentHour = currentTime.getHours();
  
  // Determine if we're currently in the delivery window (11 PM - 5 AM)
  // If current time is between 11 PM (23:00) and midnight, or between midnight and 5 AM
  const isInDeliveryWindow = currentHour >= 23 || currentHour < 5;
  
  // Create a date object for the start of the delivery window (11:00 PM)
  const startTime = new Date(currentTime);
  if (isInDeliveryWindow) {
    // If we're in the delivery window, show slots for the CURRENT cycle
    // If it's after midnight (0-4 AM), go back to yesterday's 11 PM
    if (currentHour < 5) {
      startTime.setDate(startTime.getDate() - 1);
    }
    // If it's 11 PM or later, use today's 11 PM
  }
  // If we're outside the delivery window (5 AM - 11 PM), show slots for NEXT cycle (tonight)
  startTime.setHours(23, 0, 0, 0);
  
  // Create a date object for the end of the delivery window (5:00 AM)
  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);
  endTime.setHours(5, 0, 0, 0);
  
  // Calculate the cutoff time (current time + 30 minutes)
  const cutoffTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  
  // Generate slots from 11:00 PM to 5:00 AM (30-minute intervals)
  let slotTime = new Date(startTime);
  
  while (slotTime <= endTime) {
    // Check if slot is in the past (slot time is before or at current time)
    const isPast = slotTime <= currentTime;
    
    // Check if slot is available
    // If enableAllSlots is true, all slots are available
    // Otherwise, slot must be at least 30 minutes in the future
    const isAvailable = shouldEnableAllSlots || slotTime > cutoffTime;
    
    // Format display time (e.g., "11:00 AM", "11:30 AM")
    const display = formatTimeDisplay(slotTime);
    
    slots.push({
      time: slotTime.toISOString(),
      display,
      isAvailable,
      isPast
    });
    
    // Move to next 30-minute slot
    slotTime = new Date(slotTime.getTime() + 30 * 60 * 1000);
  }
  
  return slots;
}

/**
 * Format a Date object to display format (e.g., "11:00 PM", "2:30 AM")
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
