# Requirements Document

## Introduction

The Admin Dashboard (backpanel) is a secure web interface that enables PKChai administrators to monitor and manage incoming orders in real-time. The system provides a live order feed, order status management workflow, and analytics capabilities to support operational efficiency during the 11:00 PM to 5:00 AM delivery window.

## Glossary

- **Admin Dashboard**: The secure web interface accessible at `/master` for order management
- **Order Feed**: Real-time display of incoming orders grouped by slot time and hostel block
- **SSE (Server-Sent Events)**: Primary real-time communication protocol for pushing order updates to the dashboard
- **Short Polling**: Fallback mechanism that fetches order data every 15 seconds when SSE is unavailable
- **Order Status**: The current state of an order in the fulfillment workflow (ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED)
- **Slot Time**: The 30-minute delivery window selected by the customer (e.g., 11:30 PM, 12:00 AM)
- **Hostel Block**: The delivery location (Jaadavpur Main Hostel, New block hostel, KPC boys hostel, KPC girls hostel)
- **Analytics Dashboard**: Phase 2 feature providing revenue metrics and order visualizations

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to access a secure dashboard, so that I can manage orders without unauthorized access.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access the `/master` route THEN the system SHALL redirect the user to the login page
2. WHEN an authenticated user with role USER attempts to access the `/master` route THEN the system SHALL deny access and display an authorization error
3. WHEN an authenticated user with role ADMIN accesses the `/master` route THEN the system SHALL display the Admin Dashboard interface
4. WHEN an admin session expires THEN the system SHALL require re-authentication before allowing further dashboard access

### Requirement 2

**User Story:** As an administrator, I want to see incoming orders in real-time, so that I can respond quickly to customer requests.

#### Acceptance Criteria

1. WHEN a new order is placed by a customer THEN the Admin Dashboard SHALL display the order within 2 seconds
2. WHEN the SSE connection is active THEN the system SHALL push order updates to the Admin Dashboard using Server-Sent Events
3. WHEN the SSE connection fails or times out THEN the system SHALL automatically switch to short polling with a 15-second interval
4. WHEN the SSE connection is restored after a fallback to polling THEN the system SHALL resume using SSE for real-time updates
5. WHEN orders are displayed THEN the system SHALL group orders by slot time and then by hostel block

### Requirement 3

**User Story:** As an administrator, I want to update order status through a defined workflow, so that customers receive accurate order progress information.

#### Acceptance Criteria

1. WHEN a new order is created in the database THEN the system SHALL automatically set the order status to ACCEPTED
2. WHEN an admin clicks the acknowledge button for an order with status ACCEPTED THEN the system SHALL update the order status to ACKNOWLEDGED
3. WHEN an admin clicks the deliver button for an order with status ACKNOWLEDGED THEN the system SHALL update the order status to DELIVERED
4. WHEN an admin clicks the reject button for an order with status ACCEPTED or ACKNOWLEDGED THEN the system SHALL update the order status to REJECTED
5. WHEN an order status is updated THEN the system SHALL persist the change to the database immediately

### Requirement 4

**User Story:** As an administrator, I want to see order details clearly organized, so that I can efficiently prepare and deliver orders.

#### Acceptance Criteria

1. WHEN displaying an order THEN the system SHALL show the order ID, customer phone number, target hostel block, slot time, total amount, and creation timestamp
2. WHEN displaying an order THEN the system SHALL show all order items with item name, quantity, and price at order time
3. WHEN orders are grouped by slot time THEN the system SHALL sort slot times in chronological order
4. WHEN orders are grouped by hostel block within a slot THEN the system SHALL display all four hostel blocks (Jaadavpur Main Hostel, New block hostel, KPC boys hostel, KPC girls hostel)
5. WHEN an order status changes THEN the system SHALL update the visual display to reflect the new status without requiring a page refresh

### Requirement 5

**User Story:** As an administrator, I want to view analytics and metrics, so that I can understand business performance and optimize operations.

#### Acceptance Criteria

1. WHEN the admin views the analytics section THEN the system SHALL display total daily revenue calculated from orders with status DELIVERED
2. WHEN the admin views the analytics section THEN the system SHALL display total order count and rejected order count for the current day
3. WHEN the admin views the traffic by slot visualization THEN the system SHALL display a bar chart showing order volume for each 30-minute slot
4. WHEN the admin views the hostel demand visualization THEN the system SHALL display a pie chart showing order distribution across the four hostel blocks
5. WHEN the admin views the consumption heatmap THEN the system SHALL display a heatmap showing order intensity by hostel block and time slot

### Requirement 6

**User Story:** As an administrator, I want the dashboard to handle connection failures gracefully, so that I never miss orders during network issues.

#### Acceptance Criteria

1. WHEN the SSE connection closes unexpectedly THEN the system SHALL detect the closure within 5 seconds
2. WHEN the system detects SSE connection closure THEN the system SHALL initiate short polling at 15-second intervals
3. WHEN short polling is active THEN the system SHALL fetch all pending orders from the API endpoint
4. WHEN the network connection is restored THEN the system SHALL attempt to re-establish the SSE connection
5. WHEN transitioning between SSE and polling THEN the system SHALL maintain order display continuity without data loss
6. WHEN the current time is outside the operational window (10:00 PM to 5:00 AM) THEN the system SHALL pause polling and resume automatically when the operational window begins

### Requirement 7

**User Story:** As an administrator, I want the dashboard interface to be responsive and performant, so that I can manage high order volumes efficiently.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display the initial order feed within 3 seconds
2. WHEN rendering up to 100 orders THEN the system SHALL maintain smooth scrolling and interaction responsiveness
3. WHEN an order status update is triggered THEN the system SHALL provide visual feedback within 200 milliseconds
4. WHEN the API responds with an error for a status update THEN the system SHALL display an error message to the admin
5. WHEN multiple orders are updated simultaneously THEN the system SHALL process all updates without UI blocking

### Requirement 8

**User Story:** As an administrator, I want to see all time slots always visible on the dashboard, so that I can anticipate upcoming deliveries and see which slots have no orders.

#### Acceptance Criteria

1. WHEN the dashboard displays the order feed THEN the system SHALL show all time slots from 11:00 PM to 5:00 AM in 30-minute intervals regardless of whether orders exist for those slots
2. WHEN a time slot has passed relative to the current time THEN the system SHALL visually distinguish that slot with a greyed-out appearance
3. WHEN displaying time slots THEN the system SHALL sort slots with upcoming and current slots at the top and past slots at the bottom
4. WHEN a time slot has no orders THEN the system SHALL display an empty state message within that slot section
5. WHEN the current time advances past a slot THEN the system SHALL automatically update the visual appearance and reorder slots without requiring a page refresh
