 # Implementation Plan

- [x] 1. Update analytics query to include order status in detailed orders
  - Modify `getOrdersBySlotAndBlockForWorkingDayWithDetails` in `src/db/queries/analytics.ts` to include `orders.status` in the select statement
  - Update the return type to include status field in DetailedOrder objects
  - _Requirements: 1.1, 1.4, 2.1, 2.4, 3.4_

- [x] 2. Create API endpoint for order status updates
  - Create new file `src/app/api/admin/orders/[orderId]/status/route.ts`
  - Implement PATCH handler that accepts status in request body
  - Validate orderId parameter and status value (must be 'DELIVERED' or 'REJECTED')
  - Fetch current order and validate it has status ACCEPTED or ACKNOWLEDGED
  - Call `updateOrderStatus` from queries to update the order
  - Return updated order with success message
  - Handle errors: 404 for order not found, 400 for invalid status or cannot update, 500 for server errors
  - _Requirements: 1.1, 1.5, 2.1, 2.5_

- [x] 3. Add order status management UI to admin dashboard
  - [x] 3.1 Add state management for status updates
    - Add `updatingOrderId` state to track which order is being updated
    - Add `statusUpdateError` state to store error messages
    - _Requirements: 5.1, 5.3, 5.5_
  
  - [x] 3.2 Implement status update handler function
    - Create `handleUpdateOrderStatus` function that calls the new API endpoint
    - Set loading state before request and clear after response
    - Handle success by refreshing overview data via `fetchOverviewData`
    - Handle errors by setting error state with message
    - _Requirements: 1.1, 1.4, 2.1, 2.4, 5.2, 5.3_
  
  - [x] 3.3 Add order status display and action buttons to order details
    - Display order status badge for each order in the detailed orders list
    - Add action buttons section below order items with "Fulfill" and "Reject" buttons
    - Show buttons only when order status is ACCEPTED or ACKNOWLEDGED
    - Hide buttons when order status is DELIVERED or REJECTED
    - Disable buttons and show loading spinner when `updatingOrderId` matches current order
    - Display error message below buttons when `statusUpdateError` is set
    - _Requirements: 1.3, 2.3, 3.1, 3.2, 3.3, 3.5, 5.1, 5.4_
  
  - [x] 3.4 Add CSS styles for status management UI
    - Style action buttons to match existing dashboard button styles
    - Add styles for order status badges with color coding
    - Style loading state with spinner
    - Style error messages
    - Ensure responsive layout for action buttons
    - _Requirements: 3.5, 5.1, 5.2, 5.3_

- [ ] 4. Verify revenue analytics integration
  - Test that fulfilled orders (DELIVERED status) are included in total revenue
  - Test that fulfilled orders are included in working day revenue when slot time is within working day
  - Test that rejected orders (REJECTED status) are excluded from all revenue calculations
  - Verify that overview tab displays updated revenue after status changes
  - _Requirements: 1.2, 2.2, 4.1, 4.2, 4.3, 4.4, 4.5_
