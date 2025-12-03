import { MenuItem } from "@/types/menu";
import { MENU_ITEMS } from "@/data/menu";

/**
 * Menu service providing access to menu data
 * Implements methods for retrieving and organizing menu items
 */
export class MenuService {
  /**
   * Get all menu items
   * @returns Array of all menu items
   */
  getAllItems(): MenuItem[] {
    return MENU_ITEMS;
  }

  /**
   * Get menu items grouped by category
   * Items within each category are sorted by categoryOrder
   * @returns Map with category names as keys and arrays of items as values
   */
  getItemsByCategory(): Map<string, MenuItem[]> {
    const categoryMap = new Map<string, MenuItem[]>();

    for (const item of MENU_ITEMS) {
      const categoryItems = categoryMap.get(item.category) || [];
      categoryItems.push(item);
      categoryMap.set(item.category, categoryItems);
    }

    // Sort items within each category by categoryOrder
    for (const [category, items] of categoryMap.entries()) {
      items.sort((a, b) => a.categoryOrder - b.categoryOrder);
      categoryMap.set(category, items);
    }

    return categoryMap;
  }

  /**
   * Get a specific menu item by its ID
   * @param id - The deterministic ID of the menu item
   * @returns The menu item if found, undefined otherwise
   */
  getItemById(id: string): MenuItem | undefined {
    return MENU_ITEMS.find(item => item.id === id);
  }

  /**
   * Filter menu items by search query (case-insensitive substring matching)
   * @param searchQuery - The search text to filter by
   * @returns Array of menu items whose names contain the search query
   */
  filterItems(searchQuery: string): MenuItem[] {
    if (!searchQuery || searchQuery.trim() === '') {
      return MENU_ITEMS;
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    return MENU_ITEMS.filter(item => 
      item.name.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Filter menu items by search query while maintaining category grouping
   * @param searchQuery - The search text to filter by
   * @returns Map with category names as keys and arrays of filtered items as values
   */
  filterItemsByCategory(searchQuery: string): Map<string, MenuItem[]> {
    const filteredItems = this.filterItems(searchQuery);
    const categoryMap = new Map<string, MenuItem[]>();

    for (const item of filteredItems) {
      const categoryItems = categoryMap.get(item.category) || [];
      categoryItems.push(item);
      categoryMap.set(item.category, categoryItems);
    }

    // Sort items within each category by categoryOrder
    for (const [category, items] of categoryMap.entries()) {
      items.sort((a, b) => a.categoryOrder - b.categoryOrder);
      categoryMap.set(category, items);
    }

    return categoryMap;
  }
}

/**
 * Singleton instance of MenuService
 * Export this for use throughout the application
 */
export const menuService = new MenuService();
