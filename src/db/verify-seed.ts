import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function verifySeed() {
  const { db } = await import('./index');
  const { menuItems } = await import('./schema');
  const { MENU_ITEMS } = await import('@/data/menu');

  console.log('Verifying menu items seed...\n');

  // Get all items from database
  const dbItems = await db.select().from(menuItems);
  
  console.log(`✓ Database contains ${dbItems.length} menu items`);
  console.log(`✓ Source data contains ${MENU_ITEMS.length} menu items`);
  
  if (dbItems.length !== MENU_ITEMS.length) {
    console.error(`✗ Count mismatch! Expected ${MENU_ITEMS.length}, got ${dbItems.length}`);
    process.exit(1);
  }

  // Verify each item exists
  let allMatch = true;
  for (const sourceItem of MENU_ITEMS) {
    const dbItem = dbItems.find(item => item.id === sourceItem.id);
    if (!dbItem) {
      console.error(`✗ Missing item: ${sourceItem.id} - ${sourceItem.name}`);
      allMatch = false;
    } else if (
      dbItem.name !== sourceItem.name ||
      dbItem.category !== sourceItem.category ||
      dbItem.price !== sourceItem.price ||
      dbItem.categoryOrder !== sourceItem.categoryOrder
    ) {
      console.error(`✗ Data mismatch for item: ${sourceItem.id}`);
      console.error(`  Expected: ${JSON.stringify(sourceItem)}`);
      console.error(`  Got: ${JSON.stringify(dbItem)}`);
      allMatch = false;
    }
  }

  if (allMatch) {
    console.log('\n✓ All menu items verified successfully!');
    console.log('✓ All item data matches source data');
  } else {
    console.error('\n✗ Verification failed - some items are missing or incorrect');
    process.exit(1);
  }
}

verifySeed()
  .then(() => {
    console.log('\n✓ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  });
