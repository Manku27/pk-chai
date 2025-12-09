/**
 * API route for admin order management
 * GET /api/admin/orders - Fetch orders with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrdersWithFilters } from '@/db/queries/orders';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const status = searchParams.get('status') as 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED' | null;
    const slotTimeParam = searchParams.get('slotTime');
    const hostelBlock = searchParams.get('hostelBlock');

    // Validate status parameter if provided
    if (status && !['ACCEPTED', 'ACKNOWLEDGED', 'DELIVERED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED' },
        { status: 400 }
      );
    }

    // Parse slotTime if provided
    let slotTime: Date | undefined;
    if (slotTimeParam) {
      slotTime = new Date(slotTimeParam);
      if (isNaN(slotTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid slotTime format. Must be a valid ISO 8601 date string' },
          { status: 400 }
        );
      }
    }

    // Build filters object
    const filters: {
      status?: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';
      slotTime?: Date;
      hostelBlock?: string;
    } = {};

    if (status) filters.status = status;
    if (slotTime) filters.slotTime = slotTime;
    if (hostelBlock) filters.hostelBlock = hostelBlock;

    // Fetch orders with filters
    const orders = await getOrdersWithFilters(filters);

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch admin orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
