# Requirements Document

## Introduction

Implement time-based slot blocking logic that automatically blocks delivery slots as time passes during the active night delivery window (11:00 PM to 5:00 AM). This ensures customers cannot select slots that have already passed and provides a fresh set of available slots when the next delivery shift begins.

## Glossary

- **Slot_Blocking_Service**: The system component responsible for determining which slots should be blocked based on current time
- **Active_Delivery_Window**: The current night delivery period from 11:00 PM to 5:00 AM
- **Passed_Slot**: A delivery slot whose time has already occurred during the current Active_Delivery_Window
- **Shift_Reset_Time**: The time (6:00 AM) when all slots become available again for the next delivery shift
- **Time_Based_Blocking**: The automatic blocking of slots that have passed during the current delivery window
- **Slot_Availability_Status**: The real-time status indicating whether a slot can be selected by customers

## Requirements

### Requirement 1

**User Story:** As a customer placing an order at 1:00 AM, I want to only see available slots from 1:30 AM onwards (with 30-minute buffer), so that I cannot select slots that have already passed during the current night.

#### Acceptance Criteria

1. WHEN the current time is 1:00 AM during an Active_Delivery_Window, THE Slot_Blocking_Service SHALL mark all slots from 11:00 PM to 1:00 AM as unavailable
2. WHEN the current time is 1:00 AM during an Active_Delivery_Window, THE Slot_Blocking_Service SHALL mark slots from 1:30 AM onwards as available (respecting the 30-minute buffer)
3. THE Slot_Blocking_Service SHALL continuously update slot availability as time progresses during the Active_Delivery_Window
4. WHEN a slot time has passed during the current Active_Delivery_Window, THE Slot_Blocking_Service SHALL mark that slot as permanently unavailable until the next shift

### Requirement 2

**User Story:** As a customer checking available slots at 6:00 AM, I want to see all slots available for the upcoming night delivery window, so that I can place advance orders for the next shift.

#### Acceptance Criteria

1. WHEN the current time reaches 6:00 AM (Shift_Reset_Time), THE Slot_Blocking_Service SHALL reset all slots to available status for the upcoming delivery window
2. WHEN the current time is between 6:00 AM and 10:59 PM, THE Slot_Blocking_Service SHALL show all night delivery slots as available (subject to 30-minute buffer when approaching 11:00 PM)
3. THE Slot_Blocking_Service SHALL maintain the existing 30-minute buffer logic in addition to time-based blocking
4. WHEN the current time is before the Active_Delivery_Window, THE Slot_Blocking_Service SHALL not apply time-based blocking

### Requirement 3

**User Story:** As a system administrator, I want the slot blocking logic to handle edge cases and maintain system reliability, so that customers always see accurate slot availability.

#### Acceptance Criteria

1. WHEN the current time transitions from 5:00 AM to 6:00 AM, THE Slot_Blocking_Service SHALL immediately reset all slots to available status
2. THE Slot_Blocking_Service SHALL preserve existing environment variable behavior (NEXT_PUBLIC_ENABLE_ALL_SLOTS)
3. WHERE the environment variable NEXT_PUBLIC_ENABLE_ALL_SLOTS is set to true, THE Slot_Blocking_Service SHALL bypass time-based blocking and show all slots as available
4. THE Slot_Blocking_Service SHALL maintain backward compatibility with existing slot generation logic

### Requirement 4

**User Story:** As a customer placing an order at 4:30 AM near the end of the delivery window, I want to see only the remaining available slots, so that I understand my delivery options for the current night.

#### Acceptance Criteria

1. WHEN the current time is 4:30 AM during an Active_Delivery_Window, THE Slot_Blocking_Service SHALL mark all slots from 11:00 PM to 4:30 AM as unavailable
2. WHEN the current time is 4:30 AM during an Active_Delivery_Window, THE Slot_Blocking_Service SHALL mark only the 5:00 AM slot as available (respecting the 30-minute buffer)
3. WHEN the current time reaches 4:31 AM or later, THE Slot_Blocking_Service SHALL mark all slots as unavailable until the next shift reset
4. THE Slot_Blocking_Service SHALL handle the transition from active delivery window to post-delivery period gracefully