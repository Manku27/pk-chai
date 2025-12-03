import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../index';
import { orders } from '../schema';

/**
 * Calculate total revenue for delivered orders
 */
export async function calculateTotalRevenue(): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(eq(orders.status, 'DELIVERED'));

  return result[0]?.total || 0;
}

/**
 * Calculate revenue for a specific date range
 */
export async function calculateRevenueByDateRange(startDate: Date, endDate: Date): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'DELIVERED'),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      )
    );

  return result[0]?.total || 0;
}

/**
 * Calculate daily revenue for delivered orders
 */
export async function calculateDailyRevenue(date: Date): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return calculateRevenueByDateRange(startOfDay, endOfDay);
}

/**
 * Get order counts grouped by status
 */
export async function getOrderCountsByStatus(): Promise<
  Array<{ status: string; count: number }>
> {
  const result = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .groupBy(orders.status);

  return result;
}

/**
 * Get orders grouped by slot time and hostel block
 */
export async function getOrdersBySlotAndBlock(): Promise<
  Array<{
    slotTime: Date;
    targetHostelBlock: string;
    count: number;
    totalAmount: number;
  }>
> {
  const result = await db
    .select({
      slotTime: orders.slotTime,
      targetHostelBlock: orders.targetHostelBlock,
      count: sql<number>`COUNT(*)::int`,
      totalAmount: sql<number>`SUM(${orders.totalAmount})::int`,
    })
    .from(orders)
    .groupBy(orders.slotTime, orders.targetHostelBlock)
    .orderBy(desc(orders.slotTime));

  return result;
}

/**
 * Get orders grouped by slot time and hostel block for a specific date
 */
export async function getOrdersBySlotAndBlockForDate(date: Date): Promise<
  Array<{
    slotTime: Date;
    targetHostelBlock: string;
    count: number;
    totalAmount: number;
  }>
> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      slotTime: orders.slotTime,
      targetHostelBlock: orders.targetHostelBlock,
      count: sql<number>`COUNT(*)::int`,
      totalAmount: sql<number>`SUM(${orders.totalAmount})::int`,
    })
    .from(orders)
    .where(and(gte(orders.slotTime, startOfDay), lte(orders.slotTime, endOfDay)))
    .groupBy(orders.slotTime, orders.targetHostelBlock)
    .orderBy(desc(orders.slotTime));

  return result;
}

/**
 * Get order counts by status for a specific date range
 */
export async function getOrderCountsByStatusForDateRange(
  startDate: Date,
  endDate: Date
): Promise<Array<{ status: string; count: number }>> {
  const result = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
    .groupBy(orders.status);

  return result;
}

/**
 * Get orders filtered by date range
 */
export async function getOrdersByDateRange(startDate: Date, endDate: Date) {
  return db
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
    .orderBy(desc(orders.createdAt));
}

/**
 * Get top revenue-generating hostel blocks
 */
export async function getTopRevenueBlocks(limit: number = 10): Promise<
  Array<{
    targetHostelBlock: string;
    totalRevenue: number;
    orderCount: number;
  }>
> {
  const result = await db
    .select({
      targetHostelBlock: orders.targetHostelBlock,
      totalRevenue: sql<number>`SUM(${orders.totalAmount})::int`,
      orderCount: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(eq(orders.status, 'DELIVERED'))
    .groupBy(orders.targetHostelBlock)
    .orderBy(desc(sql`SUM(${orders.totalAmount})`))
    .limit(limit);

  return result;
}
