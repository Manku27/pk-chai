# Requirements Document

## Introduction

This feature modifies the delivery time slot system to support night delivery operations from 11:00 PM to 5:00 AM instead of the current daytime delivery window of 11:00 AM to 5:00 PM. This change enables the food delivery service to operate during nighttime hours, catering to customers who need late-night or early-morning food delivery.

## Glossary

- **Slot Generator Service**: The system component responsible for generating available delivery time slots
- **Time Slot**: A 30-minute delivery window that customers can select for their order
- **Cutoff Time**: The minimum time buffer (30 minutes) required between current time and the earliest available slot
- **Night Delivery Window**: The operational period from 11:00 PM to 5:00 AM for order deliveries
- **Slot Availability**: The status indicating whether a time slot can be selected by customers

## Requirements

### Requirement 1

**User Story:** As a customer, I want to see available delivery slots from 11:00 PM to 5:00 AM, so that I can order food during nighttime hours

#### Acceptance Criteria

1. WHEN the Slot Generator Service generates time slots, THE Slot Generator Service SHALL create slots starting at 11:00 PM (23:00)
2. WHEN the Slot Generator Service generates time slots, THE Slot Generator Service SHALL create slots ending at 5:00 AM (05:00)
3. THE Slot Generator Service SHALL generate time slots in 30-minute intervals
4. WHEN a time slot crosses midnight, THE Slot Generator Service SHALL correctly handle the date transition from one day to the next
5. THE Slot Generator Service SHALL display time slots in 12-hour format with AM/PM indicators

### Requirement 2

**User Story:** As a customer, I want to only see slots that are at least 30 minutes in the future, so that the restaurant has adequate time to prepare my order

#### Acceptance Criteria

1. WHEN the current time is before 11:00 PM, THE Slot Generator Service SHALL mark all night delivery slots as available
2. WHEN the current time is between 11:00 PM and 5:00 AM, THE Slot Generator Service SHALL mark slots as unavailable if they are within 30 minutes of the current time
3. WHEN the current time is after 5:00 AM, THE Slot Generator Service SHALL mark all night delivery slots as unavailable for the current night
4. WHERE the environment variable NEXT_PUBLIC_ENABLE_ALL_SLOTS is set to true, THE Slot Generator Service SHALL mark all slots as available regardless of current time

### Requirement 3

**User Story:** As a developer, I want the slot generation logic to handle edge cases around midnight, so that the system works reliably across date boundaries

#### Acceptance Criteria

1. WHEN generating slots that span from 11:00 PM on one day to 5:00 AM on the next day, THE Slot Generator Service SHALL maintain correct chronological ordering
2. WHEN comparing slot times with the cutoff time across midnight, THE Slot Generator Service SHALL perform accurate time comparisons
3. THE Slot Generator Service SHALL preserve existing test compatibility and environment variable behavior
