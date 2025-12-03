import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDailyRevenue,
  calculateTotalRevenue,
  getOrderCountsByStatus,
  getOrdersBySlotAndBlock,
  getOrdersBySlotAndBlockForDate,
  getOrderCountsByStatusForDateRange,
  getTopRevenueBlocks,
} from '@/db/queries/analytics';

/**
 * GET /api/admin/analytics
 * Query parameters:
 * - type: 'daily-revenue' | 'total-revenue' | 'status-counts' | 'slot-block-groups' | 'top-blocks'
 * - date: ISO date string (for daily-revenue and slot-block-groups)
 * - startDate: ISO date string (for date range queries)
 * - endDate: ISO date string (for date range queries)
 * - limit: number (for top-blocks)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    switch (type) {
      case 'daily-revenue': {
        if (!dateParam) {
          return NextResponse.json(
            { error: 'Date parameter is required for daily-revenue' },
            { status: 400 }
          );
        }
        const date = new Date(dateParam);
        const revenue = await calculateDailyRevenue(date);
        return NextResponse.json({ revenue, date: dateParam });
      }

      case 'total-revenue': {
        const revenue = await calculateTotalRevenue();
        return NextResponse.json({ revenue });
      }

      case 'status-counts': {
        if (startDateParam && endDateParam) {
          const startDate = new Date(startDateParam);
          const endDate = new Date(endDateParam);
          const counts = await getOrderCountsByStatusForDateRange(startDate, endDate);
          return NextResponse.json({ counts, startDate: startDateParam, endDate: endDateParam });
        } else {
          const counts = await getOrderCountsByStatus();
          return NextResponse.json({ counts });
        }
      }

      case 'slot-block-groups': {
        if (dateParam) {
          const date = new Date(dateParam);
          const groups = await getOrdersBySlotAndBlockForDate(date);
          return NextResponse.json({ groups, date: dateParam });
        } else {
          const groups = await getOrdersBySlotAndBlock();
          return NextResponse.json({ groups });
        }
      }

      case 'top-blocks': {
        const limit = limitParam ? parseInt(limitParam, 10) : 10;
        const blocks = await getTopRevenueBlocks(limit);
        return NextResponse.json({ blocks, limit });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Must be one of: daily-revenue, total-revenue, status-counts, slot-block-groups, top-blocks' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
