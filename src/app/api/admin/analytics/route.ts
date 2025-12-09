import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDailyRevenue,
  calculateTotalRevenue,
  getOrderCountsByStatus,
  getOrdersBySlotAndBlock,
  getOrdersBySlotAndBlockForDate,
  getOrderCountsByStatusForDateRange,
  getTopRevenueBlocks,
  calculateWorkingDayRevenue,
  getOrderCountsByStatusForWorkingDay,
  getOrdersBySlotAndBlockForWorkingDayWithDetails,
} from '@/db/queries/analytics';
import { validateAdminAuth } from '@/utils/adminAuth';

/**
 * GET /api/admin/analytics
 * Query parameters:
 * - type: 'daily-revenue' | 'total-revenue' | 'status-counts' | 'slot-block-groups' | 'top-blocks' | 'working-day-revenue' | 'working-day-status-counts' | 'working-day-slot-block-groups'
 * - date: ISO date string (for daily-revenue and slot-block-groups)
 * - startDate: ISO date string (for date range queries)
 * - endDate: ISO date string (for date range queries)
 * - limit: number (for top-blocks)
 * - workingDayStart: ISO date string (for working day queries)
 * - workingDayEnd: ISO date string (for working day queries)
 */
export async function GET(request: NextRequest) {
  // Validate admin authorization
  const authResult = await validateAdminAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');
    const workingDayStartParam = searchParams.get('workingDayStart');
    const workingDayEndParam = searchParams.get('workingDayEnd');

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

      case 'working-day-revenue': {
        if (!workingDayStartParam || !workingDayEndParam) {
          return NextResponse.json(
            { error: 'workingDayStart and workingDayEnd parameters are required' },
            { status: 400 }
          );
        }
        const start = new Date(workingDayStartParam);
        const end = new Date(workingDayEndParam);
        const revenue = await calculateWorkingDayRevenue(start, end);
        return NextResponse.json({ revenue });
      }

      case 'working-day-status-counts': {
        if (!workingDayStartParam || !workingDayEndParam) {
          return NextResponse.json(
            { error: 'workingDayStart and workingDayEnd parameters are required' },
            { status: 400 }
          );
        }
        const start = new Date(workingDayStartParam);
        const end = new Date(workingDayEndParam);
        const counts = await getOrderCountsByStatusForWorkingDay(start, end);
        return NextResponse.json({ counts });
      }

      case 'working-day-slot-block-groups': {
        if (!workingDayStartParam || !workingDayEndParam) {
          return NextResponse.json(
            { error: 'workingDayStart and workingDayEnd parameters are required' },
            { status: 400 }
          );
        }
        const start = new Date(workingDayStartParam);
        const end = new Date(workingDayEndParam);
        const groups = await getOrdersBySlotAndBlockForWorkingDayWithDetails(start, end);
        return NextResponse.json({ groups });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Must be one of: daily-revenue, total-revenue, status-counts, slot-block-groups, top-blocks, working-day-revenue, working-day-status-counts, working-day-slot-block-groups' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
