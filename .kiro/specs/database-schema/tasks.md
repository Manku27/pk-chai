# Implementation Plan

- [x] 1. Set up Drizzle ORM and database configuration





  - Install required packages: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`
  - Create `src/db/schema.ts` with all table definitions and relations
  - Create `src/db/index.ts` with database connection configuration
  - Create `drizzle.config.ts` for Drizzle Kit configuration
  - Verify DATABASE_URL environment variable is set in `.env.local`
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 2. Create database migration files





  - Generate initial migration using Drizzle Kit: `drizzle-kit generate:pg`
  - Review generated SQL migration files
  - Ensure all tables, indexes, and constraints are included
  - _Requirements: 9.4_

- [x] 3. Execute database migrations in Neon




  - Run migrations using Drizzle Kit: `drizzle-kit push:pg`
  - Verify all tables are created in Neon dashboard
  - Verify all indexes are created
  - Verify enum types are created
  - _Requirements: 1.1, 1.4, 1.5, 1.6, 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 10.1_

- [x] 4. Seed menu items data





  - Create `src/db/seed.ts` script to insert menu items
  - Use the menu data from `src/data/menu.ts` as the source
  - Execute seed script to populate menu_items table
  - Verify all 47 menu items are inserted correctly
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 5. Create database query utilities





  - Create `src/db/queries/users.ts` with user CRUD operations
  - Create `src/db/queries/orders.ts` with order CRUD operations
  - Create `src/db/queries/menu.ts` with menu query operations
  - Create `src/db/queries/analytics.ts` with aggregation queries
  - Implement rate limiting query function (count orders by user in 24-hour window)
  - _Requirements: 7.1, 8.1, 8.2, 8.3, 8.4_

- [ ]* 5.1 Write property test for cascade deletion
  - **Property 1: Cascade deletion maintains referential integrity**
  - **Validates: Requirements 4.4, 5.4**

- [ ]* 5.2 Write property test for foreign key constraints
  - **Property 2: Foreign key constraints prevent orphaned records**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [ ]* 5.3 Write property test for rate limiting queries
  - **Property 3: Rate limiting queries work correctly**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ]* 5.4 Write property test for revenue aggregation
  - **Property 4: Revenue aggregation is accurate**
  - **Validates: Requirements 8.1**

- [ ]* 5.5 Write property test for order grouping
  - **Property 5: Order grouping works correctly**
  - **Validates: Requirements 8.2**

- [ ]* 5.6 Write property test for status counting
  - **Property 6: Status counting is accurate**
  - **Validates: Requirements 8.3**

- [ ]* 5.7 Write property test for date filtering
  - **Property 7: Date-based filtering works correctly**
  - **Validates: Requirements 8.4**

- [ ]* 5.8 Write property test for enum constraints
  - **Property 8: Enum constraints are enforced**
  - **Validates: Requirements 10.1, 10.3**

- [x] 6. Integrate database with authentication system





  - Update `src/services/authStorage.ts` to use database instead of IndexedDB for user data
  - Implement user registration with database insert
  - Implement user login with database query
  - Implement password hashing using bcrypt
  - Update `src/contexts/AuthContext.tsx` to use database queries
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 6.1 Write unit tests for user authentication
  - Test user registration with valid data
  - Test duplicate phone number rejection
  - Test login with valid credentials
  - Test login with invalid credentials
  - Test optional hostel details storage
  - _Requirements: 1.1, 1.3, 1.6_

- [x] 7. Integrate database with order system




  - Create `src/services/orderService.ts` to handle order placement
  - Implement order creation with order items insertion
  - Implement order status updates
  - Implement order history retrieval by user
  - Update checkout flow to save orders to database
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3_

- [ ]* 7.1 Write unit tests for order operations
  - Test order creation with items
  - Test order status updates
  - Test order history retrieval
  - Test default status is ACCEPTED
  - Test timestamp generation
  - _Requirements: 3.5, 3.6, 3.7_

- [x] 8. Implement rate limiting





  - Create rate limiting middleware in `src/middleware/rateLimit.ts`
  - Query orders count for user in last 24 hours
  - Return 429 error if count exceeds 10
  - Apply middleware to order placement API route
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 8.1 Write unit tests for rate limiting
  - Test rate limit allows orders under threshold
  - Test rate limit blocks orders over threshold
  - Test 24-hour rolling window calculation
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Create admin dashboard queries





  - Implement query to fetch orders grouped by slot and hostel block
  - Implement query to fetch orders by status
  - Implement query to calculate daily revenue
  - Implement query to count orders by status
  - Update admin dashboard to use database queries
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 9.1 Write unit tests for analytics queries
  - Test revenue calculation for delivered orders
  - Test order grouping by slot and block
  - Test order counting by status
  - Test date range filtering
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
