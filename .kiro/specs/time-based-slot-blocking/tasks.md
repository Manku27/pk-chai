# Implementation Plan

- [x] 1. Implement delivery window state detection logic
  - Create `DeliveryWindowState` enum to represent different time contexts (BEFORE_WINDOW, ACTIVE_WINDOW, AFTER_WINDOW)
  - Implement `getDeliveryWindowState` function to determine current state based on time
  - Add logic to distinguish between preparation time (6 AM - 10:59 PM), active delivery (11 PM - 5 AM), and post-delivery periods
  - _Requirements: 1.1, 2.1, 2.2, 4.1_

- [x] 2. Enhance slot availability logic with time-based blocking
  - [x] 2.1 Create enhanced slot availability function
    - Implement `isSlotAvailable` function that combines 30-minute buffer with time-based blocking
    - Add logic to block slots that have passed during active delivery window
    - Preserve existing environment variable override behavior (NEXT_PUBLIC_ENABLE_ALL_SLOTS)
    - _Requirements: 1.1, 1.2, 3.3_

  - [x] 2.2 Integrate time-based blocking into getAvailableSlots
    - Modify the main `getAvailableSlots` function to use enhanced availability logic
    - Ensure backward compatibility by maintaining existing function signature
    - Apply time-based blocking only during active delivery window state
    - _Requirements: 1.3, 1.4, 3.4_

  - [x] 2.3 Implement shift reset logic
    - Add logic to reset all slots to available when current time is outside active delivery window
    - Handle the 6:00 AM transition where all slots become available for upcoming night
    - Ensure no time-based blocking is applied during preparation periods
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Update and enhance unit tests for time-based blocking
  - [x] 3.1 Add tests for active delivery window scenarios
    - Write test for 1:00 AM scenario: verify slots before 1:00 AM are blocked, slots after 1:30 AM available
    - Write test for 4:30 AM scenario: verify only 5:00 AM slot potentially available (subject to buffer)
    - Write test for 4:45 AM scenario: verify all slots are blocked due to time-based blocking and buffer
    - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3_

  - [x] 3.2 Add tests for shift reset and preparation periods
    - Write test for 6:00 AM scenario: verify all slots are available for upcoming delivery window
    - Write test for 8:00 PM scenario: verify no time-based blocking is applied
    - Write test for 10:00 PM scenario: verify only 30-minute buffer applies, no time-based blocking
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.3 Add tests for combined logic scenarios
    - Write test verifying 30-minute buffer and time-based blocking work together correctly
    - Write test verifying environment variable override bypasses both time-based blocking and buffer
    - Write test for edge cases around delivery window transitions (5:00 AM to 6:00 AM)
    - _Requirements: 1.3, 3.3, 4.4_

  - [ ]* 3.4 Update existing unit tests for compatibility
    - Review and update existing slot generation tests to work with enhanced availability logic
    - Ensure all existing test scenarios still pass with time-based blocking integration
    - Update test expectations where time-based blocking affects results
    - _Requirements: 3.4_

- [-] 4. Integration testing and validation
  - [x] 4.1 Test complete order placement flow with time-based blocking
    - Verify SlotSelector component correctly displays blocked slots during active delivery window
    - Test order placement at different times (1:00 AM, 4:30 AM, 6:00 AM) to ensure correct slot availability
    - Validate that blocked slots cannot be selected in the UI
    - _Requirements: 1.1, 1.2, 2.1, 4.1_

  - [ ]* 4.2 Test real-time behavior and edge cases
    - Test slot availability updates as time progresses during active delivery window
    - Verify smooth transition at 6:00 AM when all slots reset to available
    - Test behavior during daylight saving time transitions
    - _Requirements: 1.3, 2.1, 4.4_