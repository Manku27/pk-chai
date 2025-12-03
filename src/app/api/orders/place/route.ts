/**
 * API route for placing orders
 * Includes rate limiting to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/middleware/rateLimit';
import { createAndSaveOrder } from '@/services/orderService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, items, targetHostelBlock, slotTime, totalAmount } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!targetHostelBlock) {
      return NextResponse.json(
        { error: 'Target hostel block is required' },
        { status: 400 }
      );
    }

    if (!slotTime) {
      return NextResponse.json(
        { error: 'Delivery slot time is required' },
        { status: 400 }
      );
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      );
    }

    // Apply rate limiting - check if user has exceeded order limit
    const rateLimitResponse = await checkRateLimit(userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Create the order
    const result = await createAndSaveOrder(
      userId,
      items,
      targetHostelBlock,
      slotTime,
      totalAmount
    );

    return NextResponse.json(
      {
        success: true,
        orderId: result.orderId,
        message: 'Order placed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order placement failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to place order',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
