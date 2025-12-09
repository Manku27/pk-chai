# Implementation Plan

- [x] 1. Create working day utility functions
  - Create `src/utils/workingDay.ts` with functions for calculating current working day, converting dates, and formatting labels
  - Implement `getCurrentWorkingDay()` to determine the active working day based on current time
  - Implement `getWorkingDayRange()` to calculate start (11pm) and end (5am) timestamps for a given date
  - Implement `dateInputToWorkingDay()` and `workingDayToDateInput()` for date picker integration
  - Implement `formatWorkingDayLabel()` to create human-readable labels like "Dec 9, 11pm - Dec 10, 5am"
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Add working day database query functions
  - Add `calculateWorkingDayRevenue()` function to `src/db/queries/analytics.ts` that filters by slotTime within working day range
  - Add `getOrderCountsByStatusForWorkingDay()` function that groups orders by status for a working day window
  - Add `getOrdersBySlotAndBlockForWorkingDay()` function that groups orders by slot and block for a working day
  - Add `getOrdersByStatusForWorkingDay()` function to `src/db/queries/orders.ts` that filters orders by status and working day
  - Export all new functions from `src/db/queries/index.ts`
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.2_

- [x] 3. Update analytics API route for working day support
  - Add `working-day-revenue` case to `/api/admin/analytics` route that accepts workingDayStart and workingDayEnd parameters
  - Add `working-day-status-counts` case that returns status counts for a working day range
  - Add `working-day-slot-block-groups` case that returns slot-block groups for a working day range
  - Add parameter validation for working day start and end timestamps
  - Maintain existing API cases for backward compatibility
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_

- [x] 4. Update orders API route for working day filtering
  - Modify `/api/admin/orders` route to accept optional workingDayStart and workingDayEnd parameters
  - Add conditional logic to call `getOrdersByStatusForWorkingDay()` when working day parameters are provided
  - Fall back to existing `getOrdersByStatus()` when working day parameters are not provided
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Update admin dashboard Overview tab
  - Remove the date picker input from the Overview tab UI
  - Add state for `workingDayRevenue` and `workingDayLabel`
  - Update `fetchOverviewData()` to call working day API endpoints with current working day range
  - Change "Daily Revenue" label to "Working Day Revenue" and display the working day label
  - Update "Orders by Slot & Block" section heading to include "(Current Working Day)"
  - Remove date parameter from Overview tab API calls
  - _Requirements: 1.1, 1.5, 2.3, 2.4, 3.3, 3.4, 4.3, 6.1, 6.2, 6.3, 6.4_

- [x] 6. Update admin dashboard Orders tab
  - Add working day date picker to Orders tab UI
  - Add state for `ordersWorkingDayDate` and `ordersWorkingDayLabel`
  - Initialize working day date to current working day on component mount
  - Update `fetchOrdersByStatus()` to include working day parameters in API call
  - Display working day label above the orders table in format "Working Day: Dec 9, 11pm - Dec 10, 5am"
  - Combine working day filter with status filter in the UI
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 7. Add unit tests for working day utilities
  - Write tests for `getCurrentWorkingDay()` covering all time ranges (11pm-midnight, midnight-5am, 5am-11pm)
  - Write tests for `getWorkingDayRange()` to verify correct start and end timestamps
  - Write tests for date conversion functions
  - Write tests for label formatting
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 8. Add integration tests for working day queries
  - Write tests for `calculateWorkingDayRevenue()` with sample order data
  - Write tests for `getOrderCountsByStatusForWorkingDay()` to verify correct grouping
  - Write tests for `getOrdersBySlotAndBlockForWorkingDay()` to verify filtering
  - Write tests for `getOrdersByStatusForWorkingDay()` to verify combined filtering
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.2_

- [x] 9. Update admin dashboard styles to match customer design system
  - Replace soft shadows with neo-brutalist hard shadows using `var(--shadow-hard)`
  - Update all borders to 3px solid `var(--pk-ink)`
  - Apply brand colors: `var(--pk-gold)` for accents, `var(--clay-red)` for primary actions, `var(--pk-foam)` for backgrounds
  - Update border radius to use `var(--radius-std)` consistently
  - Add transform and shadow transitions to interactive elements (buttons, tabs, cards)
  - Update tab styles to match neo-brutalist pattern with active state using `var(--pk-gold)`
  - Style stat cards with hard shadows and bold borders
  - Update table styling with `var(--pk-gold)` headers and bold borders
  - Apply consistent button styles with active/hover states
  - Update status badges to use neo-brutalist styling with borders and shadows
  - Ensure responsive behavior matches customer page patterns
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_


- [x] 10. Add detailed order view for hostel blocks
- [x] 10.1 Create database query for detailed orders
  - Add `getDetailedOrdersForSlotAndBlock()` function to `src/db/queries/analytics.ts`
  - Query should join orders, users, orderItems, and menuItems tables
  - Group order items by order ID to return structured data with customer name and item details
  - Export function from `src/db/queries/index.ts`
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 10.2 Create API endpoint for detailed orders
  - Create `src/app/api/admin/orders/details/route.ts` with GET handler
  - Accept slotTime and hostelBlock query parameters
  - Call `getDetailedOrdersForSlotAndBlock()` and return formatted response
  - Add parameter validation and error handling
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10.3 Add expandable UI to hostel block cards
  - Add state management for expanded blocks (`expandedBlocks` Set)
  - Add state for storing detailed orders (`detailedOrders` Record)
  - Add state for loading indicators (`loadingDetails` Set)
  - Implement `toggleBlockExpansion()` function to handle expand/collapse and fetch details
  - Update block card UI to include expand/collapse button with chevron icon
  - Make block header clickable to toggle expansion
  - _Requirements: 8.1, 8.7_

- [ ] 10.4 Implement detailed order display
  - Create expanded section UI that shows when block is expanded
  - Display list of individual orders with order ID, customer name, and total amount
  - Display menu items with quantities and prices for each order
  - Add loading state while fetching details
  - Add empty state for blocks with no orders
  - Format order IDs to show shortened version (first 8 characters)
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 10.5 Style detailed order view with neo-brutalist design
  - Apply consistent borders and shadows to order detail cards
  - Use indentation or background color to distinguish expanded content
  - Add smooth transition animation for expand/collapse
  - Style order items list with proper spacing and hierarchy
  - Ensure responsive layout for mobile and desktop
  - Add hover states for interactive elements
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.6_

- [ ]* 10.6 Add error handling and edge cases
  - Handle API errors with retry button in expanded section
  - Add error messages for failed detail fetches
  - Handle empty order lists gracefully
  - Add debouncing to prevent rapid expand/collapse actions
  - _Requirements: 8.1, 8.6_
