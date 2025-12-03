# Business Requirement Document (BRD)
**Project Name:** PKChai
**Version:** 1.1
**Date:** December 03, 2025

## 1. Executive Summary
A lightweight web application enabling students to pre-order snacks/chai for delivery to 4 specific hostel blocks. The system prioritizes speed of ordering for students and operational clarity for the delivery team.
**Primary Goal:** Manage order volume for specific 30-minute delivery slots while maintaining a low-latency feedback loop for admins.

---

## 2. Functional Requirements

### 2.1. User Module (Student Facing)
* **Authentication (The "Local" Method):**
    * **Inputs:** Phone Number, Password, Name, Default Hostel Block (A/B/C/D), Room Number (**Optional**).
    * **Mechanism:**
        * On Login/Sign-up, validations occur against the DB.
        * On success, credentials (`Phone`, `Password`) are stored in **IndexedDB** (client-side).
        * **Runtime State:** On app load, a React custom Hook retrieves credentials from IndexedDB and sets them into a global Context/State for rapid access during the session.
    * **Persistence:** Auto-login using the IndexedDB data.

* **Menu & Cart:**
    * **Display:** Flat list of items. Each item to be treated a separate item, use a deterministic id for it.
    * **Cart:** Simple increment/decrement counter.
    ```
    1.chai
Small-10
Semi medium-14
Medium-18
Large-24

2.Handi chai
Small-20
Large-30

3.Liquor chai
Small 10
Medium-14

4.coffee 
Black -15rs
Milk-20/30/40
Cold -49
Hot chocolate-30

5.Bun makhan
Grilled Bun makhan-25rs
Cheese bun makhan-35rs

6.sandwich 
Grill sandwich -30₹ 
Grill sandwich with cheese & corn -40₹
Grill chicken sandwich- 50rs/60rs

7.Maggi
Veg Maggi-40rs
Veg maggi with butter- 50rs
Veg maggi with butter and chesse-60rs
Egg maggi -50rs 
Egg maggi with butter -60rs
Chocolate maggi- 70rs
Lays maggi-69rs
Maggi warehouse-89rs
Fish maggi-119rs

8.pasta
Pk white sauce pasta-89rs
Pk red sauce pasta - 79rs
Addon chicken-20rs. 


10.French fries -60rs
11.omlete
Single-20rs
Double- 30rs

12.Dim toste
Single-30rs
Double-40rs
    ```

* **Slot Selection & Location:**
    * **Delivery Location:** Pre-filled with the user's "Default Hostel Block" (from profile), but **must be editable** via a dropdown at checkout (e.g., User lives in Block A but is hanging out in Block C).
    * **Slot Logic:**
        * **Available Slots:** 11:00 AM to 5:00 PM, every 30 minutes (11:00 AM, 11:30 AM, 12:00 PM, ..., 5:00 PM).
        * User selects a slot (e.g., 11:30 AM).
        * **Constraint:** `Order_Time <= Slot_Time - 30 minutes`.
        * **No Maximum Orders Per Slot:** Unlimited orders can be placed for any slot.
    * **Security (Rate Limiting):**
        * **Rule:** A single user (identified by Phone) cannot place more than **10 orders** within a 24-hour rolling window.
        * **Fail Action:** API returns `429 Too Many Requests`.
    ```
    Delivery Locations:
    1. Jaadavpur Main Hostel
    2. New block hostel
    3. KPC boys hostel
    4. KPC girls hostel
    ```

* **Order Placement:**
    * **Payment:** COD only.
    * **Confirmation:** Immediate "Order Placed" screen.

### 2.2. Admin Module (The Dashboard)
* **Access:** Secure route (e.g., `/master`).
* **Live Order Feed (Hybrid approach):**
    * **Primary:** Server-Sent Events (SSE).
    * **Fallback:**The Vercel Hobby connection times out (common on free tier), the client will use **Short Polling** (fetching data every 15 seconds) to ensure no orders are missed.
* **Order Status Workflow:**
    * **State 1: ACCEPTED (Default/Auto):**
        * System automatically sets this upon database entry.
        * User sees: "Order Received".
    * **State 2: ACKNOWLEDGED (Manual Action):**
        * Admin clicks a button to confirm kitchen has seen the order.
        * User sees: "Preparing".
    * **State 3: DELIVERED (Manual Action):**
        * Cash collected, food handed over.
    * **State 4: REJECTED (Manual Action):**
        * Admin cancels order (e.g., out of stock).
* **View:**
    * Grouped by **Slot Time** -> **Hostel Block**.

---

## 3. Analytics & Metrics (Phase 2)
* **Primary Dashboard View:**
    1.  **Total Revenue (Daily):** Sum of `Delivered` orders.
    2.  **Order Count:** Total vs. Rejected.
 
* **Visualizations:**
    1.  **Traffic by Slot (Bar Chart):** Identify peak times.
    2.  **Hostel Demand (Pie Chart):** Logistics planning.
    3.  **Consumption Heatmap:** Block vs. Time Slot intensity.

---

## 4. Technical Architecture

### 4.1. Stack
* **Framework:** **Next.js 16** (App Router).
* **Database:** Neon (Serverless PostgreSQL).
* **ORM:** **Drizzle ORM**. (Decision: Prisma is too heavy for serverless cold starts. Drizzle provides the necessary type safety and SQL-like control without the bloat).
* **Real-time:** Native SSE via Next.js API Routes (with `SWR` or `TanStack Query` for polling fallback).
* **Styling:** **Custom CSS** (CSS Modules or Global CSS). No Tailwind.

### 4.2. Data Model (Schema Draft)

**Table: Users**
* `phone` (PK, String)
* `password_hash` (String)
* `name` (String)
* `default_hostel_block` (Enum: A, B, C, D)
* `room_no` (String, **Nullable**)
* `role` (Enum: USER, ADMIN)
* `orders_today_count` (Int) — *Helper column or calculated on fly for rate limiting.*

**Table: MenuItems**
* `id` (PK)
* `name` (String)
* `category` (String)
* `price` (Int)
* `is_available` (Boolean)

**Table: Orders**
* `id` (PK)
* `user_phone` (FK)
* `target_hostel_block` (Enum: A, B, C, D) — *Stored per order.*
* `slot_time` (Timestamp)
* `status` (Enum: ACCEPTED, ACKNOWLEDGED, REJECTED, DELIVERED) — Default: ACCEPTED.
* `total_amount` (Int)
* `created_at` (Timestamp)

**Table: OrderItems** (Junction)
* `order_id` (FK)
* `item_id` (FK)
* `quantity` (Int)
* `price_at_order` (Int)

---

## 5. Risk Register
| Risk ID | Risk Description | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **R1** | **Vercel Hobby Timeout (SSE)** | Admin feed stops updating live. | **Hybrid Architecture:** Code the frontend to detect SSE closure and auto-switch to 15s polling. |
| **R2** | **DDoS / Spam Orders** | Students writing scripts to flood DB. | **Rate Limiting:** Max 10 orders per phone number per day. |
| **R3** | **Custom CSS Maintenance** | CSS scales poorly compared to utility classes. | Use strict CSS Modules or a BEM-like naming convention to prevent global namespace pollution. |
| **R4** | **IndexedDB Complexity** | Reading DB is async; might cause "flash" on load. | Show a "Loading..." skeleton until the `useEffect` pulls credentials from IndexedDB to State. |

---

## 6. Phased Implementation Plan

### Phase 1: Core Loop (Target: 4-5 Days)
* **Setup:** Next.js 16 + Drizzle + Neon.
* **User App:** IndexedDB wrapper utility, Custom CSS Layouts, Dynamic Location Selector, Rate Limit Logic.
* **Admin App:** Status Workflow (`Accepted` -> `Acknowledged` -> `Delivered`), Polling/SSE Toggle.

### Phase 2: Intelligence (Target: +3 Days)
* **Metrics:** SQL Aggregations.
* **Charts:** Chart.js integration (Custom CSS styling for charts will take extra time).

### Phase 3: Notifications (Post-Launch)
* **Telegram Bot:** Webhook integration.

---