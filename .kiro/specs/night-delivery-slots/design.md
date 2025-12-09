# Design Document: Night Delivery Slots

## Overview

This design modifies the existing Slot Generator Service to support night delivery operations from 11:00 PM to 5:00 AM. The core challenge is handling the midnight date transition while maintaining the existing 30-minute cutoff logic and test compatibility.

## Architecture

The change is isolated to the `src/services/slots.ts` file, specifically the `getAvailableSlots` function. No changes are required to:
- API endpoints
- UI components (SlotSelector)
- Database schema
- Type definitions (TimeSlot interface)

The function signature and return type remain unchanged, ensuring backward compatibility with all consumers.

## Components and Interfaces

### Modified Component: getAvailableSlots Function

**Current Behavior:**
- Generates slots from 11:00 AM (11:00) to 5:00 PM (17:00)
- Creates 13 slots total (11:00 AM, 11:30 AM, ..., 5:00 PM)
- Uses same-day date objects for start and end times

**New Behavior:**
- Generates slots from 11:00 PM (23:00) to 5:00 AM (05:00)
- Creates 13 slots total (11:00 PM, 11:30 PM, ..., 5:00 AM)
- Handles date transition at midnight

### Key Implementation Changes

#### 1. Start Time Calculation
```typescript
// OLD: startTime.setHours(11, 0, 0, 0)
// NEW: startTime.setHours(23, 0, 0, 0)
```

#### 2. End Time Calculation
The end time must be on the next day since we cross midnight:
```typescript
// OLD: endTime.setHours(17, 0, 0, 0)
// NEW: 
const endTime = new Date(currentTime);
endTime.setHours(5, 0, 0, 0);
// If end time is before start time, add one day
if (endTime <= startTime) {
  endTime.setDate(endTime.getDate() + 1);
}
```

#### 3. Slot Generation Logic
The while loop condition `slotTime <= endTime` will naturally handle the midnight crossing because we're comparing Date objects, which include both date and time components.

## Data Models

No changes to data models. The `TimeSlot` interface remains:
```typescript
interface TimeSlot {
  time: string;      // ISO timestamp
  display: string;   // Formatted display (e.g., "11:00 PM")
  isAvailable: boolean;
}
```

## Edge Cases and Considerations

### 1. Midnight Date Transition
When generating slots from 11:00 PM to 5:00 AM, the date changes at midnight. The implementation must:
- Correctly increment the date for slots after midnight
- Maintain accurate time comparisons with cutoff time
- Preserve chronological ordering of slots

### 2. Cutoff Time Logic
The 30-minute cutoff logic works across midnight because:
- `cutoffTime` is calculated as `currentTime + 30 minutes`
- Comparison `slotTime > cutoffTime` works correctly with Date objects regardless of date boundaries
- No special handling needed for midnight crossing

### 3. Current Time Scenarios

**Scenario A: Current time is 10:00 PM (before service window)**
- All slots (11:00 PM - 5:00 AM) should be available
- No slots are within the 30-minute cutoff

**Scenario B: Current time is 11:15 PM (early in service window)**
- 11:00 PM slot: unavailable (in the past)
- 11:30 PM slot: unavailable (within 30-minute cutoff)
- 12:00 AM and later: available

**Scenario C: Current time is 2:00 AM (middle of service window)**
- Slots before 2:30 AM: unavailable
- Slots from 2:30 AM onward: available

**Scenario D: Current time is 4:45 AM (near end of service window)**
- All slots except 5:00 AM: unavailable
- 5:00 AM slot: unavailable (within 30-minute cutoff)

**Scenario E: Current time is 6:00 AM (after service window)**
- All slots are in the past and unavailable

### 4. Display Format
The `formatTimeDisplay` function already handles 12-hour format with AM/PM correctly. Times will display as:
- 11:00 PM, 11:30 PM
- 12:00 AM, 12:30 AM, 1:00 AM, ..., 4:30 AM, 5:00 AM

## Error Handling

No new error conditions are introduced. The existing implementation is robust:
- Date arithmetic handles month/year boundaries automatically
- No division or parsing operations that could fail
- Type safety maintained through TypeScript

## Testing Strategy

### Updated Test Cases

All existing tests need to be updated to reflect the new time window:

1. **Slot Count Test**: Update to verify 13 slots from 11:00 PM to 5:00 AM
2. **Interval Test**: No changes needed (still 30-minute intervals)
3. **Cutoff Logic Test**: Update test times to use night hours (e.g., 11:15 PM instead of 11:15 AM)
4. **Early Time Test**: Update to use time before 11:00 PM (e.g., 9:00 PM)
5. **Late Time Test**: Update to use time after 5:00 AM (e.g., 6:00 AM)
6. **Boundary Test**: Update to test 30 minutes before first slot (10:30 PM)
7. **ISO Format Test**: No changes needed
8. **Environment Variable Tests**: Update test times but logic remains the same

### New Test Cases

1. **Midnight Crossing Test**: Verify slots correctly span from PM to AM
2. **Date Transition Test**: Verify slot dates increment correctly after midnight
3. **Cutoff Across Midnight Test**: Verify cutoff logic works when current time is 11:45 PM and cutoff extends past midnight

### Test Data Examples

```typescript
// Test at 11:15 PM
const currentTime = new Date('2024-01-01T23:15:00');

// Test at 12:30 AM (next day)
const currentTime = new Date('2024-01-02T00:30:00');

// Test at 4:45 AM
const currentTime = new Date('2024-01-02T04:45:00');
```

## Implementation Notes

### Minimal Changes Approach
The design prioritizes minimal code changes to reduce risk:
- Only modify time constants (11 → 23, 17 → 5)
- Add date increment logic for end time
- No changes to loop structure, cutoff logic, or formatting

### Backward Compatibility
- Function signature unchanged
- Return type unchanged
- Environment variable behavior preserved
- All existing consumers continue to work without modification

### Documentation Updates
Update the JSDoc comments to reflect:
- New time window (11:00 PM to 5:00 AM)
- Midnight crossing behavior
- Updated examples in comments
