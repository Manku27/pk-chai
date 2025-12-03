# Admin Dashboard

This admin dashboard provides analytics and order management capabilities for the PKChai food ordering application.

## Features

### Overview Tab

The overview tab displays key metrics and analytics:

1. **Total Revenue**: Sum of all delivered orders
2. **Daily Revenue**: Revenue for the selected date
3. **Order Status Counts**: Count of orders by status (ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED)
4. **Orders by Slot & Block**: Grouped view of orders by delivery slot and hostel block for the selected date

### Orders Tab

The orders tab allows filtering and viewing orders by status:

- Filter orders by status (ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED)
- View order details including ID, hostel block, slot time, amount, and timestamps

## API Endpoints

### Analytics API

**Endpoint**: `/api/admin/analytics`

**Query Parameters**:

- `type` (required): Type of analytics query
  - `daily-revenue`: Calculate revenue for a specific date
  - `total-revenue`: Calculate total revenue across all delivered orders
  - `status-counts`: Get order counts grouped by status
  - `slot-block-groups`: Get orders grouped by slot time and hostel block
  - `top-blocks`: Get top revenue-generating hostel blocks

- `date` (optional): ISO date string for date-specific queries
- `startDate` (optional): Start date for date range queries
- `endDate` (optional): End date for date range queries
- `limit` (optional): Limit for top-blocks query (default: 10)

**Examples**:

```
GET /api/admin/analytics?type=daily-revenue&date=2024-12-04
GET /api/admin/analytics?type=total-revenue
GET /api/admin/analytics?type=status-counts
GET /api/admin/analytics?type=slot-block-groups&date=2024-12-04
GET /api/admin/analytics?type=top-blocks&limit=5
```

### Orders API

**Endpoint**: `/api/admin/orders`

**Query Parameters**:

- `status` (required): Order status to filter by
  - Values: `ACCEPTED`, `ACKNOWLEDGED`, `DELIVERED`, `REJECTED`

**Example**:

```
GET /api/admin/orders?status=ACCEPTED
```

## Database Queries Used

The admin dashboard uses the following database query functions:

### From `src/db/queries/analytics.ts`:

1. `calculateDailyRevenue(date: Date)`: Calculate revenue for delivered orders on a specific date
2. `calculateTotalRevenue()`: Calculate total revenue across all delivered orders
3. `getOrderCountsByStatus()`: Get count of orders grouped by status
4. `getOrdersBySlotAndBlock()`: Get orders grouped by slot time and hostel block
5. `getOrdersBySlotAndBlockForDate(date: Date)`: Get orders grouped by slot and block for a specific date
6. `getOrderCountsByStatusForDateRange(startDate: Date, endDate: Date)`: Get status counts for a date range
7. `getTopRevenueBlocks(limit: number)`: Get top revenue-generating hostel blocks

### From `src/db/queries/orders.ts`:

1. `getOrdersByStatus(status)`: Fetch all orders with a specific status

## Requirements Validation

This implementation satisfies the following requirements from the database schema specification:

- **Requirement 8.1**: Calculate daily revenue for delivered orders ✓
- **Requirement 8.2**: Analyze order patterns by grouping by slot time and hostel block ✓
- **Requirement 8.3**: Generate reports by counting orders by status ✓
- **Requirement 8.4**: Analyze trends with date-based filtering and aggregation ✓

## Access

Navigate to `/admin` to access the admin dashboard.

## Future Enhancements

Potential improvements for the admin dashboard:

1. Authentication and authorization for admin users
2. Real-time updates using WebSockets or polling
3. Order status update functionality
4. Export data to CSV/Excel
5. Advanced filtering and search capabilities
6. Charts and visualizations for analytics data
7. Date range selectors for custom reporting periods
