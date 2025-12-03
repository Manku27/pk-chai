'use client';

/**
 * CartItem Component
 * Displays a cart item with quantity controls and subtotal
 */

import { CartItem as CartItemType } from '@/types/menu';
import { useCart } from '@/contexts/CartContext';
import styles from './CartItem.module.css';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { incrementItem, decrementItem } = useCart();

  const subtotal = item.price * item.quantity;

  const handleIncrement = () => {
    incrementItem(item.itemId);
  };

  const handleDecrement = () => {
    decrementItem(item.itemId);
  };

  return (
    <div className={styles.cartItem}>
      <div className={styles.itemInfo}>
        <h4 className={styles.itemName}>{item.name}</h4>
        <p className={styles.itemPrice}>₹{item.price} each</p>
      </div>
      
      <div className={styles.controls}>
        <div className={styles.quantityControls}>
          <button
            className={styles.controlButton}
            onClick={handleDecrement}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            −
          </button>
          <span className={styles.quantity}>{item.quantity}</span>
          <button
            className={styles.controlButton}
            onClick={handleIncrement}
            aria-label={`Increase quantity of ${item.name}`}
          >
            +
          </button>
        </div>
        
        <p className={styles.subtotal}>₹{subtotal}</p>
      </div>
    </div>
  );
}
