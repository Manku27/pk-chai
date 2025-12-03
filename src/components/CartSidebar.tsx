'use client';

/**
 * CartDrawer Component (formerly CartSidebar)
 * Slide-in drawer with backdrop overlay for cart display
 * Works consistently on mobile and desktop
 */

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { CartItemList } from './CartItemList';
import { LocationSelector } from './LocationSelector';
import { SlotSelector } from './SlotSelector';
import { Backdrop } from './Backdrop';
import { LoginPopup } from './LoginPopup';
import { OrderSuccessToast } from './OrderSuccessToast';
import { ProfileBadge } from './ProfileBadge';
import styles from './CartSidebar.module.css';

export function CartSidebar() {
  const { cart, isLoading, usingFallback, isCartOpen, closeCart, clearCart } = useCart();
  const { user, isAuthenticated, requireAuth } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  
  // Check if cart has items
  const hasItems = cart.items.size > 0;
  
  // Format total amount
  const formattedTotal = `₹${cart.totalAmount.toFixed(2)}`;
  
  const handleCheckout = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show login popup - user will need to click checkout again after logging in
      setShowLoginPopup(true);
      return;
    }

    // User is authenticated, proceed with checkout
    await processCheckout();
  };

  const processCheckout = async () => {
    // Get the current user from auth context
    const currentUser = user;
    
    if (!currentUser) {
      console.error('No user found during checkout');
      alert('Please log in to complete your order');
      return;
    }

    if (!cart.selectedBlock || !cart.selectedSlot) {
      alert('Please select a delivery location and time slot');
      return;
    }

    setIsProcessingCheckout(true);

    try {
      // Convert cart items to order items format
      const orderItems = Array.from(cart.items.values()).map(item => ({
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      // Call API to create order
      const response = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          items: orderItems,
          targetHostelBlock: cart.selectedBlock,
          slotTime: cart.selectedSlot,
          totalAmount: cart.totalAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const { orderId } = await response.json();

      // Clear cart after successful order
      clearCart();

      // Close cart sidebar
      closeCart();
      
      // Show success toast
      setSuccessOrderId(orderId);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleLoginSuccess = () => {
    // Close login popup
    setShowLoginPopup(false);
    // User is now authenticated and can manually click checkout
  };

  const handleLoginClose = () => {
    setShowLoginPopup(false);
    // User closed popup without logging in, do nothing
  };
  
  return (
    <>
      <Backdrop isOpen={isCartOpen} onClick={closeCart} />
      
      <aside className={`${styles.cartSidebar} ${isCartOpen ? styles.open : ''}`}>
        <div className={styles.cartHeader}>
          <h2 className={styles.cartTitle}>Your Cart</h2>
          <div className={styles.headerRight}>
            {hasItems && (
              <span className={styles.itemCount}>
                {cart.items.size} {cart.items.size === 1 ? 'item' : 'items'}
              </span>
            )}
            <ProfileBadge inline />
            <button
              className={styles.closeButton}
              onClick={closeCart}
              aria-label="Close cart"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      
      {isLoading ? (
        <div className={styles.cartContent}>
          <div className={styles.loadingState}>
            <p>Loading cart...</p>
          </div>
        </div>
      ) : (
        <>
          {usingFallback && (
            <div className={styles.warningBanner}>
              <p className={styles.warningText}>
                ⚠️ Cart will not persist across sessions
              </p>
            </div>
          )}
          
          <div className={styles.cartContent}>
            <div className={styles.cartItems}>
              <CartItemList />
            </div>
            
            {hasItems && (
              <>
                <div className={styles.cartSelectors}>
                  <LocationSelector />
                  <SlotSelector />
                </div>
                
                <div className={styles.cartFooter}>
                  <div className={styles.totalSection}>
                    <span className={styles.totalLabel}>Total Amount</span>
                    <span className={styles.totalAmount}>{formattedTotal}</span>
                  </div>
                  
                  <button
                    className={styles.checkoutButton}
                    onClick={handleCheckout}
                    disabled={!hasItems || isProcessingCheckout}
                    aria-label="Proceed to checkout"
                  >
                    {isProcessingCheckout ? 'Processing...' : 'Checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      </aside>

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={handleLoginClose}
        onSuccess={handleLoginSuccess}
      />

      {/* Success Toast */}
      {successOrderId && (
        <OrderSuccessToast
          orderId={successOrderId}
          onClose={() => setSuccessOrderId(null)}
        />
      )}
    </>
  );
}
