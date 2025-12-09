# AnalyticsDashboard Component

## Overview

The AnalyticsDashboard component provides comprehensive analytics and metrics for the admin dashboard, fulfilling requirements 5.1-5.5.

## Features

### 1. Date Selector
- Select any date to view analytics for that specific day
- Defaults to today's date

### 2. Revenue Metrics (Requirement 5.1)
- **Daily Revenue**: Total revenue from DELIVERED orders for the selected date
- **Total Revenue**: All-time revenue from DELIVERED orders

### 3. Order Counts (Requirement 5.2)
- Total orders for the selected date
- Rejected orders count with percentage
- Status breakdown showing ACCEPTED, ACKNOWLEDGED, DELIVERED, and REJECTED counts

### 4. Traffic by Time Slot (Requirement 5.3)
- Table showing order volume for each 30-minute delivery slot
- Visual percentage bars for easy comparison
- Sorted chronologically

### 5. Hostel Demand Distribution (Requirement 5.4)
- Table showing order distribution across all four hostel blocks
- Percentage breakdown with visual bars
- Helps identify high-demand locations

### 6. Consumption Heatmap (Requirement 5.5)
- Visual heatmap showing order intensity by hostel block and time slot
- Color intensity indicates order volume
- Hover to see exact order counts
- Helps identify peak times and locations

## Usage

```tsx
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <AnalyticsDashboard
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedDate` | `Date` | `new Date()` | The date to display analytics for |
| `onDateChange` | `(date: Date) => void` | `undefined` | Callback when date is changed |

## API Integration

The component fetches data from the following API endpoints:

- `GET /api/admin/analytics?type=daily-revenue&date={date}`
- `GET /api/admin/analytics?type=total-revenue`
- `GET /api/admin/analytics?type=order-counts&date={date}`
- `GET /api/admin/analytics?type=traffic-by-slot&date={date}`
- `GET /api/admin/analytics?type=hostel-demand&date={date}`
- `GET /api/admin/analytics?type=heatmap&date={date}`

## Loading and Error States

- **Loading**: Displays a spinner while fetching data
- **Error**: Shows error banner with retry button
- **Empty State**: Shows friendly message when no data is available

## Styling

The component uses CSS modules (`AnalyticsDashboard.module.css`) and follows the existing design patterns:
- Consistent color scheme with other admin components
- Responsive design for mobile and tablet
- Smooth transitions and hover effects
- Accessible color contrasts

## Responsive Design

- Desktop: Full grid layout with all features visible
- Tablet: Adjusted grid columns for optimal viewing
- Mobile: Single column layout with stacked elements
