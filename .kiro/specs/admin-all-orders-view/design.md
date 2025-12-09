# Design Document

## Overview

This design implements a new nested route `/admin/all-orders` that displays all orders in a simple chronological list without slot-based grouping. The implementation will reuse existing API endpoints, components, and styling patterns from the admin dashboard while providing a streamlined view focused on complete order history visibility.

## Architecture

The solution follows Next.js App Router conventions with a client-side page component that fetches data from the existing admin orders API. The architecture maintains separation between:

- **Route Layer**: New page component at `/admin/all-orders`
- **API Layer**: Reuses existing `/api/admin/orders` endpoint
- **Component Layer**: Reuses `OrderStatusManager` component for status updates
- **Data Layer**: Leverages existing `getOrdersWithFilters` database query

## Components and Interfaces

### New Page Component: `/admin/all-orders/page.tsx`

A client-side page component that:
- Fetches all orders without filters from `/api/admin/orders`
- Displays orders in a chronological list (newest first)
- Provides navigation back to the main admin dashboard
- Handles loading, error, and empty states
- Integrates `OrderStatusManager` for status updates

### Navigation Updates

**Admin Dashboard (`/admin/page.tsx`)**:
- Add a button or link to navigate to `/admin/all-orders`
- Position it prominently near the existing tab navigation

**All Orders Page**:
- Include a back button to return to `/admin`
- Maintain consistent header styling with the main dashboard

### Component Reuse

**OrderStatusManager**:
- Reuse existing component for status updates
- Pass order data and status update handler
- Maintain consistent behavior across both views

**AuthGuard**:
- Wrap the all orders page to ensure admin authentication
- Consistent with existing admin dashboard protection

## Data Models

### Order Display Data

The page will use the existing `OrderWithDetails` interface:

```typescript
interface OrderWithDetails {
  id: string;
  userId: string;
  targetHostelBlock: string;
  slotTime: Date;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  user: {
    phone: string;
    name: string;
  };
}
```

### API Response

The existing API returns:
```typescript
{
  orders: OrderWithDetails[]
}
```

No changes needed to the API response structure.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Chronological ordering

*For any* set of orders returned by the API, when displayed in the all orders view, they should be sorted by creation time with the newest order first (descending order by `createdAt`).

**Validates: Requirements 1.1, 1.3**

### Property 2: Complete order data display

*For any* order displayed in the all orders view, all required fields (order ID, customer details, items, total amount, status, timestamps) should be present and rendered in the output.

**Validates: Requirements 1.2, 3.1, 5.4**

### Property 3: Status update consistency

*For any* order status update, if the API call succeeds, then refreshing the order list should show the updated status for that order.

**Validates: Requirements 3.3**

### Property 4: Consistent data formatting

*For any* order displayed, currency values should be formatted with rupee symbol and two decimal places, and timestamps should be formatted in a readable date-time format.

**Validates: Requirements 5.2, 5.3**

## Error Handling

### API Errors

**Network Failures**:
- Display error message: "Failed to load orders. Please check your connection."
- Provide retry button to attempt fetch again
- Log error details to console for debugging

**Authentication Errors (401)**:
- Redirect to admin login or main page
- Clear any stale authentication state

**Server Errors (500)**:
- Display error message: "Server error. Please try again later."
- Provide retry button
- Log error for monitoring

### Status Update Errors

**Update Failures**:
- Display error toast/message with specific error from API
- Maintain previous status in UI
- Allow user to retry the update
- Handled by `OrderStatusManager` component

### Empty States

**No Orders**:
- Display friendly message: "No orders yet"
- Provide link back to main dashboard

## Testing Strategy

### Unit Tests

**Order Sorting**:
- Test that orders are sorted correctly by `createdAt` descending
- Test with various order counts (0, 1, many)
- Test with orders having same timestamps

**Date Formatting**:
- Test that timestamps are formatted correctly
- Test with various date values

**Currency Formatting**:
- Test that amounts are formatted with rupee symbol and two decimals
- Test with various amounts (0, small, large)

### Property-Based Tests

The testing strategy will use **fast-check** for property-based testing in TypeScript/JavaScript.

**Property 1: Chronological ordering**:
- Generate random arrays of orders with random timestamps
- Verify that after sorting, each order's `createdAt` is >= the next order's `createdAt`
- Run 100+ iterations with different order sets

**Property 2: Status update consistency**:
- Generate random order and random valid status
- Mock API success response
- Verify that after update and refresh, the order has the new status
- Run 100+ iterations with different orders and statuses

**Property 3: Complete order data display**:
- Generate random orders with all required fields
- Verify that rendering function includes all required data
- Run 100+ iterations with different order data

### Integration Tests

**Navigation Flow**:
- Test navigation from admin dashboard to all orders page
- Test back navigation from all orders to dashboard
- Verify URL changes correctly

**API Integration**:
- Test successful order fetch
- Test error handling for failed requests
- Test retry functionality

**Status Updates**:
- Test successful status update flow
- Test error handling for failed updates
- Verify UI updates after successful change

## Implementation Notes

### Styling

- Reuse CSS modules pattern from existing admin pages
- Maintain consistent color scheme and typography
- Use card-based layout similar to profile page order history
- Ensure responsive design for mobile/tablet views

### Performance Considerations

- Initial implementation fetches all orders without pagination
- For large order volumes, consider adding pagination in future iteration
- Use React's key prop correctly for efficient list rendering
- Avoid unnecessary re-renders with proper state management

### Accessibility

- Use semantic HTML elements
- Provide ARIA labels for interactive elements
- Ensure keyboard navigation works correctly
- Maintain sufficient color contrast
- Include loading and error announcements for screen readers
