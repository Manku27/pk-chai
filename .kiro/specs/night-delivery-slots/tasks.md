# Implementation Plan

- [x] 1. Update slot generation logic for night delivery hours
  - Modify the `getAvailableSlots` function in `src/services/slots.ts` to generate slots from 11:00 PM to 5:00 AM
  - Change start time from 11:00 AM (hour 11) to 11:00 PM (hour 23)
  - Change end time from 5:00 PM (hour 17) to 5:00 AM (hour 5) on the next day
  - Add logic to increment the date for the end time when it's before the start time (to handle midnight crossing)
  - Update JSDoc comments to reflect the new time window and midnight crossing behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1_

- [x] 2. Update existing unit tests for night delivery hours
  - [x] 2.1 Update slot count and display tests
    - Modify the test that verifies 13 slots are generated to expect times from "11:00 PM" to "5:00 AM"
    - Update first slot display expectation from "11:00 AM" to "11:00 PM"
    - Update last slot display expectation from "5:00 PM" to "5:00 AM"
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 2.2 Update cutoff logic tests
    - Modify the test for slots within 30 minutes to use night hours (e.g., 11:15 PM instead of 11:15 AM)
    - Update expected slot displays to use PM/AM format for night hours
    - Verify unavailable slots are correctly identified with the 30-minute buffer
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.3 Update early/late time boundary tests
    - Change "early morning" test to use time before 11:00 PM (e.g., 9:00 PM) and verify all slots are available
    - Change "late afternoon" test to use time after 5:00 AM (e.g., 6:00 AM) and verify all slots are unavailable
    - Update the 30-minute boundary test to use 10:30 PM (30 minutes before first slot)
    - _Requirements: 2.1, 2.3_
  
  - [x] 2.4 Update environment variable tests
    - Modify test times in environment variable tests to use night hours
    - Update expected display values to reflect PM/AM format
    - Verify enableAllSlots parameter still works correctly with night hours
    - _Requirements: 2.4_

- [ ]* 3. Add new tests for midnight crossing scenarios
  - [ ]* 3.1 Write test for midnight date transition
    - Create test that verifies slots correctly span from PM (before midnight) to AM (after midnight)
    - Verify slot times maintain chronological order across midnight
    - Verify date component increments correctly for slots after midnight
    - _Requirements: 1.4, 3.1, 3.2_
  
  - [ ]* 3.2 Write test for cutoff time across midnight
    - Create test with current time at 11:45 PM to verify cutoff extends past midnight correctly
    - Verify slots before 12:15 AM are marked unavailable
    - Verify slots after 12:15 AM are marked available
    - _Requirements: 2.2, 3.2_
  
  - [ ]* 3.3 Write test for current time scenarios
    - Test scenario with current time at 2:00 AM (middle of service window)
    - Test scenario with current time at 4:45 AM (near end of service window)
    - Verify correct availability for each scenario
    - _Requirements: 2.2, 2.3_
