/**
 * Slot Generator Service
 * Generates available delivery time slots from 11:00 PM to 5:00 AM
 */

import { TimeSlot } from '@/types/menu';

/**
 * Enum representing different delivery window states based on current time
 */
export enum DeliveryWindowState {
  /** 6:00 AM - 10:59 PM: Preparation time for upcoming night delivery */
  BEFORE_WINDOW = 'BEFORE_WINDOW',
  /** 11:00 PM - 5:00 AM: Currently within active delivery window */
  ACTIVE_WINDOW = 'ACTIVE_WINDOW',
  /** 5:01 AM - 5:59 AM: Post-delivery period, waiting for reset */
  AFTER_WINDOW = 'AFTER_WINDOW'
}

/**
 * Determine the current delivery window state based on the current time
 * 
 * @param currentTime - The current time to analyze
 * @returns The current delivery window state
 */
export function getDeliveryWindowState(currentTime: Date): DeliveryWindowState {
  const hour = currentTime.getHours();

  // Active delivery window: 11:00 PM (23:00) to 5:00 AM (05:00)
  if (hour === 23 || hour >= 0 && hour < 5) {
    return DeliveryWindowState.ACTIVE_WINDOW;
  }

  // Post-delivery period: 5:01 AM to 5:59 AM
  if (hour === 5) {
    return DeliveryWindowState.AFTER_WINDOW;
  }

  // Preparation time: 6:00 AM to 10:59 PM
  return DeliveryWindowState.BEFORE_WINDOW;
}

/**
 * Determine the correct base date for slot generation based on current time context
 * 
 * @param currentTime - The current time to analyze
 * @returns The base date to use for slot generation
 */
function determineSlotBaseDate(currentTime: Date): Date {
  const hour = currentTime.getHours();

  // If current time is between 12:00 AM and 5:00 AM (early morning)
  // We're within an active night delivery window, use current date
  if (hour >= 0 && hour < 5) {
    return new Date(currentTime);
  }

  // If current time is between 11:00 PM and 11:59 PM (late night)
  // We're within an active night delivery window, use current date
  if (hour === 23) {
    return new Date(currentTime);
  }

  // For all other times (5:01 AM to 10:59 PM)
  // We're preparing for the upcoming night delivery window, use current date
  return new Date(currentTime);
}

/**
 * Generate available delivery slots for night delivery
 * Slots are generated from 11:00 PM to 5:00 AM in 30-minute intervals
 * Slots span across midnight, with times after midnight on the next day
 * Slots within 30 minutes of current time are marked as unavailable
 * Time-based blocking is applied during active delivery window to block passed slots
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

  // Determine the current delivery window state for time-based blocking
  const windowState = getDeliveryWindowState(currentTime);

  // Determine the correct base date for slot generation
  const baseDate = determineSlotBaseDate(currentTime);
  const currentHour = currentTime.getHours();

  // Create start time (11:00 PM) using the base date
  const startTime = new Date(baseDate);
  startTime.setHours(23, 0, 0, 0);

  // Create end time (5:00 AM) 
  const endTime = new Date(baseDate);
  endTime.setHours(5, 0, 0, 0);

  // Handle date logic based on current time context
  if (currentHour >= 0 && currentHour < 5) {
    // Early morning (12:00 AM - 5:00 AM): slots are for current day
    // Start time should be previous day's 11:00 PM
    startTime.setDate(startTime.getDate() - 1);
    // End time stays on current day
  } else if (currentHour === 23) {
    // Late night (11:00 PM - 11:59 PM): slots span current day + next day
    // Start time stays on current day
    // End time should be next day's 5:00 AM
    endTime.setDate(endTime.getDate() + 1);
  } else {
    // Daytime (5:01 AM - 10:59 PM): slots are for upcoming night
    // Start time stays on current day
    // End time should be next day's 5:00 AM
    endTime.setDate(endTime.getDate() + 1);
  }

  // Generate slots from 11:00 PM to 5:00 AM (30-minute intervals)
  let slotTime = new Date(startTime);

  while (slotTime <= endTime) {
    // Use enhanced slot availability logic that combines 30-minute buffer with time-based blocking
    const isAvailable = isSlotAvailable(slotTime, currentTime, windowState, shouldEnableAllSlots);

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
 * Determine if a specific slot is available based on current time and delivery window state
 * Combines 30-minute buffer logic with time-based blocking during active delivery window
 * Implements shift reset logic for 6:00 AM transition
 * 
 * @param slotTime - The time of the slot to check
 * @param currentTime - The current time to check against
 * @param windowState - The current delivery window state
 * @param enableAllSlots - If true, bypass all blocking logic (for testing/admin override)
 * @returns True if the slot is available for selection
 */
export function isSlotAvailable(
  slotTime: Date,
  currentTime: Date,
  windowState: DeliveryWindowState,
  enableAllSlots: boolean
): boolean {
  // Environment/parameter override - bypass all blocking logic
  if (enableAllSlots) {
    return true;
  }

  // Shift reset logic: During preparation periods (BEFORE_WINDOW and AFTER_WINDOW),
  // all slots become available for the upcoming night delivery window
  // This handles the 6:00 AM transition where all slots reset to available
  if (windowState === DeliveryWindowState.BEFORE_WINDOW ||
    windowState === DeliveryWindowState.AFTER_WINDOW) {
    // Only apply 30-minute buffer check during preparation periods
    // No time-based blocking is applied - all slots are available for upcoming delivery
    const cutoffTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    return slotTime > cutoffTime;
  }

  // During active delivery window (ACTIVE_WINDOW), apply both checks
  if (windowState === DeliveryWindowState.ACTIVE_WINDOW) {
    // 30-minute buffer check
    const cutoffTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    const passesBufferCheck = slotTime > cutoffTime;

    // Time-based blocking check - block slots that have already passed
    const passesTimeBasedCheck = slotTime > currentTime;

    return passesBufferCheck && passesTimeBasedCheck;
  }

  // Fallback (should not reach here with current enum values)
  const cutoffTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  return slotTime > cutoffTime;
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
