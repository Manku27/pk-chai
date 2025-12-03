import { pgTable, uuid, varchar, integer, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for order status
export const orderStatusEnum = pgEnum('order_status_enum', [
  'ACCEPTED',
  'ACKNOWLEDGED', 
  'DELIVERED',
  'REJECTED'
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 15 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  defaultHostelBlock: varchar('default_hostel_block', { length: 50 }),
  hostelFloor: varchar('hostel_floor', { length: 10 }),
  hostelRoom: varchar('hostel_room', { length: 10 }),
  hostelYear: varchar('hostel_year', { length: 10 }),
  hostelDepartment: varchar('hostel_department', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('USER'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  phoneIdx: index('idx_users_phone').on(table.phone),
  roleIdx: index('idx_users_role').on(table.role),
}));

// Menu items table
export const menuItems = pgTable('menu_items', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  price: integer('price').notNull(),
  categoryOrder: integer('category_order').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_menu_items_category').on(table.category),
  availableIdx: index('idx_menu_items_available').on(table.isAvailable),
}));

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  targetHostelBlock: varchar('target_hostel_block', { length: 50 }).notNull(),
  slotTime: timestamp('slot_time').notNull(),
  status: orderStatusEnum('status').notNull().default('ACCEPTED'),
  totalAmount: integer('total_amount').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_orders_user_id').on(table.userId),
  statusIdx: index('idx_orders_status').on(table.status),
  slotTimeIdx: index('idx_orders_slot_time').on(table.slotTime),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
  userCreatedIdx: index('idx_orders_user_created').on(table.userId, table.createdAt),
}));

// Order items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: varchar('item_id', { length: 100 }).notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  priceAtOrder: integer('price_at_order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
  itemIdIdx: index('idx_order_items_item_id').on(table.itemId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.itemId],
    references: [menuItems.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}));
