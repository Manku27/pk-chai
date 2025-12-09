# Design Document: Admin Dashboard

## Overview

The Admin Dashboard is a secure, real-time order management interface for PKChai administrators. It provides live order monitoring, status workflow management, and analytics capabilities to support efficient operations during the 11:00 PM to 5:00 AM delivery window. The system uses a hybrid real-time architecture with Server-Sent Events (SSE) as the primary mechanism and short polling as a fallback to ensure reliability on Vercel's Hobby tier.

The dashboard is built as a Next.js client component with custom CSS styling, following the existing application patterns. It integrates with the existing Drizzle ORM schema and database query layer.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard (Client)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Guard   │  │ Real-time    │  │ Analytics    │      │
│  │              │  │ Order Feed   │  │ Dashboard    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Connection Manager (SSE + Polling)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/admin/  │  │ /api/admin/  │  │ /api/admin/  │      │
│  │ orders       │  │ analytics    │  │ orders/sse   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Query Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ orders.ts    │  │ analytics.ts │  │ users.ts     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Neon PostgreSQL (via Drizzle ORM)              │
└─────────────────────────────────────────────────────────────┘
```

### Real-Time Communication Strategy

The dashboard implements a hybrid approach to handle Vercel Hobby tier limitations:

1. **Primary: Server-Sent Events (SSE)**
   - Unidirectional server-to-client streaming
   - Low latency (< 2 seconds for new orders)
   - Efficient for real-time updates

2. **Fallback: Short Polling**
   - Activated when SSE connection fails or times out
   - 15-second polling interval
   - Ensures no orders are missed during network issues

3. **Connection Manager**
   - Detects SSE connection failures within 5 seconds
   - Automatically switches to polling mode
   - Attempts to re-establish SSE when connection is restored
   - Maintains state continuity during transitions

## Components and Interfaces

### 1. Authentication Guard

**Purpose:** Protect the `/master` route from unauthorized access

**Interface:**
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}
```

**Behavior:**
- Checks authentication status on mount
- Verifies user role is ADMIN
- Redirects to login if unauthenticated
- Shows authorization error if not admin
- Renders children only for authenticated admins

### 2. Real-Time Order Feed

**Purpose:** Display live orders grouped by slot time and hostel block with persistent slot visibility

**Interface:**
```typescript
interface OrderFeedProps {
  connectionMode: 'sse' | 'polling';
  onConnectionChange: (mode: 'sse' | 'polling') => void;
}

interface OrderWithItems {
  order: Order;
  items: OrderItem[];
  user: {
    phone: string;
    name: string;
  };
}

interface TimeSlot {
  time: Date;
  display: string; // e.g., "11:00 PM"
  isPast: boolean;
}

interface GroupedOrders {
  slotTime: string;
  slot: TimeSlot;
  blocks: {
    [hostelBlock: string]: OrderWithItems[];
  };
}
```

**Behavior:**
- Generates all time slots from 11:00 PM to 5:00 AM in 30-minute intervals
- Groups orders by slot time (primary grouping)
- Sub-groups by hostel block within each slot
- Displays all slots regardless of whether orders exist
- Marks slots as past/upcoming based on current time
- Sorts slots with upcoming/current at top, past at bottom
- Displays order details: ID, customer info, items, total, status
- Updates in real-time without page refresh
- Shows connection status indicator
- Automatically reorders slots as time progresses

### 3. Order Status Manager

**Purpose:** Handle order status workflow transitions

**Interface:**
```typescript
interface OrderStatusManagerProps {
  order: OrderWithItems;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

type OrderStatus = 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';

interface StatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  action: string;
  buttonLabel: string;
}
```

**Valid Transitions:**
- ACCEPTED → ACKNOWLEDGED (Acknowledge button)
- ACCEPTED → REJECTED (Reject button)
- ACKNOWLEDGED → DELIVERED (Deliver button)
- ACKNOWLEDGED → REJECTED (Reject button)

**Behavior:**
- Displays appropriate action buttons based on current status
- Sends status update to API
- Provides visual feedback during update
- Shows error message if update fails
- Disables buttons during update to prevent double-clicks

### 4. Connection Manager

**Purpose:** Manage SSE and polling connections with automatic fallback

**Interface:**
```typescript
interface ConnectionManagerConfig {
  sseUrl: string;
  pollingUrl: string;
  pollingInterval: number; // milliseconds
  sseTimeout: number; // milliseconds
  operationalHours: {
    startHour: number; // 22 for 10 PM
    endHour: number;   // 5 for 5 AM
  };
  onOrderUpdate: (orders: OrderWithItems[]) => void;
  onConnectionChange: (mode: 'sse' | 'polling') => void;
  onError: (error: Error) => void;
}

class ConnectionManager {
  private mode: 'sse' | 'polling';
  private eventSource: EventSource | null;
  private pollingTimer: NodeJS.Timeout | null;
  private lastHeartbeat: number;
  private operationalCheckTimer: NodeJS.Timeout | null;
  
  start(): void;
  stop(): void;
  switchToPolling(): void;
  attemptSSEReconnect(): void;
  isWithinOperationalHours(): boolean;
  pausePolling(): void;
  resumePolling(): void;
}
```

**Behavior:**
- Starts with SSE connection
- Monitors SSE heartbeat/activity
- Detects connection failure within 5 seconds
- Automatically switches to polling on failure
- Periodically attempts SSE reconnection
- Prevents duplicate order processing during transitions
- Checks operational hours (10 PM to 5 AM) before each poll
- Automatically pauses polling outside operational hours
- Resumes polling when operational window begins

### 5. Analytics Dashboard

**Purpose:** Display business metrics and visualizations

**Interface:**
```typescript
interface AnalyticsDashboardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

interface AnalyticsData {
  dailyRevenue: number;
  totalRevenue: number;
  orderCounts: {
    total: number;
    rejected: number;
    delivered: number;
    accepted: number;
    acknowledged: number;
  };
  trafficBySlot: Array<{
    slotTime: string;
    orderCount: number;
  }>;
  hostelDemand: Array<{
    hostelBlock: string;
    orderCount: number;
    percentage: number;
  }>;
  heatmapData: Array<{
    hostelBlock: string;
    slotTime: string;
    intensity: number;
  }>;
}
```

**Visualizations:**
- Bar chart for traffic by slot (Chart.js)
- Pie chart for hostel demand distribution
- Heatmap for block × time slot intensity
- Metric cards for revenue and counts

### 6. Slot Generator Utility

**Purpose:** Generate all delivery time slots and determine their status

**Interface:**
```typescript
interface TimeSlot {
  time: Date;
  display: string; // e.g., "11:00 PM"
  isPast: boolean;
}

function generateAllSlots(currentTime: Date): TimeSlot[];
function isSlotPast(slotTime: Date, currentTime: Date): boolean;
function sortSlotsByStatus(slots: GroupedOrders[]): GroupedOrders[];
```

**Behavior:**
- Generates slots from 11:00 PM to 5:00 AM (13 slots total: 11:00 PM, 11:30 PM, ..., 4:30 AM, 5:00 AM)
- Determines if each slot is in the past relative to current time
- Handles day boundary crossing (11 PM today to 5 AM tomorrow)
- Sorts slots with upcoming/current first, past last
- Updates slot status as time progresses

## Data Models

The dashboard uses existing database schema defined in `src/db/schema.ts`:

### Order Model
```typescript
interface Order {
  id: string; // UUID
  userId: string; // UUID FK to users
  targetHostelBlock: string;
  slotTime: Date;
  status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### OrderItem Model
```typescript
interface OrderItem {
  id: string; // UUID
  orderId: string; // UUID FK to orders
  itemId: string; // FK to menu_items
  quantity: number;
  priceAtOrder: number;
  createdAt: Date;
}
```

### User Model (subset used by dashboard)
```typescript
interface User {
  id: string;
  phone: string;
  name: string;
  role: 'USER' | 'ADMIN';
}
```

### Extended Models for Dashboard

```typescript
interface OrderWithDetails extends Order {
  items: Array<OrderItem & {
    menuItem: {
      name: string;
      category: string;
    };
  }>;
  user: {
    phone: string;
    name: string;
  };
}
```

## API Endpoints

### 1. GET /api/admin/orders

**Purpose:** Fetch orders with optional filtering

**Query Parameters:**
- `status?: OrderStatus` - Filter by order status
- `slotTime?: string` - Filter by slot time (ISO 8601)
- `hostelBlock?: string` - Filter by hostel block
- `includeItems?: boolean` - Include order items (default: true)

**Response:**
```typescript
{
  orders: OrderWithDetails[];
}
```

### 2. PATCH /api/admin/orders/[orderId]

**Purpose:** Update order status

**Request Body:**
```typescript
{
  status: OrderStatus;
}
```

**Response:**
```typescript
{
  order: Order;
}
```

**Error Responses:**
- 400: Invalid status transition
- 404: Order not found
- 500: Database error

### 3. GET /api/admin/orders/sse

**Purpose:** Server-Sent Events stream for real-time order updates

**Response:** Event stream with the following event types:
- `order-created`: New order placed
- `order-updated`: Order status changed
- `heartbeat`: Keep-alive signal (every 30 seconds)

**Event Data:**
```typescript
{
  type: 'order-created' | 'order-updated' | 'heartbeat';
  data?: OrderWithDetails;
  timestamp: string;
}
```

### 4. GET /api/admin/analytics

**Purpose:** Fetch analytics data

**Query Parameters:**
- `type: 'daily-revenue' | 'total-revenue' | 'order-counts' | 'traffic-by-slot' | 'hostel-demand' | 'heatmap'`
- `date?: string` - Date for daily metrics (ISO 8601 date)
- `startDate?: string` - Start date for range queries
- `endDate?: string` - End date for range queries

**Response:** Varies by type (see AnalyticsData interface)

## Co
rrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Order grouping preserves all orders

*For any* set of orders, when grouping by slot time and hostel block, the total number of orders across all groups should equal the original number of orders.
**Validates: Requirements 2.5**

### Property 2: New orders default to ACCEPTED status

*For any* order creation request, the created order in the database should have status ACCEPTED.
**Validates: Requirements 3.1**

### Property 3: Status transitions follow valid workflow

*For any* order with status ACCEPTED, updating to ACKNOWLEDGED or REJECTED should succeed, while updating to DELIVERED should fail.
*For any* order with status ACKNOWLEDGED, updating to DELIVERED or REJECTED should succeed, while updating to ACCEPTED should fail.
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 4: Status updates persist immediately

*For any* order status update, querying the order immediately after the update should return the new status.
**Validates: Requirements 3.5**

### Property 5: Order display includes all required fields

*For any* order, the rendered display should contain the order ID, customer phone, target hostel block, slot time, total amount, and creation timestamp.
**Validates: Requirements 4.1**

### Property 6: Order items display includes all item details

*For any* order with items, the rendered display should contain all items with their name, quantity, and price at order time.
**Validates: Requirements 4.2**

### Property 7: Slot times are sorted chronologically

*For any* set of orders grouped by slot time, the slot times should appear in chronological order (earliest to latest).
**Validates: Requirements 4.3**

### Property 8: All hostel blocks appear in grouping

*For any* grouping by hostel block, the structure should include entries for all four hostel blocks (Jaadavpur Main Hostel, New block hostel, KPC boys hostel, KPC girls hostel), even if some have zero orders.
**Validates: Requirements 4.4**

### Property 9: Daily revenue includes only delivered orders

*For any* set of orders, the daily revenue calculation should sum only orders with status DELIVERED, excluding all other statuses.
**Validates: Requirements 5.1**

### Property 10: Order counts are accurate

*For any* set of orders, the total count should equal the sum of orders across all statuses, and the rejected count should equal the number of orders with status REJECTED.
**Validates: Requirements 5.2**

### Property 11: Traffic by slot aggregates correctly

*For any* set of orders, the traffic by slot data should have one entry per unique slot time, and the sum of all slot counts should equal the total number of orders.
**Validates: Requirements 5.3**

### Property 12: Hostel demand percentages sum to 100

*For any* set of orders, the hostel demand percentages across all four blocks should sum to 100% (within rounding tolerance).
**Validates: Requirements 5.4**

### Property 13: Heatmap covers all block-slot combinations

*For any* heatmap data, there should be an entry for each combination of hostel block and time slot, even if the intensity is zero.
**Validates: Requirements 5.5**

### Property 14: Connection transitions preserve order visibility

*For any* set of orders visible before a connection mode transition (SSE to polling or vice versa), all orders should remain visible after the transition.
**Validates: Requirements 6.5**

### Property 15: API errors produce error messages

*For any* order status update that receives an error response from the API, an error message should be displayed to the admin.
**Validates: Requirements 7.4**

### Property 16: Concurrent updates all complete

*For any* set of simultaneous order status updates, all updates should complete and persist to the database without any being lost.
**Validates: Requirements 7.5**

### Property 17: Polling respects operational hours

*For any* time outside the operational window (10:00 PM to 5:00 AM), the connection manager should not make polling requests to the server.
**Validates: Requirements 6.6**

### Property 18: All time slots are generated

*For any* current time, the slot generator should produce exactly 13 time slots covering 11:00 PM to 5:00 AM in 30-minute intervals.
**Validates: Requirements 8.1**

### Property 19: Past slots are marked correctly

*For any* generated slot with a time before the current time, the slot should be marked as past (isPast = true).
**Validates: Requirements 8.2**

### Property 20: Slots are sorted by status

*For any* list of grouped orders with mixed past and upcoming slots, after sorting, all upcoming/current slots should appear before all past slots.
**Validates: Requirements 8.3**

### Property 21: Empty slots display correctly

*For any* time slot with zero orders, the slot should still appear in the display with an empty state indicator.
**Validates: Requirements 8.4**

## Error Handling

### Client-Side Error Handling

1. **Authentication Errors**
   - Redirect to login page with return URL
   - Clear invalid session data
   - Display user-friendly error message

2. **Authorization Errors**
   - Display "Access Denied" message
   - Provide link to logout and login as admin
   - Log unauthorized access attempts

3. **Network Errors**
   - Automatic fallback from SSE to polling
   - Retry failed API requests with exponential backoff
   - Display connection status indicator
   - Show error toast for failed operations

4. **API Errors**
   - Display specific error messages from API responses
   - Provide retry button for failed operations
   - Log errors for debugging
   - Prevent UI state corruption on errors

5. **Data Validation Errors**
   - Validate status transitions before API calls
   - Show validation errors inline
   - Prevent invalid operations at UI level

### Server-Side Error Handling

1. **Database Errors**
   - Return 500 status with generic error message
   - Log detailed error information
   - Rollback transactions on failure
   - Maintain data consistency

2. **Invalid Status Transitions**
   - Return 400 status with specific error message
   - Document valid transitions in error response
   - Do not modify database state

3. **Not Found Errors**
   - Return 404 status for non-existent orders
   - Verify order exists before updates
   - Handle race conditions gracefully

4. **SSE Connection Errors**
   - Implement heartbeat mechanism
   - Detect and close stale connections
   - Clean up resources on connection close
   - Handle client disconnections gracefully

## Testing Strategy

### Unit Testing

The dashboard will use Vitest for unit testing, following the existing project patterns. Unit tests will cover:

1. **Component Tests**
   - Authentication guard behavior
   - Order grouping logic
   - Status transition validation
   - Analytics calculations
   - Error message display

2. **Connection Manager Tests**
   - SSE connection establishment
   - Polling activation on SSE failure
   - Reconnection attempts
   - Heartbeat monitoring

3. **API Route Tests**
   - Order fetching with filters
   - Status update validation
   - Analytics data aggregation
   - Error responses

4. **Utility Function Tests**
   - Date formatting
   - Currency formatting
   - Data transformation functions

### Property-Based Testing

Property-based tests will use **fast-check** (JavaScript/TypeScript property testing library) to verify universal properties across many randomly generated inputs. Each property-based test will run a minimum of 100 iterations.

Each property-based test will be tagged with a comment explicitly referencing the correctness property from this design document using the format: `**Feature: admin-dashboard, Property {number}: {property_text}**`

Property-based tests will cover:

1. **Order Grouping Properties**
   - Property 1: Order grouping preserves all orders
   - Property 7: Slot times are sorted chronologically
   - Property 8: All hostel blocks appear in grouping
   - Property 14: Connection transitions preserve order visibility

2. **Status Workflow Properties**
   - Property 2: New orders default to ACCEPTED status
   - Property 3: Status transitions follow valid workflow
   - Property 4: Status updates persist immediately

3. **Display Properties**
   - Property 5: Order display includes all required fields
   - Property 6: Order items display includes all item details

4. **Analytics Properties**
   - Property 9: Daily revenue includes only delivered orders
   - Property 10: Order counts are accurate
   - Property 11: Traffic by slot aggregates correctly
   - Property 12: Hostel demand percentages sum to 100
   - Property 13: Heatmap covers all block-slot combinations

5. **Error Handling Properties**
   - Property 15: API errors produce error messages
   - Property 16: Concurrent updates all complete

6. **Slot Display Properties**
   - Property 18: All time slots are generated
   - Property 19: Past slots are marked correctly
   - Property 20: Slots are sorted by status
   - Property 21: Empty slots display correctly

### Integration Testing

Integration tests will verify:

1. **End-to-End Order Flow**
   - Order creation → Dashboard display → Status update → Analytics update
   - Verify data consistency across all layers

2. **Real-Time Communication**
   - SSE connection and message delivery
   - Polling fallback activation
   - Reconnection behavior

3. **Authentication and Authorization**
   - Admin access control
   - Session management
   - Unauthorized access prevention

### Testing Configuration

- **Framework:** Vitest (existing project standard)
- **Property Testing Library:** fast-check
- **Minimum Iterations:** 100 per property test
- **Test Location:** Co-located with source files using `.test.ts` suffix
- **Coverage Target:** 80% for critical paths (status workflow, grouping, analytics)

## Performance Considerations

1. **Real-Time Updates**
   - SSE provides sub-2-second latency for new orders
   - Polling fallback ensures 15-second maximum delay
   - Heartbeat every 30 seconds to detect stale connections

2. **Data Fetching**
   - Use database indexes on `status`, `slotTime`, `createdAt`
   - Limit initial order fetch to current day by default
   - Implement pagination for large order lists

3. **Client-Side Rendering**
   - Virtual scrolling for large order lists (100+ orders)
   - Debounce status update buttons to prevent double-clicks
   - Optimize re-renders with React.memo for order cards

4. **Analytics Calculations**
   - Perform aggregations in database using SQL
   - Cache analytics data for 1 minute
   - Use incremental updates for real-time metrics

## Security Considerations

1. **Authentication**
   - Verify JWT tokens on all admin API routes
   - Check user role is ADMIN before granting access
   - Implement session timeout and refresh

2. **Authorization**
   - Middleware to protect `/master` route
   - API-level role checks for all admin endpoints
   - Audit log for admin actions

3. **Data Protection**
   - Sanitize all user inputs
   - Use parameterized queries (Drizzle ORM handles this)
   - Limit data exposure in API responses

4. **Rate Limiting**
   - Apply rate limiting to admin API endpoints
   - Prevent abuse of status update endpoints
   - Monitor for suspicious activity

## Deployment Considerations

1. **Vercel Hobby Tier Limitations**
   - SSE connections may timeout after 60 seconds
   - Implement polling fallback for reliability
   - Test connection resilience thoroughly

2. **Environment Variables**
   - `DATABASE_URL`: Neon PostgreSQL connection string
   - `JWT_SECRET`: Secret for token verification
   - `NODE_ENV`: Environment indicator

3. **Database Migrations**
   - No schema changes required (uses existing tables)
   - Verify indexes exist for performance

4. **Monitoring**
   - Log SSE connection failures
   - Track polling fallback frequency
   - Monitor API response times
   - Alert on high error rates

## Future Enhancements

1. **Phase 2 Features**
   - Advanced chart visualizations (Chart.js integration)
   - Export analytics data to CSV
   - Custom date range selection
   - Real-time revenue counter

2. **Phase 3 Features**
   - Telegram bot integration for notifications
   - Push notifications for new orders
   - Order search and filtering
   - Admin action history log

3. **Optimization Opportunities**
   - WebSocket upgrade for more reliable real-time communication
   - Redis caching for analytics data
   - Batch status updates
   - Mobile-responsive design improvements
