/**
 * Order service for managing order operations
 * Provides business logic layer over database operations
 */

import { 
  createOrder as dbCreateOrder, 
  getOrdersWithItemsByUserIdPaginated as dbGetOrdersWithItemsByUserIdPaginated,
  updateOrderStatus as dbUpdateOrderStatus 
} from '@/db/queries/orders';
import { db } from '@/db/index';
import { menuItems } from '@/db/schema';
import type { NewOrder, NewOrderItem } from '@/db/queries/orders';

/**
 * Create and save a new order with order items to the database
 * @param userId - User ID placing the order
 * @param items - Cart items in the order
 * @param targetHostelBlock - Delivery location
 * @param slotTime - Delivery time slot (ISO timestamp string)
 * @param totalAmount - Total order amount in rupees
 * @returns Created order with ID
 */
export async function createAndSaveOrder(
  userId: string,
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }>,
  targetHostelBlock: string,
  slotTime: string,
  totalAmount: number
): Promise<{ orderId: string }> {
  try {
    // Prepare order data
    const orderData: NewOrder = {
      userId,
      targetHostelBlock,
      slotTime: new Date(slotTime),
      totalAmount,
      status: 'ACCEPTED', // Default status as per requirements
    };

    // Prepare order items data
    const orderItemsData: Omit<NewOrderItem, 'orderId'>[] = items.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      priceAtOrder: item.price,
    }));

    // Create order with items in database
    const { order } = await dbCreateOrder(orderData, orderItemsData);

    return { orderId: order.id };
  } catch (error) {
    console.error('Failed to create order:', error);
    throw new Error('Unable to place order. Please try again.');
  }
}

/**
 * Retrieve order history for a user with items
 * Orders are returned sorted by creation date (newest first)
 * @param userId - User ID to retrieve orders for
 * @param page - Page number (1-indexed), defaults to 1
 * @param limit - Orders per page, defaults to 10, max 50
 * @returns Orders with items and pagination metadata
 */
export async function getOrderHistory(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  orders: Array<{
    id: string;
    userId: string;
    targetHostelBlock: string;
    slotTime: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      priceAtOrder: number;
    }>;
  }>;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalOrders: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  try {
    // Cap limit at maximum of 50
    const cappedLimit = Math.min(limit, 50);
    
    // Get paginated orders with total count
    const { orders: ordersWithItems, total } = await dbGetOrdersWithItemsByUserIdPaginated(
      userId,
      page,
      cappedLimit
    );
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / cappedLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    // If no orders, return empty result with pagination metadata
    if (ordersWithItems.length === 0) {
      return {
        orders: [],
        pagination: {
          currentPage: page,
          pageSize: cappedLimit,
          totalOrders: total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
    }
    
    // Fetch menu item names for all items
    const allItemIds = [...new Set(
      ordersWithItems.flatMap(({ items }) => items.map(item => item.itemId))
    )];
    
    // Create a map of item IDs to names by fetching all menu items at once
    const itemNameMap = new Map<string, string>();
    if (allItemIds.length > 0) {
      // Fetch all menu items in one query
      const allMenuItems = await db.select().from(menuItems);
      allMenuItems.forEach(item => {
        itemNameMap.set(item.id, item.name);
      });
    }
    
    // Format orders for frontend consumption
    const formattedOrders = ordersWithItems.map(({ order, items }) => ({
      id: order.id,
      userId: order.userId,
      targetHostelBlock: order.targetHostelBlock,
      slotTime: order.slotTime.toISOString(),
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      items: items.map(item => ({
        itemId: item.itemId,
        name: itemNameMap.get(item.itemId) || 'Unknown Item',
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
      })),
    }));
    
    return {
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        pageSize: cappedLimit,
        totalOrders: total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  } catch (error) {
    console.error('Failed to retrieve order history:', error);
    return {
      orders: [],
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalOrders: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}

/**
 * Update order status
 * @param orderId - Order ID to update
 * @param status - New status value
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED'
): Promise<void> {
  try {
    await dbUpdateOrderStatus(orderId, status);
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw new Error('Unable to update order status. Please try again.');
  }
}
