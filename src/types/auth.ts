/**
 * Type definitions for the Authentication system
 */

/**
 * User interface representing an authenticated user
 */
export interface User {
  id: string;                    // UUID
  name: string;                  // Full name
  phone: string;                 // Unique identifier for login
  passwordHash: string;          // Hashed password (bcrypt)
  hostelDetails?: {
    block?: string;              // Hostel block name
    floor?: string;              // Floor number
    room?: string;               // Room number
    year?: string;               // Academic year
    department?: string;         // Department name
  };
  role?: string;                 // User role (USER or ADMIN)
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
}

/**
 * Registration data for new users
 */
export interface RegisterData {
  name: string;
  phone: string;
  password: string;
  hostelDetails?: {
    block?: string;
    floor?: string;
    room?: string;
    year?: string;
    department?: string;
  };
}

/**
 * Auth context value interface
 */
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt'>>) => Promise<void>;
  requireAuth: () => Promise<boolean>; // Returns true if authenticated, shows popup if not
}

/**
 * Order status type
 */
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';

/**
 * Order interface representing a user's order
 */
export interface Order {
  id: string;                    // UUID
  userId: string;                // References User.id
  items: Array<{                 // Snapshot of cart items
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  selectedBlock: string;         // Delivery location
  selectedSlot: string;          // Delivery time
  totalAmount: number;           // Total price
  status: OrderStatus;           // Order status
  createdAt: number;             // Timestamp
}
