import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByStatus } from '@/db/queries/orders';

/**
 * GET /api/admin/orders
 * Query parameters:
 * - status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED' | null;

    if (!status) {
      return NextResponse.json(
        { error: 'Status parameter is required' },
        { status: 400 }
      );
    }

    if (!['ACCEPTED', 'ACKNOWLEDGED', 'DELIVERED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED' },
        { status: 400 }
      );
    }

    const orders = await getOrdersByStatus(status);
    return NextResponse.json({ orders, status });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
