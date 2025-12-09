# Design Document

## Overview

This design transforms the admin dashboard from a calendar-date-based system to a working-day-based system that aligns with the night delivery service's operational hours (11pm-5am). The key innovation is the "working day" concept: a 6-hour operational shift that spans two calendar dates, providing admins with an intuitive view of their business that matches their actual work patterns.

## Architecture

### Working Day Calculation Logic

The working day calculation is the core of this feature. It determines which 6-hour window (11pm-5am) should be displayed based on the current time:

**Current Working Day Logic:**
- If current time is 11:00 PM - 11:59 PM: Working day started today at 11 PM (ongoing)
- If current time is 12:00 AM - 5:00 AM: Working day started yesterday at 11 PM (ongoing)
- If current time is 5:01 AM - 5:59 AM: Most recent completed working day (ended at 5 AM today)
- If current time is 6:00 AM - 10:59 PM: Upcoming working day (starting at 11 PM today)

**Date Range Calculation:**
```
Working Day Start: [date] at 23:00:00
Working Day End: [date + 1 day] at 05:00:00
```

### Component Changes

**Frontend (src/app/admin/page.tsx):**
- Remove date picker from Overview tab
- Add working day date picker to Orders tab
- Update state management to use working day ranges
- Add utility functions for working day calculations
- Update UI labels to reflect working day terminology

**Backend (src/db/queries/analytics.ts):**
- Add new query functions that accept working day date ranges
- Modify existing queries to filter by `slotTime` instead of `createdAt`
- Create working day-specific analytics functions

**API Routes:**
- Update `/api/admin/analytics` to support working day queries
- Update `/api/admin/orders` to support working day filtering

## Components and Interfaces

### 1. Working Day Utility Functions

Create utility functions for working day calculations:

```typescript
// src/utils/workingDay.ts

export interface WorkingDayRange {
  start: Date;
  end: Date;
  label: string; // e.g., "Dec 9, 11pm - Dec 10, 5am"
}

/**
 * Get the current working day based on the current time
 */
export function getCurrentWorkingDay(): WorkingDayRange {
  const now = new Date();
  const hour = now.getHours();
  
  let workingDayDate: Date;
  
  if (hour >= 23) {
    // 11 PM - 11:59 PM: working day started today
    workingDayDate = new Date(now);
  } else if (hour < 5) {
    // 12 AM - 4:59 AM: working day started yesterday
    workingDayDate = new Date(now);
    workingDayDate.setDate(workingDayDate.getDate() - 1);
  } else if (hour === 5) {
    // 5 AM - 5:59 AM: show most recent completed working day (started yesterday)
    workingDayDate = new Date(now);
    workingDayDate.setDate(workingDayDate.getDate() - 1);
  } else {
    // 6 AM - 10:59 PM: show upcoming working day (starting today at 11 PM)
    workingDayDate = new Date(now);
  }
  
  return getWorkingDayRange(workingDayDate);
}

/**
 * Get working day range for a specific date
 * @param date The date representing the working day (the date when it starts at 11 PM)
 */
export function getWorkingDayRange(date: Date): WorkingDayRange {
  const start = new Date(date);
  start.setHours(23, 0, 0, 0);
  
  const end = new Date(date);
  end.setDate(end.getDate() + 1);
  end.setHours(5, 0, 0, 0);
  
  const label = formatWorkingDayLabel(start, end);
  
  return { start, end, label };
}

/**
 * Format working day label
 */
function formatWorkingDayLabel(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  const endStr = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `${startStr}, 11pm - ${endStr}, 5am`;
}

/**
 * Convert a date input value to a working day date
 * Date input gives us YYYY-MM-DD, we treat this as the start date
 */
export function dateInputToWorkingDay(dateString: string): Date {
  const date = new Date(dateString);
  // Ensure we're working with local date
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return localDate;
}

/**
 * Convert a working day date to date input value
 */
export function workingDayToDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 2. Database Query Functions

Add new analytics functions for working day queries:

```typescript
// src/db/queries/analytics.ts

/**
 * Calculate revenue for a working day (11pm to 5am window)
 */
export async function calculateWorkingDayRevenue(
  workingDayStart: Date,
  workingDayEnd: Date
): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'DELIVERED'),
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    );

  return result[0]?.total || 0;
}

/**
 * Get order counts by status for a working day
 */
export async function getOrderCountsByStatusForWorkingDay(
  workingDayStart: Date,
  workingDayEnd: Date
): Promise<Array<{ status: string; count: number }>> {
  const result = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    )
    .groupBy(orders.status);

  return result;
}

/**
 * Get orders grouped by slot and block for a working day
 */
export async function getOrdersBySlotAndBlockForWorkingDay(
  workingDayStart: Date,
  workingDayEnd: Date
): Promise<
  Array<{
    slotTime: Date;
    targetHostelBlock: string;
    count: number;
    totalAmount: number;
  }>
> {
  const result = await db
    .select({
      slotTime: orders.slotTime,
      targetHostelBlock: orders.targetHostelBlock,
      count: sql<number>`COUNT(*)::int`,
      totalAmount: sql<number>`SUM(${orders.totalAmount})::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    )
    .groupBy(orders.slotTime, orders.targetHostelBlock)
    .orderBy(desc(orders.slotTime));

  return result;
}

/**
 * Get orders by status for a working day
 */
export async function getOrdersByStatusForWorkingDay(
  status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED',
  workingDayStart: Date,
  workingDayEnd: Date
) {
  return db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, status),
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    )
    .orderBy(desc(orders.createdAt));
}
```

### 3. API Route Updates

Update the analytics API to support working day queries:

```typescript
// src/app/api/admin/analytics/route.ts

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  
  // New parameters for working day
  const workingDayStartParam = searchParams.get('workingDayStart');
  const workingDayEndParam = searchParams.get('workingDayEnd');
  
  switch (type) {
    case 'working-day-revenue': {
      if (!workingDayStartParam || !workingDayEndParam) {
        return NextResponse.json(
          { error: 'workingDayStart and workingDayEnd parameters are required' },
          { status: 400 }
        );
      }
      const start = new Date(workingDayStartParam);
      const end = new Date(workingDayEndParam);
      const revenue = await calculateWorkingDayRevenue(start, end);
      return NextResponse.json({ revenue });
    }
    
    case 'working-day-status-counts': {
      if (!workingDayStartParam || !workingDayEndParam) {
        return NextResponse.json(
          { error: 'workingDayStart and workingDayEnd parameters are required' },
          { status: 400 }
        );
      }
      const start = new Date(workingDayStartParam);
      const end = new Date(workingDayEndParam);
      const counts = await getOrderCountsByStatusForWorkingDay(start, end);
      return NextResponse.json({ counts });
    }
    
    case 'working-day-slot-block-groups': {
      if (!workingDayStartParam || !workingDayEndParam) {
        return NextResponse.json(
          { error: 'workingDayStart and workingDayEnd parameters are required' },
          { status: 400 }
        );
      }
      const start = new Date(workingDayStartParam);
      const end = new Date(workingDayEndParam);
      const groups = await getOrdersBySlotAndBlockForWorkingDay(start, end);
      return NextResponse.json({ groups });
    }
    
    // Keep existing cases for total-revenue, etc.
  }
}
```

Update the orders API to support working day filtering:

```typescript
// src/app/api/admin/orders/route.ts

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const workingDayStartParam = searchParams.get('workingDayStart');
  const workingDayEndParam = searchParams.get('workingDayEnd');
  
  if (!status) {
    return NextResponse.json({ error: 'Status parameter is required' }, { status: 400 });
  }
  
  let orders;
  
  if (workingDayStartParam && workingDayEndParam) {
    const start = new Date(workingDayStartParam);
    const end = new Date(workingDayEndParam);
    orders = await getOrdersByStatusForWorkingDay(status, start, end);
  } else {
    orders = await getOrdersByStatus(status);
  }
  
  return NextResponse.json({ orders, status });
}
```

### 4. Frontend Component Updates

Update the admin dashboard component:

```typescript
// src/app/admin/page.tsx

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [workingDayRevenue, setWorkingDayRevenue] = useState<number>(0);
  const [workingDayLabel, setWorkingDayLabel] = useState<string>('');
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [slotBlockGroups, setSlotBlockGroups] = useState<SlotBlockGroup[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('ACCEPTED');
  
  // For Orders tab - working day filter
  const [ordersWorkingDayDate, setOrdersWorkingDayDate] = useState<string>('');
  const [ordersWorkingDayLabel, setOrdersWorkingDayLabel] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  
  // Initialize working day dates
  useEffect(() => {
    const currentWD = getCurrentWorkingDay();
    const dateInput = workingDayToDateInput(currentWD.start);
    setOrdersWorkingDayDate(dateInput);
    setOrdersWorkingDayLabel(currentWD.label);
  }, []);
  
  // Fetch overview data for current working day
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    }
  }, [activeTab]);
  
  // Fetch orders by status and working day
  useEffect(() => {
    if (activeTab === 'orders' && ordersWorkingDayDate) {
      fetchOrdersByStatus();
    }
  }, [activeTab, selectedStatus, ordersWorkingDayDate]);
  
  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const currentWD = getCurrentWorkingDay();
      setWorkingDayLabel(currentWD.label);
      
      // Fetch total revenue (all-time)
      const totalRevenueRes = await fetch('/api/admin/analytics?type=total-revenue');
      const totalRevenueData = await totalRevenueRes.json();
      setTotalRevenue(totalRevenueData.revenue);
      
      // Fetch working day revenue
      const wdRevenueRes = await fetch(
        `/api/admin/analytics?type=working-day-revenue&workingDayStart=${currentWD.start.toISOString()}&workingDayEnd=${currentWD.end.toISOString()}`
      );
      const wdRevenueData = await wdRevenueRes.json();
      setWorkingDayRevenue(wdRevenueData.revenue);
      
      // Fetch status counts for working day
      const statusCountsRes = await fetch(
        `/api/admin/analytics?type=working-day-status-counts&workingDayStart=${currentWD.start.toISOString()}&workingDayEnd=${currentWD.end.toISOString()}`
      );
      const statusCountsData = await statusCountsRes.json();
      setStatusCounts(statusCountsData.counts);
      
      // Fetch slot-block groups for working day
      const slotBlockRes = await fetch(
        `/api/admin/analytics?type=working-day-slot-block-groups&workingDayStart=${currentWD.start.toISOString()}&workingDayEnd=${currentWD.end.toISOString()}`
      );
      const slotBlockData = await slotBlockRes.json();
      setSlotBlockGroups(slotBlockData.groups);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOrdersByStatus = async () => {
    setLoading(true);
    try {
      const workingDay = dateInputToWorkingDay(ordersWorkingDayDate);
      const range = getWorkingDayRange(workingDay);
      setOrdersWorkingDayLabel(range.label);
      
      const res = await fetch(
        `/api/admin/orders?status=${selectedStatus}&workingDayStart=${range.start.toISOString()}&workingDayEnd=${range.end.toISOString()}`
      );
      const data = await res.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // UI updates:
  // - Remove date picker from Overview tab
  // - Update "Daily Revenue" to "Working Day Revenue"
  // - Add working day label display
  // - Add date picker to Orders tab
  // - Update section headings
}
```

## Data Models

No changes to database schema required. The feature uses existing fields:
- `orders.slotTime`: Used for working day filtering
- `orders.status`: Used for status filtering
- `orders.totalAmount`: Used for revenue calculations
- `orders.createdAt`: Preserved for audit purposes

## Error Handling

1. **Invalid Date Parameters**: API routes validate that working day start/end parameters are provided and valid
2. **Timezone Handling**: All date calculations use local timezone to ensure consistency
3. **Empty Results**: UI displays appropriate empty states when no orders exist for a working day
4. **API Failures**: Frontend catches errors and displays loading states appropriately

## Visual Design System

### Design Consistency

The admin dashboard will adopt the neo-brutalist design system used throughout the customer-facing pages to ensure brand consistency and a cohesive user experience.

### Design Tokens

Use the following CSS custom properties defined in `globals.css`:

**Colors:**
- `--pk-gold`: #F5B041 (Primary accent, backgrounds)
- `--pk-ink`: #2E1B0F (Text, borders)
- `--pk-foam`: #F9F3E3 (Page background)
- `--pk-cream`: #FFF8E7 (Light backgrounds)
- `--clay-red`: #D35400 (Primary actions, emphasis)
- `--leaf-green`: #27AE60 (Success states)
- `--alert-red`: #C0392B (Errors, warnings)

**Spacing & Effects:**
- `--radius-std`: 8px (Border radius)
- `--shadow-hard`: 4px 4px 0px var(--pk-ink) (Neo-brutalist shadow)

### Component Styling Patterns

**Cards and Containers:**
```css
background: white;
border: 3px solid var(--pk-ink);
border-radius: var(--radius-std);
box-shadow: var(--shadow-hard);
```

**Interactive Elements (Buttons, Inputs):**
```css
border: 3px solid var(--pk-ink);
border-radius: var(--radius-std);
box-shadow: var(--shadow-hard);
transition: transform 0.1s ease, box-shadow 0.1s ease;

/* On active/click */
transform: translate(2px, 2px);
box-shadow: 2px 2px 0px var(--pk-ink);

/* On hover (desktop) */
transform: translate(-1px, -1px);
box-shadow: 5px 5px 0px var(--pk-ink);
```

**Primary Action Buttons:**
```css
background-color: var(--clay-red);
color: white;
border: 3px solid var(--pk-ink);
box-shadow: var(--shadow-hard);
```

**Tabs:**
```css
/* Inactive */
background: var(--pk-foam);
border: 3px solid var(--pk-ink);

/* Active */
background: var(--pk-gold);
border: 3px solid var(--pk-ink);
box-shadow: var(--shadow-hard);
```

**Status Badges:**
```css
border: 2px solid var(--pk-ink);
border-radius: var(--radius-std);
box-shadow: 2px 2px 0px var(--pk-ink);
```

### Layout Updates

**Page Container:**
- Background: `var(--pk-foam)`
- Max-width: 1400px
- Padding: Responsive (1rem mobile, 2rem desktop)

**Header:**
- Background: white
- Border: 3px solid `var(--pk-ink)`
- Shadow: `var(--shadow-hard)`

**Stat Cards:**
- Use neo-brutalist card pattern
- Accent colors for values (revenue in `var(--clay-red)`)

**Tables:**
- Header background: `var(--pk-gold)`
- Borders: 3px solid `var(--pk-ink)`
- Row hover: subtle background change

## Testing Strategy

### Unit Tests
- Test working day calculation logic for all time ranges (11pm-5am, 5am-11pm)
- Test date conversion utilities (dateInputToWorkingDay, workingDayToDateInput)
- Test working day label formatting

### Integration Tests
- Test API routes with working day parameters
- Test database queries with working day date ranges
- Verify correct filtering by slotTime vs createdAt

### Manual Testing
- Verify Overview tab shows current working day automatically
- Verify Orders tab date picker filters correctly
- Test edge cases: midnight transitions, 5am cutoff, 11pm start
- Verify revenue calculations match expected values
- Test across different timezones if applicable
- Verify visual consistency with customer pages
- Test responsive behavior on mobile, tablet, and desktop
- Verify interactive states (hover, active, focus) match design system

## Migration Notes

This is a non-breaking change:
- No database migrations required
- Existing API endpoints remain functional
- New query parameters are optional additions
- Frontend changes are isolated to admin dashboard
- CSS changes are purely visual and don't affect functionality


## Detailed Order View Enhancement

### Overview

Kitchen staff need to see individual order details within each hostel block to prepare food accurately. This enhancement adds an expandable/collapsible interface to show detailed order information including customer names, menu items, and quantities.

### Component Design

#### 1. Expandable Block Cards

Each hostel block card in the slot-block view will become expandable:

**Collapsed State (Current):**
- Shows hostel block name
- Shows order count and total amount
- Shows expand/collapse indicator (chevron icon or "View Details" button)

**Expanded State (New):**
- Shows all information from collapsed state
- Shows list of individual orders with:
  - Order ID (shortened, e.g., "abc123...")
  - Customer name
  - List of menu items with quantities
  - Order total amount

#### 2. Database Query Enhancement

Add a new query function to fetch detailed orders with items:

```typescript
// src/db/queries/analytics.ts

/**
 * Get detailed orders for a specific slot and hostel block
 * Includes user information and order items with menu item details
 */
export async function getDetailedOrdersForSlotAndBlock(
  slotTime: Date,
  hostelBlock: string
): Promise<
  Array<{
    id: string;
    userId: string;
    userName: string;
    totalAmount: number;
    items: Array<{
      itemName: string;
      quantity: number;
      priceAtOrder: number;
    }>;
  }>
> {
  const result = await db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      userName: users.name,
      totalAmount: orders.totalAmount,
      itemName: menuItems.name,
      quantity: orderItems.quantity,
      priceAtOrder: orderItems.priceAtOrder,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.itemId, menuItems.id))
    .where(
      and(
        eq(orders.slotTime, slotTime),
        eq(orders.targetHostelBlock, hostelBlock)
      )
    )
    .orderBy(orders.createdAt);

  // Group items by order
  const ordersMap = new Map<string, {
    id: string;
    userId: string;
    userName: string;
    totalAmount: number;
    items: Array<{
      itemName: string;
      quantity: number;
      priceAtOrder: number;
    }>;
  }>();

  for (const row of result) {
    if (!ordersMap.has(row.orderId)) {
      ordersMap.set(row.orderId, {
        id: row.orderId,
        userId: row.userId,
        userName: row.userName,
        totalAmount: row.totalAmount,
        items: [],
      });
    }
    ordersMap.get(row.orderId)!.items.push({
      itemName: row.itemName,
      quantity: row.quantity,
      priceAtOrder: row.priceAtOrder,
    });
  }

  return Array.from(ordersMap.values());
}
```

#### 3. API Route Addition

Add a new API endpoint for fetching detailed orders:

```typescript
// src/app/api/admin/orders/details/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDetailedOrdersForSlotAndBlock } from '@/db/queries/analytics';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slotTime = searchParams.get('slotTime');
  const hostelBlock = searchParams.get('hostelBlock');

  if (!slotTime || !hostelBlock) {
    return NextResponse.json(
      { error: 'slotTime and hostelBlock parameters are required' },
      { status: 400 }
    );
  }

  try {
    const orders = await getDetailedOrdersForSlotAndBlock(
      new Date(slotTime),
      hostelBlock
    );
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch detailed orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed orders' },
      { status: 500 }
    );
  }
}
```

#### 4. Frontend Component Updates

Update the admin dashboard to support expandable blocks:

```typescript
// src/app/admin/page.tsx

interface DetailedOrder {
  id: string;
  userId: string;
  userName: string;
  totalAmount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    priceAtOrder: number;
  }>;
}

export default function AdminDashboard() {
  // ... existing state ...
  
  // New state for expanded blocks and detailed orders
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [detailedOrders, setDetailedOrders] = useState<Record<string, DetailedOrder[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  const toggleBlockExpansion = async (slotTime: string, hostelBlock: string) => {
    const blockKey = `${slotTime}-${hostelBlock}`;
    
    if (expandedBlocks.has(blockKey)) {
      // Collapse
      const newExpanded = new Set(expandedBlocks);
      newExpanded.delete(blockKey);
      setExpandedBlocks(newExpanded);
    } else {
      // Expand - fetch details if not already loaded
      const newExpanded = new Set(expandedBlocks);
      newExpanded.add(blockKey);
      setExpandedBlocks(newExpanded);
      
      if (!detailedOrders[blockKey]) {
        setLoadingDetails(new Set(loadingDetails).add(blockKey));
        try {
          const res = await fetch(
            `/api/admin/orders/details?slotTime=${encodeURIComponent(slotTime)}&hostelBlock=${encodeURIComponent(hostelBlock)}`
          );
          const data = await res.json();
          setDetailedOrders({
            ...detailedOrders,
            [blockKey]: data.orders,
          });
        } catch (error) {
          console.error('Failed to fetch order details:', error);
        } finally {
          const newLoading = new Set(loadingDetails);
          newLoading.delete(blockKey);
          setLoadingDetails(newLoading);
        }
      }
    }
  };

  // ... rest of component ...
}
```

#### 5. UI Layout

**Block Card Structure:**

```jsx
<div className={styles.blockCard}>
  <div 
    className={styles.blockHeader}
    onClick={() => toggleBlockExpansion(slotTime, hostelBlock)}
  >
    <div className={styles.blockName}>{hostelBlock}</div>
    <div className={styles.blockStats}>
      <span>{count} orders</span>
      <span>{formatCurrency(amount)}</span>
    </div>
    <button className={styles.expandButton}>
      {isExpanded ? '▼' : '▶'}
    </button>
  </div>
  
  {isExpanded && (
    <div className={styles.blockDetails}>
      {loadingDetails ? (
        <div className={styles.detailsLoading}>Loading...</div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderDetail}>
              <div className={styles.orderHeader}>
                <span className={styles.orderId}>
                  Order: {order.id.substring(0, 8)}...
                </span>
                <span className={styles.customerName}>
                  {order.userName}
                </span>
                <span className={styles.orderAmount}>
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className={styles.orderItems}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.orderItem}>
                    <span className={styles.itemQuantity}>{item.quantity}x</span>
                    <span className={styles.itemName}>{item.itemName}</span>
                    <span className={styles.itemPrice}>
                      {formatCurrency(item.priceAtOrder)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}
</div>
```

### Styling Considerations

**Expandable Block Card:**
- Add cursor pointer to indicate clickability
- Use smooth transition for expand/collapse animation
- Maintain neo-brutalist design with borders and shadows
- Use subtle background color change for expanded state

**Order Details Section:**
- Indent or use different background to distinguish from summary
- Use smaller font size for item details
- Maintain clear visual hierarchy: Order → Customer → Items
- Ensure adequate spacing between orders

**Responsive Design:**
- On mobile: Stack order information vertically
- On desktop: Use grid layout for better space utilization
- Ensure touch targets are large enough for mobile interaction

### Performance Considerations

1. **Lazy Loading**: Only fetch detailed orders when a block is expanded
2. **Caching**: Store fetched details in state to avoid re-fetching on collapse/expand
3. **Pagination**: If a block has many orders (>20), consider pagination or virtual scrolling
4. **Debouncing**: Prevent rapid expand/collapse actions

### Error Handling

1. **Failed API Calls**: Show error message in expanded section with retry button
2. **Empty Orders**: Show "No orders found" message
3. **Network Issues**: Display appropriate error state with retry option
