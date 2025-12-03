import { MenuItem } from "@/types/menu";

/**
 * Complete menu data with deterministic IDs for all items
 * Based on BRD menu structure
 */
export const MENU_ITEMS: MenuItem[] = [
  // 1. Chai Category
  { 
    id: "chai-small", 
    name: "Chai - Small", 
    category: "Chai", 
    price: 10, 
    categoryOrder: 1 
  },
  { 
    id: "chai-semi-medium", 
    name: "Chai - Semi Medium", 
    category: "Chai", 
    price: 14, 
    categoryOrder: 2 
  },
  { 
    id: "chai-medium", 
    name: "Chai - Medium", 
    category: "Chai", 
    price: 18, 
    categoryOrder: 3 
  },
  { 
    id: "chai-large", 
    name: "Chai - Large", 
    category: "Chai", 
    price: 24, 
    categoryOrder: 4 
  },

  // 2. Handi Chai Category
  { 
    id: "handi-chai-small", 
    name: "Handi Chai - Small", 
    category: "Handi Chai", 
    price: 20, 
    categoryOrder: 1 
  },
  { 
    id: "handi-chai-large", 
    name: "Handi Chai - Large", 
    category: "Handi Chai", 
    price: 30, 
    categoryOrder: 2 
  },

  // 3. Liquor Chai Category
  { 
    id: "liquor-chai-small", 
    name: "Liquor Chai - Small", 
    category: "Liquor Chai", 
    price: 10, 
    categoryOrder: 1 
  },
  { 
    id: "liquor-chai-medium", 
    name: "Liquor Chai - Medium", 
    category: "Liquor Chai", 
    price: 14, 
    categoryOrder: 2 
  },

  // 4. Coffee Category
  { 
    id: "coffee-black", 
    name: "Coffee - Black", 
    category: "Coffee", 
    price: 15, 
    categoryOrder: 1 
  },
  { 
    id: "coffee-milk-small", 
    name: "Coffee - Milk (Small)", 
    category: "Coffee", 
    price: 20, 
    categoryOrder: 2 
  },
  { 
    id: "coffee-milk-medium", 
    name: "Coffee - Milk (Medium)", 
    category: "Coffee", 
    price: 30, 
    categoryOrder: 3 
  },
  { 
    id: "coffee-milk-large", 
    name: "Coffee - Milk (Large)", 
    category: "Coffee", 
    price: 40, 
    categoryOrder: 4 
  },
  { 
    id: "coffee-cold", 
    name: "Coffee - Cold", 
    category: "Coffee", 
    price: 49, 
    categoryOrder: 5 
  },
  { 
    id: "coffee-hot-chocolate", 
    name: "Hot Chocolate", 
    category: "Coffee", 
    price: 30, 
    categoryOrder: 6 
  },

  // 5. Bun Makhan Category
  { 
    id: "bun-makhan-grilled", 
    name: "Grilled Bun Makhan", 
    category: "Bun Makhan", 
    price: 25, 
    categoryOrder: 1 
  },
  { 
    id: "bun-makhan-cheese", 
    name: "Cheese Bun Makhan", 
    category: "Bun Makhan", 
    price: 35, 
    categoryOrder: 2 
  },

  // 6. Sandwich Category
  { 
    id: "sandwich-grill", 
    name: "Grill Sandwich", 
    category: "Sandwich", 
    price: 30, 
    categoryOrder: 1 
  },
  { 
    id: "sandwich-grill-cheese-corn", 
    name: "Grill Sandwich with Cheese & Corn", 
    category: "Sandwich", 
    price: 40, 
    categoryOrder: 2 
  },
  { 
    id: "sandwich-grill-chicken-small", 
    name: "Grill Chicken Sandwich (Small)", 
    category: "Sandwich", 
    price: 50, 
    categoryOrder: 3 
  },
  { 
    id: "sandwich-grill-chicken-large", 
    name: "Grill Chicken Sandwich (Large)", 
    category: "Sandwich", 
    price: 60, 
    categoryOrder: 4 
  },

  // 7. Maggi Category
  { 
    id: "maggi-veg", 
    name: "Veg Maggi", 
    category: "Maggi", 
    price: 40, 
    categoryOrder: 1 
  },
  { 
    id: "maggi-veg-butter", 
    name: "Veg Maggi with Butter", 
    category: "Maggi", 
    price: 50, 
    categoryOrder: 2 
  },
  { 
    id: "maggi-veg-butter-cheese", 
    name: "Veg Maggi with Butter and Cheese", 
    category: "Maggi", 
    price: 60, 
    categoryOrder: 3 
  },
  { 
    id: "maggi-egg", 
    name: "Egg Maggi", 
    category: "Maggi", 
    price: 50, 
    categoryOrder: 4 
  },
  { 
    id: "maggi-egg-butter", 
    name: "Egg Maggi with Butter", 
    category: "Maggi", 
    price: 60, 
    categoryOrder: 5 
  },
  { 
    id: "maggi-chocolate", 
    name: "Chocolate Maggi", 
    category: "Maggi", 
    price: 70, 
    categoryOrder: 6 
  },
  { 
    id: "maggi-lays", 
    name: "Lays Maggi", 
    category: "Maggi", 
    price: 69, 
    categoryOrder: 7 
  },
  { 
    id: "maggi-warehouse", 
    name: "Maggi Warehouse", 
    category: "Maggi", 
    price: 89, 
    categoryOrder: 8 
  },
  { 
    id: "maggi-fish", 
    name: "Fish Maggi", 
    category: "Maggi", 
    price: 119, 
    categoryOrder: 9 
  },

  // 8. Pasta Category
  { 
    id: "pasta-white-sauce", 
    name: "PK White Sauce Pasta", 
    category: "Pasta", 
    price: 89, 
    categoryOrder: 1 
  },
  { 
    id: "pasta-red-sauce", 
    name: "PK Red Sauce Pasta", 
    category: "Pasta", 
    price: 79, 
    categoryOrder: 2 
  },
  { 
    id: "pasta-addon-chicken", 
    name: "Addon Chicken", 
    category: "Pasta", 
    price: 20, 
    categoryOrder: 3 
  },

  // 10. French Fries Category
  { 
    id: "french-fries", 
    name: "French Fries", 
    category: "French Fries", 
    price: 60, 
    categoryOrder: 1 
  },

  // 11. Omelette Category
  { 
    id: "omelette-single", 
    name: "Omelette - Single", 
    category: "Omelette", 
    price: 20, 
    categoryOrder: 1 
  },
  { 
    id: "omelette-double", 
    name: "Omelette - Double", 
    category: "Omelette", 
    price: 30, 
    categoryOrder: 2 
  },

  // 12. Dim Toste Category
  { 
    id: "dim-toste-single", 
    name: "Dim Toste - Single", 
    category: "Dim Toste", 
    price: 30, 
    categoryOrder: 1 
  },
  { 
    id: "dim-toste-double", 
    name: "Dim Toste - Double", 
    category: "Dim Toste", 
    price: 40, 
    categoryOrder: 2 
  },
];
