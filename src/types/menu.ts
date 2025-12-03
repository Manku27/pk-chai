/**
 * Type definitions for the Menu and Cart system
 */

/**
 * Hostel block delivery locations
 */
export type HostelBlock = 
  | "jaadavpur-main"
  | "new-block"
  | "kpc-boys"
  | "kpc-girls";

export const HOSTEL_BLOCKS: Record<HostelBlock, string> = {
  "jaadavpur-main": "Jaadavpur Main Hostel",
  "new-block": "New block hostel",
  "kpc-boys": "KPC boys hostel",
  "kpc-girls": "KPC girls hostel"
};

/**
 * Menu item interface representing a single product
 */
export interface MenuItem {
  id: string;           // Deterministic ID (e.g., "chai-small", "maggi-veg-butter")
  name: string;         // Display name (e.g., "Chai - Small")
  category: string;     // Category name (e.g., "Chai", "Maggi")
  price: number;        // Price in rupees
  categoryOrder: number; // Order within category
}

/**
 * Cart item interface representing an item in the shopping cart
 */
export interface CartItem {
  itemId: string;       // References MenuItem.id
  name: string;         // Cached from MenuItem
  price: number;        // Price at time of addition
  quantity: number;     // Current quantity
}

/**
 * Cart state interface representing the complete cart
 */
export interface CartState {
  items: Map<string, CartItem>;  // Key: itemId
  selectedBlock: HostelBlock | null;
  selectedSlot: string | null;   // ISO timestamp
  totalAmount: number;
}

/**
 * Time slot interface for delivery scheduling
 */
export interface TimeSlot {
  time: string;        // ISO timestamp
  display: string;     // "11:00 AM", "11:30 AM"
  isAvailable: boolean;
}
