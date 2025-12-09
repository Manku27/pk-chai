/**
 * Admin authorization utilities for server-side route protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserById, type User } from '@/db/queries/users';

/**
 * Extracts user ID from request headers
 * @param request - Next.js request object
 * @returns User ID string or null if not found
 */
function extractUserIdFromRequest(request: NextRequest): string | null {
    // Try to get user ID from x-user-id header
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return null;
    }

    // Validate UUID format (basic validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        console.warn('[AdminAuth] Invalid user ID format:', userId);
        return null;
    }

    return userId;
}

/**
 * Gets user from request by extracting user ID from headers and fetching from database
 * @param request - Next.js request object
 * @returns User object or null if not found/authenticated
 */
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
    try {
        const userId = extractUserIdFromRequest(request);

        if (!userId) {
            return null;
        }

        // Fetch user from database
        const user = await getUserById(userId);

        if (!user) {
            console.warn('[AdminAuth] User not found for ID:', userId);
            return null;
        }

        return user;
    } catch (error) {
        console.error('[AdminAuth] Error fetching user from request:', error);
        return null;
    }
}

/**
 * Checks if user has admin role
 * @param user - User object or null
 * @returns boolean indicating admin status
 */
export function isAdmin(user: User | null): boolean {
    if (!user) {
        return false;
    }

    return user.role === 'ADMIN';
}

/**
 * Creates a 401 Unauthorized error response
 * @param message - Optional custom error message
 * @returns NextResponse with 401 status
 */
export function createUnauthorizedResponse(message?: string): NextResponse {
    return NextResponse.json(
        {
            error: 'Unauthorized',
            message: message || 'Authentication required',
        },
        { status: 401 }
    );
}

/**
 * Creates a 403 Forbidden error response
 * @param message - Optional custom error message
 * @returns NextResponse with 403 status
 */
export function createForbiddenResponse(message?: string): NextResponse {
    return NextResponse.json(
        {
            error: 'Forbidden',
            message: message || 'Admin access required',
        },
        { status: 403 }
    );
}

/**
 * Validates that the request is from an authenticated admin user
 * Combines user extraction and role validation
 * @param request - Next.js request object
 * @returns Object with user if admin, or error response if not authorized
 */
export async function validateAdminAuth(
    request: NextRequest
): Promise<{ user: User; error: null } | { user: null; error: NextResponse }> {
    try {
        // Extract and fetch user
        const user = await getUserFromRequest(request);

        // Check if user exists (authentication)
        if (!user) {
            console.warn('[AdminAuth] Authorization failed: No authenticated user', {
                path: request.nextUrl.pathname,
                timestamp: new Date().toISOString(),
            });

            return {
                user: null,
                error: createUnauthorizedResponse(),
            };
        }

        // Check if user is admin (authorization)
        if (!isAdmin(user)) {
            console.warn('[AdminAuth] Authorization failed: User is not admin', {
                userId: user.id,
                userRole: user.role,
                path: request.nextUrl.pathname,
                timestamp: new Date().toISOString(),
            });

            return {
                user: null,
                error: createForbiddenResponse(),
            };
        }

        // Success - user is authenticated and authorized
        return {
            user,
            error: null,
        };
    } catch (error) {
        console.error('[AdminAuth] Error during admin validation:', {
            error,
            path: request.nextUrl.pathname,
            timestamp: new Date().toISOString(),
        });

        // Return 500 error for unexpected failures
        return {
            user: null,
            error: NextResponse.json(
                {
                    error: 'Internal Server Error',
                    message: 'Failed to validate authorization',
                },
                { status: 500 }
            ),
        };
    }
}
