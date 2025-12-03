  # Implementation Plan

- [x] 1. Set up authentication types and utilities






  - Create type definitions for User, AuthContextValue, Order, and related interfaces
  - Implement password hashing utilities using Web Crypto API
  - Implement phone number validation function
  - Implement initials extraction function from user names
  - _Requirements: 2.1, 2.2, 4.1, 5.2_

- [ ]* 1.1 Write property test for initials calculation
  - **Property 11: Initials calculation**
  - **Validates: Requirements 5.2**

- [ ]* 1.2 Write unit tests for validation utilities
  - Test phone number validation with valid and invalid inputs
  - Test password strength validation
  - Test required field validation
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 2. Implement authentication storage service





  - Create IndexedDB adapter for user storage with object stores for users, auth-session, and orders
  - Implement user CRUD operations (create, read, update)
  - Implement session management (save, load, clear)
  - Implement memory storage fallback adapter
  - Add storage initialization with IndexedDB availability testing
  - _Requirements: 2.2, 4.1, 4.3, 7.2_

- [ ]* 2.1 Write property test for session persistence
  - **Property 9: Session persistence**
  - **Validates: Requirements 4.3, 4.4**

- [ ]* 2.2 Write unit tests for storage adapters
  - Test IndexedDB adapter save/load/clear operations
  - Test memory adapter save/load/clear operations
  - Test storage initialization and fallback logic
  - _Requirements: 4.3_

- [x] 3. Create AuthContext and provider






  - Implement AuthContext with user state, loading state, and authentication methods
  - Create AuthProvider component following CartContext pattern
  - Implement login function with credential validation and session creation
  - Implement register function with validation and user creation
  - Implement logout function with session clearing
  - Implement updateProfile function with validation
  - Implement requireAuth function to trigger login popup when needed
  - Add useAuth hook for component access
  - Initialize auth state from storage on mount
  - _Requirements: 1.1, 2.2, 4.1, 7.2, 8.2, 8.3_

- [ ]* 3.1 Write property test for valid registration
  - **Property 2: Valid registration creates account**
  - **Validates: Requirements 2.2**

- [ ]* 3.2 Write property test for required fields validation
  - **Property 3: Required fields validation**
  - **Validates: Requirements 2.3, 2.4, 2.5**

- [ ]* 3.3 Write property test for phone uniqueness
  - **Property 4: Phone number uniqueness**
  - **Validates: Requirements 2.6**

- [ ]* 3.4 Write property test for valid login
  - **Property 7: Valid credentials authenticate user**
  - **Validates: Requirements 4.1**

- [ ]* 3.5 Write property test for invalid login rejection
  - **Property 8: Invalid credentials rejected**
  - **Validates: Requirements 4.2**

- [ ]* 3.6 Write property test for logout session clearing
  - **Property 15: Logout clears session**
  - **Validates: Requirements 7.2, 7.4**

- [x] 4. Build LoginPopup component





  - Create modal component with backdrop and focus trap
  - Implement login form with phone and password fields
  - Implement signup form step 1 with name, phone, and password fields
  - Implement signup form step 2 with optional hostel details fields and skip button
  - Add form validation and error display
  - Handle mode switching between login and signup
  - Integrate with AuthContext for authentication operations
  - Add loading states during authentication
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 4.1_

- [ ]* 4.1 Write property test for skip hostel details
  - **Property 5: Skip hostel details completes registration**
  - **Validates: Requirements 3.3**

- [ ]* 4.2 Write property test for hostel details persistence
  - **Property 6: Hostel details persistence**
  - **Validates: Requirements 3.4, 3.5**

- [x] 5. Create ProfileBadge component




  - Implement circular badge with user initials display
  - Add click handler to navigate to profile page
  - Style with colored background and white text
  - Position in top-right corner of layout
  - Integrate with AuthContext to show/hide based on auth state
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 5.1 Write property test for profile indicator visibility
  - **Property 10: Profile indicator visibility**
  - **Validates: Requirements 5.1, 5.3**

- [ ]* 5.2 Write property test for logout UI update
  - **Property 16: Logout updates UI**
  - **Validates: Requirements 7.3**

- [x] 6. Implement order service and storage





  - Create order storage in IndexedDB
  - Implement function to save orders to storage
  - Implement function to retrieve order history by user ID
  - Add order sorting by creation date (newest first)
  - _Requirements: 6.3, 6.4_

- [ ]* 6.1 Write property test for order history sorting
  - **Property 13: Order history chronological ordering**
  - **Validates: Requirements 6.3**

- [ ]* 6.2 Write unit tests for order service
  - Test order creation and storage
  - Test order retrieval by user ID
  - Test order history sorting
  - _Requirements: 6.3, 6.4_

- [x] 7. Build ProfilePage component





  - Create profile page route and component
  - Display user details section (name, phone, hostel details)
  - Implement edit mode for profile information
  - Display order history section with order cards
  - Show order details (date, items, total amount)
  - Add logout button with confirmation
  - Integrate with AuthContext and order service
  - Handle empty order history state
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 8.1_

- [ ]* 7.1 Write property test for profile page user data display
  - **Property 12: Profile page displays user data**
  - **Validates: Requirements 6.2**

- [ ]* 7.2 Write property test for order history completeness
  - **Property 14: Order history completeness**
  - **Validates: Requirements 6.4**

- [ ]* 7.3 Write property test for name update propagation
  - **Property 17: Name update propagation**
  - **Validates: Requirements 8.2**

- [ ]* 7.4 Write property test for hostel details update
  - **Property 18: Hostel details update**
  - **Validates: Requirements 8.3**

- [ ]* 7.5 Write property test for phone update uniqueness
  - **Property 19: Phone update uniqueness constraint**
  - **Validates: Requirements 8.4**

- [x] 8. Integrate authentication with checkout flow





  - Modify CartSidebar checkout button to call requireAuth before proceeding
  - Show LoginPopup when checkout is clicked and user is not authenticated
  - Allow checkout to proceed after successful authentication
  - Update checkout flow to associate orders with authenticated user
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 8.1 Write property test for checkout authentication requirement
  - **Property 1: Checkout requires authentication**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 9. Add AuthProvider to app layout






  - Wrap app with AuthProvider in root layout
  - Add ProfileBadge to app header/navigation
  - Ensure AuthContext is available throughout the app
  - Test authentication flow end-to-end
  - _Requirements: 5.1, 5.3_

- [x] 10. Style and polish authentication UI




  - Create CSS modules for LoginPopup with modal styling
  - Create CSS modules for ProfileBadge with circular design
  - Create CSS modules for ProfilePage with clean layout
  - Ensure responsive design for mobile devices
  - Add loading spinners and transitions
  - Implement accessibility features (ARIA labels, keyboard navigation, focus management)
  - _Requirements: All UI-related requirements_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
