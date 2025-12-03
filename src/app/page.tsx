/**
 * Main Menu Page
 * Displays the menu items and cart sidebar wrapped in CartProvider
 */

import { CartProvider } from '@/contexts/CartContext';
import { MenuList } from '@/components/MenuList';
import { CartSidebar } from '@/components/CartSidebar';
import { CartButton } from '@/components/CartButton';
import Image from 'next/image';
import logo from './assets/logo.jpg';
import styles from './page.module.css';

export default function Home() {
  return (
    <CartProvider>
      <div className={styles.page}>
        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <Image 
                src={logo} 
                alt="PKChai Logo" 
                className={styles.logo}
                width={60}
                height={60}
                priority
              />
              <div className={styles.headerText}>
                <h1 className={styles.title}>PKChai Menu</h1>
                <p className={styles.subtitle}>Order your favorite snacks and chai for hostel delivery</p>
              </div>
            </div>
          </header>
          
          <MenuList />
        </main>
        
        <CartButton />
        <CartSidebar />
      </div>
    </CartProvider>
  );
}
