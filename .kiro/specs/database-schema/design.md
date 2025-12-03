# Database Schema Design Document

## Overview

This document provides the complete database schema design for the PKChai food ordering application. The schema uses PostgreSQL (via Neon serverless) with Drizzle ORM for type-safe database access. The design supports user authentication, menu management, order processing, and analytics while maintaining referential integrity and query performance.

## Architecture

### Technology Stack
- **Database**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Migration Tool**: Drizzle Kit
- **Type Safety**: Full TypeScript inference

### Design Principles
1. **Normalization**: Tables are normalized to 3NF to prevent data redundancy
2. **Referential Integrity**: Foreign keys enforce data consistency
3. **Performance**: Strategic indexes on frequently queried columns
4. **Type Safety**: Drizzle schema provides compile-time type checking
5. **Scalability**: Schema supports serverless cold starts efficiently

## Data Models

### Users Table

Stores customer account information and authentication credentials.

**Table Name**: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| phone | VARCHAR(15) | UNIQUE, NOT NULL | Phone number (login identifier) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| name | VARCHAR(255) | NOT NULL | User's full name |
| default_hostel_block | VARCHAR(50) | NULLABLE | Default delivery location |
| hostel_floor | VARCHAR(10) | NULLABLE | Hostel floor number |
| hostel_room | VARCHAR(10) | NULLABLE | Room number |
| hostel_year | VARCHAR(10) | NULLABLE | Academic year |
| hostel_department | VARCHAR(100) | NULLABLE | Department name |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | User role (USER or ADMIN) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes**:
- `idx_users_phone` on `phone` (for login queries)
- `idx_users_role` on `role` (for admin queries)

### Menu Items Table

Stores all available food and beverage products.

**Table Name**: `menu_items`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(100) | PRIMARY KEY | Deterministic item ID (e.g., "chai-small") |
| name | VARCHAR(255) | NOT NULL | Display name |
| category | VARCHAR(100) | NOT NULL | Category grouping |
| price | INTEGER | NOT NULL | Price in rupees |
| category_order | INTEGER | NOT NULL | Sort order within category |
| is_available | BOOLEAN | NOT NULL, DEFAULT TRUE | Availability flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Item creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes**:
- `idx_menu_items_category` on `category` (for category filtering)
- `idx_menu_items_available` on `is_available` (for active items)

### Orders Table

Stores order header information including delivery details and status.

**Table Name**: `orders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique order identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) | User who placed the order |
| target_hostel_block | VARCHAR(50) | NOT NULL | Delivery location |
| slot_time | TIMESTAMP | NOT NULL | Scheduled delivery time |
| status | order_status_enum | NOT NULL, DEFAULT 'ACCEPTED' | Order status |
| total_amount | INTEGER | NOT NULL | Total price in rupees |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Order placement time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last status update time |

**Enum Type**: `order_status_enum`
- Values: `'ACCEPTED'`, `'ACKNOWLEDGED'`, `'DELIVERED'`, `'REJECTED'`

**Indexes**:
- `idx_orders_user_id` on `user_id` (for user order history)
- `idx_orders_status` on `status` (for admin filtering)
- `idx_orders_slot_time` on `slot_time` (for slot-based queries)
- `idx_orders_created_at` on `created_at` (for rate limiting and analytics)
- `idx_orders_user_created` on `(user_id, created_at)` (composite for rate limiting)

### Order Items Table

Stores individual line items for each order.

**Table Name**: `order_items`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique order item identifier |
| order_id | UUID | NOT NULL, FOREIGN KEY → orders(id) ON DELETE CASCADE | Parent order |
| item_id | VARCHAR(100) | NOT NULL, FOREIGN KEY → menu_items(id) | Menu item reference |
| quantity | INTEGER | NOT NULL, CHECK (quantity > 0) | Number of items |
| price_at_order | INTEGER | NOT NULL | Price snapshot at order time |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Item creation time |

**Indexes**:
- `idx_order_items_order_id` on `order_id` (for order details queries)
- `idx_order_items_item_id` on `item_id` (for item popularity analytics)

## Components and Interfaces

### Drizzle Schema Definition

The schema will be defined in `src/db/schema.ts`:

```typescript
import { pgTable, uuid, varchar, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
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
});

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
});

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
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: varchar('item_id', { length: 100 }).notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  priceAtOrder: integer('price_at_order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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
```

### Database Connection

The database connection will be configured in `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

## SQL Migration Scripts

### Initial Migration SQL

This SQL can be executed directly in Neon's SQL editor or via Drizzle Kit migrations:

```sql
-- Create order status enum
CREATE TYPE order_status_enum AS ENUM ('ACCEPTED', 'ACKNOWLEDGED', 'DELIVERED', 'REJECTED');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  default_hostel_block VARCHAR(50),
  hostel_floor VARCHAR(10),
  hostel_room VARCHAR(10),
  hostel_year VARCHAR(10),
  hostel_department VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE menu_items (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  category_order INTEGER NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  target_hostel_block VARCHAR(50) NOT NULL,
  slot_time TIMESTAMP NOT NULL,
  status order_status_enum NOT NULL DEFAULT 'ACCEPTED',
  total_amount INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id VARCHAR(100) NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_order INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- Create indexes for menu_items
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- Create indexes for orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_slot_time ON orders(slot_time);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);

-- Create indexes for order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
```

### Seed Data for Menu Items

```sql
-- Insert all menu items from the application
INSERT INTO menu_items (id, name, category, price, category_order) VALUES
-- Chai
('chai-small', 'Chai - Small', 'Chai', 10, 1),
('chai-semi-medium', 'Chai - Semi Medium', 'Chai', 14, 2),
('chai-medium', 'Chai - Medium', 'Chai', 18, 3),
('chai-large', 'Chai - Large', 'Chai', 24, 4),

-- Handi Chai
('handi-chai-small', 'Handi Chai - Small', 'Handi Chai', 20, 1),
('handi-chai-large', 'Handi Chai - Large', 'Handi Chai', 30, 2),

-- Liquor Chai
('liquor-chai-small', 'Liquor Chai - Small', 'Liquor Chai', 10, 1),
('liquor-chai-medium', 'Liquor Chai - Medium', 'Liquor Chai', 14, 2),

-- Coffee
('coffee-black', 'Coffee - Black', 'Coffee', 15, 1),
('coffee-milk-small', 'Coffee - Milk (Small)', 'Coffee', 20, 2),
('coffee-milk-medium', 'Coffee - Milk (Medium)', 'Coffee', 30, 3),
('coffee-milk-large', 'Coffee - Milk (Large)', 'Coffee', 40, 4),
('coffee-cold', 'Coffee - Cold', 'Coffee', 49, 5),
('coffee-hot-chocolate', 'Hot Chocolate', 'Coffee', 30, 6),

-- Bun Makhan
('bun-makhan-grilled', 'Grilled Bun Makhan', 'Bun Makhan', 25, 1),
('bun-makhan-cheese', 'Cheese Bun Makhan', 'Bun Makhan', 35, 2),

-- Sandwich
('sandwich-grill', 'Grill Sandwich', 'Sandwich', 30, 1),
('sandwich-grill-cheese-corn', 'Grill Sandwich with Cheese & Corn', 'Sandwich', 40, 2),
('sandwich-grill-chicken-small', 'Grill Chicken Sandwich (Small)', 'Sandwich', 50, 3),
('sandwich-grill-chicken-large', 'Grill Chicken Sandwich (Large)', 'Sandwich', 60, 4),

-- Maggi
('maggi-veg', 'Veg Maggi', 'Maggi', 40, 1),
('maggi-veg-butter', 'Veg Maggi with Butter', 'Maggi', 50, 2),
('maggi-veg-butter-cheese', 'Veg Maggi with Butter and Cheese', 'Maggi', 60, 3),
('maggi-egg', 'Egg Maggi', 'Maggi', 50, 4),
('maggi-egg-butter', 'Egg Maggi with Butter', 'Maggi', 60, 5),
('maggi-chocolate', 'Chocolate Maggi', 'Maggi', 70, 6),
('maggi-lays', 'Lays Maggi', 'Maggi', 69, 7),
('maggi-warehouse', 'Maggi Warehouse', 'Maggi', 89, 8),
('maggi-fish', 'Fish Maggi', 'Maggi', 119, 9),

-- Pasta
('pasta-white-sauce', 'PK White Sauce Pasta', 'Pasta', 89, 1),
('pasta-red-sauce', 'PK Red Sauce Pasta', 'Pasta', 79, 2),
('pasta-addon-chicken', 'Addon Chicken', 'Pasta', 20, 3),

-- French Fries
('french-fries', 'French Fries', 'French Fries', 60, 1),

-- Omelette
('omelette-single', 'Omelette - Single', 'Omelette', 20, 1),
('omelette-double', 'Omelette - Double', 'Omelette', 30, 2),

-- Dim Toste
('dim-toste-single', 'Dim Toste - Single', 'Dim Toste', 30, 1),
('dim-toste-double', 'Dim Toste - Double', 'Dim Toste', 40, 2);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cascade deletion maintains referential integrity

*For any* order with associated order items, when the order is deleted, all associated order items should also be deleted automatically.

**Validates: Requirements 4.4, 5.4**

### Property 2: Foreign key constraints prevent orphaned records

*For any* attempt to insert an order item with a non-existent order ID or menu item ID, or an order with a non-existent user ID, the database should reject the operation.

**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

### Property 3: Rate limiting queries work correctly

*For any* user and time window, the database should accurately count the number of orders placed by that user within the specified time range.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 4: Revenue aggregation is accurate

*For any* set of orders with status 'DELIVERED', the sum of their total amounts should equal the calculated daily revenue.

**Validates: Requirements 8.1**

### Property 5: Order grouping works correctly

*For any* set of orders, grouping by slot time and hostel block should produce accurate counts for each combination.

**Validates: Requirements 8.2**

### Property 6: Status counting is accurate

*For any* set of orders, counting by status should produce accurate counts for each status value.

**Validates: Requirements 8.3**

### Property 7: Date-based filtering works correctly

*For any* date range, filtering orders by creation date should return only orders created within that range.

**Validates: Requirements 8.4**

### Property 8: Enum constraints are enforced

*For any* attempt to insert or update an order with an invalid status value (not in ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED), the database should reject the operation.

**Validates: Requirements 10.1, 10.3**

## Error Handling

### Database Connection Errors
- **Missing DATABASE_URL**: Throw error at startup if environment variable is not set
- **Connection Failures**: Neon handles connection pooling; transient errors should be retried
- **Query Timeouts**: Set reasonable timeout values for serverless environment

### Constraint Violations
- **Unique Constraint**: Phone number duplicates return specific error for user feedback
- **Foreign Key Violations**: Prevent orphaned records; return meaningful error messages
- **Check Constraints**: Quantity must be positive; reject invalid values

### Data Validation
- **Phone Format**: Validate at application layer before database insert
- **Price Values**: Ensure non-negative integers
- **Enum Values**: PostgreSQL enforces valid enum values automatically

## Testing Strategy

### Unit Tests
- Test Drizzle schema type inference
- Test database connection initialization
- Test query builders for common operations

### Integration Tests
- Test CRUD operations for each table
- Test foreign key constraints and cascades
- Test index usage with EXPLAIN queries
- Test rate limiting queries (count orders in 24-hour window)

### Migration Tests
- Test migration scripts in development environment
- Verify all indexes are created
- Verify enum types are properly defined
- Test rollback scenarios

## Performance Considerations

### Query Optimization
- Use prepared statements via Drizzle for query plan caching
- Leverage composite index on `(user_id, created_at)` for rate limiting
- Use `SELECT` specific columns instead of `SELECT *`

### Serverless Optimization
- Drizzle ORM has minimal overhead for cold starts
- Connection pooling handled by Neon
- Keep queries simple to minimize execution time

### Scalability
- Indexes support efficient queries as data grows
- Partition orders table by date if volume exceeds millions of rows
- Consider read replicas for analytics queries in Phase 2

