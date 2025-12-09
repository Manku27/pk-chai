# Requirements Document

## Introduction

This specification addresses the need for an unfiltered view of all orders in the admin dashboard. Currently, the admin order feed groups orders by slot time and hostel block, which makes it difficult to see the complete order history at a glance. This enhancement will add a nested route that displays all orders in a simple, chronological list without slot-based grouping, making it easier for administrators to review the complete order history.

## Glossary

- **Admin Dashboard**: The administrative interface for managing orders and viewing analytics
- **Order Feed**: The current slot-grouped view of orders on the admin dashboard
- **All Orders View**: A new nested route that displays all orders without slot-based grouping
- **Slot-Based Grouping**: The current organization of orders by delivery time slot and hostel block
- **Chronological List**: Orders displayed in time order without additional grouping
- **Nested Route**: A sub-page within the admin section (e.g., `/admin/all-orders`)

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to view all orders in a simple chronological list, so that I can easily review the complete order history without slot-based filtering.

#### Acceptance Criteria

1. WHEN an administrator navigates to the all orders route THEN the system SHALL display all orders in chronological order
2. WHEN displaying orders THEN the system SHALL show order ID, customer details, items, total amount, status, and timestamps
3. WHEN orders are loaded THEN the system SHALL sort them by creation time with newest orders first
4. WHEN the page loads THEN the system SHALL fetch all orders without slot or block filtering
5. WHEN no orders exist THEN the system SHALL display an empty state message

### Requirement 2

**User Story:** As an administrator, I want to navigate between the slot-grouped view and the all orders view, so that I can choose the most appropriate view for my current task.

#### Acceptance Criteria

1. WHEN viewing the admin dashboard THEN the system SHALL provide a navigation link to the all orders view
2. WHEN viewing the all orders page THEN the system SHALL provide a navigation link back to the main dashboard
3. WHEN navigating between views THEN the system SHALL maintain the admin authentication state
4. WHEN the URL changes THEN the system SHALL update the active view without full page reload
5. WHEN accessing the all orders route directly THEN the system SHALL verify admin authentication before displaying content

### Requirement 3

**User Story:** As an administrator, I want to update order status from the all orders view, so that I can manage orders efficiently regardless of which view I'm using.

#### Acceptance Criteria

1. WHEN viewing an order in the all orders list THEN the system SHALL display the current order status
2. WHEN an administrator changes an order status THEN the system SHALL update the status via API call
3. WHEN a status update succeeds THEN the system SHALL refresh the order list to reflect the change
4. WHEN a status update fails THEN the system SHALL display an error message and maintain the previous status
5. WHEN multiple status updates occur THEN the system SHALL handle them independently without conflicts

### Requirement 4

**User Story:** As an administrator, I want the all orders view to load efficiently, so that I can access order information quickly even with a large order history.

#### Acceptance Criteria

1. WHEN the all orders page loads THEN the system SHALL display a loading indicator while fetching data
2. WHEN the API request completes THEN the system SHALL remove the loading indicator and display orders
3. WHEN the API request fails THEN the system SHALL display an error message with a retry option
4. WHEN the retry button is clicked THEN the system SHALL attempt to fetch orders again
5. WHEN orders are displayed THEN the system SHALL render them efficiently without performance degradation

### Requirement 5

**User Story:** As an administrator, I want the all orders view to have a clean, readable layout, so that I can quickly scan through order information.

#### Acceptance Criteria

1. WHEN orders are displayed THEN the system SHALL use a card-based layout with clear visual separation
2. WHEN displaying order details THEN the system SHALL format currency values consistently
3. WHEN displaying timestamps THEN the system SHALL format dates and times in a readable format
4. WHEN displaying order items THEN the system SHALL show item name, quantity, and price clearly
5. WHEN the viewport is narrow THEN the system SHALL maintain readability with responsive design
