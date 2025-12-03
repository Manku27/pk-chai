# Rate Limiting Middleware

## Overview

This middleware implements rate limiting for order placement to prevent abuse. Users are limited to a maximum of 10 orders per 24-hour rolling window.

## Implementation Details

### Rate Limit Configuration
- **Maximum Orders**: 10 orders per user
- **Time Window**: 24 hours (rolling window)
- **Response Code**: 429 (Too Many Requests) when limit exceeded

### How It Works

1. When an order placement request is received, the middleware extracts the user ID
2. It queries the database to count orders placed by that user in the last 24 hours
3. If the count is >= 10, it returns a 429 error response
4. If the count is < 10, the request proceeds to create the order

### Database Query

The rate limiting uses the `countOrdersByUserSince` function from `src/db/queries/orders.ts`, which:
- Uses a composite index on `(user_id, created_at)` for efficient queries
- Counts orders where `user_id` matches and `created_at >= (now - 24 hours)`

### Error Handling

- If the rate limit check fails due to a database error, the middleware fails open (allows the request)
- This prevents rate limiting issues from blocking legitimate orders
- Errors are logged for monitoring

## Usage

### In API Routes

The rate limiting is applied in the order placement API route:

```typescript
import { checkRateLimit } from '@/middleware/rateLimit';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId } = body;
  
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(userId);
  if (rateLimitResponse) {
    return rateLimitResponse; // Returns 429 if limit exceeded
  }
  
  // Proceed with order creation
  // ...
}
```

## Testing

### Manual Testing

To test the rate limiting:

1. Create a test user account
2. Place 10 orders using that user ID
3. Attempt to place an 11th order
4. Verify you receive a 429 response with the error message

### API Endpoint

**POST** `/api/orders/place`

**Request Body:**
```json
{
  "userId": "user-uuid",
  "items": [
    {
      "itemId": "chai-small",
      "name": "Chai - Small",
      "price": 10,
      "quantity": 2
    }
  ],
  "targetHostelBlock": "Block A",
  "slotTime": "2024-01-01T12:00:00.000Z",
  "totalAmount": 20
}
```

**Success Response (201):**
```json
{
  "success": true,
  "orderId": "order-uuid",
  "message": "Order placed successfully"
}
```

**Rate Limit Exceeded Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have reached the maximum of 10 orders per 24 hours. Please try again later.",
  "retryAfter": "24 hours"
}
```

## Requirements Satisfied

- **7.1**: Supports efficient queries for counting orders per user within a time window
- **7.2**: Uses order timestamps to enable 24-hour rolling window calculations
- **7.3**: Counts orders by user and time range for rate limit checks
