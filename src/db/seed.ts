import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local BEFORE any other imports
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Seed script to populate menu_items table with data from src/data/menu.ts
 * This script can be run multiple times safely - it will skip existing items
 */
async function seedMenuItems() {
  // Import after env is loaded
  const { db } = await import('./index');
  const { menuItems } = await import('./schema');
  const { MENU_ITEMS } = await import('@/data/menu');
  try {
    console.log('Starting menu items seed...');
    console.log(`Found ${MENU_ITEMS.length} menu items to insert`);

    // Insert all menu items
    // Using onConflictDoNothing to make the script idempotent
    for (const item of MENU_ITEMS) {
      await db.insert(menuItems).values({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        categoryOrder: item.categoryOrder,
        isAvailable: true, // Default to available
      }).onConflictDoNothing();
    }

    console.log('✓ Menu items seeded successfully');

    // Verify the count
    const allItems = await db.select().from(menuItems);
    console.log(`✓ Verified: ${allItems.length} menu items in database`);

    // Show breakdown by category
    const categories = new Map<string, number>();
    allItems.forEach(item => {
      categories.set(item.category, (categories.get(item.category) || 0) + 1);
    });

    console.log('\nMenu items by category:');
    categories.forEach((count, category) => {
      console.log(`  ${category}: ${count} items`);
    });

  } catch (error) {
    console.error('Error seeding menu items:', error);
    throw error;
  }
}

// Run the seed function
seedMenuItems()
  .then(() => {
    console.log('\n✓ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  });
