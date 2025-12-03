# Design Document

## Overview

The Menu and Cart feature is a client-side React application built with Next.js 16 App Router that provides students with a fast, intuitive interface for browsing menu items and building orders. The system uses IndexedDB for cart persistence, React Context for state management, and CSS Modules for styling. The design prioritizes performance, simplicity, and offline-first capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
│                      (Client Side)                       │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Menu Display │    │ Cart Manager │    │ Slot Selector│
│  Component   │    │  Component   │    │  Component   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌──────────────────┐
                  │  Cart Context    │
                  │  (React Context) │
                  └──────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │  IndexedDB   │        │  Menu Data   │
        │   Storage    │        │  (Static)    │
        └──────────────┘        └──────────────┘
```

### Component Hierarchy

```
MenuPage (Server Component)
├── SearchBar (Client Component)
├── MenuList (Client Component)
│   ├── CategorySection (Client Component)
│   │   └── MenuItem (Client Component)
│   │       └── AddToCartButton (Client Component)
│   └── ...
└── CartSidebar (Client Component)
    ├── CartItemList (Client Component)
    │   └── CartItem (Client Component)
    │       ├── QuantityControls (Client Component)
    │       └── ItemSubtotal (Client Component)
    ├── LocationSelector (Client Component)
    ├── SlotSelector (Client Component)
    └── CheckoutButton (Client Component)
```

## Components and Interfaces

### Data Models

#### MenuItem Interface
```typescript
interface MenuItem {
  id: string;           // Deterministic ID (e.g., "chai-small", "maggi-veg-butter")
  name: string;         // Display name (e.g., "Chai - Small")
  category: string;     // Category name (e.g., "Chai", "Maggi")
  price: number;        // Price in rupees
  categoryOrder: number; // Order within category
}
```

#### CartItem Interface
```typescript
interface CartItem {
  itemId: string;       // References MenuItem.id
  name: string;         // Cached from MenuItem
  price: number;        // Price at time of addition
  quantity: number;     // Current quantity
}
```

#### Cart State Interface
```typescript
interface CartState {
  items: Map<string, CartItem>;  // Key: itemId
  selectedBlock: HostelBlock | null;
  selectedSlot: string | null;   // ISO timestamp
  totalAmount: number;
}
```

#### Hostel Block Enum
```typescript
type HostelBlock = 
  | "jaadavpur-main"
  | "new-block"
  | "kpc-boys"
  | "kpc-girls";

const HOSTEL_BLOCKS: Record<HostelBlock, string> = {
  "jaadavpur-main": "Jaadavpur Main Hostel",
  "new-block": "New block hostel",
  "kpc-boys": "KPC boys hostel",
  "kpc-girls": "KPC girls hostel"
};
```

### Core Components

#### 1. CartContext Provider
**Purpose:** Global state management for cart operations

**Interface:**
```typescript
interface CartContextValue {
  cart: CartState;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setLocation: (block: HostelBlock) => void;
  setSlot: (slot: string) => void;
  clearCart: () => void;
  isLoading: boolean;
}
```

**Responsibilities:**
- Manage cart state in React Context
- Sync cart changes to IndexedDB
- Load cart from IndexedDB on mount
- Calculate total amount
- Provide cart operations to child components

#### 2. IndexedDB Service
**Purpose:** Persistent storage layer for cart data

**Interface:**
```typescript
interface IDBService {
  saveCart(cart: CartState): Promise<void>;
  loadCart(): Promise<CartState | null>;
  clearCart(): Promise<void>;
}
```

**Implementation Details:**
- Database name: `pkchai-db`
- Object store: `cart`
- Single record with key: `current-cart`
- Fallback to in-memory if IndexedDB unavailable

#### 3. Menu Data Service
**Purpose:** Provide structured menu data with filtering capabilities

**Interface:**
```typescript
interface MenuService {
  getAllItems(): MenuItem[];
  getItemsByCategory(): Map<string, MenuItem[]>;
  getItemById(id: string): MenuItem | undefined;
  filterItems(searchQuery: string): MenuItem[];
  filterItemsByCategory(searchQuery: string): Map<string, MenuItem[]>;
}
```

**Data Structure:**
- Static TypeScript file exporting menu array
- Items organized by category with deterministic IDs
- Example ID format: `{category}-{variant}` (e.g., "chai-small", "sandwich-grill-cheese-corn")

**Filtering Logic:**
- Case-insensitive substring matching on item names
- Returns items whose names contain the search query
- Maintains category grouping in filtered results

#### 4. Slot Generator Service
**Purpose:** Generate available delivery slots with environment-based overrides

**Interface:**
```typescript
interface SlotService {
  getAvailableSlots(currentTime: Date, enableAllSlots?: boolean): TimeSlot[];
}

interface TimeSlot {
  time: string;        // ISO timestamp
  display: string;     // "11:00 AM", "11:30 AM"
  isAvailable: boolean;
}
```

**Logic:**
- Generate slots from 11:00 AM to 5:00 PM (30-minute intervals)
- Disable slots where `currentTime > slotTime - 30 minutes`
- Return array of 13 slots total
- **Environment Override:** If `NEXT_PUBLIC_ENABLE_ALL_SLOTS === "true"`, mark all slots as available regardless of current time

**Environment Configuration:**
```typescript
const enableAllSlots = process.env.NEXT_PUBLIC_ENABLE_ALL_SLOTS === "true";
```

### Component Specifications

#### SearchBar Component
- Text input field for search query
- Clear button (visible when search text is present)
- Manages local search state
- Passes search query to parent (MenuList) via callback
- Debounced input to optimize performance
- Client component for interactivity

**Interface:**
```typescript
interface SearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
}
```

#### MenuList Component
- Fetches menu data from MenuService
- Manages search state from SearchBar
- Filters items based on search query
- Groups items by category (maintains grouping even when filtered)
- Renders CategorySection for each category
- Client component for interactivity

#### MenuItem Component
- Displays item name and price
- Shows AddToCartButton
- Uses CSS Module for styling
- Applies neo-brutalist design (hard shadows, borders)

#### CartButton Component
- Floating button fixed to bottom-right or top-right
- Shows cart item count badge
- Triggers cart drawer open on click
- Visible at all times when cart is closed

#### CartDrawer Component
- Slide-in overlay drawer from right side
- Backdrop overlay that dims background content
- Close button and backdrop click to dismiss
- Smooth open/close animations
- Contains CartItemList, LocationSelector, SlotSelector, CheckoutButton
- Same behavior on mobile and desktop (drawer pattern)

#### CartItem Component
- Displays item name, quantity, subtotal
- Includes QuantityControls (+ / -)
- Real-time updates on quantity change

#### LocationSelector Component
- Dropdown with 4 hostel blocks
- Pre-selects default block if user authenticated
- Updates cart context on change

#### SlotSelector Component
- Dropdown with time slots
- Disables unavailable slots
- Shows validation message if slot invalid

## Data Models

### Menu Data Structure

The menu will be defined as a static TypeScript array:

```typescript
export const MENU_ITEMS: MenuItem[] = [
  // Chai Category
  { id: "chai-small", name: "Chai - Small", category: "Chai", price: 10, categoryOrder: 1 },
  { id: "chai-semi-medium", name: "Chai - Semi Medium", category: "Chai", price: 14, categoryOrder: 2 },
  { id: "chai-medium", name: "Chai - Medium", category: "Chai", price: 18, categoryOrder: 3 },
  { id: "chai-large", name: "Chai - Large", category: "Chai", price: 24, categoryOrder: 4 },
  
  // Handi Chai Category
  { id: "handi-chai-small", name: "Handi Chai - Small", category: "Handi Chai", price: 20, categoryOrder: 1 },
  { id: "handi-chai-large", name: "Handi Chai - Large", category: "Handi Chai", price: 30, categoryOrder: 2 },
  
  // ... (additional items)
];
```

### IndexedDB Schema

**Database:** `pkchai-db` (version 1)

**Object Store:** `cart`
- Key path: `id`
- Single record with `id: "current-cart"`

**Stored Data:**
```typescript
{
  id: "current-cart",
  items: Array<CartItem>,
  selectedBlock: string | null,
  selectedSlot: string | null,
  totalAmount: number,
  lastUpdated: number  // timestamp
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Menu items are grouped by category

*For any* menu data, when rendered, all items with the same category value should appear together in the same category group.

**Validates: Requirements 1.1**

### Property 2: Menu items display required information

*For any* menu item, the rendered output should contain both the item's name and price.

**Validates: Requirements 1.2**

### Property 3: Menu item IDs are deterministic

*For any* menu item, the ID should be consistent across multiple renders and uniquely identify that specific item variant.

**Validates: Requirements 1.4**

### Property 4: Category ordering is consistent

*For any* category containing multiple items, the display order of items within that category should remain the same across renders.

**Validates: Requirements 1.5**

### Property 5: Adding items increments quantity

*For any* menu item, adding it to the cart should increase its quantity by exactly 1.

**Validates: Requirements 2.1**

### Property 6: Decrementing reduces quantity

*For any* cart item with quantity greater than zero, decrementing should reduce the quantity by exactly 1.

**Validates: Requirements 2.2**

### Property 7: Zero quantity removes item

*For any* cart item, when its quantity reaches zero, that item should no longer exist in the cart.

**Validates: Requirements 2.3**

### Property 8: Total amount equals sum of subtotals

*For any* cart state, the total amount should equal the sum of (quantity × price) for all items in the cart.

**Validates: Requirements 2.4, 5.2**

### Property 9: Cart changes persist to IndexedDB

*For any* cart modification (add, remove, increment, decrement), the updated cart state should be stored in IndexedDB.

**Validates: Requirements 2.5, 3.1, 8.4**

### Property 10: Cart restoration round-trip

*For any* cart state, saving to IndexedDB and then loading should restore the exact same cart state (items, quantities, prices, location, slot).

**Validates: Requirements 3.2**

### Property 11: Stored cart items have required fields

*For any* cart item stored in IndexedDB, it must contain itemId, name, price, and quantity fields.

**Validates: Requirements 3.3**

### Property 12: Authenticated users have pre-selected location

*For any* authenticated user with a default hostel block, that block should be pre-selected in the location dropdown.

**Validates: Requirements 4.2**

### Property 13: Slot generation produces correct count

*For any* current time, the slot generator should produce exactly 13 time slots from 11:00 AM to 5:00 PM at 30-minute intervals.

**Validates: Requirements 4.4**

### Property 14: Slots within 30 minutes are disabled

*For any* time slot, if the current time is less than 30 minutes before the slot time, that slot should be marked as unavailable.

**Validates: Requirements 4.5, 4.6**

### Property 15: Cart items display complete information

*For any* cart item in the display, the rendered output should contain the item name, quantity, and subtotal (quantity × price).

**Validates: Requirements 5.1**

### Property 16: Checkout button visibility depends on cart state

*For any* cart state, the checkout button should be visible/enabled when the cart contains items, and hidden/disabled when empty.

**Validates: Requirements 5.4, 5.5**

### Property 17: Menu items have required structure

*For any* menu item, it must have id, name, category, and price fields defined.

**Validates: Requirements 7.2**

### Property 18: React keys use deterministic IDs

*For any* rendered menu item, the React key prop should be set to the item's deterministic ID.

**Validates: Requirements 7.5**

### Property 19: Rapid changes maintain consistency

*For any* sequence of rapid cart modifications, the final cart state should correctly reflect all operations without data loss.

**Validates: Requirements 8.5**

### Property 20: Mobile layout uses single column

*For any* viewport width less than 768px, menu items should be displayed in a single column layout.

**Validates: Requirements 9.1**

### Property 21: Touch targets meet minimum size

*For any* interactive element on mobile devices, the touch target area should be at least 44x44 pixels.

**Validates: Requirements 9.3**

### Property 22: No horizontal scrolling on mobile

*For any* viewport width, the page content should fit within the viewport width without requiring horizontal scrolling.

**Validates: Requirements 9.7**

### Property 23: Cart button displays item count

*For any* cart state with items, the cart button badge should display the total number of unique items in the cart.

**Validates: Requirements 10.1, 10.7**

### Property 24: Cart drawer opens on button click

*For any* cart state, clicking the cart button should transition the drawer from closed to open state.

**Validates: Requirements 10.2**

### Property 25: Backdrop click closes drawer

*For any* open cart drawer, clicking the backdrop overlay should close the drawer.

**Validates: Requirements 10.4**

### Property 26: Search filter matches substring case-insensitively

*For any* search query and menu data, all filtered items should have names that contain the search text when compared case-insensitively.

**Validates: Requirements 11.2**

### Property 27: Filtered items maintain category grouping

*For any* search query that returns multiple items, items with the same category should still appear together in the same category group.

**Validates: Requirements 11.3**

### Property 28: Clear button visibility depends on search state

*For any* non-empty search query, the clear button should be visible; for an empty search query, it should be hidden.

**Validates: Requirements 11.4**

### Property 29: Clear button resets search and displays all items

*For any* search state with a non-empty query, clicking the clear button should result in an empty search field and all menu items being displayed.

**Validates: Requirements 11.5**

### Property 30: Empty search displays all items

*For any* menu data, when the search query is empty, all menu items should be displayed without filtering.

**Validates: Requirements 11.6**

### Property 31: Environment variable enables all slots

*For any* current time, when NEXT_PUBLIC_ENABLE_ALL_SLOTS is set to "true", all 13 time slots should be marked as available.

**Validates: Requirements 12.1**

### Property 32: Normal slot rules apply without environment override

*For any* current time, when NEXT_PUBLIC_ENABLE_ALL_SLOTS is not "true", slots within 30 minutes of current time should be marked as unavailable.

**Validates: Requirements 12.2**

### Property 33: Environment override maintains slot count and times

*For any* current time, when NEXT_PUBLIC_ENABLE_ALL_SLOTS is "true", the system should still generate exactly 13 slots from 11:00 AM to 5:00 PM at 30-minute intervals.

**Validates: Requirements 12.4**

## Error Handling

### IndexedDB Failures

**Scenario:** IndexedDB is unavailable or blocked by browser settings

**Handling:**
- Detect IndexedDB availability on app initialization
- If unavailable, set a flag `useMemoryFallback = true`
- Maintain cart state in React Context/memory only
- Display a subtle warning to user: "Cart will not persist across sessions"
- All cart operations function normally, just without persistence

**Implementation:**
```typescript
async function initializeStorage(): Promise<StorageAdapter> {
  try {
    await testIndexedDB();
    return new IndexedDBAdapter();
  } catch (error) {
    console.warn('IndexedDB unavailable, using memory storage');
    return new MemoryStorageAdapter();
  }
}
```

### Corrupted Cart Data

**Scenario:** IndexedDB contains invalid or corrupted cart data

**Handling:**
- Wrap `loadCart()` in try-catch
- Validate loaded data structure (check required fields)
- If validation fails, log error and return empty cart
- Clear corrupted data from IndexedDB
- User starts with fresh cart

**Validation:**
```typescript
function validateCartData(data: unknown): data is CartState {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray(data.items) &&
    'totalAmount' in data &&
    typeof data.totalAmount === 'number'
  );
}
```

### Slot Selection Validation

**Scenario:** User attempts to select an unavailable slot

**Handling:**
- Disable unavailable slots in UI (grayed out, not clickable)
- If somehow selected (race condition), validate on checkout
- Display error message: "This slot is no longer available. Please select a later time."
- Prevent checkout until valid slot selected

### Network Failures (Future: API Integration)

**Scenario:** Menu data fetch fails (when moved to API)

**Handling:**
- Show loading skeleton while fetching
- On error, display retry button
- Cache last successful menu data in IndexedDB
- Fall back to cached data if available
- Display staleness indicator if using cached data

## Testing Strategy

### Unit Testing

**Framework:** Vitest (built-in with Next.js)

**Test Coverage:**

1. **Menu Data Service**
   - Test `getAllItems()` returns all menu items
   - Test `getItemsByCategory()` groups correctly
   - Test `getItemById()` finds items by ID
   - Test `filterItems()` returns correct subset
   - Test `filterItemsByCategory()` maintains grouping

2. **Slot Generator Service**
   - Test slot generation produces 13 slots
   - Test slot times are 30 minutes apart
   - Test slots before current time + 30 mins are disabled
   - Test edge cases (midnight, boundary times)
   - Test environment variable override enables all slots
   - Test slot count remains 13 with environment override

3. **Cart Operations**
   - Test adding item increases quantity
   - Test decrementing reduces quantity
   - Test removing item at zero quantity
   - Test total calculation accuracy

4. **IndexedDB Service**
   - Test save and load operations
   - Test handling of corrupted data
   - Test fallback to memory storage

5. **Search Functionality**
   - Test search filters items correctly
   - Test case-insensitive matching
   - Test clear button resets search
   - Test empty search shows all items

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations.

**Test Tagging:** Each property-based test must include a comment with the format:
```typescript
// Feature: menu-and-cart, Property X: [property description]
```

**Property Tests:**

1. **Property 8: Total Calculation**
   - Generate random cart states with varying items and quantities
   - Verify total always equals sum of subtotals
   - Tag: `// Feature: menu-and-cart, Property 8: Total amount equals sum of subtotals`

2. **Property 10: Cart Persistence Round-Trip**
   - Generate random cart states
   - Save to IndexedDB, load back, verify equality
   - Tag: `// Feature: menu-and-cart, Property 10: Cart restoration round-trip`

3. **Property 14: Slot Availability**
   - Generate random current times
   - Verify slots within 30 minutes are disabled
   - Tag: `// Feature: menu-and-cart, Property 14: Slots within 30 minutes are disabled`

4. **Property 19: Rapid Changes Consistency**
   - Generate random sequences of cart operations
   - Apply all operations, verify final state is correct
   - Tag: `// Feature: menu-and-cart, Property 19: Rapid changes maintain consistency`

5. **Property 26: Search Filter Substring Matching**
   - Generate random search queries and menu data
   - Verify all filtered items contain search text (case-insensitive)
   - Tag: `// Feature: menu-and-cart, Property 26: Search filter matches substring case-insensitively`

6. **Property 27: Filtered Items Category Grouping**
   - Generate random search queries
   - Verify filtered items maintain category grouping
   - Tag: `// Feature: menu-and-cart, Property 27: Filtered items maintain category grouping`

7. **Property 31: Environment Variable Enables All Slots**
   - Generate random current times with env var set to "true"
   - Verify all 13 slots are available
   - Tag: `// Feature: menu-and-cart, Property 31: Environment variable enables all slots`

8. **Property 33: Environment Override Maintains Slot Structure**
   - Generate random current times with env var enabled
   - Verify 13 slots from 11:00 AM to 5:00 PM at 30-min intervals
   - Tag: `// Feature: menu-and-cart, Property 33: Environment override maintains slot count and times`

### Integration Testing

**Scope:** Test component interactions and user flows

1. **Menu to Cart Flow**
   - Render menu, click add button, verify cart updates
   - Test multiple items from different categories

2. **Cart Persistence Flow**
   - Add items, simulate page reload, verify cart restored

3. **Checkout Validation Flow**
   - Test checkout button disabled when cart empty
   - Test location and slot selection required

### Manual Testing Checklist

- [ ] Visual design matches neo-brutalist aesthetic
- [ ] Mobile responsive layout works correctly
- [ ] Cart sidebar is accessible and usable
- [ ] All 13 time slots display correctly
- [ ] Slot disabling works at boundary times
- [ ] IndexedDB fallback message displays when blocked

## Performance Considerations

### Optimization Strategies

1. **Menu Rendering**
   - Use React.memo for MenuItem components
   - Virtualize long category lists if needed (future)
   - Static menu data requires no API calls

2. **Search Functionality**
   - Debounce search input (300ms) to reduce filter operations
   - Memoize filtered results to avoid recalculation
   - Use efficient string matching (toLowerCase + includes)

3. **Cart State Updates**
   - Debounce IndexedDB writes (100ms) to avoid excessive I/O
   - Use Map for cart items for O(1) lookups
   - Batch multiple rapid changes before persisting

4. **IndexedDB Operations**
   - Use transactions for atomic updates
   - Implement write queue to prevent concurrent write conflicts
   - Cache cart in memory, sync to IndexedDB asynchronously

5. **Component Re-renders**
   - Use Context selectors to prevent unnecessary re-renders
   - Memoize expensive calculations (total amount)
   - Split cart context if needed (cart data vs. UI state)

### Performance Targets

- Menu initial render: < 100ms
- Search filter operation: < 50ms
- Cart operation response: < 50ms (UI update)
- IndexedDB write: < 200ms (async, non-blocking)
- Slot generation: < 10ms

## Responsive Design

### Mobile-First Approach

The application follows a mobile-first design strategy, with base styles optimized for mobile devices and progressive enhancement for larger screens.

### Breakpoints

- **Mobile**: < 768px (base styles)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Layout Adaptations

#### Mobile (< 768px)
- Single column menu layout
- Cart displayed as bottom sheet/drawer
- Full-width components
- Reduced padding and spacing
- Stacked form elements
- Touch-optimized button sizes (minimum 44x44px)

#### Tablet (768px - 1024px)
- Two-column menu grid where appropriate
- Cart transitions to side panel
- Increased spacing
- Larger touch targets maintained

#### Desktop (> 1024px)
- Multi-column menu grid (auto-fill, minmax 300px)
- Fixed sidebar cart (400px width)
- Maximum content width (1400px)
- Hover states enabled

### Component-Specific Responsive Behavior

#### CartDrawer
- **All devices**: Slide-in drawer from right side with backdrop overlay
- **Mobile & Desktop**: Consistent drawer behavior (not always visible)
- **Trigger**: Floating cart button with item count badge

#### MenuItem
- **Mobile**: Full width, larger touch targets
- **Desktop**: Grid layout with hover effects

#### CategorySection
- **Mobile**: Single column
- **Desktop**: Multi-column grid

#### SearchBar
- **Mobile**: Full width, sticky positioning at top
- **Desktop**: Constrained width (max 600px), centered

#### Form Controls (LocationSelector, SlotSelector)
- **Mobile**: Full width, larger tap areas
- **Desktop**: Constrained width with hover states

### Typography Scaling

- **Mobile**: Base font sizes (14-16px body, 24-28px headings)
- **Tablet**: Slightly increased (15-17px body, 26-30px headings)
- **Desktop**: Full scale (16-18px body, 28-32px headings)

### Touch Optimization

- Minimum touch target: 44x44px (WCAG AAA standard)
- Adequate spacing between interactive elements (8px minimum)
- No hover-dependent functionality
- Swipe gestures for cart drawer on mobile

## Accessibility

### ARIA Labels

- Add `aria-label` to increment/decrement buttons
- Use `aria-live` for cart total updates
- Mark disabled slots with `aria-disabled`

### Keyboard Navigation

- All cart controls accessible via keyboard
- Tab order follows logical flow
- Enter key submits checkout

### Screen Reader Support

- Announce cart updates ("Item added to cart")
- Describe slot availability status
- Provide text alternatives for icons

## Future Enhancements

1. **Advanced Filtering**
   - Filter by category dropdown
   - Filter by price range
   - Combine search with filters

2. **Favorites**
   - Allow users to mark favorite items
   - Quick-add from favorites list

3. **Order History Integration**
   - "Reorder" button to add previous order to cart
   - Suggest frequently ordered items

4. **Real-time Menu Updates**
   - WebSocket connection for item availability
   - Show "Out of Stock" badges dynamically

5. **Cart Sharing**
   - Generate shareable cart link
   - Group orders for same location/slot

6. **Search Enhancements**
   - Search by category name
   - Fuzzy matching for typos
   - Search history/suggestions
