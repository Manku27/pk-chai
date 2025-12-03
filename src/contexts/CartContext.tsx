'use client';

/**
 * Cart Context Provider
 * Manages global cart state and operations with IndexedDB persistence
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { CartState, CartItem, MenuItem, HostelBlock } from '@/types/menu';
import { initializeStorage, StorageAdapter } from '@/services/storage';
import { debounce, DebouncedFunction } from '@/utils/debounce';

/**
 * Cart Context value interface
 */
export interface CartContextValue {
  cart: CartState;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setLocation: (block: HostelBlock) => void;
  setSlot: (slot: string) => void;
  clearCart: () => void;
  isLoading: boolean;
  usingFallback: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

/**
 * Create Cart Context
 */
const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Initial empty cart state
 */
const createEmptyCart = (): CartState => ({
  items: new Map<string, CartItem>(),
  selectedBlock: null,
  selectedSlot: null,
  totalAmount: 0
});

/**
 * Calculate total amount from cart items
 */
const calculateTotal = (items: Map<string, CartItem>): number => {
  let total = 0;
  items.forEach(item => {
    total += item.price * item.quantity;
  });
  return total;
};

/**
 * Cart Provider Props
 */
interface CartProviderProps {
  children: React.ReactNode;
}

/**
 * Cart Provider Component
 */
export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartState>(createEmptyCart());
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const storageAdapter = useRef<StorageAdapter | null>(null);
  const debouncedSaveRef = useRef<DebouncedFunction<(cartState: CartState) => Promise<void>> | null>(null);

  /**
   * Initialize storage and load cart on mount
   */
  useEffect(() => {
    const initCart = async () => {
      try {
        const { adapter, usingFallback: fallback } = await initializeStorage();
        storageAdapter.current = adapter;
        setUsingFallback(fallback);

        // Create debounced save function with 100ms delay
        const saveToStorage = async (cartState: CartState) => {
          if (storageAdapter.current) {
            try {
              await storageAdapter.current.saveCart(cartState);
            } catch (error) {
              console.error('Failed to save cart:', error);
            }
          }
        };

        debouncedSaveRef.current = debounce(saveToStorage, 100);

        // Load cart from storage
        const loadedCart = await adapter.loadCart();
        if (loadedCart) {
          setCart(loadedCart);
        }
      } catch (error) {
        console.error('Failed to initialize cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initCart();

    // Cleanup: flush any pending saves on unmount
    return () => {
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.flush();
      }
    };
  }, []);

  /**
   * Ensure final state is saved before page unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.flush();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  /**
   * Debounced save to IndexedDB
   * Delays save by 100ms to batch rapid changes
   * Ensures final state is always saved via flush on unmount/unload
   */
  const debouncedSave = useCallback((cartState: CartState) => {
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current(cartState);
    }
  }, []);

  /**
   * Add item to cart (increment quantity by 1)
   */
  const addItem = useCallback((item: MenuItem) => {
    setCart(prevCart => {
      const newItems = new Map(prevCart.items);
      const existingItem = newItems.get(item.id);

      if (existingItem) {
        // Increment quantity
        newItems.set(item.id, {
          ...existingItem,
          quantity: existingItem.quantity + 1
        });
      } else {
        // Add new item
        newItems.set(item.id, {
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        });
      }

      const newCart: CartState = {
        ...prevCart,
        items: newItems,
        totalAmount: calculateTotal(newItems)
      };

      debouncedSave(newCart);
      return newCart;
    });
  }, [debouncedSave]);

  /**
   * Remove item from cart completely
   */
  const removeItem = useCallback((itemId: string) => {
    setCart(prevCart => {
      const newItems = new Map(prevCart.items);
      newItems.delete(itemId);

      const newCart: CartState = {
        ...prevCart,
        items: newItems,
        totalAmount: calculateTotal(newItems)
      };

      debouncedSave(newCart);
      return newCart;
    });
  }, [debouncedSave]);

  /**
   * Increment item quantity by 1
   */
  const incrementItem = useCallback((itemId: string) => {
    setCart(prevCart => {
      const newItems = new Map(prevCart.items);
      const item = newItems.get(itemId);

      if (item) {
        newItems.set(itemId, {
          ...item,
          quantity: item.quantity + 1
        });
      }

      const newCart: CartState = {
        ...prevCart,
        items: newItems,
        totalAmount: calculateTotal(newItems)
      };

      debouncedSave(newCart);
      return newCart;
    });
  }, [debouncedSave]);

  /**
   * Decrement item quantity by 1
   * Removes item if quantity reaches 0
   */
  const decrementItem = useCallback((itemId: string) => {
    setCart(prevCart => {
      const newItems = new Map(prevCart.items);
      const item = newItems.get(itemId);

      if (item) {
        if (item.quantity > 1) {
          newItems.set(itemId, {
            ...item,
            quantity: item.quantity - 1
          });
        } else {
          // Remove item when quantity reaches 0
          newItems.delete(itemId);
        }
      }

      const newCart: CartState = {
        ...prevCart,
        items: newItems,
        totalAmount: calculateTotal(newItems)
      };

      debouncedSave(newCart);
      return newCart;
    });
  }, [debouncedSave]);

  /**
   * Set delivery location
   */
  const setLocation = useCallback((block: HostelBlock) => {
    setCart(prevCart => {
      const newCart: CartState = {
        ...prevCart,
        selectedBlock: block
      };

      debouncedSave(newCart);
      return newCart;
    });
  }, [debouncedSave]);

  /**
   * Set delivery time slot
   */
  const setSlot = useCallback((slot: string) => {
    setCart(prevCart => {
      const newCart: CartState = {
        ...prevCart,
        selectedSlot: slot
      };

      debouncedSave(newCart);
      return newCart;
    });
  }, [debouncedSave]);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(async () => {
    const emptyCart = createEmptyCart();
    setCart(emptyCart);

    if (storageAdapter.current) {
      try {
        await storageAdapter.current.clearCart();
      } catch (error) {
        console.error('Failed to clear cart from storage:', error);
      }
    }
  }, []);

  /**
   * Open cart drawer
   */
  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  /**
   * Close cart drawer
   */
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const value: CartContextValue = {
    cart,
    addItem,
    removeItem,
    incrementItem,
    decrementItem,
    setLocation,
    setSlot,
    clearCart,
    isLoading,
    usingFallback,
    isCartOpen,
    openCart,
    closeCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook to use Cart Context
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}
