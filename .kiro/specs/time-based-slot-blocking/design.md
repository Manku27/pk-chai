# Design Document: Time-Based Slot Blocking

## Overview

The time-based slot blocking feature enhances the existing slot generation logic to automatically block delivery slots that have passed during the current active delivery window. This ensures customers can only select future slots and provides a clean slate when the next delivery shift begins at 6:00 AM.

The design builds upon the existing slot generation logic in `src/services/slots.ts` and integrates seamlessly with the current 30-minute buffer system and environment variable controls.

## Architecture

The solution modifies the existing `getAvailableSlots` function to include time-based blocking logic alongside the current 30-minute buffer logic. The architecture maintains backward compatibility while adding the new blocking behavior.

### Key Components

1. **Enhanced Slot Availability Logic**: Combines existing 30-minute buffer with new time-based blocking
2. **Delivery Window State Detection**: Determines if we're currently within an active delivery window
3. **Shift Reset Logic**: Handles the transition at 6:00 AM when all slots become available again
4. **Backward Compatibility Layer**: Preserves existing behavior for environment variables and testing

## Components and Interfaces

### Modified Component: getAvailableSlots Function

**File**: `src/services/slots.ts`

The function signature remains unchanged to maintain backward compatibility:
```typescript
export function getAvailableSlots(
  currentTime: Date = new Date(),
  enableAllSlots?: boolean
): TimeSlot[]
```

### Enhanced Availability Logic

The slot availability determination will now consider three factors:

1. **Environment Override**: `enableAllSlots` parameter or `NEXT_PUBLIC_ENABLE_ALL_SLOTS` environment variable
2. **30-Minute Buffer**: Existing logic that blocks slots within 30 minutes of current time
3. **Time-Based Blocking**: New logic that blocks slots that have passed during the current delivery window

### Delivery Window State Detection

The system needs to distinguish between different time contexts:

```typescript
enum DeliveryWindowState {
  BEFORE_WINDOW,    // 6:00 AM - 10:59 PM: Preparing for upcoming night
  ACTIVE_WINDOW,    // 11:00 PM - 5:00 AM: Currently in delivery window
  AFTER_WINDOW      // 5:01 AM - 5:59 AM: Just ended, waiting for reset
}
```

### Time-Based Blocking Algorithm

**During Active Delivery Window (11:00 PM - 5:00 AM):**
- Block all slots whose time has already passed
- Apply 30-minute buffer to remaining future slots
- Continuously update as time progresses

**Outside Active Delivery Window:**
- No time-based blocking applied
- Only 30-minute buffer logic applies
- All slots available for upcoming delivery window

## Data Models

No changes to existing data models. The `TimeSlot` interface remains unchanged:

```typescript
interface TimeSlot {
  time: string;      // ISO timestamp
  display: string;   // Display format (e.g., "11:00 PM")
  isAvailable: boolean; // Enhanced availability logic
}
```

## Detailed Logic Flow

### 1. Determine Delivery Window State

```typescript
function getDeliveryWindowState(currentTime: Date): DeliveryWindowState {
  const hour = currentTime.getHours();
  
  if (hour >= 6 && hour < 23) {
    return DeliveryWindowState.BEFORE_WINDOW;
  } else if (hour === 23 || hour < 5) {
    return DeliveryWindowState.ACTIVE_WINDOW;
  } else {
    return DeliveryWindowState.AFTER_WINDOW;
  }
}
```

### 2. Enhanced Slot Availability Logic

```typescript
function isSlotAvailable(
  slotTime: Date,
  currentTime: Date,
  windowState: DeliveryWindowState,
  enableAllSlots: boolean
): boolean {
  // Environment override
  if (enableAllSlots) {
    return true;
  }
  
  // 30-minute buffer (existing logic)
  const cutoffTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  const passesBufferCheck = slotTime > cutoffTime;
  
  // Time-based blocking (new logic)
  const passesTimeBasedCheck = windowState !== DeliveryWindowState.ACTIVE_WINDOW || 
                               slotTime > currentTime;
  
  return passesBufferCheck && passesTimeBasedCheck;
}
```

### 3. Scenario Examples

**Scenario A: 1:00 AM (Active Window)**
- Current time: 2024-12-10T01:00:00
- Window state: ACTIVE_WINDOW
- 11:00 PM slot: Blocked (time-based: passed)
- 12:30 AM slot: Blocked (time-based: passed)
- 1:00 AM slot: Blocked (30-minute buffer)
- 1:30 AM slot: Available ✓

**Scenario B: 6:00 AM (Reset Time)**
- Current time: 2024-12-10T06:00:00
- Window state: BEFORE_WINDOW
- All slots: Available (for upcoming night) ✓
- Time-based blocking: Not applied

**Scenario C: 4:45 AM (Near End of Window)**
- Current time: 2024-12-10T04:45:00
- Window state: ACTIVE_WINDOW
- All slots except 5:00 AM: Blocked (time-based: passed)
- 5:00 AM slot: Blocked (30-minute buffer)
- Result: No available slots

## Error Handling

### Graceful Degradation
- If time-based blocking logic fails, fall back to existing 30-minute buffer only
- Maintain existing error handling for date calculations
- Preserve environment variable override behavior

### Edge Cases
- **Daylight Saving Time**: Use existing Date object methods that handle DST automatically
- **Leap Years**: No special handling needed (Date objects handle this)
- **System Clock Changes**: Logic based on current time comparison, naturally adapts

## Testing Strategy

### Unit Tests

1. **Active Window Time-Based Blocking**
   - Test at 1:00 AM: verify slots before 1:00 AM are blocked
   - Test at 3:00 AM: verify slots before 3:00 AM are blocked
   - Test at 4:45 AM: verify almost all slots are blocked

2. **Shift Reset Logic**
   - Test at 6:00 AM: verify all slots are available for upcoming night
   - Test at 8:00 PM: verify no time-based blocking applied

3. **Combined Logic Testing**
   - Test 30-minute buffer + time-based blocking work together
   - Test environment variable override bypasses both checks
   - Test edge cases around window transitions

4. **Backward Compatibility**
   - Verify existing tests still pass with enhanced logic
   - Test that function signature and return type unchanged
   - Verify environment variable behavior preserved

### Integration Tests

1. **End-to-End Slot Selection**
   - Test complete order flow with time-based blocking
   - Verify UI shows correct slot availability
   - Test slot selection at different times during delivery window

2. **Real-Time Updates**
   - Test that slot availability updates as time progresses
   - Verify smooth transition at 6:00 AM reset time

## Implementation Approach

### Phase 1: Core Logic Enhancement
1. Add delivery window state detection function
2. Enhance slot availability logic to include time-based blocking
3. Integrate with existing 30-minute buffer logic
4. Maintain environment variable override behavior

### Phase 2: Testing and Validation
1. Update existing unit tests to work with enhanced logic
2. Add comprehensive tests for time-based blocking scenarios
3. Test edge cases and window transitions
4. Verify backward compatibility

### Phase 3: Integration Testing
1. Test with SlotSelector component
2. Verify order placement flow works correctly
3. Test real-time behavior during active delivery window

## Risk Mitigation

### Minimal Changes Approach
- Enhance existing function rather than replacing it
- Preserve all existing interfaces and behavior
- Add new logic as additional checks, not replacements

### Backward Compatibility
- Function signature unchanged
- Environment variable behavior preserved
- Existing tests continue to work with minimal updates

### Performance Considerations
- Time-based blocking adds minimal computational overhead
- Date comparisons are efficient operations
- No additional API calls or database queries required

## Future Enhancements

### Real-Time Updates
- Consider WebSocket or polling for real-time slot updates in UI
- Add slot availability change notifications

### Configuration Options
- Make shift reset time configurable (currently hardcoded to 6:00 AM)
- Add configuration for different delivery window schedules

### Analytics
- Track slot blocking patterns for operational insights
- Monitor customer behavior around blocked slots