# Design Document

## Overview

The Admin Route Protection system implements authentication and authorization controls for admin pages and API endpoints. The design leverages Next.js middleware for route protection, server-side utilities for API authorization, and client-side hooks for UI protection. The system validates that users have the ADMIN role before granting access to administrative features.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin Page Component                                 │  │
│  │  - useAdminAuth() hook checks role                   │  │
│  │  - Redirects non-admins to home                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Middleware                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Route Matcher: /admin/*                             │  │
│  │  - Checks localStorage for user                      │  │
│  │  - Validates role === 'ADMIN'                        │  │
│  │  - Redirects or allows access                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Route Handlers                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin API Endpoints: /api/admin/*                   │  │
│  │  - validateAdminAuth() utility                       │  │
│  │  - Returns 401/403 or proceeds                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
│  - User role stored in users.role column                   │
│  - Default: 'USER', Admin: 'ADMIN'                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Client-Side Protection (Admin Pages)**
   - User navigates to `/admin` or `/admin/*`
   - React component uses `useAdminAuth()` hook
   - Hook checks `AuthContext` for user and role
   - If not admin, redirects to home page with error message

2. **Server-Side Protection (API Routes)**
   - Client makes request to `/api/admin/*`
   - API route handler calls `validateAdminAuth(request)`
   - Utility extracts user from request headers/cookies
   - Validates role === 'ADMIN'
   - Returns error response or allows processing

3. **Middleware Protection (Route Level)**
   - User attempts to access `/admin/*` route
   - Next.js middleware intercepts request
   - Checks authentication and authorization
   - Redirects to home or allows access

## Components and Interfaces

### 1. Server-Side Authorization Utility

**File**: `src/utils/adminAuth.ts`

```typescript
/**
 * Validates that the request is from an authenticated admin user
 * @param request - Next.js request object
 * @returns User object if admin, null otherwise
 */
export async function validateAdminAuth(
  request: NextRequest
): Promise<{ user: User; error: null } | { user: null; error: NextResponse }>;

/**
 * Gets user from request (from headers or other auth mechanism)
 * @param request - Next.js request object
 * @returns User object or null
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null>;

/**
 * Checks if user has admin role
 * @param user - User object
 * @returns boolean indicating admin status
 */
export function isAdmin(user: User | null): boolean;
```

**Implementation Details**:
- Extracts user ID from request headers (e.g., `x-user-id`)
- Queries database to fetch user by ID
- Validates role === 'ADMIN'
- Returns appropriate error responses (401 for unauthenticated, 403 for unauthorized)
- Logs authorization failures for security monitoring

### 2. Client-Side Admin Hook

**File**: `src/hooks/useAdminAuth.ts`

```typescript
/**
 * Hook for protecting admin pages on the client side
 * @returns Object with admin status and loading state
 */
export function useAdminAuth(): {
  isAdmin: boolean;
  isLoading: boolean;
  user: User | null;
};
```

**Implementation Details**:
- Uses `useAuth()` from AuthContext
- Checks if `user.role === 'ADMIN'`
- Provides loading state during auth initialization
- Returns admin status for conditional rendering

### 3. Admin Page Protection Component

**File**: `src/components/AdminProtection.tsx`

```typescript
/**
 * Wrapper component that protects admin pages
 * Redirects non-admin users to home page
 */
export function AdminProtection({ 
  children 
}: { 
  children: React.ReactNode 
}): JSX.Element;
```

**Implementation Details**:
- Uses `useAdminAuth()` hook
- Shows loading state while checking auth
- Redirects to home page if not admin
- Displays error message about insufficient permissions
- Renders children if user is admin

### 4. Next.js Middleware (Optional Enhancement)

**File**: `middleware.ts` (root level)

```typescript
/**
 * Next.js middleware for route-level protection
 * Intercepts requests to /admin/* routes
 */
export function middleware(request: NextRequest): NextResponse;

export const config = {
  matcher: '/admin/:path*',
};
```

**Implementation Details**:
- Matches all `/admin/*` routes
- Checks for user session/token
- Validates admin role
- Redirects to home page if unauthorized
- Allows request to proceed if authorized

**Note**: This is an optional enhancement. The primary protection will be at the component and API level since Next.js middleware cannot directly access localStorage or client-side state.

## Data Models

### User Role Extension

The existing `User` interface already includes a `role` field:

```typescript
interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  hostelDetails?: { ... };
  role?: string;  // 'USER' | 'ADMIN'
  createdAt: number;
  updatedAt: number;
}
```

**Database Schema** (already exists in `src/db/schema.ts`):
```typescript
role: varchar('role', { length: 20 }).notNull().default('USER')
```

### Request Headers for API Authentication

Admin API routes will expect user identification through:
- **Option 1**: Request header `x-user-id` containing the user's ID
- **Option 2**: Session token/cookie (if session management is implemented)
- **Option 3**: Extract from request body (less secure, not recommended)

For the initial implementation, we'll use **Option 1** with client-side setting of the `x-user-id` header.

## Error Handling

### Client-Side Errors

1. **Unauthenticated User**
   - Redirect to home page
   - Display toast/message: "Please log in to access admin features"

2. **Unauthorized User (Non-Admin)**
   - Redirect to home page
   - Display toast/message: "You don't have permission to access this page"

3. **Loading State**
   - Show loading spinner while checking authentication
   - Prevent flash of admin content

### Server-Side Errors

1. **401 Unauthorized** (No user authentication)
   ```json
   {
     "error": "Unauthorized",
     "message": "Authentication required"
   }
   ```

2. **403 Forbidden** (User is not admin)
   ```json
   {
     "error": "Forbidden",
     "message": "Admin access required"
   }
   ```

3. **500 Internal Server Error** (Database/system error)
   ```json
   {
     "error": "Internal Server Error",
     "message": "Failed to validate authorization"
   }
   ```

### Logging

All authorization failures will be logged with:
- Timestamp
- User ID (if available)
- Requested route/endpoint
- Failure reason (unauthenticated vs unauthorized)

## Testing Strategy

### Unit Tests

1. **Server-Side Utilities** (`src/utils/adminAuth.ts`)
   - Test `isAdmin()` with USER role → returns false
   - Test `isAdmin()` with ADMIN role → returns true
   - Test `isAdmin()` with null user → returns false
   - Test `validateAdminAuth()` with valid admin → returns user
   - Test `validateAdminAuth()` with non-admin → returns 403 error
   - Test `validateAdminAuth()` with no user → returns 401 error

2. **Client-Side Hook** (`src/hooks/useAdminAuth.ts`)
   - Test hook with admin user → returns isAdmin: true
   - Test hook with regular user → returns isAdmin: false
   - Test hook with no user → returns isAdmin: false
   - Test loading state during auth initialization

### Integration Tests

1. **Admin Page Protection**
   - Navigate to `/admin` as regular user → redirects to home
   - Navigate to `/admin` as admin → shows admin page
   - Navigate to `/admin` without login → redirects to home

2. **API Route Protection**
   - Call `/api/admin/orders` without auth → returns 401
   - Call `/api/admin/orders` as regular user → returns 403
   - Call `/api/admin/orders` as admin → returns data

### Manual Testing Checklist

- [ ] Create test user with role 'USER'
- [ ] Create test user with role 'ADMIN'
- [ ] Attempt to access `/admin` as regular user
- [ ] Attempt to access `/admin` as admin user
- [ ] Attempt to access `/admin` without login
- [ ] Call admin API endpoints with different user roles
- [ ] Verify error messages are clear and helpful
- [ ] Check that authorization failures are logged

## Security Considerations

1. **Role Validation**
   - Always validate role on the server side
   - Never trust client-side role checks alone
   - Client-side checks are for UX only

2. **User ID Transmission**
   - Use secure headers for user identification
   - Consider implementing proper session management
   - Validate user ID format (UUID)

3. **Error Messages**
   - Don't reveal sensitive information in error messages
   - Use generic messages for security failures
   - Log detailed errors server-side only

4. **Rate Limiting**
   - Consider adding rate limiting to admin endpoints
   - Prevent brute force authorization attempts
   - Reuse existing rate limiting middleware pattern

## Implementation Phases

### Phase 1: Core Authorization Utilities
- Create `src/utils/adminAuth.ts` with server-side validation
- Create `src/hooks/useAdminAuth.ts` for client-side checks
- Add logging for authorization failures

### Phase 2: API Route Protection
- Update all `/api/admin/*` routes to use `validateAdminAuth()`
- Test API protection with different user roles
- Verify error responses

### Phase 3: Client-Side Page Protection
- Create `AdminProtection` wrapper component
- Update `/admin/page.tsx` to use protection
- Add user feedback for authorization failures

### Phase 4: Testing and Refinement
- Write unit tests for utilities and hooks
- Perform integration testing
- Add documentation and examples

## Migration Notes

### Existing Admin Routes to Update

1. `/api/admin/orders/route.ts`
2. `/api/admin/orders/[orderId]/status/route.ts`
3. `/api/admin/orders/details/route.ts`
4. `/api/admin/analytics/route.ts`

### Existing Admin Pages to Update

1. `/admin/page.tsx` - Main admin dashboard

### Breaking Changes

None. This is an additive feature that adds protection to existing routes.

## Future Enhancements

1. **Session Management**
   - Implement proper session tokens
   - Add token refresh mechanism
   - Store sessions in database

2. **Role-Based Access Control (RBAC)**
   - Add more granular permissions
   - Create role hierarchy (e.g., SUPER_ADMIN, ADMIN, MODERATOR)
   - Implement permission-based access

3. **Audit Logging**
   - Log all admin actions
   - Create audit trail for compliance
   - Add admin activity dashboard

4. **Two-Factor Authentication**
   - Require 2FA for admin accounts
   - Add SMS/email verification
   - Implement backup codes
