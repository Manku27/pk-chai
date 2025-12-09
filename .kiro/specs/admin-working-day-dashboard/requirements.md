# Requirements Document

## Introduction

This feature transforms the admin dashboard from a calendar-date-based view to a working-day-based view that aligns with the night delivery service's operational hours (11pm to 5am). The working day concept treats the period from 11pm on one calendar day through 5am the next calendar day as a single operational shift, providing admins with a more intuitive view of their business operations.

## Glossary

- **Admin Dashboard**: The administrative interface used by restaurant staff to monitor orders, revenue, and operational metrics
- **Working Day**: A single operational shift spanning from 11:00 PM on one calendar date to 5:00 AM the following calendar date (6-hour window)
- **Current Working Day**: The active working day based on the current time - if before 5am, it's the working day that started the previous night; if after 11pm, it's the working day that just started; otherwise it's the most recent completed working day
- **Overview Tab**: The main dashboard view showing real-time metrics for the current working day
- **Orders Tab**: The order management view with status filtering capabilities
- **Calendar Date**: A standard 24-hour period from midnight to midnight
- **Shift-Based Analytics**: Metrics and data grouped by working day rather than calendar date

## Requirements

### Requirement 1

**User Story:** As an admin, I want the dashboard overview to automatically show the current working day's data, so that I can monitor today's operations without selecting dates

#### Acceptance Criteria

1. WHEN the Admin Dashboard loads, THE Admin Dashboard SHALL display metrics for the current working day without requiring date selection
2. IF the current time is between 11:00 PM and 11:59 PM, THEN THE Admin Dashboard SHALL display the working day that started at 11:00 PM today
3. IF the current time is between 12:00 AM and 5:00 AM, THEN THE Admin Dashboard SHALL display the working day that started at 11:00 PM yesterday
4. IF the current time is between 5:01 AM and 5:59 AM, THEN THE Admin Dashboard SHALL display the most recently completed working day (ended at 5:00 AM today)
5. IF the current time is between 6:00 AM and 10:59 PM, THEN THE Admin Dashboard SHALL display the upcoming working day (starting at 11:00 PM today)
6. THE Admin Dashboard SHALL remove the date picker input from the Overview tab

### Requirement 2

**User Story:** As an admin, I want to see revenue metrics for the current working day, so that I can track today's business performance

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display total revenue for the current working day
2. THE Admin Dashboard SHALL calculate revenue by summing all orders with slotTime between the working day start (11:00 PM) and end (5:00 AM)
3. THE Admin Dashboard SHALL update the "Daily Revenue" label to "Working Day Revenue" to reflect the shift-based calculation
4. THE Admin Dashboard SHALL display the working day date range in the format "Nov 8, 11pm - Nov 9, 5am"

### Requirement 3

**User Story:** As an admin, I want to see order counts grouped by slot and hostel block for the current working day, so that I can understand delivery patterns during my shift

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display a table showing orders grouped by slot time and hostel block for the current working day
2. THE Admin Dashboard SHALL filter the slot-block groups to include only orders with slotTime within the current working day window
3. THE Admin Dashboard SHALL display order count and total amount for each slot-block combination
4. THE Admin Dashboard SHALL update the section heading to "Orders by Slot & Block (Current Working Day)"

### Requirement 4

**User Story:** As an admin, I want the order status counts to reflect the current working day, so that I can see how many orders are in each state for my shift

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display order counts by status (ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED) for the current working day
2. THE Admin Dashboard SHALL filter status counts to include only orders with slotTime within the current working day window
3. THE Admin Dashboard SHALL maintain the existing status count display format with status labels and counts

### Requirement 5

**User Story:** As an admin, I want to filter orders by working day in the Orders tab, so that I can review historical orders using the same shift-based approach

#### Acceptance Criteria

1. THE Admin Dashboard SHALL add a working day date picker to the Orders tab
2. WHEN a working day date is selected, THE Admin Dashboard SHALL display orders with slotTime between 11:00 PM on the selected date and 5:00 AM on the following date
3. THE Admin Dashboard SHALL combine the working day filter with the status filter to show orders matching both criteria
4. THE Admin Dashboard SHALL display the working day date range label in the format "Working Day: Dec 9, 11pm - Dec 10, 5am"
5. THE Admin Dashboard SHALL default the working day picker to the current working day when the Orders tab loads

### Requirement 6

**User Story:** As an admin, I want the total revenue metric to show all-time revenue, so that I can track cumulative business performance

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display total all-time revenue in the Overview tab
2. THE Admin Dashboard SHALL calculate total revenue by summing all orders regardless of date or working day
3. THE Admin Dashboard SHALL maintain the "Total Revenue" label for the all-time metric
4. THE Admin Dashboard SHALL display the total revenue metric separately from the working day revenue metric

### Requirement 7

**User Story:** As an admin, I want the dashboard to use the same visual design as the customer pages, so that the application has a consistent brand identity

#### Acceptance Criteria

1. THE Admin Dashboard SHALL use the neo-brutalist design system with hard shadows defined by `var(--shadow-hard)`
2. THE Admin Dashboard SHALL use 3px solid borders with `var(--pk-ink)` color for all cards and interactive elements
3. THE Admin Dashboard SHALL use brand colors from the design system including `var(--pk-gold)`, `var(--clay-red)`, `var(--pk-foam)`, and `var(--pk-cream)`
4. THE Admin Dashboard SHALL use `var(--radius-std)` for border radius on all rounded elements
5. THE Admin Dashboard SHALL apply the same button styles as customer pages with transform and shadow transitions on interaction
6. THE Admin Dashboard SHALL use consistent typography and spacing patterns from the customer pages
