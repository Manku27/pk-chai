/**
 * API route for retrieving order history
 * Server-side endpoint to fetch user order history from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderHistory } from '@/services/orderService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Validate required userId parameter
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Extract pagination parameters from query string
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // Parse and validate page parameter
    let page = 1; // Default value
    if (pageParam !== null) {
      const parsedPage = parseInt(pageParam, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return NextResponse.json(
          { error: 'Page must be a positive integer' },
          { status: 400 }
        );
      }
      page = parsedPage;
    }

    // Parse and validate limit parameter
    let limit = 10; // Default value
    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'Limit must be a positive integer' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Retrieve paginated order history from database
    const result = await getOrderHistory(userId, page, limit);

    // Return paginated orders with pagination metadata
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to retrieve order history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order history' },
      { status: 500 }
    );
  }
}
