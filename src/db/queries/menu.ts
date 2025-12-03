import { eq, and } from 'drizzle-orm';
import { db } from '../index';
import { menuItems } from '../schema';

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

/**
 * Get all menu items
 */
export async function getAllMenuItems(): Promise<MenuItem[]> {
  return db.select().from(menuItems);
}

/**
 * Get all available menu items
 */
export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  return db.select().from(menuItems).where(eq(menuItems.isAvailable, true));
}

/**
 * Get menu items by category
 */
export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  return db.select().from(menuItems).where(eq(menuItems.category, category));
}

/**
 * Get available menu items by category
 */
export async function getAvailableMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  return db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.category, category), eq(menuItems.isAvailable, true)));
}

/**
 * Get menu item by ID
 */
export async function getMenuItemById(id: string): Promise<MenuItem | undefined> {
  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  return item;
}

/**
 * Create a new menu item
 */
export async function createMenuItem(itemData: NewMenuItem): Promise<MenuItem> {
  const [item] = await db.insert(menuItems).values(itemData).returning();
  return item;
}

/**
 * Update menu item
 */
export async function updateMenuItem(id: string, itemData: Partial<NewMenuItem>): Promise<MenuItem | undefined> {
  const [item] = await db
    .update(menuItems)
    .set({ ...itemData, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  return item;
}

/**
 * Toggle menu item availability
 */
export async function toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem | undefined> {
  const [item] = await db
    .update(menuItems)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  return item;
}

/**
 * Delete menu item
 */
export async function deleteMenuItem(id: string): Promise<void> {
  await db.delete(menuItems).where(eq(menuItems.id, id));
}
