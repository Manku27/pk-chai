 # Implementation Plan: Admin Dashboard

- [x] 1. Create connection manager for polling
  - Implement ConnectionManager class with polling mode
  - Add automatic error handling and retry logic
  - Implement configurable polling interval
  - _Requirements: 2.2, 2.3, 2.4, 6.2, 6.3, 6.4_
  - _Note: SSE not supported in deployment environment, using polling only_

- [x] 2. Implement order grouping and sorting utilities
  - Create function to group orders by slot time and hostel block
  - Implement chronological sorting for slot times
  - Ensure all four hostel blocks appear in grouping structure
  - _Requirements: 2.5, 4.3, 4.4_

- [x] 2.1 Enhance slot generation to create all time slots




  - Update getAvailableSlots() or create generateAllSlots() function to generate all slots from 11:00 PM to 5:00 AM
  - Add isPast property to TimeSlot interface
  - Implement logic to determine if a slot is in the past relative to current time
  - Handle day boundary crossing (11 PM today to 5 AM tomorrow)
  - _Requirements: 8.1, 8.2_

- [ ]* 2.1.1 Write property test for slot generation
  - **Property 18: All time slots are generated**
  - **Validates: Requirements 8.1**

- [ ]* 2.1.2 Write property test for past slot marking
  - **Property 19: Past slots are marked correctly**
  - **Validates: Requirements 8.2**

- [x] 2.2 Update order grouping to include all slots





  - Modify groupOrdersBySlotAndBlock() to merge orders with all generated slots
  - Ensure slots without orders still appear in the grouped structure
  - Add empty array for blocks with no orders in each slot
  - _Requirements: 8.1, 8.4_

- [ ]* 2.2.1 Write property test for empty slot display
  - **Property 21: Empty slots display correctly**
  - **Validates: Requirements 8.4**

- [x] 2.3 Implement slot sorting by status




  - Create sortSlotsByStatus() function to sort slots with upcoming first, past last
  - Maintain chronological order within each group (upcoming and past)
  - Update grouping logic to apply this sorting
  - _Requirements: 8.3_

- [ ]* 2.3.1 Write property test for slot sorting
  - **Property 20: Slots are sorted by status**
  - **Validates: Requirements 8.3**

- [x] 3. Create API route for fetching orders with filters





  - Implement GET /api/admin/orders endpoint
  - Add query parameter support for status, slotTime, hostelBlock filters
  - Include order items and user details in response
  - Add error handling for database failures
  - _Requirements: 4.1, 4.2_

- [x] 4. Create API route for order status updates






  - Implement PATCH /api/admin/orders/[orderId] endpoint
  - Add status transition validation logic
  - Ensure immediate database persistence
  - Return appropriate error codes for invalid transitions
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 5. ~~Create SSE endpoint for real-time order updates~~ (Not needed - using polling only)
  - _Note: SSE not supported in deployment environment_

- [x] 6. Implement analytics API endpoints






  - Create GET /api/admin/analytics endpoint with type parameter
  - Implement daily-revenue calculation (DELIVERED orders only)
  - Implement order-counts aggregation by status
  - Implement traffic-by-slot aggregation
  - Implement hostel-demand distribution calculation
  - Implement heatmap data generation (block × slot)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Create authentication guard component





  - Implement AuthGuard component for /master route protection
  - Check authentication status on mount
  - Verify user role is ADMIN
  - Redirect to login if unauthenticated
  - Display authorization error for non-admin users
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Build real-time order feed component






  - Create OrderFeed component with connection manager integration
  - Display orders grouped by slot time and hostel block
  - Show order details: ID, customer info, items, total, status
  - Add connection status indicator (Polling)
  - Implement polling-based updates without page refresh
  - _Requirements: 2.1, 2.5, 4.1, 4.2, 4.5_

- [x] 8.1 Update OrderFeed to display all slots persistently





  - Integrate generateAllSlots() and sortSlotsByStatus() into OrderFeed
  - Display all time slots regardless of whether orders exist
  - Apply greyed-out styling to past slots using CSS
  - Show "No orders for this slot" message for empty slots
  - Implement automatic reordering as time progresses (check every minute)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.2 Add CSS styling for past slots




  - Create greyed-out style for past slot headers
  - Add visual distinction between upcoming and past slots
  - Ensure empty slot messages are clearly visible
  - Maintain existing styling for order cards
  - _Requirements: 8.2_

- [x] 9. Build order status manager component






  - Create OrderStatusManager component with action buttons
  - Implement status transition buttons based on current status
  - Add visual feedback during status updates
  - Display error messages for failed updates
  - Disable buttons during updates to prevent double-clicks
  - _Requirements: 3.2, 3.3, 3.4, 7.3, 7.4_

- [x] 10. Build analytics dashboard component




  - Create AnalyticsDashboard component with date selector
  - Display daily revenue and total revenue metrics
  - Show order counts by status
  - Display traffic by slot table
  - Display hostel demand distribution table
  - Add loading states and error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Integrate components into admin page





  - Update /master route with AuthGuard wrapper
  - Add tab navigation between order feed and analytics
  - Wire up ConnectionManager to OrderFeed
  - Connect OrderStatusManager to status update API
  - Implement error toast notifications
  - Add CSS styling following existing patterns
  - _Requirements: 1.3, 2.1, 4.5, 7.4_

- [x] 12. Add Chart.js visualizations for analytics (Phase 2)





  - Install and configure Chart.js library
  - Create bar chart component for traffic by slot
  - Create pie chart component for hostel demand
  - Create heatmap component for block × slot intensity
  - Style charts with custom CSS
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 13. Add operational hours restriction to polling
  - Update ConnectionManager to check current time before polling
  - Implement isWithinOperationalHours() method (10 PM to 5 AM)
  - Pause polling when outside operational hours
  - Add timer to automatically resume polling when operational window begins
  - Display operational status in UI
  - _Requirements: 6.6_

- [ ]* 13.1 Write property test for operational hours restriction
  - **Property 17: Polling respects operational hours**
  - **Validates: Requirements 6.6**
