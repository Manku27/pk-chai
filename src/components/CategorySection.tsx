'use client';

/**
 * CategorySection Component
 * Displays a category header and all menu items within that category
 */

import React from 'react';
import { MenuItem as MenuItemType } from '@/types/menu';
import { MenuItem } from './MenuItem';
import styles from './CategorySection.module.css';

interface CategorySectionProps {
  category: string;
  items: MenuItemType[];
}

export function CategorySection({ category, items }: CategorySectionProps) {
  return (
    <section className={styles.categorySection}>
      <h2 className={styles.categoryHeader}>{category}</h2>
      <div className={styles.itemsGrid}>
        {items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
