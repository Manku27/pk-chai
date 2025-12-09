export interface WorkingDayRange {
    start: Date;
    end: Date;
    label: string; // e.g., "Dec 9, 11pm - Dec 10, 5am"
}

/**
 * Get the current working day based on the current time
 * - If current time is 11:00 PM - 11:59 PM: Working day started today at 11 PM (ongoing)
 * - If current time is 12:00 AM - 5:00 AM: Working day started yesterday at 11 PM (ongoing)
 * - If current time is 5:01 AM - 5:59 AM: Most recent completed working day (ended at 5 AM today)
 * - If current time is 6:00 AM - 10:59 PM: Upcoming working day (starting at 11 PM today)
 */
export function getCurrentWorkingDay(): WorkingDayRange {
    const now = new Date();
    const hour = now.getHours();

    let workingDayDate: Date;

    if (hour >= 23) {
        // 11 PM - 11:59 PM: working day started today
        workingDayDate = new Date(now);
    } else if (hour < 5) {
        // 12 AM - 4:59 AM: working day started yesterday
        workingDayDate = new Date(now);
        workingDayDate.setDate(workingDayDate.getDate() - 1);
    } else if (hour === 5) {
        // 5 AM - 5:59 AM: show most recent completed working day (started yesterday)
        workingDayDate = new Date(now);
        workingDayDate.setDate(workingDayDate.getDate() - 1);
    } else {
        // 6 AM - 10:59 PM: show upcoming working day (starting today at 11 PM)
        workingDayDate = new Date(now);
    }

    return getWorkingDayRange(workingDayDate);
}

/**
 * Get working day range for a specific date
 * @param date The date representing the working day (the date when it starts at 11 PM)
 */
export function getWorkingDayRange(date: Date): WorkingDayRange {
    const start = new Date(date);
    start.setHours(23, 0, 0, 0);

    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    end.setHours(5, 0, 0, 0);

    const label = formatWorkingDayLabel(start, end);

    return { start, end, label };
}

/**
 * Format working day label
 * @param start The start date/time of the working day
 * @param end The end date/time of the working day
 * @returns Formatted label like "Dec 9, 11pm - Dec 10, 5am"
 */
export function formatWorkingDayLabel(start: Date, end: Date): string {
    const startStr = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    const endStr = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    return `${startStr}, 11pm - ${endStr}, 5am`;
}

/**
 * Convert a date input value to a working day date
 * Date input gives us YYYY-MM-DD, we treat this as the start date
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Date object representing the working day start date
 */
export function dateInputToWorkingDay(dateString: string): Date {
    const date = new Date(dateString);
    // Ensure we're working with local date
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate;
}

/**
 * Convert a working day date to date input value
 * @param date The working day start date
 * @returns Date string in YYYY-MM-DD format
 */
export function workingDayToDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
