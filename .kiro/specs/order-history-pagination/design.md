# Design Document

## Overview

This design implements cursor-based pagination for the order history feature to improve performance and user experience. The solution adds pagination parameters to the existing API route, updates the database queries to support efficient pagination, and enhances the profile page with pagination controls.

The implementation follows REST API best practices for pagination and maintains consistency with the existing codebase architecture.

## Architecture

### Current Flow
```
Profile Page → GET /api/orders/history/[userId] → All Orders → Display All
```

### New Flow with Pagination
```
Profile Page → GET /api/orders/history/[userId]?page=1&limit=10 → Paginated Orders + Metadata → Display Page with Controls
```

### Key Components
1. **API Route Enhancement**: Add query parameter support for `page` and `limit`
2. **Database Query Updates**: Implement LIMIT and OFFSET in order queries
3. **Profile Page Updates**: Add pagination state management and UI controls
4. **URL State Management**: Sync pagination state with URL query parameters

## Components and Interfaces

### API Route: `/api/orders/history/[userId]`

**HTTP Method**: GET

**Query Parameters**:
- `page` (number, optional): Page number (1-indexed), defaults to 1
- `limit` (number, optional): Orders per page, defaults to 10, max 50

**Response Format** (Success - 200):
```typescript
{
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
}
```

**Error Responses**:
- 400: Invalid pagination parameters (negative page, invalid limit)
- 500: Database or server error

### Database Query Updates

**New Function**: `getOrdersWithItemsByUserIdPaginated`

```typescript
async function getOrdersWithItemsByUserIdPaginated(
  userId: string,
  page: number,
  limit: number
): Promise<{
  orders: Array<{ order: Order; items: OrderItem[] }>;
  total: number;
}>
```

**Implementation Details**:
- Use `OFFSET` for skipping records: `(page - 1) * limit`
- Use `LIMIT` for page size
- Execute separate count query to get total orders
- Maintain existing ordering (newest first)

### Profile Page Updates

**New State Variables**:
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageSize] = useState(10);
const [totalPages, setTotalPages] = useState(0);
const [hasNextPage, setHasNextPage] = useState(false);
const [hasPreviousPage, setHasPreviousPage] = useState(false);
```

**URL Synchronization**:
- Read `page` from URL query parameters on mount
- Update URL when page changes using `router.push()`
- Preserve pagination state across page refreshes

**Pagination Controls Component**:
```typescript
<div className={styles.pagination}>
  <button 
    disabled={!hasPreviousPage} 
    onClick={() => handlePageChange(currentPage - 1)}
  >
    Previous
  </button>
  <span>Page {currentPage} of {totalPages}</span>
  <button 
    disabled={!hasNextPage} 
    onClick={() => handlePageChange(currentPage + 1)}
  >
    Next
  </button>
</div>
```

## Data Models

### API Response Type
```typescript
interface PaginatedOrderHistoryResponse {
  orders: OrderDisplay[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalOrders: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### Database Query Return Type
```typescript
interface PaginatedOrdersResult {
  orders: Array<{
    order: Order;
    items: OrderItem[];
  }>;
  total: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Pagination controls visibility based on order count

*For any* user with order count and page size, pagination controls should be visible if and only if the total number of orders exceeds the page size.

**Validates: Requirements 1.2**

### Property 2: Page size limit enforcement

*For any* API request with a limit parameter exceeding 50, the actual number of orders returned should not exceed 50.

**Validates: Requirements 2.5**

### Property 3: Pagination metadata completeness

*For any* successful paginated API response, the response should include all required pagination metadata fields: currentPage, pageSize, totalOrders, totalPages, hasNextPage, and hasPreviousPage.

**Validates: Requirements 2.3**

### Property 4: Invalid pagination parameters rejection

*For any* API request with invalid pagination parameters (negative page numbers, non-numeric values, or zero page numbers), the API should return a 400 status code.

**Validates: Requirements 2.4**

### Property 5: Previous button disabled on first page

*For any* pagination state where currentPage equals 1, the "Previous" button should be disabled.

**Validates: Requirements 1.5**

### Property 6: Next button disabled on last page

*For any* pagination state where currentPage equals totalPages, the "Next" button should be disabled.

**Validates: Requirements 1.6**

### Property 7: URL state synchronization

*For any* page navigation action, the URL query parameters should be updated to reflect the current page number.

**Validates: Requirements 3.1, 3.2, 3.5**

### Property 8: Out-of-bounds page requests

*For any* page request where the page number exceeds the total number of pages, the API should return an empty orders array with valid pagination metadata.

**Validates: Requirements 4.3**

### Property 9: Results count within page size

*For any* valid paginated request, the number of orders returned should be less than or equal to the requested page size (or default page size if not specified).

**Validates: Requirements 2.2**

## Error Handling

### API Route Error Handling

1. **Invalid Page Parameter** (400):
   - Check if page is a positive integer
   - Return: `{ error: 'Page must be a positive integer' }`

2. **Invalid Limit Parameter** (400):
   - Check if limit is a positive integer
   - Return: `{ error: 'Limit must be a positive integer' }`

3. **Limit Exceeds Maximum** (200 with capped value):
   - Silently cap limit at 50
   - Continue processing with capped value

4. **Database Errors** (500):
   - Catch all database exceptions
   - Log detailed error server-side
   - Return: `{ error: 'Failed to retrieve order history' }`

5. **Out of Bounds Page** (200):
   - Return empty orders array with valid pagination metadata
   - Not treated as an error

### Client-Side Error Handling

1. **Network Errors**:
   - Display: "Unable to load orders. Please check your connection."
   - Show retry button
   - Maintain current page state

2. **Server Errors (500)**:
   - Display: "Failed to load orders. Please try again later."
   - Show retry button
   - Log error to console

3. **Empty Results**:
   - Display friendly empty state
   - Hide pagination controls
   - Show "Browse Menu" call-to-action

## Testing Strategy

### Unit Testing

We will write focused unit tests for:

1. **API Route Tests**:
   - Valid pagination parameters return correct page
   - Default values applied when parameters omitted
   - Invalid parameters return 400 errors
   - Limit capping works correctly
   - Pagination metadata calculated correctly
   - Out-of-bounds pages handled gracefully

2. **Database Query Tests**:
   - LIMIT and OFFSET applied correctly
   - Total count query returns accurate count
   - Empty results handled properly
   - Ordering maintained (newest first)

3. **Profile Page Tests**:
   - Initial load fetches first page
   - Page navigation updates state and URL
   - Pagination controls render conditionally
   - Button states (enabled/disabled) correct
   - URL parameters parsed correctly on mount

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) to verify universal properties:

1. **Property 1 Test**: Generate random order counts and page sizes, verify pagination controls visibility
2. **Property 2 Test**: Generate random limit values including those > 50, verify capping
3. **Property 3 Test**: Generate random valid pagination requests, verify all metadata fields present
4. **Property 4 Test**: Generate random invalid parameters, verify 400 responses
5. **Property 5 Test**: Generate pagination states with page=1, verify previous button disabled
6. **Property 6 Test**: Generate pagination states with page=totalPages, verify next button disabled
7. **Property 7 Test**: Generate random page navigation actions, verify URL updates
8. **Property 8 Test**: Generate out-of-bounds page requests, verify empty results with valid metadata
9. **Property 9 Test**: Generate random valid requests, verify result count <= page size

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage.

**Test Tagging**: Each property-based test will include a comment in this format:
```typescript
// Feature: order-history-pagination, Property 1: Pagination controls visibility based on order count
```

### Integration Testing

- Test complete pagination flow from profile page through API to database
- Verify URL state persistence across page refreshes
- Test navigation between multiple pages
- Verify correct data displayed for each page

## Implementation Notes

1. **Backward Compatibility**: The API route will maintain backward compatibility by using default values when pagination parameters are omitted.

2. **Performance**: Database queries will use indexed columns (userId, createdAt) for efficient pagination. The separate count query is acceptable for this use case.

3. **URL State Management**: Use Next.js router's `push` method with shallow routing to avoid full page reloads during pagination.

4. **Page Size Selection**: Initially implement fixed page size of 10. Future enhancement could add user-selectable page sizes.

5. **Cursor vs Offset Pagination**: While cursor-based pagination is generally more efficient, offset-based pagination is simpler and sufficient for this use case where order history is relatively stable.

6. **Loading States**: Show loading spinner during page transitions to provide user feedback.

7. **Accessibility**: Ensure pagination controls are keyboard navigable and screen reader friendly with proper ARIA labels.
