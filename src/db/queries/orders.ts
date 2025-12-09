import { eq, and, gte, desc, count } from 'drizzle-orm';
import { db } from '../index';
import { orders, orderItems, users } from '../schema';

export type NewOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;

/**
 * Create a new order with order items
 */
export async function createOrder(
  orderData: NewOrder,
  items: Omit<NewOrderItem, 'orderId'>[]
): Promise<{ order: Order; items: OrderItem[] }> {
  // Insert the order
  const [order] = await db.insert(orders).values(orderData).returning();

  // Insert order items
  const orderItemsData = items.map(item => ({
    ...item,
    orderId: order.id,
  }));
  
  const insertedItems = await db.insert(orderItems).values(orderItemsData).returning();

  return { order, items: insertedItems };
}

/**
 * Get order by ID with its items
 */
export async function getOrderById(orderId: string): Promise<{
  order: Order | undefined;
  items: OrderItem[];
}> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  
  if (!order) {
    return { order: undefined, items: [] };
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  return { order, items };
}

/**
 * Get all orders for a specific user
 */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

/**
 * Get all orders for a specific user with their items
 */
export async function getOrdersWithItemsByUserId(userId: string): Promise<Array<{
  order: Order;
  items: OrderItem[];
}>> {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      
      return { order, items };
    })
  );

  return ordersWithItems;
}

/**
 * Get paginated orders for a specific user with their items
 */
export async function getOrdersWithItemsByUserIdPaginated(
  userId: string,
  page: number,
  limit: number
): Promise<{
  orders: Array<{ order: Order; items: OrderItem[] }>;
  total: number;
}> {
  // Calculate offset
  const offset = (page - 1) * limit;

  // Get total count of orders for this user
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.userId, userId));

  // Get paginated orders
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      
      return { order, items };
    })
  );

  return { orders: ordersWithItems, total };
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED'): Promise<Order[]> {
  return db
    .select()
    .from(orders)
    .where(eq(orders.status, status))
    .orderBy(desc(orders.createdAt));
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED'
): Promise<Order | undefined> {
  const [order] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return order;
}

/**
 * Delete order by ID (cascade deletes order items)
 */
export async function deleteOrder(orderId: string): Promise<void> {
  await db.delete(orders).where(eq(orders.id, orderId));
}

/**
 * Count orders by user in a time window (for rate limiting)
 * Returns the number of orders placed by a user since the given timestamp
 */
export async function countOrdersByUserSince(userId: string, since: Date): Promise<number> {
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), gte(orders.createdAt, since)));
  
  return result.length;
}

/**
 * Get orders by user in the last 24 hours (for rate limiting)
 */
export async function getRecentOrdersByUser(userId: string): Promise<Order[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), gte(orders.createdAt, twentyFourHoursAgo)))
    .orderBy(desc(orders.createdAt));
}

/**
 * Get orders with filters for admin dashboard
 * Includes order items with menu item details and user information
 */
export async function getOrdersWithFilters(filters: {
  status?: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';
  slotTime?: Date;
  hostelBlock?: string;
}): Promise<Array<Order & {
  items: Array<OrderItem & { menuItem: { name: string; category: string } }>;
  user: { phone: string; name: string };
}>> {
  // Build where conditions
  const conditions = [];
  if (filters.status) {
    conditions.push(eq(orders.status, filters.status));
  }
  if (filters.slotTime) {
    conditions.push(eq(orders.slotTime, filters.slotTime));
  }
  if (filters.hostelBlock) {
    conditions.push(eq(orders.targetHostelBlock, filters.hostelBlock));
  }

  // Fetch orders with filters
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const filteredOrders = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt));

  // Fetch related data for each order
  const ordersWithDetails = await Promise.all(
    filteredOrders.map(async (order) => {
      // Fetch order items with menu item details
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, order.id),
        with: {
          menuItem: {
            columns: {
              name: true,
              category: true,
            },
          },
        },
      });

      // Fetch user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, order.userId),
        columns: {
          phone: true,
          name: true,
        },
      });

      // Flatten the structure - spread order fields at top level
      return {
        ...order,
        items: items.map(item => ({
          ...item,
          menuItem: item.menuItem,
        })),
        user: user || { phone: '', name: '' },
      };
    })
  );

  return ordersWithDetails;
}
