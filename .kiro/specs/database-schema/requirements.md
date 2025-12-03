# Requirements Document

## Introduction

This document specifies the requirements for the database schema for the PKChai food ordering application. The database will store user accounts, menu items, orders, and order items using Neon (Serverless PostgreSQL) with Drizzle ORM. The schema must support authentication, order management, real-time admin updates, rate limiting, and analytics.

## Glossary

- **Database Schema**: The structure and organization of tables, columns, relationships, and constraints in the PostgreSQL database
- **Neon**: A serverless PostgreSQL database platform optimized for serverless applications
- **Drizzle ORM**: A TypeScript ORM that provides type-safe database access with minimal overhead
- **User**: A customer account with authentication credentials and optional hostel details
- **Menu Item**: A food or beverage product available for ordering
- **Order**: A complete order placed by a user including delivery details and status
- **Order Item**: A line item within an order representing a specific menu item and quantity
- **Rate Limiting**: A mechanism to prevent abuse by limiting the number of orders per user per time period
- **Order Status**: The current state of an order in the fulfillment workflow (ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED)
- **Hostel Block**: One of four delivery locations for orders
- **Delivery Slot**: A 30-minute time window for order delivery

## Requirements

### Requirement 1

**User Story:** As a system, I need to store user account information securely, so that users can authenticate and place orders.

#### Acceptance Criteria

1. WHEN a user registers THEN the Database Schema SHALL store the user's phone number as a unique identifier
2. WHEN storing passwords THEN the Database Schema SHALL store only hashed passwords, never plain text
3. WHEN a user provides hostel details THEN the Database Schema SHALL store block, floor, room, year, and department as optional fields
4. WHEN a user account is created THEN the Database Schema SHALL assign a unique UUID as the primary key
5. WHEN storing user data THEN the Database Schema SHALL record creation and update timestamps
6. WHEN a phone number is used for registration THEN the Database Schema SHALL enforce uniqueness through a unique constraint

### Requirement 2

**User Story:** As a system, I need to store menu items with their details, so that users can browse and order available products.

#### Acceptance Criteria

1. WHEN a menu item is stored THEN the Database Schema SHALL include a deterministic string ID as the primary key
2. WHEN storing menu items THEN the Database Schema SHALL include name, category, price, and category order fields
3. WHEN menu items are queried THEN the Database Schema SHALL support efficient retrieval by category
4. WHEN a menu item is stored THEN the Database Schema SHALL include an availability flag to enable/disable items
5. WHEN storing prices THEN the Database Schema SHALL use integer type to represent rupees

### Requirement 3

**User Story:** As a system, I need to store complete order information, so that orders can be tracked and fulfilled.

#### Acceptance Criteria

1. WHEN an order is placed THEN the Database Schema SHALL store a reference to the user who placed it
2. WHEN an order is created THEN the Database Schema SHALL store the target hostel block for delivery
3. WHEN an order is placed THEN the Database Schema SHALL store the selected delivery slot as a timestamp
4. WHEN an order is created THEN the Database Schema SHALL store the total amount
5. WHEN an order is placed THEN the Database Schema SHALL default the status to ACCEPTED
6. WHEN an order is stored THEN the Database Schema SHALL record the creation timestamp
7. WHEN an order status changes THEN the Database Schema SHALL allow updates to ACKNOWLEDGED, DELIVERED, or REJECTED

### Requirement 4

**User Story:** As a system, I need to store individual order items, so that each order's contents are preserved accurately.

#### Acceptance Criteria

1. WHEN an order item is stored THEN the Database Schema SHALL reference both the order and the menu item
2. WHEN storing order items THEN the Database Schema SHALL include the quantity ordered
3. WHEN an order item is created THEN the Database Schema SHALL store the price at the time of order
4. WHEN an order is deleted THEN the Database Schema SHALL automatically delete associated order items through cascade deletion
5. WHEN querying order items THEN the Database Schema SHALL support efficient retrieval by order ID

### Requirement 5

**User Story:** As a system, I need to enforce referential integrity, so that data relationships remain consistent.

#### Acceptance Criteria

1. WHEN an order references a user THEN the Database Schema SHALL enforce a foreign key constraint
2. WHEN an order item references an order THEN the Database Schema SHALL enforce a foreign key constraint
3. WHEN an order item references a menu item THEN the Database Schema SHALL enforce a foreign key constraint
4. WHEN a referenced record is deleted THEN the Database Schema SHALL handle the deletion according to defined cascade rules
5. WHEN invalid foreign key values are inserted THEN the Database Schema SHALL reject the operation

### Requirement 6

**User Story:** As a system, I need to support efficient queries for common operations, so that the application performs well.

#### Acceptance Criteria

1. WHEN querying users by phone number THEN the Database Schema SHALL use an index for fast lookup
2. WHEN querying orders by user THEN the Database Schema SHALL use an index on the user foreign key
3. WHEN querying orders by status THEN the Database Schema SHALL use an index for efficient filtering
4. WHEN querying orders by slot time THEN the Database Schema SHALL use an index for time-based queries
5. WHEN querying order items by order THEN the Database Schema SHALL use an index on the order foreign key

### Requirement 7

**User Story:** As a system, I need to support rate limiting data, so that order abuse can be prevented.

#### Acceptance Criteria

1. WHEN checking rate limits THEN the Database Schema SHALL support efficient queries for counting orders per user within a time window
2. WHEN orders are created THEN the Database Schema SHALL store timestamps that enable 24-hour rolling window calculations
3. WHEN rate limit checks occur THEN the Database Schema SHALL support queries that count orders by user and time range
4. WHEN implementing rate limiting THEN the Database Schema SHALL not require additional tables beyond the orders table

### Requirement 8

**User Story:** As a system, I need to support analytics queries, so that business metrics can be calculated.

#### Acceptance Criteria

1. WHEN calculating daily revenue THEN the Database Schema SHALL support aggregation queries on delivered orders
2. WHEN analyzing order patterns THEN the Database Schema SHALL support grouping by slot time and hostel block
3. WHEN generating reports THEN the Database Schema SHALL support counting orders by status
4. WHEN analyzing trends THEN the Database Schema SHALL support date-based filtering and aggregation
5. WHEN querying analytics data THEN the Database Schema SHALL use indexes to optimize common aggregation queries

### Requirement 9

**User Story:** As a developer, I need the schema to be type-safe and maintainable, so that database operations are reliable.

#### Acceptance Criteria

1. WHEN defining the schema THEN the Database Schema SHALL use Drizzle ORM schema definitions
2. WHEN accessing the database THEN the Database Schema SHALL provide TypeScript type inference for all tables
3. WHEN performing queries THEN the Database Schema SHALL provide compile-time type checking
4. WHEN the schema changes THEN the Database Schema SHALL support migrations through Drizzle Kit
5. WHEN defining relationships THEN the Database Schema SHALL use Drizzle's relation syntax for type-safe joins

### Requirement 10

**User Story:** As a system, I need to handle enum types properly, so that status and location values are constrained.

#### Acceptance Criteria

1. WHEN storing order status THEN the Database Schema SHALL use an enum type with values ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED
2. WHEN storing hostel blocks THEN the Database Schema SHALL use a text field that can be validated at the application level
3. WHEN enum values are inserted THEN the Database Schema SHALL reject invalid values
4. WHEN querying by enum values THEN the Database Schema SHALL support efficient filtering
5. WHEN the schema is defined THEN the Database Schema SHALL use PostgreSQL enum types for order status
