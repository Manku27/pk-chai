'use client';

/**
 * CartButton Component
 * Floating button with item count badge that opens the cart drawer
 */

import { useCart } from '@/contexts/CartContext';
import styles from './CartButton.module.css';

export function CartButton() {
  const { cart, openCart } = useCart();
  
  // Calculate total item count
  const itemCount = cart.items.size;
  
  return (
    <button
      className={styles.cartButton}
      onClick={openCart}
      aria-label={`Open cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
    >
      <svg
        className={styles.cartIcon}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M9 2L7 6H3C1.9 6 1 6.9 1 8V18C1 19.1 1.9 20 3 20H21C22.1 20 23 19.1 23 18V8C23 6.9 22.1 6 21 6H17L15 2H9ZM9 4H15L16.5 6H7.5L9 4ZM3 8H21V18H3V8Z"
          fill="currentColor"
        />
      </svg>
      {itemCount > 0 && (
        <span className={styles.badge} aria-label={`${itemCount} items in cart`}>
          {itemCount}
        </span>
      )}
    </button>
  );
}
