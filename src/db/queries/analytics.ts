import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../index';
import { orders, users, orderItems, menuItems } from '../schema';

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

/**
 * Calculate revenue for a working day (11pm to 5am window)
 */
export async function calculateWorkingDayRevenue(
  workingDayStart: Date,
  workingDayEnd: Date
): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'DELIVERED'),
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    );

  return result[0]?.total || 0;
}

/**
 * Get order counts by status for a working day
 */
export async function getOrderCountsByStatusForWorkingDay(
  workingDayStart: Date,
  workingDayEnd: Date
): Promise<Array<{ status: string; count: number }>> {
  const result = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    )
    .groupBy(orders.status);

  return result;
}

/**
 * Get orders grouped by slot and block for a working day
 */
export async function getOrdersBySlotAndBlockForWorkingDay(
  workingDayStart: Date,
  workingDayEnd: Date
): Promise<
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
    .where(
      and(
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    )
    .groupBy(orders.slotTime, orders.targetHostelBlock)
    .orderBy(desc(orders.slotTime));

  return result;
}

/**
 * Get detailed orders for a specific slot and hostel block
 * Includes user information and order items with menu item details
 */
export async function getDetailedOrdersForSlotAndBlock(
  slotTime: Date,
  hostelBlock: string
): Promise<
  Array<{
    id: string;
    userId: string;
    userName: string;
    totalAmount: number;
    items: Array<{
      itemName: string;
      quantity: number;
      priceAtOrder: number;
    }>;
  }>
> {
  const result = await db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      userName: users.name,
      totalAmount: orders.totalAmount,
      itemName: menuItems.name,
      quantity: orderItems.quantity,
      priceAtOrder: orderItems.priceAtOrder,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.itemId, menuItems.id))
    .where(
      and(
        eq(orders.slotTime, slotTime),
        eq(orders.targetHostelBlock, hostelBlock)
      )
    )
    .orderBy(orders.createdAt);

  // Group items by order
  const ordersMap = new Map<string, {
    id: string;
    userId: string;
    userName: string;
    totalAmount: number;
    items: Array<{
      itemName: string;
      quantity: number;
      priceAtOrder: number;
    }>;
  }>();

  for (const row of result) {
    if (!ordersMap.has(row.orderId)) {
      ordersMap.set(row.orderId, {
        id: row.orderId,
        userId: row.userId,
        userName: row.userName,
        totalAmount: row.totalAmount,
        items: [],
      });
    }
    ordersMap.get(row.orderId)!.items.push({
      itemName: row.itemName,
      quantity: row.quantity,
      priceAtOrder: row.priceAtOrder,
    });
  }

  return Array.from(ordersMap.values());
}

/**
 * Get orders grouped by slot and block for a working day WITH detailed order information
 * This combines aggregated data with detailed orders to avoid multiple API calls
 */
export async function getOrdersBySlotAndBlockForWorkingDayWithDetails(
  workingDayStart: Date,
  workingDayEnd: Date
): Promise<
  Array<{
    slotTime: Date;
    targetHostelBlock: string;
    count: number;
    totalAmount: number;
    detailedOrders: Array<{
      id: string;
      userId: string;
      userName: string;
      userPhone: string;
      totalAmount: number;
      status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';
      items: Array<{
        itemName: string;
        quantity: number;
        priceAtOrder: number;
      }>;
    }>;
  }>
> {
  // First get aggregated slot-block data (this always works even without items)
  const aggregated = await db
    .select({
      slotTime: orders.slotTime,
      targetHostelBlock: orders.targetHostelBlock,
      count: sql<number>`COUNT(*)::int`,
      totalAmount: sql<number>`SUM(${orders.totalAmount})::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    )
    .groupBy(orders.slotTime, orders.targetHostelBlock)
    .orderBy(desc(orders.slotTime));

  // Then get detailed order information with items
  const detailedResult = await db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      userName: users.name,
      userPhone: users.phone,
      orderTotalAmount: orders.totalAmount,
      orderStatus: orders.status,
      slotTime: orders.slotTime,
      targetHostelBlock: orders.targetHostelBlock,
      itemName: menuItems.name,
      quantity: orderItems.quantity,
      priceAtOrder: orderItems.priceAtOrder,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(menuItems, eq(orderItems.itemId, menuItems.id))
    .where(
      and(
        gte(orders.slotTime, workingDayStart),
        lte(orders.slotTime, workingDayEnd)
      )
    )
    .orderBy(desc(orders.slotTime), orders.createdAt);

  // Group detailed orders by slot-block
  const detailsMap = new Map<string, Map<string, {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    totalAmount: number;
    status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';
    items: Array<{
      itemName: string;
      quantity: number;
      priceAtOrder: number;
    }>;
  }>>();

  for (const row of detailedResult) {
    const key = `${row.slotTime.toISOString()}-${row.targetHostelBlock}`;

    if (!detailsMap.has(key)) {
      detailsMap.set(key, new Map());
    }

    const ordersMap = detailsMap.get(key)!;

    // Add order if not already added
    if (!ordersMap.has(row.orderId)) {
      ordersMap.set(row.orderId, {
        id: row.orderId,
        userId: row.userId,
        userName: row.userName,
        userPhone: row.userPhone,
        totalAmount: row.orderTotalAmount,
        status: row.orderStatus,
        items: [],
      });
    }

    // Add item to order (if exists)
    if (row.itemName) {
      ordersMap.get(row.orderId)!.items.push({
        itemName: row.itemName,
        quantity: row.quantity!,
        priceAtOrder: row.priceAtOrder!,
      });
    }
  }

  // Combine aggregated data with detailed orders
  return aggregated.map(agg => {
    const key = `${agg.slotTime.toISOString()}-${agg.targetHostelBlock}`;
    const ordersMap = detailsMap.get(key) || new Map();

    return {
      slotTime: agg.slotTime,
      targetHostelBlock: agg.targetHostelBlock,
      count: agg.count,
      totalAmount: agg.totalAmount,
      detailedOrders: Array.from(ordersMap.values()),
    };
  });
}
