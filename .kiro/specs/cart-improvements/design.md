# Design Document

## Overview

This design document outlines the implementation approach for three cart improvements: minimum order value validation, inline validation feedback for location/slot selection, and a cleaner order success popup. The solution maintains the existing neo-brutalist design system while enhancing user experience through better validation feedback and clearer messaging.

## Architecture

### Component Changes

The implementation will modify three existing components:

1. **CartSidebar** - Add minimum order validation logic and inline validation state management
2. **LocationSelector** - Add validation error display capability
3. **SlotSelector** - Add validation error display capability  
4. **OrderSuccessToast** - Simplify display by removing order ID section

### State Management

Validation state will be managed locally within CartSidebar using React state:
- `validationErrors` - Object tracking which fields have errors
- Errors are set when checkout is attempted with missing/invalid data
- Errors are cleared when the user corrects the issue

## Components and Interfaces

### 1. Minimum Order Value Validation

**Location:** CartSidebar component

**Implementation:**
- Define constant `MINIMUM_ORDER_VALUE = 99`
- Calculate if cart meets minimum: `cart.totalAmount >= MINIMUM_ORDER_VALUE`
- Disable checkout button when below minimum
- Display helper text showing remaining amount needed

**UI Elements:**
```typescript
// Below the total section, conditionally render:
{cart.totalAmount < MINIMUM_ORDER_VALUE && (
  <div className={styles.minimumOrderWarning}>
    Add ₹{(MINIMUM_ORDER_VALUE - cart.totalAmount).toFixed(2)} more to place order
  </div>
)}
```

**Styling:**
- Warning box with yellow/gold background (`var(--pk-gold)`)
- Border and text in ink color
- Small icon (⚠️) for visual emphasis
- Positioned between total section and checkout button

### 2. Inline Validation Feedback

**Location:** CartSidebar, LocationSelector, SlotSelector components

**Validation State Interface:**
```typescript
interface ValidationErrors {
  location?: string;
  slot?: string;
}
```

**CartSidebar Changes:**
- Add state: `const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})`
- In `processCheckout()`, replace alert with state update:
```typescript
if (!cart.selectedBlock || !cart.selectedSlot) {
  setValidationErrors({
    location: !cart.selectedBlock ? 'Please select a delivery location' : undefined,
    slot: !cart.selectedSlot ? 'Please select a delivery time' : undefined
  });
  return;
}
```
- Clear errors when user makes selections
- Pass error messages to selector components via props

**LocationSelector Changes:**
- Add optional prop: `error?: string`
- Conditionally render error message below select
- Add error styling class when error exists
- Clear parent error state on change

**SlotSelector Changes:**
- Add optional prop: `error?: string`
- Conditionally render error message below select
- Add error styling class when error exists
- Clear parent error state on change

**Error Display:**
```typescript
{error && (
  <div className={styles.errorMessage}>
    {error}
  </div>
)}
```

**Styling:**
- Error message: red text (`var(--clay-red)`), small font, positioned below select
- Error state select: red border instead of default ink border
- Smooth transition when error appears/disappears
- Maintains neo-brutalist aesthetic with hard borders

### 3. Order Success Popup Cleanup

**Location:** OrderSuccessToast component

**Changes:**
- Remove `orderId` prop from interface (keep for backward compatibility but don't use)
- Remove `.orderId`, `.label`, and `.id` elements from JSX
- Remove corresponding CSS classes
- Keep celebration icon, title, message, and single button
- Adjust spacing after removing order ID section

**Updated Component Structure:**
```typescript
<div className={styles.toast}>
  <div className={styles.icon}>🎉</div>
  <h3 className={styles.title}>Order Placed Successfully!</h3>
  <p className={styles.message}>
    Your order has been confirmed and will be delivered soon.
  </p>
  <button className={styles.closeButton} onClick={onClose}>
    Got it!
  </button>
</div>
```

**Styling Adjustments:**
- Reduce bottom margin on `.message` from 20px to 24px (to compensate for removed order ID section)
- No other styling changes needed

## Data Models

### Constants

```typescript
// In CartSidebar.tsx
const MINIMUM_ORDER_VALUE = 99;
```

### Validation Errors Type

```typescript
interface ValidationErrors {
  location?: string;
  slot?: string;
}
```

### Updated Component Props

```typescript
// LocationSelector
interface LocationSelectorProps {
  error?: string;
  onErrorClear?: () => void;
}

// SlotSelector
interface SlotSelectorProps {
  error?: string;
  onErrorClear?: () => void;
}
```

## Error Handling

### Minimum Order Validation
- No error state needed - purely UI feedback
- Checkout button disabled state prevents action
- Warning message provides clear guidance

### Location/Slot Validation
- Errors set on checkout attempt
- Errors cleared when user makes selection
- Multiple errors can display simultaneously
- Non-blocking - user can continue browsing/editing cart

### Edge Cases
- User removes items after validation error: Re-validate on checkout
- User changes location/slot after error: Clear corresponding error immediately
- Cart total drops below minimum after adding items: Update warning dynamically

## Testing Strategy

### Unit Tests
Not required for this implementation as it involves primarily UI changes and simple validation logic.

### Manual Testing Checklist

**Minimum Order Value:**
- [ ] Warning displays when cart total < ₹99
- [ ] Warning shows correct remaining amount
- [ ] Checkout button disabled when below minimum
- [ ] Warning disappears when total reaches ₹99
- [ ] Checkout button enables when minimum met

**Inline Validation:**
- [ ] Location error displays when checkout attempted without location
- [ ] Slot error displays when checkout attempted without slot
- [ ] Both errors display when both missing
- [ ] Location error clears when location selected
- [ ] Slot error clears when slot selected
- [ ] No browser alerts appear during validation

**Order Success Popup:**
- [ ] Order ID section not displayed
- [ ] Only one button visible
- [ ] Popup closes on button click
- [ ] Popup auto-closes after 5 seconds
- [ ] Celebration icon and message display correctly

### Visual Regression
- Verify neo-brutalist styling maintained
- Check responsive behavior on mobile/tablet/desktop
- Ensure proper spacing and alignment
- Validate color scheme consistency

## Implementation Notes

### CSS Module Updates Required

**CartSidebar.module.css:**
- Add `.minimumOrderWarning` class
- Add `.errorMessage` class (if not using selector-specific styles)

**LocationSelector.module.css:**
- Add `.errorMessage` class
- Add `.selectError` class for error state styling

**SlotSelector.module.css:**
- Add `.errorMessage` class
- Add `.selectError` class for error state styling

**OrderSuccessToast.module.css:**
- Remove or comment out `.orderId`, `.label`, `.id` classes
- Adjust `.message` bottom margin

### Accessibility Considerations

- Error messages associated with form controls via `aria-describedby`
- Error state communicated via `aria-invalid` attribute
- Disabled checkout button includes `aria-disabled` attribute
- Color not sole indicator of error state (text message included)
- Focus management maintained during validation

### Performance Considerations

- Validation runs only on checkout attempt (not on every cart change)
- Error state updates are local to CartSidebar (no context updates)
- No additional API calls or data fetching required
- Minimal re-renders due to targeted state updates
