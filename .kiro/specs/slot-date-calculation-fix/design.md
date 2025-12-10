# Design Document

## Overview

The slot date calculation bug occurs because the current implementation always uses the current date as the base for both start time (11:00 PM) and end time (5:00 AM), then adds a day to the end time if it's before the start time. This logic fails when the current time is already in the early morning hours (after midnight) because it incorrectly assumes all slots should be for the "next" night delivery window.

The fix involves implementing smarter date calculation logic that determines whether we're currently within an active night delivery window or preparing for the next one.

## Architecture

The solution will modify the `getAvailableSlots` function in `src/services/slots.ts` to:

1. **Detect Current Context**: Determine if the current time falls within an active night delivery window (11:00 PM to 5:00 AM)
2. **Calculate Base Date**: Choose the appropriate base date for slot generation based on the current context
3. **Generate Slots**: Create slots with correct dates that align with user expectations

## Components and Interfaces

### Modified Slot Generator Service

**File**: `src/services/slots.ts`

**Key Changes**:
- Enhanced date calculation logic in `getAvailableSlots` function
- New helper function `determineSlotBaseDate` to calculate the correct base date
- Preserve existing function signature and return type for backward compatibility

**Logic Flow**:
```
Current Time Analysis:
├── If current time is between 11:00 PM and 11:59 PM
│   └── Base date = current date (slots span current day + next day)
├── If current time is between 12:00 AM and 5:00 AM  
│   └── Base date = current date (all slots are for current day)
└── If current time is between 5:01 AM and 10:59 PM
    └── Base date = current date (slots are for upcoming night)
```

### Date Calculation Algorithm

**Scenario 1: Order at 2:00 AM on Dec 10th**
- Current time: 2024-12-10T02:00:00
- Context: Within active night delivery window
- Base date: 2024-12-10 (current day)
- 3:00 AM slot: 2024-12-10T03:00:00 ✓

**Scenario 2: Order at 11:30 PM on Dec 10th**
- Current time: 2024-12-10T23:30:00  
- Context: Within active night delivery window
- Base date: 2024-12-10 (current day)
- 11:30 PM slot: 2024-12-10T23:30:00
- 1:00 AM slot: 2024-12-11T01:00:00 ✓

**Scenario 3: Order at 8:00 PM on Dec 10th**
- Current time: 2024-12-10T20:00:00
- Context: Preparing for upcoming night delivery window
- Base date: 2024-12-10 (current day)
- 11:00 PM slot: 2024-12-10T23:00:00
- 1:00 AM slot: 2024-12-11T01:00:00 ✓

## Data Models

No changes to existing data models. The `TimeSlot` interface remains unchanged:

```typescript
interface TimeSlot {
  time: string;      // ISO timestamp - this will now have correct dates
  display: string;   // Display format (unchanged)
  isAvailable: boolean; // Availability status (unchanged)
}
```

## Error Handling

- **Backward Compatibility**: Existing code calling `getAvailableSlots()` will continue to work without changes
- **Edge Cases**: Handle daylight saving time transitions and leap years through native Date object methods
- **Validation**: Maintain existing slot availability validation (30-minute buffer)
- **Fallback**: If date calculation fails, fall back to current behavior to prevent system breakage

## Testing Strategy

### Unit Tests to Add/Modify

1. **Early Morning Context Tests**:
   - Test slot generation at 2:00 AM expecting same-day slots
   - Test slot generation at 4:00 AM expecting same-day slots
   - Verify 3:00 AM slot at 2:00 AM has correct date

2. **Late Night Context Tests**:
   - Test slot generation at 11:30 PM expecting cross-midnight slots
   - Verify slots before midnight use current date
   - Verify slots after midnight use next date

3. **Daytime Context Tests**:
   - Test slot generation at 8:00 PM expecting upcoming night slots
   - Verify all slots use appropriate dates for the upcoming delivery window

4. **Edge C
ase Tests**:
   - Test date transitions at exactly midnight
   - Test behavior during daylight saving time changes
   - Test leap year date calculations

5. **Regression Tests**:
   - Verify existing functionality remains unchanged
   - Test slot availability logic still works correctly
   - Confirm 30-minute buffer logic is preserved

### Integration Tests

- Test complete order flow from slot selection to order creation
- Verify orders placed at 2:00 AM for 3:00 AM slots have correct dates
- Test slot selector component displays correct dates

## Implementation Approach

### Phase 1: Core Logic Fix
1. Implement `determineSlotBaseDate` helper function
2. Modify `getAvailableSlots` to use new date calculation logic
3. Ensure backward compatibility

### Phase 2: Testing
1. Add comprehensive unit tests for new date logic
2. Update existing tests that may be affected
3. Run integration tests to verify end-to-end functionality

### Phase 3: Validation
1. Test with real-world scenarios matching the reported bug
2. Verify orders placed at 2:00 AM for 3:00 AM slots work correctly
3. Confirm no regression in existing functionality

## Risk Mitigation

- **Minimal Changes**: Keep modifications focused to the date calculation logic only
- **Preserve Interfaces**: Maintain existing function signatures and return types
- **Comprehensive Testing**: Add extensive test coverage for edge cases
- **Gradual Rollout**: Consider feature flag for new logic if needed for production safety