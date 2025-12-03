# Database Setup SQL Scripts

This document contains all the SQL scripts you need to set up your PKChai database in Neon.

## Step 1: Create Tables and Indexes

Run this SQL in your Neon SQL Editor:

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

## Step 2: Seed Menu Items

Run this SQL to populate your menu with all items:

```sql
-- Insert all menu items
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

## Step 3: Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check table creation
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check menu items count (should be 47)
SELECT COUNT(*) as total_items FROM menu_items;

-- Check menu items by category
SELECT category, COUNT(*) as item_count 
FROM menu_items 
GROUP BY category 
ORDER BY category;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check enum type
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'order_status_enum'::regtype;
```

## Optional: Create Test Admin User

If you want to create a test admin user (password will need to be hashed in your application):

```sql
-- Note: Replace 'HASHED_PASSWORD_HERE' with an actual bcrypt hash
INSERT INTO users (phone, password_hash, name, role) 
VALUES ('9999999999', 'HASHED_PASSWORD_HERE', 'Admin User', 'ADMIN');
```

## Database Schema Summary

### Tables Created:
1. **users** - Customer accounts with authentication
2. **menu_items** - Food and beverage products (47 items)
3. **orders** - Order headers with delivery details
4. **order_items** - Individual line items for each order

### Key Features:
- ✅ UUID primary keys for users, orders, and order_items
- ✅ String primary keys for menu_items (deterministic IDs)
- ✅ Foreign key constraints with cascade deletion
- ✅ Enum type for order status
- ✅ Indexes for efficient queries
- ✅ Default values and timestamps
- ✅ Unique constraint on phone numbers

### Next Steps:
1. Run the SQL scripts above in your Neon SQL Editor
2. Update your `.env.local` with the DATABASE_URL from Neon
3. Install Drizzle packages: `npm install drizzle-orm @neondatabase/serverless`
4. Follow the implementation tasks in `tasks.md` to integrate the database with your application
