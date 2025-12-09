# Design Document

## Overview

This design improves the mobile layout of the admin dashboard by flattening the visual hierarchy and optimizing horizontal space usage. The redesign focuses on the "Orders by Slot & Block" section in the Overview tab, which currently suffers from excessive nesting and poor space utilization on mobile devices.

## Architecture

The solution is purely CSS-based, requiring no changes to the React component structure or data fetching logic. We'll use responsive CSS with mobile-first breakpoints to apply optimized layouts for screens under 768px width.

### Key Design Principles

1. **Flatten Visual Hierarchy**: Reduce perceived depth by minimizing nested borders and backgrounds
2. **Maximize Horizontal Space**: Use full-width layouts and reduce excessive padding
3. **Improve Scannability**: Use inline layouts for related information
4. **Maintain Touch Targets**: Ensure all interactive elements meet 44x44px minimum size

## Components and Interfaces

### Slot Header (Mobile)

**Current Issues:**
- Stacked layout wastes vertical space
- Small font sizes reduce scannability
- Separated time label and value

**Design Changes:**
```css
.slotHeader (mobile) {
  - Reduce padding: 1rem → 0.875rem
  - Use inline-flex for summary stats
  - Increase slot time font size: 1.125rem → 1.25rem
  - Display order count and amount as inline badges with icons
}
```

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ SLOT: 10 Dec 2025, 12:00 am        │
│ 5 orders • ₹537                     │
└─────────────────────────────────────┘
```

### Block Card (Mobile)

**Current Issues:**
- Vertical stacking of stats wastes space
- Large padding reduces content area
- Stats labels take up unnecessary space

**Design Changes:**
```css
.blockCard (mobile) {
  - Remove outer padding
  - Use horizontal flexbox for stats
  - Compact stat display: label + value inline
  - Reduce border width: 3px → 2px for nested elements
}

.blockHeader (mobile) {
  - Padding: 1rem → 0.875rem
  - Display stats in single row
  - Position expand button absolutely (top-right)
  - Add clear visual separation from details
}
```

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ JAADAVPUR-MAIN              ▼      │
│ Orders: 1 • Amount: ₹113           │
└─────────────────────────────────────┘
```

### Order Detail Card (Mobile)

**Current Issues:**
- Grid layout creates unnecessary columns
- Customer info stacked inefficiently
- Order ID takes full width unnecessarily

**Design Changes:**
```css
.orderDetail (mobile) {
  - Reduce padding: 0.875rem → 0.75rem
  - Use flex column for all info
  - Full-width customer name and phone
  - Inline order ID with smaller font
}

.orderHeader (mobile) {
  - Remove grid layout
  - Stack all elements vertically
  - Align amount to the right on same line as name
}
```

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ ORDER: D89DC5CD...                  │
│ Mayank Jhunjhunwala        ₹113    │
│ 7477367506                          │
│ ─────────────────────────────────── │
│ 2x  Coffee - Cold          ₹49     │
│ 1x  Coffee - Black         ₹15     │
└─────────────────────────────────────┘
```

### Order Items (Mobile)

**Current Issues:**
- Background color adds visual noise
- Padding reduces available space
- Fixed gap sizes don't scale well

**Design Changes:**
```css
.orderItem (mobile) {
  - Remove background color
  - Reduce padding: 0.5rem → 0.375rem
  - Use minimal gap: 0.5rem → 0.375rem
  - Ensure price right-aligns
}

.itemQuantity {
  - Fixed width: 2rem → 2.5rem
  - Bold weight for emphasis
}

.itemName {
  - Allow text wrapping
  - Reduce font size: 0.875rem → 0.8125rem
}
```

### Block Details Container (Mobile)

**Current Issues:**
- Heavy background color creates visual weight
- Excessive padding
- Strong border separation

**Design Changes:**
```css
.blockDetails (mobile) {
  - Reduce padding: 1rem → 0.75rem
  - Lighter background: var(--pk-foam) → rgba(pk-foam, 0.5)
  - Reduce border width: 3px → 2px
  - Tighter gap between orders: 0.75rem → 0.5rem
}
```

## Data Models

No changes to data models required. All modifications are presentational.

## Error Handling

No new error states introduced. Existing error handling remains unchanged.

## Testing Strategy

### Manual Testing Checklist

1. **Mobile Viewport Testing (< 768px)**
   - Test on actual mobile devices (iOS Safari, Chrome Android)
   - Verify touch targets are at least 44x44px
   - Confirm no horizontal scrolling occurs
   - Check text readability at various zoom levels

2. **Layout Verification**
   - Slot headers display inline stats correctly
   - Block cards use full width efficiently
   - Order details are readable without expansion issues
   - Item lists don't overflow or wrap incorrectly

3. **Interaction Testing**
   - Expand/collapse animations work smoothly
   - Touch feedback is visible and responsive
   - No layout shifts during expansion
   - Scrolling is smooth without jank

4. **Cross-Browser Testing**
   - Safari iOS (primary mobile browser)
   - Chrome Android
   - Firefox Mobile
   - Samsung Internet

5. **Responsive Breakpoint Testing**
   - Verify layout at 320px (small phones)
   - Verify layout at 375px (iPhone SE)
   - Verify layout at 414px (iPhone Pro Max)
   - Verify layout at 768px (tablet boundary)

### Visual Regression Testing

Compare before/after screenshots at key breakpoints:
- 375px width (iPhone SE)
- 414px width (iPhone Pro Max)
- 768px width (tablet)

## Implementation Notes

### CSS Variables to Use

```css
/* Existing variables from globals.css */
--pk-foam: #f5f5f0
--pk-cream: #fef9f3
--pk-gold: #ffd966
--pk-ink: #1a1a1a
--clay-red: #d84315
--border-color: #e0e0e0
--radius-std: 8px
--shadow-hard: 4px 4px 0px var(--pk-ink)
```

### Mobile-First Approach

All changes will be applied to the base styles (mobile-first), with tablet and desktop overrides remaining in their existing media queries. This ensures the mobile experience is optimized by default.

### Performance Considerations

- Use CSS transforms for animations (GPU-accelerated)
- Avoid layout thrashing by batching style changes
- Keep animation durations under 300ms for snappy feel
- Use `will-change` sparingly for expand/collapse animations

## Accessibility Considerations

- Maintain WCAG 2.1 AA contrast ratios (4.5:1 for text)
- Ensure touch targets meet minimum 44x44px size
- Preserve keyboard navigation for expand/collapse
- Keep focus indicators visible and clear
- Maintain semantic HTML structure (no changes needed)
