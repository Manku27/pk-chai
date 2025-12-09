# Admin Dashboard

The Admin Dashboard is a secure, real-time order management interface for PKChai administrators.

## Features

### 1. Authentication & Authorization
- Protected route at `/master` (mapped to `/admin`)
- Requires ADMIN role for access
- Automatic redirect to login for unauthenticated users
- Authorization error display for non-admin users

### 2. Real-Time Order Feed
- Live order monitoring with polling-based updates (15-second interval)
- Orders grouped by slot time and hostel block
- Displays all order details:
  - Order ID, customer info (name, phone)
  - Order items with quantities and prices
  - Total amount and creation timestamp
  - Current order status
- Integrated order status management with action buttons
- Connection status indicator
- Automatic updates without page refresh

### 3. Analytics Dashboard
- Daily and total revenue metrics
- Order counts by status
- Traffic by time slot visualization
- Hostel demand distribution
- Consumption heatmap (block × time slot)
- Date selector for historical data

### 4. Tab Navigation
- **Order Feed Tab**: Real-time order monitoring and management
- **Analytics Tab**: Business metrics and visualizations

### 5. Error Handling
- Toast notifications for errors and success messages
- Connection error display
- Graceful error recovery
- User-friendly error messages

## Components Used

### OrderFeed
- Real-time order display with polling
- Order grouping and sorting
- Integrated with OrderStatusManager
- Connection status monitoring

### AnalyticsDashboard
- Revenue metrics display
- Order statistics
- Traffic and demand visualizations
- Heatmap generation

### AuthGuard
- Route protection
- Authentication verification
- Role-based access control

### OrderStatusManager
- Status transition buttons
- API integration for status updates
- Visual feedback during updates
- Error handling

## Usage

### Accessing the Dashboard
1. Navigate to `/master` (or `/admin`)
2. Login with admin credentials if not authenticated
3. Dashboard loads with Order Feed tab active

### Managing Orders
1. View incoming orders in real-time
2. Orders are grouped by slot time and hostel block
3. Use action buttons to update order status:
   - **Acknowledge**: ACCEPTED → ACKNOWLEDGED
   - **Deliver**: ACKNOWLEDGED → DELIVERED
   - **Reject**: ACCEPTED/ACKNOWLEDGED → REJECTED
4. Status updates are immediate and reflected in the UI

### Viewing Analytics
1. Click the "Analytics" tab
2. Select a date to view historical data
3. View metrics:
   - Daily and total revenue
   - Order counts by status
   - Traffic patterns by time slot
   - Hostel demand distribution
   - Consumption heatmap

## Technical Details

### Polling Configuration
- Default interval: 15 seconds
- Configurable via `pollingInterval` prop
- Automatic error recovery
- Force poll after status updates

### Toast Notifications
- Auto-dismiss after 5 seconds
- Manual close option
- Success and error variants
- Fixed position (top-right)

### Responsive Design
- Mobile-friendly layout
- Adaptive tab navigation
- Responsive toast positioning
- Optimized for various screen sizes

## Requirements Satisfied

- **1.3**: Admin Dashboard interface display
- **2.1**: Real-time order display within 2 seconds (via polling)
- **4.5**: Update display without page refresh
- **7.4**: Error message display to admin

## Styling

The dashboard follows the existing PKChai design patterns:
- Custom CSS modules
- Green accent color (#4CAF50)
- Clean, modern interface
- Smooth animations and transitions
- Consistent spacing and typography

## Future Enhancements

- Chart.js visualizations (Phase 2)
- Export analytics to CSV
- Custom date range selection
- Push notifications for new orders
- Order search and filtering
