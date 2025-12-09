# Requirements Document

## Introduction

This feature enables administrators to manage order statuses by marking orders as fulfilled or rejected. When an order is marked as fulfilled (DELIVERED status), it contributes to revenue analytics. This provides administrators with control over order lifecycle and ensures accurate revenue tracking.

## Glossary

- **Admin Dashboard**: The web interface used by administrators to view and manage orders
- **Order Status**: The current state of an order in the system (ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED)
- **Revenue Analytics**: Calculated metrics showing total and working day revenue based on delivered orders
- **Working Day**: A time period from 11 PM to 5 AM the following day during which orders are fulfilled
- **Order Management System**: The backend system that processes order status updates

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to mark orders as fulfilled directly from the order details on the dashboard, so that completed orders are tracked in revenue analytics

#### Acceptance Criteria

1. WHEN the administrator clicks a fulfill action on an order with status ACCEPTED or ACKNOWLEDGED, THE Order Management System SHALL update the order status to DELIVERED
2. WHEN an order status is updated to DELIVERED, THE Order Management System SHALL include the order's total amount in revenue calculations
3. THE Admin Dashboard SHALL display a fulfill action button below each order detail in the expandable block cards for orders with status ACCEPTED or ACKNOWLEDGED
4. WHEN an order status is successfully updated to DELIVERED, THE Admin Dashboard SHALL refresh the slot-block groups to reflect the new status
5. THE Order Management System SHALL record the timestamp when the order status is updated to DELIVERED

### Requirement 2

**User Story:** As an administrator, I want to reject orders directly from the order details on the dashboard, so that cancelled or problematic orders are properly tracked and excluded from revenue

#### Acceptance Criteria

1. WHEN the administrator clicks a reject action on an order with status ACCEPTED or ACKNOWLEDGED, THE Order Management System SHALL update the order status to REJECTED
2. WHEN an order status is updated to REJECTED, THE Order Management System SHALL exclude the order's total amount from revenue calculations
3. THE Admin Dashboard SHALL display a reject action button below each order detail in the expandable block cards for orders with status ACCEPTED or ACKNOWLEDGED
4. WHEN an order status is successfully updated to REJECTED, THE Admin Dashboard SHALL refresh the slot-block groups to reflect the new status
5. THE Order Management System SHALL record the timestamp when the order status is updated to REJECTED

### Requirement 3

**User Story:** As an administrator, I want to see action buttons only for orders that can be updated, so that I don't accidentally modify orders in final states

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display fulfill and reject action buttons below order details only for orders with status ACCEPTED or ACKNOWLEDGED
2. THE Admin Dashboard SHALL NOT display action buttons below order details for orders with status DELIVERED
3. THE Admin Dashboard SHALL NOT display action buttons below order details for orders with status REJECTED
4. WHEN an order detail is displayed in the expandable block card, THE Admin Dashboard SHALL show the current order status
5. THE Admin Dashboard SHALL visually distinguish orders by status using color coding or badges in the order details

### Requirement 4

**User Story:** As an administrator, I want revenue analytics to automatically update when orders are fulfilled, so that I see accurate financial data in real-time

#### Acceptance Criteria

1. WHEN an order status changes to DELIVERED, THE Revenue Analytics SHALL include the order amount in total revenue calculations
2. WHEN an order status changes to DELIVERED, THE Revenue Analytics SHALL include the order amount in working day revenue if the order slot time falls within the current working day
3. WHEN the administrator views the Overview tab after fulfilling an order, THE Admin Dashboard SHALL display updated revenue figures
4. THE Revenue Analytics SHALL calculate total revenue by summing all orders with status DELIVERED
5. THE Revenue Analytics SHALL calculate working day revenue by summing orders with status DELIVERED where slot time is within the working day range

### Requirement 5

**User Story:** As an administrator, I want visual feedback when updating order status, so that I know the action was successful or if an error occurred

#### Acceptance Criteria

1. WHEN an order status update is in progress, THE Admin Dashboard SHALL display a loading indicator on the action button
2. WHEN an order status update succeeds, THE Admin Dashboard SHALL display a success message to the administrator
3. WHEN an order status update fails, THE Admin Dashboard SHALL display an error message with failure details
4. WHILE an order status update is in progress, THE Admin Dashboard SHALL disable the action buttons to prevent duplicate requests
5. WHEN an error occurs during status update, THE Admin Dashboard SHALL maintain the current order status display
