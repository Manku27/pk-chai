/**
 * Type definitions for the Admin Dashboard
 */

export type OrderStatus = 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  quantity: number;
  priceAtOrder: number;
  createdAt: Date;
  menuItem?: {
    name: string;
    category: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  targetHostelBlock: string;
  slotTime: Date;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  user: {
    phone: string;
    name: string;
  };
}

export interface GroupedOrders {
  slotTime: string;
  slot?: {
    time: string;
    display: string;
    isPast?: boolean;
  };
  blocks: {
    [hostelBlock: string]: OrderWithDetails[];
  };
}
