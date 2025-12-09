# Design Document

## Overview

This feature adds a contact and social media section to the customer menu page and makes phone numbers clickable throughout the admin dashboard. The implementation focuses on minimal UI additions that maintain the existing neo-brutalist design system while providing essential contact functionality.

## Architecture

### Component Structure

```
MenuList Component (existing)
└── ContactSection Component (new)
    ├── Phone Link
    └── Instagram Link

AdminDashboard Component (existing)
└── Phone number text → Clickable tel: links (modification)
```

### Design System Integration

The ContactSection will follow the existing neo-brutalist design patterns:
- Hard shadows (var(--shadow-hard))
- Bold borders (3px solid var(--pk-ink))
- Standard border radius (var(--radius-std))
- Color palette: pk-foam (background), pk-ink (text/borders), pk-chai (accent)

## Components and Interfaces

### ContactSection Component

**Location**: `src/components/ContactSection.tsx`

**Props**: None (static content)

**Structure**:
```typescript
export function ContactSection() {
  return (
    <section className={styles.contactSection}>
      <h2>Need Help?</h2>
      <div className={styles.contactLinks}>
        <a href="tel:9674778549" className={styles.phoneLink}>
          📞 Call: 9674778549
        </a>
        <a 
          href="https://www.instagram.com/p_k_chai" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.instagramLink}
        >
          📷 Follow us on Instagram
        </a>
      </div>
    </section>
  );
}
```

**Styling** (`src/components/ContactSection.module.css`):
- Section container with top margin/padding for separation
- Card-like appearance matching existing components
- Links styled as interactive buttons with hover states
- Mobile-first responsive design
- Icons using emoji for simplicity (no external dependencies)

### Admin Dashboard Phone Links

**Location**: `src/app/admin/page.tsx` (modifications)

**Changes**:
- Wrap phone number displays in `<a href="tel:...">` tags
- Maintain existing styling while adding link functionality
- Apply to both:
  - Customer phone in expanded block details (`.customerPhone`)
  - Any other phone number displays in the orders table

**Implementation Pattern**:
```typescript
// Before:
<span className={styles.customerPhone}>{order.userPhone}</span>

// After:
<a href={`tel:${order.userPhone}`} className={styles.customerPhone}>
  {order.userPhone}
</a>
```

**CSS Updates** (`src/app/admin/page.module.css`):
```css
.customerPhone {
  /* existing styles */
  cursor: pointer;
  text-decoration: none;
}

.customerPhone:hover {
  text-decoration: underline;
}
```

## Data Models

No new data models required. Uses existing static data:
- Phone: `9674778549`
- Instagram: `https://www.instagram.com/p_k_chai`

## Integration Points

### Menu Page Integration

The ContactSection will be added to the MenuList component after all category sections:

```typescript
// In MenuList.tsx
return (
  <div className={styles.menuList}>
    <SearchBar onSearchChange={handleSearchChange} />
    {Array.from(itemsByCategory.entries()).map(([category, items]) => (
      <CategorySection key={category} category={category} items={items} />
    ))}
    <ContactSection />
  </div>
);
```

### Admin Dashboard Integration

Phone numbers appear in two locations:
1. **Overview Tab - Block Details**: Customer phone in expanded order details
2. **Orders Tab - Table View**: Could be added as a column if user data is fetched

The modification will wrap existing phone number text with tel: links without changing the layout or visual hierarchy.

## Error Handling

### Contact Section
- Links use standard HTML anchor behavior
- Instagram link opens in new tab with `rel="noopener noreferrer"` for security
- No JavaScript required, so no error states needed

### Admin Phone Links
- Tel links gracefully degrade on devices without phone capability
- No error handling needed as it's a standard browser feature

## Testing Strategy

### Manual Testing
1. **Menu Page Contact Section**:
   - Verify section appears at bottom of menu
   - Click phone link on mobile device → should open dialer
   - Click Instagram link → should open in new tab
   - Test responsive layout on mobile, tablet, desktop

2. **Admin Dashboard Phone Links**:
   - Verify phone numbers are clickable
   - Click phone link → should open dialer
   - Verify styling matches existing design
   - Test on both Overview and Orders tabs

### Accessibility Testing
- Verify links have proper focus states
- Test keyboard navigation (Tab key)
- Verify screen reader announces links correctly
- Ensure sufficient color contrast for links

### Browser Compatibility
- Test tel: links on iOS Safari, Android Chrome
- Verify Instagram link opens correctly in all major browsers
- Test on desktop browsers (Chrome, Firefox, Safari, Edge)

## Visual Design

### ContactSection Layout

```
┌─────────────────────────────────────┐
│  Need Help?                         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 📞 Call: 9674778549           │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 📷 Follow us on Instagram     │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Styling Specifications
- Background: var(--pk-foam) or white card
- Border: 3px solid var(--pk-ink)
- Shadow: var(--shadow-hard)
- Links: Button-like appearance with hover effects
- Spacing: Consistent with existing components (1rem gaps)
- Typography: Matches existing heading and link styles

## Implementation Notes

1. **No External Dependencies**: Uses native HTML tel: links and emoji icons
2. **Progressive Enhancement**: Works without JavaScript
3. **Mobile-First**: Tel links are most useful on mobile devices
4. **Minimal Changes**: Leverages existing design system and patterns
5. **Accessibility**: Semantic HTML with proper ARIA attributes where needed
