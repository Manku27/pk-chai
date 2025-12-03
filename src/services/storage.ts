/**
 * Storage service for cart persistence
 * Provides IndexedDB storage with memory fallback
 */

import { CartState, CartItem, HostelBlock } from '@/types/menu';

/**
 * Serializable cart data structure for storage
 */
interface StoredCartData {
  id: string;
  items: Array<CartItem>;
  selectedBlock: HostelBlock | null;
  selectedSlot: string | null;
  totalAmount: number;
  lastUpdated: number;
}

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  saveCart(cart: CartState): Promise<void>;
  loadCart(): Promise<CartState | null>;
  clearCart(): Promise<void>;
}

/**
 * IndexedDB storage adapter
 */
class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'pkchai-db';
  private storeName = 'cart';
  private version = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
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
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Convert CartState to storable format
   */
  private serializeCart(cart: CartState): StoredCartData {
    return {
      id: 'current-cart',
      items: Array.from(cart.items.values()),
      selectedBlock: cart.selectedBlock,
      selectedSlot: cart.selectedSlot,
      totalAmount: cart.totalAmount,
      lastUpdated: Date.now()
    };
  }

  /**
   * Convert stored data back to CartState
   */
  private deserializeCart(data: StoredCartData): CartState {
    const itemsMap = new Map<string, CartItem>();
    data.items.forEach(item => {
      itemsMap.set(item.itemId, item);
    });

    return {
      items: itemsMap,
      selectedBlock: data.selectedBlock,
      selectedSlot: data.selectedSlot,
      totalAmount: data.totalAmount
    };
  }

  /**
   * Validate stored cart data structure
   */
  private validateCartData(data: unknown): data is StoredCartData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'items' in data &&
      Array.isArray((data as StoredCartData).items) &&
      'totalAmount' in data &&
      typeof (data as StoredCartData).totalAmount === 'number'
    );
  }

  async saveCart(cart: CartState): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const data = this.serializeCart(cart);
      store.put(data);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to save cart to IndexedDB:', error);
      throw error;
    }
  }

  async loadCart(): Promise<CartState | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('current-cart');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const data = request.result;
          
          if (!data) {
            resolve(null);
            return;
          }

          // Validate data structure
          if (!this.validateCartData(data)) {
            console.warn('Invalid cart data found, clearing corrupted data');
            this.clearCart().catch(console.error);
            resolve(null);
            return;
          }

          resolve(this.deserializeCart(data));
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load cart from IndexedDB:', error);
      return null;
    }
  }

  async clearCart(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.delete('current-cart');

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to clear cart from IndexedDB:', error);
      throw error;
    }
  }
}

/**
 * Memory storage adapter (fallback when IndexedDB unavailable)
 */
class MemoryStorageAdapter implements StorageAdapter {
  private cart: CartState | null = null;

  async saveCart(cart: CartState): Promise<void> {
    // Deep clone to avoid reference issues
    this.cart = {
      items: new Map(cart.items),
      selectedBlock: cart.selectedBlock,
      selectedSlot: cart.selectedSlot,
      totalAmount: cart.totalAmount
    };
  }

  async loadCart(): Promise<CartState | null> {
    if (!this.cart) {
      return null;
    }

    // Return a deep clone
    return {
      items: new Map(this.cart.items),
      selectedBlock: this.cart.selectedBlock,
      selectedSlot: this.cart.selectedSlot,
      totalAmount: this.cart.totalAmount
    };
  }

  async clearCart(): Promise<void> {
    this.cart = null;
  }
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
 * Initialize storage adapter with IndexedDB or memory fallback
 */
export async function initializeStorage(): Promise<{
  adapter: StorageAdapter;
  usingFallback: boolean;
}> {
  const isAvailable = await testIndexedDB();
  
  if (isAvailable) {
    return {
      adapter: new IndexedDBAdapter(),
      usingFallback: false
    };
  } else {
    console.warn('IndexedDB unavailable, using memory storage');
    return {
      adapter: new MemoryStorageAdapter(),
      usingFallback: true
    };
  }
}
