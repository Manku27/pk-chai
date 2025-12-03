/**
 * Storage service for authentication and user data persistence
 * Provides database storage with IndexedDB fallback
 */

import { User, Order } from '@/types/auth';

/**
 * Stored session data structure
 */
interface StoredSession {
  id: string;
  userId: string;
  createdAt: number;
}

/**
 * Auth storage adapter interface
 */
export interface AuthStorageAdapter {
  // User operations
  createUser(user: User): Promise<void>;
  getUserByPhone(phone: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  updateUser(user: User): Promise<void>;
  
  // Session operations
  saveSession(session: StoredSession): Promise<void>;
  loadSession(): Promise<StoredSession | null>;
  clearSession(): Promise<void>;
  
  // Order operations
  saveOrder(order: Order): Promise<void>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
}

/**
 * Database storage adapter for authentication (primary)
 * Uses API routes to interact with Neon PostgreSQL
 */
class DatabaseAuthAdapter implements AuthStorageAdapter {
  private sessionStorage: Map<string, StoredSession> = new Map();

  /**
   * Convert API user response to app User type
   */
  private apiUserToAppUser(apiUser: any, passwordHash: string = ''): User {
    return {
      id: apiUser.id,
      name: apiUser.name,
      phone: apiUser.phone,
      passwordHash: passwordHash, // Not returned from API for security
      hostelDetails: {
        block: apiUser.defaultHostelBlock || undefined,
        floor: apiUser.hostelFloor || undefined,
        room: apiUser.hostelRoom || undefined,
        year: apiUser.hostelYear || undefined,
        department: apiUser.hostelDepartment || undefined,
      },
      role: apiUser.role,
      createdAt: apiUser.createdAt,
      updatedAt: apiUser.updatedAt,
    };
  }

  async createUser(user: User): Promise<void> {
    // This method is not used directly - registration goes through register API
    throw new Error('Use register API endpoint for user creation');
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    // This is called during login, but actual verification happens via API
    // We'll return null here and let the login flow handle it
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      // For server-side calls, use direct database query
      if (typeof window === 'undefined') {
        // Dynamic import to avoid loading database on client
        const { getUserById: dbGetUserById } = await import('@/db/queries/users');
        const dbUser = await dbGetUserById(id);
        if (!dbUser) {
          return null;
        }
        return {
          id: dbUser.id,
          name: dbUser.name,
          phone: dbUser.phone,
          passwordHash: dbUser.passwordHash,
          hostelDetails: {
            block: dbUser.defaultHostelBlock || undefined,
            floor: dbUser.hostelFloor || undefined,
            room: dbUser.hostelRoom || undefined,
            year: dbUser.hostelYear || undefined,
            department: dbUser.hostelDepartment || undefined,
          },
          role: dbUser.role,
          createdAt: dbUser.createdAt.getTime(),
          updatedAt: dbUser.updatedAt.getTime(),
        };
      }
      
      // For client-side, call the API
      const response = await fetch(`/api/auth/user/${id}`);
      if (!response.ok) {
        return null;
      }

      const { user: userData } = await response.json();
      
      return {
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
    } catch (error) {
      console.error('Failed to get user by id:', error);
      return null;
    }
  }

  async updateUser(user: User): Promise<void> {
    try {
      // For server-side calls, use direct database query
      if (typeof window === 'undefined') {
        const { updateUser: dbUpdateUser } = await import('@/db/queries/users');
        const updates = {
          name: user.name,
          phone: user.phone,
          passwordHash: user.passwordHash,
          defaultHostelBlock: user.hostelDetails?.block || null,
          hostelFloor: user.hostelDetails?.floor || null,
          hostelRoom: user.hostelDetails?.room || null,
          hostelYear: user.hostelDetails?.year || null,
          hostelDepartment: user.hostelDetails?.department || null,
          role: user.role || 'USER',
          updatedAt: new Date(user.updatedAt),
        };
        await dbUpdateUser(user.id, updates);
      } else {
        // For client-side, we would need an update API endpoint
        throw new Error('User update API not implemented yet');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Session operations (stored in memory for now, can be moved to database later)
  async saveSession(session: StoredSession): Promise<void> {
    this.sessionStorage.set('current-session', session);
    // Also store in localStorage for persistence across page reloads
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth-session', JSON.stringify(session));
      } catch (error) {
        console.error('Failed to save session to localStorage:', error);
      }
    }
  }

  async loadSession(): Promise<StoredSession | null> {
    // Try memory first
    let session = this.sessionStorage.get('current-session');
    
    // If not in memory, try localStorage
    if (!session && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('auth-session');
        if (stored) {
          session = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load session from localStorage:', error);
      }
    }

    return session || null;
  }

  async clearSession(): Promise<void> {
    this.sessionStorage.delete('current-session');
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth-session');
      } catch (error) {
        console.error('Failed to clear session from localStorage:', error);
      }
    }
  }

  // Order operations (not implemented yet, will be handled by orderService)
  async saveOrder(order: Order): Promise<void> {
    // Orders will be saved via the order service
    console.warn('saveOrder called on DatabaseAuthAdapter - orders should be saved via orderService');
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    // Orders will be retrieved via the order service
    console.warn('getOrdersByUserId called on DatabaseAuthAdapter - orders should be retrieved via orderService');
    return [];
  }
}

/**
 * IndexedDB storage adapter for authentication (fallback)
 */
class IndexedDBAuthAdapter implements AuthStorageAdapter {
  private dbName = 'pkchai-db';
  private version = 2; // Increment version to add new stores
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database with auth stores
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create cart store if it doesn't exist (for backward compatibility)
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' });
        }
        
        // Create users store with phone as key and id as index
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'phone' });
          userStore.createIndex('id', 'id', { unique: true });
        }
        
        // Create auth-session store
        if (!db.objectStoreNames.contains('auth-session')) {
          db.createObjectStore('auth-session', { keyPath: 'id' });
        }
        
        // Create orders store with userId and createdAt indexes
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('userId', 'userId', { unique: false });
          orderStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Validate user data structure
   */
  private validateUser(data: unknown): data is User {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'name' in data &&
      'phone' in data &&
      'passwordHash' in data &&
      'createdAt' in data &&
      'updatedAt' in data &&
      typeof (data as User).id === 'string' &&
      typeof (data as User).name === 'string' &&
      typeof (data as User).phone === 'string' &&
      typeof (data as User).passwordHash === 'string'
    );
  }

  /**
   * Validate session data structure
   */
  private validateSession(data: unknown): data is StoredSession {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'userId' in data &&
      'createdAt' in data &&
      typeof (data as StoredSession).id === 'string' &&
      typeof (data as StoredSession).userId === 'string' &&
      typeof (data as StoredSession).createdAt === 'number'
    );
  }

  /**
   * Validate order data structure
   */
  private validateOrder(data: unknown): data is Order {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'userId' in data &&
      'items' in data &&
      'totalAmount' in data &&
      'createdAt' in data &&
      Array.isArray((data as Order).items) &&
      typeof (data as Order).userId === 'string' &&
      typeof (data as Order).totalAmount === 'number'
    );
  }

  // User operations
  async createUser(user: User): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      store.add(user);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to create user in IndexedDB:', error);
      throw error;
    }
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(phone);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const data = request.result;
          
          if (!data) {
            resolve(null);
            return;
          }

          if (!this.validateUser(data)) {
            console.warn('Invalid user data found');
            resolve(null);
            return;
          }

          resolve(data);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get user by phone from IndexedDB:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('id');
      const request = index.get(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const data = request.result;
          
          if (!data) {
            resolve(null);
            return;
          }

          if (!this.validateUser(data)) {
            console.warn('Invalid user data found');
            resolve(null);
            return;
          }

          resolve(data);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get user by id from IndexedDB:', error);
      return null;
    }
  }

  async updateUser(user: User): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      store.put(user);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to update user in IndexedDB:', error);
      throw error;
    }
  }

  // Session operations
  async saveSession(session: StoredSession): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['auth-session'], 'readwrite');
      const store = transaction.objectStore('auth-session');
      
      store.put(session);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to save session to IndexedDB:', error);
      throw error;
    }
  }

  async loadSession(): Promise<StoredSession | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['auth-session'], 'readonly');
      const store = transaction.objectStore('auth-session');
      const request = store.get('current-session');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const data = request.result;
          
          if (!data) {
            resolve(null);
            return;
          }

          if (!this.validateSession(data)) {
            console.warn('Invalid session data found, clearing corrupted data');
            this.clearSession().catch(console.error);
            resolve(null);
            return;
          }

          resolve(data);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load session from IndexedDB:', error);
      return null;
    }
  }

  async clearSession(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['auth-session'], 'readwrite');
      const store = transaction.objectStore('auth-session');
      store.delete('current-session');

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to clear session from IndexedDB:', error);
      throw error;
    }
  }

  // Order operations
  async saveOrder(order: Order): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      store.add(order);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to save order to IndexedDB:', error);
      throw error;
    }
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('userId');
      const request = index.getAll(userId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const orders = request.result;
          
          if (!orders || orders.length === 0) {
            resolve([]);
            return;
          }

          // Validate and filter orders
          const validOrders = orders.filter(order => this.validateOrder(order));
          
          // Sort by createdAt descending (newest first)
          validOrders.sort((a, b) => b.createdAt - a.createdAt);
          
          resolve(validOrders);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get orders from IndexedDB:', error);
      return [];
    }
  }
}

/**
 * Memory storage adapter (fallback when IndexedDB unavailable)
 */
class MemoryAuthStorageAdapter implements AuthStorageAdapter {
  private users: Map<string, User> = new Map(); // keyed by phone
  private usersById: Map<string, User> = new Map(); // keyed by id
  private session: StoredSession | null = null;
  private orders: Map<string, Order> = new Map(); // keyed by order id

  async createUser(user: User): Promise<void> {
    // Check if user already exists
    if (this.users.has(user.phone)) {
      throw new Error('User with this phone number already exists');
    }
    
    // Deep clone to avoid reference issues
    const clonedUser = JSON.parse(JSON.stringify(user));
    this.users.set(user.phone, clonedUser);
    this.usersById.set(user.id, clonedUser);
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const user = this.users.get(phone);
    if (!user) {
      return null;
    }
    // Return a deep clone
    return JSON.parse(JSON.stringify(user));
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.usersById.get(id);
    if (!user) {
      return null;
    }
    // Return a deep clone
    return JSON.parse(JSON.stringify(user));
  }

  async updateUser(user: User): Promise<void> {
    // Deep clone to avoid reference issues
    const clonedUser = JSON.parse(JSON.stringify(user));
    this.users.set(user.phone, clonedUser);
    this.usersById.set(user.id, clonedUser);
  }

  async saveSession(session: StoredSession): Promise<void> {
    // Deep clone to avoid reference issues
    this.session = JSON.parse(JSON.stringify(session));
  }

  async loadSession(): Promise<StoredSession | null> {
    if (!this.session) {
      return null;
    }
    
    // Return a deep clone
    return JSON.parse(JSON.stringify(this.session));
  }

  async clearSession(): Promise<void> {
    this.session = null;
  }

  async saveOrder(order: Order): Promise<void> {
    // Deep clone to avoid reference issues
    const clonedOrder = JSON.parse(JSON.stringify(order));
    this.orders.set(order.id, clonedOrder);
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const userOrders: Order[] = [];
    
    for (const order of this.orders.values()) {
      if (order.userId === userId) {
        // Deep clone each order
        userOrders.push(JSON.parse(JSON.stringify(order)));
      }
    }
    
    // Sort by createdAt descending (newest first)
    userOrders.sort((a, b) => b.createdAt - a.createdAt);
    
    return userOrders;
  }
}

/**
 * Test if database is available
 */
async function testDatabase(): Promise<boolean> {
  // Database is only available on server side
  // Client side should always use API routes
  return typeof window === 'undefined';
}

/**
 * Test if IndexedDB is available
 */
async function testIndexedDB(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return false;
  }

  try {
    const testDB = 'test-db';
    const request = indexedDB.open(testDB);
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase(testDB);
        resolve(true);
      };
      
      request.onerror = () => {
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

/**
 * Initialize auth storage adapter with database, IndexedDB, or memory fallback
 */
export async function initializeAuthStorage(): Promise<{
  adapter: AuthStorageAdapter;
  usingFallback: boolean;
}> {
  // Try database first
  const dbAvailable = await testDatabase();
  if (dbAvailable) {
    return {
      adapter: new DatabaseAuthAdapter(),
      usingFallback: false
    };
  }

  // Fall back to IndexedDB
  const indexedDBAvailable = await testIndexedDB();
  if (indexedDBAvailable) {
    console.warn('Database unavailable, using IndexedDB for auth');
    return {
      adapter: new IndexedDBAuthAdapter(),
      usingFallback: true
    };
  }

  // Final fallback to memory
  console.warn('Database and IndexedDB unavailable, using memory storage for auth');
  return {
    adapter: new MemoryAuthStorageAdapter(),
    usingFallback: true
  };
}

/**
 * Export session type for use in other modules
 */
export type { StoredSession };
