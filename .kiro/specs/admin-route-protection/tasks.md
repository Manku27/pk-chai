# Implementation Plan

- [x] 1. Create server-side authorization utilities
  - Create `src/utils/adminAuth.ts` with functions to validate admin access from API requests
  - Implement `getUserFromRequest()` to extract user ID from request headers
  - Implement `isAdmin()` to check if user has ADMIN role
  - Implement `validateAdminAuth()` that combines user extraction and role validation
  - Add error response helpers for 401 (Unauthorized) and 403 (Forbidden) cases
  - Add logging for authorization failures
  - _Requirements: 1.2, 1.4, 3.1, 4.2, 4.3_

- [x] 2. Create client-side admin authentication hook
  - Create `src/hooks/useAdminAuth.ts` that wraps the AuthContext
  - Implement hook to check if current user has ADMIN role
  - Return admin status, loading state, and user object
  - Handle cases where user is null or role is undefined
  - _Requirements: 2.1, 2.3, 3.2_

- [x] 3. Create admin page protection component
  - Create `src/components/AdminProtection.tsx` wrapper component
  - Use `useAdminAuth()` hook to check admin status
  - Show loading spinner while authentication is being checked
  - Redirect to home page if user is not admin
  - Display error message when access is denied
  - Render children only if user is admin
  - _Requirements: 1.1, 1.3, 2.1, 4.1_

- [x] 4. Protect admin API routes
- [x] 4.1 Update `/api/admin/orders/route.ts`
  - Import and use `validateAdminAuth()` at the start of GET handler
  - Return error response if validation fails
  - Proceed with existing logic if validation succeeds
  - _Requirements: 1.2, 1.4, 2.2_

- [x] 4.2 Update `/api/admin/orders/[orderId]/status/route.ts`
  - Import and use `validateAdminAuth()` at the start of PATCH handler
  - Return error response if validation fails
  - Proceed with existing logic if validation succeeds
  - _Requirements: 1.2, 1.4, 2.2_

- [x] 4.3 Update `/api/admin/orders/details/route.ts`
  - Import and use `validateAdminAuth()` at the start of GET handler
  - Return error response if validation fails
  - Proceed with existing logic if validation succeeds
  - _Requirements: 1.2, 1.4, 2.2_

- [x] 4.4 Update `/api/admin/analytics/route.ts`
  - Import and use `validateAdminAuth()` at the start of GET handler
  - Return error response if validation fails
  - Proceed with existing logic if validation succeeds
  - _Requirements: 1.2, 1.4, 2.2_

- [x] 5. Protect admin pages
- [x] 5.1 Update `/admin/page.tsx`
  - Wrap the admin dashboard component with `AdminProtection`
  - Ensure proper error handling and user feedback
  - Test that non-admin users are redirected
  - _Requirements: 1.1, 1.3, 2.1, 4.1_

- [x] 6. Update client-side API calls to include user ID
  - Update admin dashboard API calls to include `x-user-id` header
  - Extract user ID from AuthContext
  - Add header to all fetch requests to `/api/admin/*` endpoints
  - Handle cases where user is not authenticated
  - _Requirements: 2.2, 3.1_

- [ ]* 7. Add unit tests for authorization utilities
  - Write tests for `isAdmin()` function with different user roles
  - Write tests for `validateAdminAuth()` with admin, non-admin, and null users
  - Write tests for error response generation
  - Verify logging functionality
  - _Requirements: 3.1, 4.3_

- [ ]* 8. Add integration tests for protected routes
  - Test admin page access with different user roles
  - Test admin API endpoints with different authorization states
  - Verify redirect behavior for unauthorized access
  - Test error messages and user feedback
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
