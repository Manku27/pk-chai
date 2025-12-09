# Design Document

## Overview

This feature adds order status management capabilities to the admin dashboard, allowing administrators to mark orders as fulfilled (DELIVERED) or rejected (REJECTED) directly from the order details displayed in expandable block cards. The system will automatically update revenue analytics to reflect only delivered orders.

The implementation focuses on:
- Adding action buttons to individual order details in the Overview tab's slot-block groups
- Creating a new API endpoint to handle order status updates
- Refreshing the dashboard data after status changes
- Ensuring revenue calculations only include DELIVERED orders (already implemented)

## Architecture

### Component Structure

```
Admin Dashboard (page.tsx)
├── Overview Tab
│   └── Slot-Block Groups
│       └── Block Cards (expandable)
│           └── Order Details
│               ├── Order Information
│               ├── Order Items List
│               └── Action Buttons (NEW)
│                   ├── Fulfill Button
│                   └── Reject Button
└── Orders Tab (unchanged)
```

### API Layer

```
/api/admin/orders/[orderId]/status (NEW)
├── PATCH: Update order status
│   ├── Request: { status: 'DELIVERED' | 'REJECTED' }
│   ├── Validation: Check current status is ACCEPTED or ACKNOWLEDGED
│   └── Response: Updated order object
```

### Data Flow

1. User clicks "Fulfill" or "Reject" button on an order detail
2. Frontend sends PATCH request to `/api/admin/orders/[orderId]/status`
3. Backend validates the request and current order status
4. Backend updates order status using existing `updateOrderStatus` query
5. Backend returns updated order
6. Frontend refreshes overview data to show updated status and revenue
7. UI updates to reflect new order status and removes action buttons if status is final

## Components and Interfaces

### Frontend Components

#### Admin Dashboard Updates (`src/app/admin/page.tsx`)

**New State:**
```typescript
const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
```

**New Handler Functions:**
```typescript
const handleUpdateOrderStatus = async (
  orderId: string, 
  newStatus: 'DELIVERED' | 'REJECTED'
) => {
  setUpdatingOrderId(orderId);
  setStatusUpdateError(null);
  
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update order status');
    }
    
    // Refresh overview data to reflect changes
    await fetchOverviewData();
  } catch (error) {
    setStatusUpdateError(error.message);
  } finally {
    setUpdatingOrderId(null);
  }
};
```

**UI Changes in Order Details:**
- Add order status badge display for each order
- Add action buttons section below order items
- Show "Fulfill" and "Reject" buttons only for ACCEPTED/ACKNOWLEDGED orders
- Disable buttons and show loading state during updates
- Display error messages if status update fails

### Backend Components

#### New API Route (`src/app/api/admin/orders/[orderId]/status/route.ts`)

**Endpoint:** `PATCH /api/admin/orders/[orderId]/status`

**Request Body:**
```typescript
{
  status: 'DELIVERED' | 'REJECTED'
}
```

**Response:**
```typescript
{
  order: Order,
  message: string
}
```

**Error Responses:**
- 400: Invalid status or order cannot be updated
- 404: Order not found
- 500: Server error

**Implementation Logic:**
1. Extract orderId from URL parameters
2. Parse and validate request body
3. Fetch current order to check existing status
4. Validate that current status is ACCEPTED or ACKNOWLEDGED
5. Call `updateOrderStatus` from queries
6. Return updated order

## Data Models

### Existing Models (No Changes Required)

The database schema already supports all required statuses:
- `orderStatusEnum`: ['ACCEPTED', 'ACKNOWLEDGED', 'DELIVERED', 'REJECTED']
- `orders.status`: Uses orderStatusEnum
- `orders.updatedAt`: Automatically updated on status change

### API Request/Response Types

```typescript
// Request body for status update
interface UpdateOrderStatusRequest {
  status: 'DELIVERED' | 'REJECTED';
}

// Response from status update
interface UpdateOrderStatusResponse {
  order: Order;
  message: string;
}

// Error response
interface ErrorResponse {
  error: string;
  message?: string;
}
```

### Frontend Types

```typescript
// Extended DetailedOrder to include status
interface DetailedOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  totalAmount: number;
  status: OrderStatus; // NEW: Add status to detailed orders
  items: Array<{
    itemName: string;
    quantity: number;
    priceAtOrder: number;
  }>;
}
```

## Error Handling

### Frontend Error Handling

1. **Network Errors**: Display error message below action buttons
2. **Validation Errors**: Show specific error message from API
3. **Loading States**: Disable buttons and show spinner during update
4. **Optimistic Updates**: Not implemented - wait for server confirmation

### Backend Error Handling

1. **Invalid Order ID**: Return 404 with message "Order not found"
2. **Invalid Status**: Return 400 with message "Invalid status value"
3. **Order Already in Final State**: Return 400 with message "Order status cannot be changed from [current_status]"
4. **Database Errors**: Return 500 with generic error message, log details

### Error Messages

```typescript
const ERROR_MESSAGES = {
  INVALID_STATUS: 'Invalid status. Must be DELIVERED or REJECTED',
  ORDER_NOT_FOUND: 'Order not found',
  CANNOT_UPDATE: 'Order status cannot be changed from its current state',
  NETWORK_ERROR: 'Failed to update order status. Please try again',
  SERVER_ERROR: 'An error occurred while updating the order'
};
```

## Testing Strategy

### Manual Testing Checklist

1. **Status Update - Fulfill**
   - Click "Fulfill" on an ACCEPTED order
   - Verify order status changes to DELIVERED
   - Verify revenue analytics update to include the order
   - Verify action buttons disappear after update

2. **Status Update - Reject**
   - Click "Reject" on an ACKNOWLEDGED order
   - Verify order status changes to REJECTED
   - Verify revenue analytics exclude the order
   - Verify action buttons disappear after update

3. **Button Visibility**
   - Verify buttons only show for ACCEPTED/ACKNOWLEDGED orders
   - Verify no buttons show for DELIVERED orders
   - Verify no buttons show for REJECTED orders

4. **Error Handling**
   - Test with invalid order ID
   - Test updating already DELIVERED order
   - Test network failure scenarios
   - Verify error messages display correctly

5. **Loading States**
   - Verify loading indicator shows during update
   - Verify buttons are disabled during update
   - Verify multiple clicks don't trigger multiple requests

6. **Revenue Analytics**
   - Note revenue before fulfilling an order
   - Fulfill the order
   - Verify revenue increases by order amount
   - Reject an order and verify revenue doesn't change

### Integration Points to Verify

1. **Analytics Query Integration**
   - Verify `calculateTotalRevenue` only counts DELIVERED orders
   - Verify `calculateWorkingDayRevenue` only counts DELIVERED orders
   - Verify status counts update correctly

2. **Data Refresh**
   - Verify slot-block groups refresh after status update
   - Verify order details reflect new status
   - Verify status counts update in real-time

3. **Database Updates**
   - Verify `updatedAt` timestamp changes
   - Verify status persists correctly
   - Verify no side effects on related data

## Implementation Notes

### Query Modifications Required

The `getOrdersBySlotAndBlockForWorkingDayWithDetails` query needs to include order status in the returned data:

```typescript
// Add status to the select
.select({
  // ... existing fields
  orderStatus: orders.status, // NEW
})
```

### CSS Styling Considerations

- Action buttons should be styled consistently with existing dashboard buttons
- Use existing status badge styles for order status display
- Loading state should use existing spinner/loading patterns
- Error messages should use existing error styling
- Buttons should be horizontally aligned with appropriate spacing

### Performance Considerations

- Status updates are individual operations (no batch updates needed)
- Dashboard refresh fetches all overview data (acceptable for admin use)
- No caching strategy needed for admin dashboard
- Rate limiting not required for admin actions

### Security Considerations

- API endpoint should verify admin authentication (add if not present)
- Validate order ID format to prevent injection
- Validate status enum values strictly
- Log all status changes for audit trail (future enhancement)

## Future Enhancements

1. **Confirmation Dialogs**: Add confirmation before rejecting orders
2. **Reason for Rejection**: Allow admin to specify rejection reason
3. **Status History**: Track all status changes with timestamps
4. **Bulk Actions**: Allow selecting multiple orders for batch status updates
5. **Notifications**: Notify customers when order status changes
6. **Undo Action**: Allow reverting status change within a time window
