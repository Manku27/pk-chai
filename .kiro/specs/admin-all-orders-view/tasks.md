# Implementation Plan

- [x] 1. Create the all orders page component




  - Create new page at `src/app/admin/all-orders/page.tsx`
  - Implement client-side component with AuthGuard wrapper
  - Set up state management for orders, loading, and error states
  - Add navigation header with back button to admin dashboard
  - _Requirements: 1.1, 2.2, 2.5_

- [x] 2. Implement order fetching logic




  - Add useEffect hook to fetch orders from `/api/admin/orders` on mount
  - Implement loading state display with spinner
  - Implement error state display with retry button
  - Implement empty state display when no orders exist
  - _Requirements: 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Implement order sorting and display





  - Sort fetched orders by `createdAt` descending (newest first)
  - Render orders in card-based layout
  - Display all required order fields: ID, customer details, items, total, status, timestamps
  - Format currency values with rupee symbol and two decimals
  - Format timestamps in readable date-time format
  - _Requirements: 1.1, 1.2, 1.3, 5.2, 5.3, 5.4_

- [ ]* 3.1 Write property test for chronological ordering
  - **Property 1: Chronological ordering**
  - **Validates: Requirements 1.1, 1.3**

- [ ]* 3.2 Write property test for complete order data display
  - **Property 2: Complete order data display**
  - **Validates: Requirements 1.2, 3.1, 5.4**

- [ ]* 3.3 Write property test for consistent data formatting
  - **Property 4: Consistent data formatting**
  - **Validates: Requirements 5.2, 5.3**

- [x] 4. Integrate order status management




  - Import and use OrderStatusManager component for each order
  - Implement status update handler that calls API endpoint
  - Refresh order list after successful status update
  - Handle status update errors with error display
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 4.1 Write property test for status update consistency
  - **Property 3: Status update consistency**
  - **Validates: Requirements 3.3**

- [x] 5. Add navigation from admin dashboard




  - Update `src/app/admin/page.tsx` to add navigation link/button to all orders view
  - Position link prominently near existing tab navigation
  - Style consistently with existing dashboard UI
  - _Requirements: 2.1_

- [ ]* 5.1 Write unit tests for navigation elements
  - Test that admin dashboard includes link to all orders
  - Test that all orders page includes back button
  - _Requirements: 2.1, 2.2_

- [x] 6. Create CSS module for styling





  - Create `src/app/admin/all-orders/page.module.css`
  - Implement card-based layout styles
  - Ensure responsive design for mobile/tablet
  - Maintain consistent styling with admin dashboard
  - Ensure accessibility (color contrast, focus states)
  - _Requirements: 5.1, 5.5_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
