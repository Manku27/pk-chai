/**
 * Authentication utility functions
 */

/**
 * Hashes a password using bcrypt (server-side only)
 * This is a placeholder that will be replaced by server-side implementation
 * @param password - The password to hash
 * @returns Promise resolving to the bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  // This will be handled by server-side API
  if (typeof window === 'undefined') {
    // Server-side: use bcrypt
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  } else {
    // Client-side: throw error - should use API
    throw new Error('Password hashing must be done server-side');
  }
}

/**
 * Verifies a password against a stored bcrypt hash (server-side only)
 * @param password - The password to verify
 * @param storedHash - The stored bcrypt hash to compare against
 * @returns Promise resolving to true if password matches
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  // This will be handled by server-side API
  if (typeof window === 'undefined') {
    // Server-side: use bcrypt
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, storedHash);
  } else {
    // Client-side: throw error - should use API
    throw new Error('Password verification must be done server-side');
  }
}

/**
 * Validates a phone number
 * @param phone - The phone number to validate
 * @returns true if valid (10 digits), false otherwise
 */
export function validatePhone(phone: string): boolean {
  // Check if phone is exactly 10 digits
  return /^\d{10}$/.test(phone);
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns true if valid (minimum 6 characters), false otherwise
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validates that a required field is not empty
 * @param value - The value to validate
 * @returns true if not empty (after trimming), false otherwise
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Extracts initials from a user's name
 * @param name - The full name
 * @returns Initials (e.g., "JD" for "John Doe", "M" for "Madonna")
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  
  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 1) {
    // Single name: return first letter
    return parts[0][0].toUpperCase();
  }
  
  // Multiple names: return first letter of first and last name
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * Generates a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
