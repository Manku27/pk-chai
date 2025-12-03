'use client';

/**
 * CartItemList Component
 * Maps through cart items and renders CartItem components
 * Shows empty message when cart has no items
 */

import { useCart } from '@/contexts/CartContext';
import { CartItem } from './CartItem';
import styles from './CartItemList.module.css';

export function CartItemList() {
  const { cart } = useCart();
  
  // Convert Map to array for rendering
  const cartItems = Array.from(cart.items.values());
  
  // Show empty message when cart has no items
  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <p className={styles.emptyMessage}>Cart is empty</p>
      </div>
    );
  }
  
  // Map through cart items and render CartItem for each
  return (
    <div className={styles.cartItemList}>
      {cartItems.map(item => (
        <CartItem key={item.itemId} item={item} />
      ))}
    </div>
  );
}
