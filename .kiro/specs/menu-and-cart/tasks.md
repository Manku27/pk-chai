# Implementation Plan

- [x] 1. Set up data layer and type definitions




  - Create TypeScript interfaces for MenuItem, CartItem, CartState, HostelBlock
  - Define menu data structure with all items from BRD
  - Create deterministic IDs for each menu item variant
  - _Requirements: 1.4, 7.1, 7.2_

- [x] 2. Implement IndexedDB storage service





  - Create IndexedDB wrapper with saveCart, loadCart, clearCart methods
  - Implement database initialization with proper schema
  - Add error handling for IndexedDB unavailability
  - Create memory storage fallback adapter
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 2.1 Write property test for cart persistence
  - **Property 10: Cart restoration round-trip**
  - **Validates: Requirements 3.2**
-

- [x] 3. Create Cart Context and Provider




  - Implement CartContext with state management
  - Create cart operations: addItem, removeItem, incrementItem, decrementItem
  - Add setLocation and setSlot methods
  - Implement total amount calculation
  - Integrate IndexedDB service for persistence
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 3.1 Write property test for cart operations
  - **Property 5: Adding items increments quantity**
  - **Validates: Requirements 2.1**

- [ ]* 3.2 Write property test for total calculation
  - **Property 8: Total amount equals sum of subtotals**
  - **Validates: Requirements 2.4, 5.2**

- [ ]* 3.3 Write property test for rapid changes
  - **Property 19: Rapid changes maintain consistency**
  - **Validates: Requirements 8.5**
-

- [x] 4. Build menu data service




  - Create static menu data array with all items from BRD
  - Implement getAllItems method
  - Implement getItemsByCategory method (group by category)
  - Implement getItemById lookup method
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ]* 4.1 Write unit tests for menu service
  - Test getAllItems returns complete menu
  - Test getItemsByCategory groups correctly
  - Test getItemById finds items
  - Test filterItems returns correct subset
  - Test filterItemsByCategory maintains grouping
  - _Requirements: 1.1, 7.2, 11.2, 11.3_
-

- [x] 5. Implement slot generator service




  - Create function to generate slots from 11:00 AM to 5:00 PM (30-min intervals)
  - Implement logic to disable slots within 30 minutes of current time
  - Return array of TimeSlot objects with availability status
  - _Requirements: 4.4, 4.5, 4.6_

- [ ]* 5.1 Write property test for slot availability
  - **Property 14: Slots within 30 minutes are disabled**
  - **Validates: Requirements 4.5, 4.6**

- [ ]* 5.2 Write unit tests for slot generation
  - Test 13 slots are generated
  - Test slots are 30 minutes apart
  - Test boundary cases (early morning, late afternoon)
  - Test environment variable enables all slots
  - Test slot count remains 13 with environment override
  - _Requirements: 4.4, 12.1, 12.4_

- [x] 6. Create MenuItem component




  - Display item name and price
  - Add "Add to Cart" button
  - Style with CSS Module using neo-brutalist design
  - Connect to CartContext for addItem action
  - _Requirements: 1.2, 2.1, 6.1_


- [x] 7. Create CategorySection component




  - Accept category name and array of items
  - Render category header with visual separation
  - Map through items and render MenuItem components
  - Use deterministic IDs as React keys
  - _Requirements: 1.1, 1.5, 7.5_
-

- [x] 8. Create MenuList component



  - Fetch menu data from menu service
  - Group items by category
  - Render CategorySection for each category
  - Make it a client component for interactivity
  - _Requirements: 1.1, 1.3, 1.5_

- [x] 9. Create CartItem component




  - Display item name, quantity, and subtotal
  - Add increment (+) and decrement (-) buttons
  - Connect to CartContext for quantity changes
  - Style with CSS Module
  - _Requirements: 2.2, 5.1, 8.1, 8.2_
- [x] 10. Create CartItemList component



- [ ] 10. Create CartItemList component

  - Map through cart items from CartContext
  - Render CartItem for each item
  - Show "Cart is empty" message when no items
  - _Requirements: 5.1, 5.3_

- [x] 11. Create LocationSelector component




  - Render dropdown with 4 hostel block options
  - Pre-select default block if user authenticated
  - Connect to CartContext to update selected location
  - _Requirements: 4.1, 4.2, 4.3_
-

- [x] 12. Create SlotSelector component




  - Use slot generator service to get available slots
  - Render dropdown with time slot options
  - Disable unavailable slots (grayed out)
  - Connect to CartContext to update selected slot
  - _Requirements: 4.4, 4.5, 4.6_

- [x] 12.1 Add environment variable support to slot generator




  - Read NEXT_PUBLIC_ENABLE_ALL_SLOTS from environment
  - Pass enableAllSlots parameter to getAvailableSlots
  - Mark all slots as available when environment variable is "true"
  - Maintain normal 30-minute buffer logic when not enabled
  - _Requirements: 12.1, 12.2, 12.4_

- [ ]* 12.2 Write property test for environment variable slot override
  - **Property 31: Environment variable enables all slots**
  - **Validates: Requirements 12.1**

- [ ]* 12.3 Write property test for slot structure with environment override
  - **Property 33: Environment override maintains slot count and times**
  - **Validates: Requirements 12.4**
-

- [x] 12.4 Add search filtering to menu service




  - Implement filterItems method with case-insensitive substring matching
  - Implement filterItemsByCategory to maintain category grouping
  - Return filtered items that contain search query in name
  - _Requirements: 11.2, 11.3_

- [ ]* 12.5 Write property test for search filter matching
  - **Property 26: Search filter matches substring case-insensitively**
  - **Validates: Requirements 11.2**

- [ ]* 12.6 Write property test for filtered category grouping
  - **Property 27: Filtered items maintain category grouping**
  - **Validates: Requirements 11.3**
- [x] 12.7 Create SearchBar component





- [ ] 12.7 Create SearchBar component

  - Create text input field with placeholder
  - Add clear button (visible when text is present)
  - Implement debounced search (300ms delay)
  - Pass search query to parent via callback
  - Style with CSS Module using neo-brutalist design
  - _Requirements: 11.1, 11.4, 11.5_

- [ ]* 12.8 Write property test for clear button visibility
  - **Property 28: Clear button visibility depends on search state**
  - **Validates: Requirements 11.4**

- [ ]* 12.9 Write property test for clear button functionality
  - **Property 29: Clear button resets search and displays all items**
  - **Validates: Requirements 11.5**
- [x] 12.10 Integrate SearchBar with MenuList





- [ ] 12.10 Integrate SearchBar with MenuList

  - Add search state management to MenuList
  - Connect SearchBar onSearchChange callback
  - Filter menu items based on search query
  - Display filtered results maintaining category grouping
  - Show all items when search is empty
  - _Requirements: 11.2, 11.3, 11.6_

- [ ]* 12.11 Write property test for empty search
  - **Property 30: Empty search displays all items**
  - **Validates: Requirements 11.6**

- [x] 13. Create CartSidebar component





  - Compose CartItemList, LocationSelector, SlotSelector
  - Display total amount from CartContext
  - Add checkout button (enabled only when cart has items)
  - Make it fixed position on desktop, bottom sheet on mobile
  - Style with CSS Module using neo-brutalist design
  - _Requirements: 5.2, 5.4, 5.5, 6.4_
- [x] 14. Create main menu page




- [ ] 14. Create main menu page

  - Set up Next.js page component at appropriate route
  - Wrap with CartContext Provider
  - Render MenuList and CartSidebar components
  - Apply global styles from globals.css
  - _Requirements: 1.3, 6.1, 6.5_

- [x] 15. Implement cart persistence on load





  - Add useEffect in CartContext to load cart from IndexedDB on mount
  - Show loading state while retrieving cart
  - Handle corrupted data gracefully (initialize empty cart)
  - Display warning if IndexedDB unavailable
  - _Requirements: 3.2, 3.4, 3.5_
- [x] 16. Add debouncing for IndexedDB writes




- [ ] 16. Add debouncing for IndexedDB writes

  - Implement debounce utility (100ms delay)
  - Apply to cart save operations to reduce I/O
  - Ensure final state is always saved
  - _Requirements: 2.5, 8.4_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 18. Add accessibility features
  - Add ARIA labels to cart control buttons
  - Implement keyboard navigation for cart
  - Add aria-live for cart updates
  - Mark disabled slots with aria-disabled
  - _Requirements: 6.3_

- [ ]* 19. Optimize performance
  - Add React.memo to MenuItem components
  - Memoize total amount calculation
  - Implement write queue for IndexedDB
  - Test and verify performance targets
  - _Requirements: 2.4, 2.5_

- [x] 20. Implement responsive design for mobile-first layout



  - Update all component CSS modules to use mobile-first approach
  - Ensure menu items display in single column on mobile (< 768px)
  - Implement responsive grid for tablet and desktop
  - Verify touch targets meet 44x44px minimum on mobile
  - Test layouts across all breakpoints (mobile, tablet, desktop)
  - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 20.1 Make CartSidebar responsive


  - Implement bottom sheet/drawer behavior for mobile
  - Keep fixed sidebar for desktop (> 1024px)
  - Add slide-up animation and backdrop for mobile
  - Ensure cart is accessible on all screen sizes
  - _Requirements: 9.2_

- [x] 20.2 Optimize touch interactions for mobile


  - Ensure all buttons have minimum 44x44px touch targets
  - Add adequate spacing between interactive elements
  - Test touch interactions on actual mobile devices
  - Remove hover-dependent functionality on touch devices
  - _Requirements: 9.3_

- [x] 20.3 Verify no horizontal scrolling


  - Test all viewport widths to ensure content fits
  - Fix any overflow issues
  - Ensure images and components are responsive
  - _Requirements: 9.7_

- [ ]* 20.4 Write visual regression tests for responsive layouts
  - Test mobile layout (< 768px)
  - Test tablet layout (768px - 1024px)
  - Test desktop layout (> 1024px)
  - _Requirements: 9.1, 9.4_

- [x] 21. Refactor cart to drawer pattern





  - Convert CartSidebar to CartDrawer with open/close state
  - Create floating CartButton component with item count badge
  - Implement backdrop overlay component
  - Add smooth slide-in/slide-out animations
  - Handle drawer open/close via CartContext state
  - Ensure drawer works consistently on mobile and desktop
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 21.1 Implement CartButton component


  - Create floating button with fixed positioning
  - Display cart item count badge
  - Connect to CartContext to trigger drawer open
  - Style with neo-brutalist design
  - _Requirements: 10.1, 10.7_

- [x] 21.2 Add drawer state management to CartContext


  - Add isCartOpen boolean state
  - Create openCart and closeCart methods
  - Expose drawer state to components
  - _Requirements: 10.2, 10.4_

- [x] 21.3 Implement backdrop and close interactions


  - Create backdrop overlay component
  - Handle backdrop click to close drawer
  - Add close button to drawer header
  - Prevent body scroll when drawer is open
  - _Requirements: 10.3, 10.4_

- [ ]* 21.4 Write property tests for drawer behavior
  - **Property 24: Cart drawer opens on button click**
  - **Property 25: Backdrop click closes drawer**
  - **Validates: Requirements 10.2, 10.4**

- [ ] 22. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
