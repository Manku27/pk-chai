# Requirements Document

## Introduction

The Menu and Cart feature enables students to browse available food items, add them to a persistent cart, and prepare for order placement. This feature is the core user-facing interface for the PKChai ordering system, prioritizing speed and simplicity for students ordering snacks and chai for hostel delivery.

## Glossary

- **Menu System**: The component that displays all available food and beverage items organized by category
- **Cart System**: The client-side shopping cart that stores selected items with quantities
- **Menu Item**: A specific food or beverage product with a deterministic ID, name, category, and price
- **Category**: A grouping of related menu items (e.g., "Chai", "Maggi", "Sandwich")
- **IndexedDB**: Browser-based persistent storage used for cart data
- **Hostel Block**: One of four delivery locations (Jaadavpur Main Hostel, New block hostel, KPC boys hostel, KPC girls hostel)
- **Delivery Slot**: A 30-minute time window between 11:00 PM and 5:00 AM for order delivery
- **Search Filter**: A text-based filtering mechanism that narrows displayed menu items based on name matching
- **Environment Variable**: A configuration value set outside the application code that controls system behavior

## Requirements

### Requirement 1

**User Story:** As a student, I want to view all available menu items organized by category, so that I can quickly browse and find what I want to order.

#### Acceptance Criteria

1. WHEN the Menu System loads THEN the system SHALL display all menu items grouped by their category
2. WHEN displaying menu items THEN the system SHALL show the item name and price for each item
3. WHEN the Menu System is accessed THEN the system SHALL not require user authentication
4. WHEN menu items are displayed THEN the system SHALL use deterministic IDs for each item variant
5. WHEN a category contains multiple items THEN the system SHALL display them in a consistent order within that category

### Requirement 2

**User Story:** As a student, I want to add items to my cart with quantity controls, so that I can build my order incrementally.

#### Acceptance Criteria

1. WHEN a user clicks an add button for a menu item THEN the Cart System SHALL increment the quantity for that item by one
2. WHEN a user clicks a decrement button for a cart item THEN the Cart System SHALL decrease the quantity by one
3. WHEN a cart item quantity reaches zero THEN the Cart System SHALL remove that item from the cart
4. WHEN a user adds or removes items THEN the Cart System SHALL update the total amount in real-time
5. WHEN cart modifications occur THEN the Cart System SHALL persist changes to IndexedDB immediately

### Requirement 3

**User Story:** As a student, I want my cart to persist across browser sessions, so that I don't lose my selections if I close the app.

#### Acceptance Criteria

1. WHEN a user adds items to the cart THEN the system SHALL store the cart data in IndexedDB
2. WHEN the application loads THEN the system SHALL retrieve cart data from IndexedDB and restore the cart state
3. WHEN cart data is stored THEN the system SHALL include item IDs, quantities, and prices at the time of addition
4. WHEN IndexedDB is unavailable THEN the system SHALL maintain cart state in memory for the current session
5. WHEN cart data is corrupted or invalid THEN the system SHALL initialize an empty cart

### Requirement 4

**User Story:** As a student, I want to select my delivery location and time slot, so that my order arrives at the right place and time.

#### Acceptance Criteria

1. WHEN a user views the cart THEN the system SHALL display a dropdown for selecting the delivery hostel block
2. WHEN a user is authenticated THEN the system SHALL pre-select their default hostel block in the dropdown
3. WHEN a user is not authenticated THEN the system SHALL require hostel block selection before checkout
4. WHEN a user views available slots THEN the system SHALL display time slots from 11:00 PM to 5:00 AM in 30-minute intervals
5. WHEN the current time is within 30 minutes of a slot THEN the system SHALL disable that slot for selection
6. WHEN a user selects a slot THEN the system SHALL validate that the order time is at least 30 minutes before the slot time

### Requirement 5

**User Story:** As a student, I want to see a clear summary of my cart contents and total price, so that I can review my order before proceeding to checkout.

#### Acceptance Criteria

1. WHEN the cart contains items THEN the system SHALL display each item name, quantity, and subtotal
2. WHEN the cart is updated THEN the system SHALL recalculate and display the total order amount
3. WHEN the cart is empty THEN the system SHALL display a message indicating no items are in the cart
4. WHEN the cart contains items THEN the system SHALL display a checkout button
5. WHEN the cart is empty THEN the system SHALL disable or hide the checkout button

### Requirement 6

**User Story:** As a student, I want the menu to be visually organized and easy to navigate, so that I can quickly find and order items.

#### Acceptance Criteria

1. WHEN the Menu System renders THEN the system SHALL apply consistent styling using the defined CSS variables
2. WHEN displaying categories THEN the system SHALL visually separate each category group
3. WHEN a user interacts with cart controls THEN the system SHALL provide immediate visual feedback
4. WHEN the cart is visible THEN the system SHALL display it in a fixed or easily accessible position
5. WHEN the interface updates THEN the system SHALL maintain the neo-brutalist design aesthetic with hard shadows and defined borders

### Requirement 7

**User Story:** As a developer, I want the menu data to be maintainable and type-safe, so that adding or modifying items is straightforward.

#### Acceptance Criteria

1. WHEN menu items are defined THEN the system SHALL use a structured data format with typed interfaces
2. WHEN a menu item is created THEN the system SHALL include id, name, category, and price fields
3. WHEN menu data is accessed THEN the system SHALL provide type safety through TypeScript interfaces
4. WHEN the menu structure changes THEN the system SHALL maintain backward compatibility with existing cart data
5. WHEN menu items are rendered THEN the system SHALL use the deterministic ID as the React key

### Requirement 8

**User Story:** As a student, I want to modify my cart at any time before checkout, so that I can adjust my order as needed.

#### Acceptance Criteria

1. WHEN viewing the cart THEN the system SHALL allow incrementing quantities for existing items
2. WHEN viewing the cart THEN the system SHALL allow decrementing quantities for existing items
3. WHEN viewing the cart THEN the system SHALL allow removing items by reducing quantity to zero
4. WHEN cart modifications occur THEN the system SHALL update IndexedDB with the new cart state
5. WHEN multiple rapid changes occur THEN the system SHALL handle updates without data loss or race conditions

### Requirement 9

**User Story:** As a student using a mobile device, I want the interface to be fully responsive and optimized for mobile, so that I can easily browse and order on my phone.

#### Acceptance Criteria

1. WHEN the Menu System is accessed on a mobile device (viewport width less than 768px) THEN the system SHALL display menu items in a single column layout
2. WHEN the Cart System is accessed on a mobile device THEN the system SHALL display as a bottom sheet or drawer instead of a fixed sidebar
3. WHEN touch interactions occur on mobile THEN the system SHALL provide appropriate touch targets with minimum 44x44px tap areas
4. WHEN the interface is viewed on screens between 768px and 1024px THEN the system SHALL adapt the layout for tablet devices
5. WHEN text is displayed on mobile devices THEN the system SHALL scale font sizes appropriately for readability without zooming
6. WHEN the page loads on any device THEN the system SHALL use mobile-first CSS with progressive enhancement for larger screens
7. WHEN horizontal space is limited THEN the system SHALL ensure all interactive elements remain accessible without horizontal scrolling

### Requirement 10

**User Story:** As a student, I want the cart to be accessible without blocking the menu content, so that I can browse items and manage my cart without navigation conflicts.

#### Acceptance Criteria

1. WHEN the cart is closed THEN the system SHALL display a floating cart button showing the item count
2. WHEN a user clicks the cart button THEN the system SHALL open the cart as an overlay drawer from the right side
3. WHEN the cart drawer is open THEN the system SHALL display a backdrop overlay that dims the menu content
4. WHEN a user clicks the backdrop or close button THEN the system SHALL close the cart drawer
5. WHEN the cart drawer opens or closes THEN the system SHALL animate the transition smoothly
6. WHEN the cart is open on desktop THEN the system SHALL display it as a slide-in drawer (not a fixed sidebar)
7. WHEN items are added to the cart while it is closed THEN the system SHALL update the cart button badge count in real-time

### Requirement 11

**User Story:** As a student, I want to search for menu items by name, so that I can quickly find specific items without scrolling through all categories.

#### Acceptance Criteria

1. WHEN the Menu System loads THEN the system SHALL display a search input field above the menu items
2. WHEN a user types in the search field THEN the system SHALL filter menu items to show only those whose names contain the search text (case-insensitive)
3. WHEN search results are displayed THEN the system SHALL maintain category grouping for filtered items
4. WHEN the search field contains text THEN the system SHALL display a clear button
5. WHEN a user clicks the clear button THEN the system SHALL empty the search field and display all menu items
6. WHEN the search field is empty THEN the system SHALL display all menu items without filtering

### Requirement 12

**User Story:** As a developer, I want to bypass slot availability restrictions during testing, so that I can test order flows without time constraints.

#### Acceptance Criteria

1. WHEN the environment variable NEXT_PUBLIC_ENABLE_ALL_SLOTS is set to "true" THEN the system SHALL mark all time slots as available regardless of current time
2. WHEN the environment variable NEXT_PUBLIC_ENABLE_ALL_SLOTS is not set or set to any other value THEN the system SHALL apply normal slot availability rules (30-minute buffer)
3. WHEN all slots are enabled via environment variable THEN the system SHALL not display any visual indicator to end users
4. WHEN generating slots with the environment variable enabled THEN the system SHALL still generate the same 13 slots from 11:00 PM to 5:00 AM
