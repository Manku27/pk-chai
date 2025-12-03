'use client';

/**
 * MenuItem Component
 * Displays a single menu item with name, price, and add to cart button
 * Shows quantity controls when item is in cart
 */

import React from 'react';
import { MenuItem as MenuItemType } from '@/types/menu';
import { useCart } from '@/contexts/CartContext';
import styles from './MenuItem.module.css';

interface MenuItemProps {
  item: MenuItemType;
}

export function MenuItem({ item }: MenuItemProps) {
  const { cart, addItem, incrementItem, decrementItem } = useCart();
  
  // Check if item is in cart
  const cartItem = cart.items.get(item.id);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;

  const handleAddToCart = () => {
    addItem(item);
  };

  const handleIncrement = () => {
    incrementItem(item.id);
  };

  const handleDecrement = () => {
    decrementItem(item.id);
  };

  return (
    <div className={styles.menuItem}>
      <div className={styles.itemInfo}>
        <h3 className={styles.itemName}>{item.name}</h3>
        <p className={styles.itemPrice}>₹{item.price}</p>
      </div>
      
      {isInCart ? (
        <div className={styles.quantityControls}>
          <button 
            className={styles.quantityButton}
            onClick={handleDecrement}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            −
          </button>
          <span className={styles.quantity}>{quantity}</span>
          <button 
            className={styles.quantityButton}
            onClick={handleIncrement}
            aria-label={`Increase quantity of ${item.name}`}
          >
            +
          </button>
        </div>
      ) : (
        <button 
          className={styles.addButton}
          onClick={handleAddToCart}
          aria-label={`Add ${item.name} to cart`}
        >
          Add to Cart
        </button>
      )}
    </div>
  );
}
