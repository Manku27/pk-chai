/**
 * Rate limiting middleware for order placement
 * Prevents users from placing more than 10 orders in a 24-hour period
 * Requirements: 7.1, 7.2, 7.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { countOrdersByUserSince } from '@/db/queries/orders';

const MAX_ORDERS_PER_DAY = 10;
const TIME_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Rate limiting middleware that checks if a user has exceeded their order limit
 * @param userId - User ID to check rate limit for
 * @returns NextResponse with 429 status if rate limit exceeded, null otherwise
 */
export async function checkRateLimit(userId: string): Promise<NextResponse | null> {
  try {
    // Bypass rate limiting in development when NEXT_PUBLIC_ENABLE_ALL_SLOTS is set
    if (process.env.NEXT_PUBLIC_ENABLE_ALL_SLOTS === 'true') {
      return null;
    }

    // Calculate the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - TIME_WINDOW_MS);

    // Query the number of orders placed by this user in the last 24 hours
    const orderCount = await countOrdersByUserSince(userId, twentyFourHoursAgo);

    // Check if the user has exceeded the rate limit
    if (orderCount >= MAX_ORDERS_PER_DAY) {
      return NextResponse.json(
        {
          error: 'You have reached the order limit for today',
        },
        { status: 429 }
      );
    }

    // Rate limit not exceeded, allow the request to proceed
    return null;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request to proceed (fail open)
    // This prevents rate limiting errors from blocking legitimate orders
    return null;
  }
}

/**
 * Wrapper function to apply rate limiting to an API route handler
 * @param handler - The API route handler function
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract user ID from request body
      const body = await req.json();
      const userId = body.userId;

      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Check rate limit
      const rateLimitResponse = await checkRateLimit(userId);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Rate limit passed, call the original handler
      return handler(req, userId);
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
