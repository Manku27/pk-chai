'use client';

/**
 * MenuList Component
 * Fetches menu data from the menu service and displays all items grouped by category
 * Supports search filtering while maintaining category grouping
 */

import { useState } from 'react';
import { menuService } from '@/services/menu';
import { CategorySection } from './CategorySection';
import SearchBar from './SearchBar';
import styles from './MenuList.module.css';

export function MenuList() {
  // Search state management
  const [searchQuery, setSearchQuery] = useState('');

  // Filter menu items based on search query
  // When search is empty, display all items
  const itemsByCategory = searchQuery.trim() === ''
    ? menuService.getItemsByCategory()
    : menuService.filterItemsByCategory(searchQuery);

  // Handle search change from SearchBar
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className={styles.menuList}>
      <SearchBar onSearchChange={handleSearchChange} />
      {Array.from(itemsByCategory.entries()).map(([category, items]) => (
        <CategorySection key={category} category={category} items={items} />
      ))}
    </div>
  );
}
