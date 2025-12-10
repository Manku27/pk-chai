# Implementation Plan

- [x] 1. Implement core date calculation logic
  - Create helper function `determineSlotBaseDate` to calculate correct base date based on current time context
  - Modify `getAvailableSlots` function to use new date calculation logic
  - Ensure backward compatibility by maintaining existing function signature
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1_

- [x] 2. Add comprehensive unit tests for date calculation scenarios
  - [x] 2.1 Write tests for early morning context (12:00 AM - 5:00 AM)
    - Test slot generation at 2:00 AM expecting same-day slots
    - Test slot generation at 4:00 AM expecting same-day slots  
    - Verify 3:00 AM slot selected at 2:00 AM has correct date (Dec 10th scenario)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Write tests for late night context (11:00 PM - 11:59 PM)
    - Test slot generation at 11:30 PM expecting cross-midnight slots
    - Verify slots before midnight use current date
    - Verify slots after midnight use next date
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.3 Write tests for daytime context (5:01 AM - 10:59 PM)
    - Test slot generation at 8:00 PM expecting upcoming night slots
    - Verify all slots use appropriate dates for upcoming delivery window
    - _Requirements: 3.1, 3.2_

  - [ ]* 2.4 Write edge case tests
    - Test date transitions at exactly midnight
    - Test behavior during daylight saving time changes
    - Test leap year date calculations
    - _Requirements: 3.1, 3.4_

- [x] 3. Update existing tests and verify no regressions
  - Review and update existing slot generator tests that may be affected by date changes
  - Ensure all existing functionality tests still pass
  - Verify slot availability logic (30-minute buffer) remains unchanged
  - _Requirements: 3.3, 3.4_

- [-] 4. Integration testing and validation
  - [x] 4.1 Test complete order placement flow
    - Verify orders placed at 2:00 AM for 3:00 AM slots create correct database entries
    - Test slot selector component displays correct dates in UI
    - Validate order service correctly processes new slot timestamps
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 4.2 End-to-end scenario testing
    - Test real-world scenarios matching the reported bug
    - Verify no regression in existing order placement functionality
    - Test cross-browser compatibility for date handling
    - _Requirements: 3.1, 3.4_