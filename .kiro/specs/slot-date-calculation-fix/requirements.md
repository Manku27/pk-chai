# Requirements Document

## Introduction

Fix the slot date calculation bug where selecting a delivery slot in the early morning hours (after midnight but before 5:00 AM) incorrectly schedules the order for the next day instead of the current day. This affects users who place orders between 12:00 AM and 5:00 AM for delivery slots on the same day.

## Glossary

- **Slot_Generator**: The service responsible for generating available delivery time slots
- **Night_Delivery_Window**: The operational hours from 11:00 PM to 5:00 AM spanning across midnight
- **Current_Day_Slots**: Delivery slots that should be scheduled for the same calendar day when ordered after midnight
- **Slot_Time**: The ISO timestamp representing when a delivery should occur
- **Order_Placement_Time**: The timestamp when a user places an order

## Requirements

### Requirement 1

**User Story:** As a customer placing an order at 2:00 AM, I want to select a 3:00 AM delivery slot for the same day, so that my order is delivered within the current night delivery window.

#### Acceptance Criteria

1. WHEN a user places an order between 12:00 AM and 5:00 AM, THE Slot_Generator SHALL generate slots for the current calendar day
2. WHEN a user selects a slot time that occurs after the Order_Placement_Time within the same Night_Delivery_Window, THE Slot_Generator SHALL use the current calendar date for the Slot_Time
3. IF a user places an order at 2:00 AM and selects a 3:00 AM slot, THEN THE Slot_Generator SHALL create a Slot_Time for 3:00 AM on the same calendar day
4. WHEN generating slots during early morning hours (12:00 AM to 5:00 AM), THE Slot_Generator SHALL maintain the same date for all slots within the current Night_Delivery_Window

### Requirement 2

**User Story:** As a customer placing an order at 11:30 PM, I want to select delivery slots for both the current night (before midnight) and early morning (after midnight), so that all slots are correctly dated for the appropriate calendar days.

#### Acceptance Criteria

1. WHEN a user places an order before midnight, THE Slot_Generator SHALL generate slots spanning the current day (before midnight) and next day (after midnight)
2. WHEN generating slots that cross midnight, THE Slot_Generator SHALL assign the correct calendar date to each slot based on when it occurs
3. IF a user selects an 11:30 PM slot at 11:00 PM, THEN THE Slot_Generator SHALL use the current calendar date
4. IF a user selects a 1:00 AM slot at 11:00 PM, THEN THE Slot_Generator SHALL use the next calendar date

### Requirement 3

**User Story:** As a system administrator, I want the slot generation logic to handle date transitions correctly across different time zones and edge cases, so that orders are always scheduled for the intended delivery time.

#### Acceptance Criteria

1. THE Slot_Generator SHALL maintain consistent date calculation logic regardless of the Order_Placement_Time
2. WHEN calculating slot dates, THE Slot_Generator SHALL consider the relationship between Order_Placement_Time and slot time within the Night_Delivery_Window
3. THE Slot_Generator SHALL preserve existing slot availability logic while fixing date calculation
4. THE Slot_Generator SHALL maintain backward compatibility with existing order placement functionality