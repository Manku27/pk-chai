'use client';

/**
 * Auth Context Provider
 * Manages global authentication state and operations with IndexedDB persistence
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, RegisterData, AuthContextValue } from '@/types/auth';
import { initializeAuthStorage, AuthStorageAdapter, StoredSession } from '@/services/authStorage';

// Re-export types for convenience
export type { AuthContextValue, User, RegisterData } from '@/types/auth';
import { 
  validatePhone,
  validatePassword,
  validateRequired
} from '@/utils/auth';

/**
 * Create Auth Context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const storageAdapter = useRef<AuthStorageAdapter | null>(null);
  const requireAuthResolverRef = useRef<((value: boolean) => void) | null>(null);

  /**
   * Initialize storage and load session on mount
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        // Load user from localStorage
        const storedUser = localStorage.getItem('auth-user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('auth-user');
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Initialize storage adapter lazily for profile updates
    initializeAuthStorage().then(({ adapter }) => {
      storageAdapter.current = adapter;
    }).catch(console.error);
  }, []);

  /**
   * Login function with credential validation and session creation
   */
  const login = useCallback(async (phone: string, password: string): Promise<void> => {
    // Validate inputs
    if (!validatePhone(phone)) {
      throw new Error('Invalid phone number format');
    }

    if (!validateRequired(password)) {
      throw new Error('Password is required');
    }

    // Call login API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const { user: userData } = await response.json();

    // Convert API response to User type
    const user: User = {
      ...userData,
      passwordHash: '', // Not returned from API
      hostelDetails: {
        block: userData.defaultHostelBlock || undefined,
        floor: userData.hostelFloor || undefined,
        room: userData.hostelRoom || undefined,
        year: userData.hostelYear || undefined,
        department: userData.hostelDepartment || undefined,
      },
    };

    // Save to localStorage
    try {
      localStorage.setItem('auth-user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }

    setUser(user);

    // Resolve requireAuth promise if waiting
    if (requireAuthResolverRef.current) {
      requireAuthResolverRef.current(true);
      requireAuthResolverRef.current = null;
    }
  }, []);

  /**
   * Register function with validation and user creation
   */
  const register = useCallback(async (data: RegisterData): Promise<void> => {
    // Validate required fields
    if (!validateRequired(data.name)) {
      throw new Error('Name is required');
    }

    if (!validatePhone(data.phone)) {
      throw new Error('Invalid phone number format');
    }

    if (!validatePassword(data.password)) {
      throw new Error('Password must be at least 6 characters');
    }

    // Call register API
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        password: data.password,
        hostelDetails: data.hostelDetails,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const { user: userData } = await response.json();

    // Convert API response to User type
    const newUser: User = {
      ...userData,
      passwordHash: '', // Not returned from API
      hostelDetails: {
        block: userData.defaultHostelBlock || undefined,
        floor: userData.hostelFloor || undefined,
        room: userData.hostelRoom || undefined,
        year: userData.hostelYear || undefined,
        department: userData.hostelDepartment || undefined,
      },
    };

    // Save to localStorage
    try {
      localStorage.setItem('auth-user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }

    setUser(newUser);

    // Resolve requireAuth promise if waiting
    if (requireAuthResolverRef.current) {
      requireAuthResolverRef.current(true);
      requireAuthResolverRef.current = null;
    }
  }, []);

  /**
   * Logout function with session clearing
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      localStorage.removeItem('auth-user');
    } catch (error) {
      console.error('Failed to clear user from localStorage:', error);
    }
    setUser(null);
  }, []);

  /**
   * Update profile function with validation
   */
  const updateProfile = useCallback(async (
    updates: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt'>>
  ): Promise<void> => {
    if (!storageAdapter.current) {
      throw new Error('Storage not initialized');
    }

    if (!user) {
      throw new Error('No user logged in');
    }

    // Validate name if provided
    if (updates.name !== undefined && !validateRequired(updates.name)) {
      throw new Error('Name cannot be empty');
    }

    // Validate phone if provided
    if (updates.phone !== undefined) {
      if (!validatePhone(updates.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Check if new phone already exists (and it's not the current user's phone)
      if (updates.phone !== user.phone) {
        const existingUser = await storageAdapter.current.getUserByPhone(updates.phone);
        if (existingUser) {
          throw new Error('Phone number is already registered');
        }
      }
    }

    // Create updated user object
    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: Date.now()
    };

    await storageAdapter.current.updateUser(updatedUser);
    setUser(updatedUser);
  }, [user]);

  /**
   * Require authentication function
   * Returns true if authenticated, triggers login popup if not
   */
  const requireAuth = useCallback(async (): Promise<boolean> => {
    if (user) {
      return true;
    }

    // Return a promise that will be resolved when user logs in or registers
    return new Promise((resolve) => {
      requireAuthResolverRef.current = resolve;
      // The promise will be resolved in login() or register() functions
      // For now, we return false to indicate auth is required
      // The UI component will need to show the login popup
    });
  }, [user]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    requireAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use Auth Context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
