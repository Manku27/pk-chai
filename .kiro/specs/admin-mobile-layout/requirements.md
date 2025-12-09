# Requirements Document

## Introduction

This feature improves the mobile user experience of the admin dashboard by reducing visual hierarchy depth and optimizing horizontal space usage. The current mobile view has excessive nesting (Slot → Block → Order → Items) that creates a cramped, difficult-to-scan interface. This redesign will flatten the information architecture and make better use of available screen width.

## Glossary

- **Admin Dashboard**: The administrative interface for viewing orders and analytics
- **Slot Group**: A time-based grouping of orders (e.g., "10 Dec 2025, 12:00 am")
- **Block Card**: A hostel block grouping within a slot (e.g., "JAADAVPUR-MAIN", "KPC-BOYS")
- **Order Detail**: Individual order information including customer name, phone, items, and total
- **Mobile Viewport**: Screen width less than 768px
- **Horizontal Space**: The available width for displaying content on screen

## Requirements

### Requirement 1

**User Story:** As an admin using a mobile device, I want to see slot and block information in a more compact format, so that I can quickly scan orders without excessive scrolling.

#### Acceptance Criteria

1. WHEN viewing the overview tab on mobile, THE Admin Dashboard SHALL display slot headers with time and summary statistics in a single compact card
2. WHEN viewing block cards on mobile, THE Admin Dashboard SHALL display block name, order count, and amount in a horizontal layout that uses full available width
3. THE Admin Dashboard SHALL reduce vertical padding and margins on mobile to minimize wasted space
4. THE Admin Dashboard SHALL use a single-column layout for block cards on mobile viewports

### Requirement 2

**User Story:** As an admin reviewing orders on mobile, I want order details to be displayed more efficiently, so that I can see more information without expanding multiple nested levels.

#### Acceptance Criteria

1. WHEN an admin expands a block card on mobile, THE Admin Dashboard SHALL display order details in a flattened card layout
2. THE Admin Dashboard SHALL display customer name and phone number on separate lines with full width utilization
3. THE Admin Dashboard SHALL display order items in a compact list format with quantity, name, and price aligned horizontally
4. THE Admin Dashboard SHALL eliminate unnecessary nested borders and padding that waste horizontal space

### Requirement 3

**User Story:** As an admin on mobile, I want the slot header to be more scannable, so that I can quickly identify which time slot I'm looking at.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display slot time in a larger, more prominent font on mobile
2. THE Admin Dashboard SHALL display order count and total amount as inline badges rather than stacked elements
3. THE Admin Dashboard SHALL use color coding to distinguish slot headers from block cards
4. THE Admin Dashboard SHALL maintain consistent spacing between slot groups on mobile

### Requirement 4

**User Story:** As an admin using a mobile device, I want block cards to be easier to tap and expand, so that I can access order details with less effort.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL provide a minimum touch target size of 44x44 pixels for expand buttons
2. THE Admin Dashboard SHALL display the expand/collapse indicator clearly on the right side of block headers
3. WHEN a block card is tapped, THE Admin Dashboard SHALL provide visual feedback before expanding
4. THE Admin Dashboard SHALL maintain smooth animations when expanding or collapsing block cards on mobile

### Requirement 5

**User Story:** As an admin reviewing order items on mobile, I want item details to be readable without horizontal scrolling, so that I can quickly verify order contents.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display item quantity as a fixed-width element on the left
2. THE Admin Dashboard SHALL allow item names to wrap to multiple lines if needed
3. THE Admin Dashboard SHALL right-align item prices for easy scanning
4. THE Admin Dashboard SHALL use a flexible layout that adapts to different item name lengths
