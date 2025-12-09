import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByStatus, getOrdersByStatusForWorkingDay } from '@/db/queries/orders';
import { validateAdminAuth } from '@/utils/adminAuth';

/**
 * GET /api/admin/orders
 * Query parameters:
 * - status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED'
 * - workingDayStart: (optional) ISO date string for working day start
 * - workingDayEnd: (optional) ISO date string for working day end
 */
export async function GET(request: NextRequest) {
  // Validate admin authorization
  const authResult = await validateAdminAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED' | null;
    const workingDayStartParam = searchParams.get('workingDayStart');
    const workingDayEndParam = searchParams.get('workingDayEnd');

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

    let orders;

    // If working day parameters are provided, use working day filtering
    if (workingDayStartParam && workingDayEndParam) {
      const workingDayStart = new Date(workingDayStartParam);
      const workingDayEnd = new Date(workingDayEndParam);
      orders = await getOrdersByStatusForWorkingDay(status, workingDayStart, workingDayEnd);
    } else {
      // Fall back to existing query without working day filtering
      orders = await getOrdersByStatus(status);
    }

    return NextResponse.json({ orders, status });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
