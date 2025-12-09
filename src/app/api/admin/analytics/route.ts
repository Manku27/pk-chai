/**
 * API route for admin analytics
 * GET /api/admin/analytics - Fetch analytics data based on type parameter
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDailyRevenue,
  calculateTotalRevenue,
  getOrderCountsByStatusForDateRange,
  getOrdersBySlotAndBlockForDate,
} from '@/db/queries/analytics';

type AnalyticsType = 
  | 'daily-revenue' 
  | 'total-revenue' 
  | 'order-counts' 
  | 'traffic-by-slot' 
  | 'hostel-demand' 
  | 'heatmap';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as AnalyticsType | null;

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required parameter: type' },
        { status: 400 }
      );
    }

    // Validate type parameter
    const validTypes: AnalyticsType[] = [
      'daily-revenue',
      'total-revenue',
      'order-counts',
      'traffic-by-slot',
      'hostel-demand',
      'heatmap'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse date parameter (used by daily-revenue, order-counts, traffic-by-slot, hostel-demand, heatmap)
    const dateParam = searchParams.get('date');
    let date: Date;
    
    if (dateParam) {
      date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Must be a valid ISO 8601 date string' },
          { status: 400 }
        );
      }
    } else {
      // Default to today
      date = new Date();
    }

    // Handle different analytics types
    switch (type) {
      case 'daily-revenue': {
        const revenue = await calculateDailyRevenue(date);
        return NextResponse.json({ revenue }, { status: 200 });
      }

      case 'total-revenue': {
        const revenue = await calculateTotalRevenue();
        return NextResponse.json({ revenue }, { status: 200 });
      }

      case 'order-counts': {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const statusCounts = await getOrderCountsByStatusForDateRange(startOfDay, endOfDay);
        
        // Transform to include all statuses with 0 counts if missing
        const countsMap = new Map(statusCounts.map(sc => [sc.status, sc.count]));
        
        const orderCounts = {
          total: statusCounts.reduce((sum, sc) => sum + sc.count, 0),
          accepted: countsMap.get('ACCEPTED') || 0,
          acknowledged: countsMap.get('ACKNOWLEDGED') || 0,
          delivered: countsMap.get('DELIVERED') || 0,
          rejected: countsMap.get('REJECTED') || 0,
        };

        return NextResponse.json({ orderCounts }, { status: 200 });
      }

      case 'traffic-by-slot': {
        const slotData = await getOrdersBySlotAndBlockForDate(date);
        
        // Aggregate by slot time
        const slotMap = new Map<string, number>();
        
        for (const item of slotData) {
          const slotTimeStr = item.slotTime.toISOString();
          const currentCount = slotMap.get(slotTimeStr) || 0;
          slotMap.set(slotTimeStr, currentCount + item.count);
        }

        // Convert to array and sort chronologically
        const trafficBySlot = Array.from(slotMap.entries())
          .map(([slotTime, orderCount]) => ({
            slotTime,
            orderCount,
          }))
          .sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());

        return NextResponse.json({ trafficBySlot }, { status: 200 });
      }

      case 'hostel-demand': {
        const slotData = await getOrdersBySlotAndBlockForDate(date);
        
        // Aggregate by hostel block
        const blockMap = new Map<string, number>();
        
        for (const item of slotData) {
          const currentCount = blockMap.get(item.targetHostelBlock) || 0;
          blockMap.set(item.targetHostelBlock, currentCount + item.count);
        }

        // Calculate total orders
        const totalOrders = Array.from(blockMap.values()).reduce((sum, count) => sum + count, 0);

        // Convert to array with percentages
        const hostelDemand = Array.from(blockMap.entries()).map(([hostelBlock, orderCount]) => ({
          hostelBlock,
          orderCount,
          percentage: totalOrders > 0 ? (orderCount / totalOrders) * 100 : 0,
        }));

        return NextResponse.json({ hostelDemand }, { status: 200 });
      }

      case 'heatmap': {
        const slotData = await getOrdersBySlotAndBlockForDate(date);
        
        // Create heatmap data with all combinations
        const heatmapData = slotData.map(item => ({
          hostelBlock: item.targetHostelBlock,
          slotTime: item.slotTime.toISOString(),
          intensity: item.count,
        }));

        return NextResponse.json({ heatmapData }, { status: 200 });
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported analytics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
