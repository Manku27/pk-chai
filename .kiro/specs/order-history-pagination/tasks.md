# Implementation Plan

- [x] 1. Implement paginated database query function





  - Create `getOrdersWithItemsByUserIdPaginated` function in `src/db/queries/orders.ts`
  - Add parameters for userId, page, and limit
  - Implement OFFSET calculation: `(page - 1) * limit`
  - Use LIMIT clause for page size
  - Add separate COUNT query to get total orders
  - Maintain existing ordering (newest first using createdAt DESC)
  - Return both paginated orders and total count
  - _Requirements: 2.1, 2.2_

- [ ]* 1.1 Write unit tests for paginated query
  - Test correct OFFSET and LIMIT application
  - Test total count accuracy
  - Test empty results for out-of-bounds pages
  - Test ordering maintained
  - _Requirements: 2.1, 2.2, 4.3_

- [ ]* 1.2 Write property test for page size limits
  - **Property 2: Page size limit enforcement**
  - **Validates: Requirements 2.5**

- [ ]* 1.3 Write property test for results count
  - **Property 9: Results count within page size**
  - **Validates: Requirements 2.2**
-

- [x] 2. Update orderService to support pagination




  - Modify `getOrderHistory` function to accept optional page and limit parameters
  - Call new `getOrdersWithItemsByUserIdPaginated` database function
  - Calculate pagination metadata (totalPages, hasNextPage, hasPreviousPage)
  - Return orders with pagination metadata
  - Maintain backward compatibility with default values (page=1, limit=10)
  - Cap limit at maximum of 50
  - _Requirements: 2.2, 2.3, 2.5_

- [ ]* 2.1 Write unit tests for orderService pagination
  - Test pagination metadata calculation
  - Test limit capping at 50
  - Test default values applied
  - Test backward compatibility
  - _Requirements: 2.3, 2.5_

- [ ]* 2.2 Write property test for metadata completeness
  - **Property 3: Pagination metadata completeness**
  - **Validates: Requirements 2.3**
-

- [x] 3. Update API route to accept pagination parameters



  - Modify `/api/orders/history/[userId]/route.ts` to parse query parameters
  - Extract `page` and `limit` from request URL searchParams
  - Validate pagination parameters (positive integers)
  - Return 400 error for invalid parameters
  - Pass parameters to updated `getOrderHistory` function
  - Return paginated response with orders and pagination metadata
  - _Requirements: 1.1, 2.4, 3.1_

- [ ]* 3.1 Write unit tests for API route pagination
  - Test valid parameters return correct page
  - Test default values when parameters omitted
  - Test invalid parameters return 400
  - Test pagination metadata in response
  - _Requirements: 1.1, 2.4_

- [ ]* 3.2 Write property test for invalid parameters
  - **Property 4: Invalid pagination parameters rejection**
  - **Validates: Requirements 2.4**

- [ ]* 3.3 Write property test for out-of-bounds requests
  - **Property 8: Out-of-bounds page requests**
  - **Validates: Requirements 4.3**
-

- [x] 4. Add pagination state management to profile page




  - Add state variables: currentPage, pageSize, totalPages, hasNextPage, hasPreviousPage
  - Initialize currentPage from URL query parameters on mount
  - Update fetch call to include page and limit query parameters
  - Parse pagination metadata from API response
  - Update state with pagination metadata
  - _Requirements: 1.1, 3.1, 3.2, 3.5_

- [ ]* 4.1 Write unit tests for pagination state management
  - Test initial state from URL parameters
  - Test state updates from API response
  - Test default values when no URL parameters
  - _Requirements: 3.1, 3.2, 3.5_

- [ ]* 4.2 Write property test for URL state synchronization
  - **Property 7: URL state synchronization**
  - **Validates: Requirements 3.1, 3.2, 3.5**
-

- [x] 5. Implement pagination UI controls


  - Create pagination controls section in profile page
  - Add "Previous" button with click handler
  - Add "Next" button with click handler
  - Add page indicator showing "Page X of Y"
  - Implement handlePageChange function to update page state and URL
  - Update URL query parameters when page changes using router.push()
  - Conditionally render pagination controls only when totalPages > 1
  - _Requirements: 1.2, 1.3, 1.4, 3.1_

- [ ]* 5.1 Write unit tests for pagination controls
  - Test controls render when multiple pages exist
  - Test controls hidden when single page or no orders
  - Test page change updates state and URL
  - Test button click handlers
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 5.2 Write property test for controls visibility
  - **Property 1: Pagination controls visibility based on order count**
  - **Validates: Requirements 1.2**

- [x] 6. Implement button state management




  - Disable "Previous" button when currentPage === 1
  - Disable "Next" button when !hasNextPage or currentPage === totalPages
  - Add disabled styling to buttons
  - Add ARIA attributes for accessibility
  - _Requirements: 1.5, 1.6_

- [ ]* 6.1 Write unit tests for button states
  - Test previous button disabled on first page
  - Test next button disabled on last page
  - Test both buttons enabled on middle pages
  - _Requirements: 1.5, 1.6_

- [ ]* 6.2 Write property test for previous button state
  - **Property 5: Previous button disabled on first page**
  - **Validates: Requirements 1.5**

- [ ]* 6.3 Write property test for next button state
  - **Property 6: Next button disabled on last page**
  - **Validates: Requirements 1.6**

- [x] 7. Add loading and error states for pagination




  - Show loading spinner during page transitions
  - Display error message if pagination request fails
  - Add retry button for failed requests
  - Maintain current page state on error
  - _Requirements: 3.3, 3.4_

- [ ]* 7.1 Write unit tests for loading and error states
  - Test loading indicator displays during fetch
  - Test error message displays on failure
  - Test retry button functionality
  - _Requirements: 3.3, 3.4_

- [x] 8. Handle edge cases




  - Hide pagination controls when user has zero orders
  - Hide pagination controls when orders <= page size
  - Display appropriate empty state messages
  - Handle out-of-bounds page requests gracefully
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 8.1 Write unit tests for edge cases
  - Test zero orders shows empty state without pagination
  - Test orders <= page size shows all without pagination
  - Test out-of-bounds page shows empty results
  - _Requirements: 4.1, 4.2, 4.3_
-

- [x] 9. Add pagination styling




  - Create CSS module for pagination controls
  - Style pagination buttons with hover and disabled states
  - Style page indicator
  - Ensure responsive design for mobile devices
  - Add focus styles for keyboard navigation
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
