/**
 * KAHA Restaurant Ecommerce — Mock Data Seed Script
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seed.ts
 *
 * Prerequisites:
 *   - .env file must be present with valid DB_* and JWT_SECRET_TOKEN values
 *   - Database must be running and reachable
 *
 * What this seeds:
 *   1. Categories (with parent/child hierarchy)
 *   2. Addon Groups (with addons inside)
 *   3. Menu items (with variants, linked to categories & addon groups)
 *
 * NOTE: User/Business data lives in the external KAH_API_V3 microservice.
 *       This script uses placeholder IDs that match the Postman collection
 *       environment variables ({{businessId}}, {{userId}}).
 */

import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

// ─── Entities ────────────────────────────────────────────────────────────────
import { CategoryEntity } from "../entities/category.entity";
import { MenuEntity } from "../entities/menu.entity";
import { MenuVariantEntity } from "../entities/menu-variant.entity";
import { AddonGroupEntity } from "../entities/addon-group.entity";
import { AddOnEntity } from "../entities/addons.entity";
import { MenuRatingEntity } from "../entities/menu-rating.entity";
import { CartEntity } from "../entities/cart.entity";
import { CartItemEntity } from "../entities/cartitem.entity";
import { CartItemAddOnsEntity } from "../entities/cart-item-addons.entity";
import { OrderEntity } from "../entities/order.entity";
import { OrderItemEntity } from "../entities/orderitem.entity";
import { OrderItemAddonEntity } from "../entities/orderitem-addons.entity";
import { OrderStatusEntity } from "../entities/order.status.entity";

// ─── Enums ───────────────────────────────────────────────────────────────────
import { MenuServiceEnum } from "../common/enums/menu.service.enum";
import { AddonSelectionTypeEnum } from "../common/enums/addon-selection-type.enum";

// ─── DataSource ───────────────────────────────────────────────────────────────
const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "kaha_restaurant",
  username: process.env.DB_USER_NAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  synchronize: true,
  logging: false,
  entities: [
    CategoryEntity,
    MenuEntity,
    MenuVariantEntity,
    AddonGroupEntity,
    AddOnEntity,
    MenuRatingEntity,
    CartEntity,
    CartItemEntity,
    CartItemAddOnsEntity,
    OrderEntity,
    OrderItemEntity,
    OrderItemAddonEntity,
    OrderStatusEntity,
  ],
});

// ─── Seed Config ─────────────────────────────────────────────────────────────
// Replace these with real IDs from your KAH_API_V3 microservice,
// or keep as-is and override via the Postman environment variables.
const MOCK_BUSINESS_ID = "biz-mock-001";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[SEED] ${msg}`);
}

// ─── Main Seed ───────────────────────────────────────────────────────────────
async function seed() {
  await AppDataSource.initialize();
  log("Database connected.");

  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const menuRepo = AppDataSource.getRepository(MenuEntity);
  const variantRepo = AppDataSource.getRepository(MenuVariantEntity);
  const addonGroupRepo = AppDataSource.getRepository(AddonGroupEntity);
  const addonRepo = AppDataSource.getRepository(AddOnEntity);

  // ── 1. Categories ──────────────────────────────────────────────────────────
  log("Seeding categories...");

  const existingCats = await categoryRepo.find({
    where: { businessId: MOCK_BUSINESS_ID },
  });
  if (existingCats.length > 0) {
    log(`Categories already seeded (${existingCats.length} found). Skipping.`);
  } else {
    // Parent categories
    const catFood = categoryRepo.create({
      name: "Food",
      description: "All food items",
      icon: "🍽️",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 1,
    });
    const catDrinks = categoryRepo.create({
      name: "Drinks",
      description: "Beverages and drinks",
      icon: "🥤",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 2,
    });
    const catDesserts = categoryRepo.create({
      name: "Desserts",
      description: "Sweet treats",
      icon: "🍰",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 3,
    });

    await categoryRepo.save([catFood, catDrinks, catDesserts]);

    // Child categories
    const catBurgers = categoryRepo.create({
      name: "Burgers",
      description: "Juicy burgers",
      icon: "🍔",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 1,
      parent: catFood,
    });
    const catPizza = categoryRepo.create({
      name: "Pizza",
      description: "Wood-fired pizzas",
      icon: "🍕",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 2,
      parent: catFood,
    });
    const catPasta = categoryRepo.create({
      name: "Pasta",
      description: "Italian pasta dishes",
      icon: "🍝",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 3,
      parent: catFood,
    });
    const catCoffee = categoryRepo.create({
      name: "Coffee",
      description: "Hot and cold coffee",
      icon: "☕",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 1,
      parent: catDrinks,
    });
    const catJuices = categoryRepo.create({
      name: "Fresh Juices",
      description: "Freshly squeezed juices",
      icon: "🍊",
      businessId: MOCK_BUSINESS_ID,
      isActive: true,
      position: 2,
      parent: catDrinks,
    });

    await categoryRepo.save([
      catBurgers,
      catPizza,
      catPasta,
      catCoffee,
      catJuices,
    ]);

    log(
      "Categories seeded: Food, Drinks, Desserts + Burgers, Pizza, Pasta, Coffee, Fresh Juices"
    );
  }

  // Reload categories for use below
  const [catBurgers, catPizza, catPasta, catCoffee, catJuices, catDesserts] =
    await Promise.all([
      categoryRepo.findOne({ where: { name: "Burgers", businessId: MOCK_BUSINESS_ID } }),
      categoryRepo.findOne({ where: { name: "Pizza", businessId: MOCK_BUSINESS_ID } }),
      categoryRepo.findOne({ where: { name: "Pasta", businessId: MOCK_BUSINESS_ID } }),
      categoryRepo.findOne({ where: { name: "Coffee", businessId: MOCK_BUSINESS_ID } }),
      categoryRepo.findOne({ where: { name: "Fresh Juices", businessId: MOCK_BUSINESS_ID } }),
      categoryRepo.findOne({ where: { name: "Desserts", businessId: MOCK_BUSINESS_ID } }),
    ]);

  // ── 2. Addon Groups ────────────────────────────────────────────────────────
  log("Seeding addon groups...");

  const existingGroups = await addonGroupRepo.find({
    where: { businessId: MOCK_BUSINESS_ID },
  });

  let groupSauces: AddonGroupEntity;
  let groupExtras: AddonGroupEntity;
  let groupDrinkSize: AddonGroupEntity;
  let groupToppings: AddonGroupEntity;

  if (existingGroups.length > 0) {
    log(`Addon groups already seeded (${existingGroups.length} found). Skipping.`);
    [groupSauces, groupExtras, groupDrinkSize, groupToppings] = existingGroups;
  } else {
    // Group 1: Sauces (multi-select, optional)
    groupSauces = addonGroupRepo.create({
      name: "Sauces",
      businessId: MOCK_BUSINESS_ID,
      isRequired: false,
      minSelect: 0,
      maxSelect: 3,
      selectionType: AddonSelectionTypeEnum.MULTI,
      isActive: true,
    });

    // Group 2: Extras (multi-select, optional)
    groupExtras = addonGroupRepo.create({
      name: "Extras",
      businessId: MOCK_BUSINESS_ID,
      isRequired: false,
      minSelect: 0,
      maxSelect: 5,
      selectionType: AddonSelectionTypeEnum.MULTI,
      isActive: true,
    });

    // Group 3: Drink Size (single-select, required)
    groupDrinkSize = addonGroupRepo.create({
      name: "Size",
      businessId: MOCK_BUSINESS_ID,
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      selectionType: AddonSelectionTypeEnum.SINGLE,
      isActive: true,
    });

    // Group 4: Pizza Toppings (multi-select, optional)
    groupToppings = addonGroupRepo.create({
      name: "Pizza Toppings",
      businessId: MOCK_BUSINESS_ID,
      isRequired: false,
      minSelect: 0,
      maxSelect: 6,
      selectionType: AddonSelectionTypeEnum.MULTI,
      isActive: true,
    });

    await addonGroupRepo.save([
      groupSauces,
      groupExtras,
      groupDrinkSize,
      groupToppings,
    ]);

    // Addons for Sauces
    await addonRepo.save([
      addonRepo.create({ name: "Ketchup", price: 0, sortOrder: 1, isActive: true, addonGroup: groupSauces }),
      addonRepo.create({ name: "Mayonnaise", price: 0, sortOrder: 2, isActive: true, addonGroup: groupSauces }),
      addonRepo.create({ name: "BBQ Sauce", price: 20, sortOrder: 3, isActive: true, addonGroup: groupSauces }),
      addonRepo.create({ name: "Sriracha", price: 20, sortOrder: 4, isActive: true, addonGroup: groupSauces }),
      addonRepo.create({ name: "Garlic Aioli", price: 30, sortOrder: 5, isActive: true, addonGroup: groupSauces }),
    ]);

    // Addons for Extras
    await addonRepo.save([
      addonRepo.create({ name: "Extra Cheese", price: 50, sortOrder: 1, isActive: true, addonGroup: groupExtras }),
      addonRepo.create({ name: "Extra Patty", price: 120, sortOrder: 2, isActive: true, addonGroup: groupExtras }),
      addonRepo.create({ name: "Bacon Strip", price: 80, sortOrder: 3, isActive: true, addonGroup: groupExtras }),
      addonRepo.create({ name: "Fried Egg", price: 40, sortOrder: 4, isActive: true, addonGroup: groupExtras }),
      addonRepo.create({ name: "Avocado", price: 60, sortOrder: 5, isActive: true, addonGroup: groupExtras }),
    ]);

    // Addons for Drink Size
    await addonRepo.save([
      addonRepo.create({ name: "Small (8oz)", price: 0, sortOrder: 1, isActive: true, addonGroup: groupDrinkSize }),
      addonRepo.create({ name: "Medium (12oz)", price: 30, sortOrder: 2, isActive: true, addonGroup: groupDrinkSize }),
      addonRepo.create({ name: "Large (16oz)", price: 60, sortOrder: 3, isActive: true, addonGroup: groupDrinkSize }),
    ]);

    // Addons for Pizza Toppings
    await addonRepo.save([
      addonRepo.create({ name: "Mushrooms", price: 40, sortOrder: 1, isActive: true, addonGroup: groupToppings }),
      addonRepo.create({ name: "Olives", price: 40, sortOrder: 2, isActive: true, addonGroup: groupToppings }),
      addonRepo.create({ name: "Jalapeños", price: 30, sortOrder: 3, isActive: true, addonGroup: groupToppings }),
      addonRepo.create({ name: "Sun-dried Tomatoes", price: 50, sortOrder: 4, isActive: true, addonGroup: groupToppings }),
      addonRepo.create({ name: "Pepperoni", price: 80, sortOrder: 5, isActive: true, addonGroup: groupToppings }),
      addonRepo.create({ name: "Chicken", price: 100, sortOrder: 6, isActive: true, addonGroup: groupToppings }),
    ]);

    log("Addon groups seeded: Sauces, Extras, Size, Pizza Toppings (with addons)");
  }

  // ── 3. Menu Items ──────────────────────────────────────────────────────────
  log("Seeding menu items...");

  const existingMenus = await menuRepo.find({
    where: { businessId: MOCK_BUSINESS_ID },
  });

  if (existingMenus.length > 0) {
    log(`Menu items already seeded (${existingMenus.length} found). Skipping.`);
  } else {
    // Reload addon groups with their addons
    const [sgSauces, sgExtras, sgDrinkSize, sgToppings] = await Promise.all([
      addonGroupRepo.findOne({ where: { name: "Sauces", businessId: MOCK_BUSINESS_ID } }),
      addonGroupRepo.findOne({ where: { name: "Extras", businessId: MOCK_BUSINESS_ID } }),
      addonGroupRepo.findOne({ where: { name: "Size", businessId: MOCK_BUSINESS_ID } }),
      addonGroupRepo.findOne({ where: { name: "Pizza Toppings", businessId: MOCK_BUSINESS_ID } }),
    ]);

    // ── Burgers ──
    const classicBurger = menuRepo.create({
      name: "Classic Beef Burger",
      description: "Juicy beef patty with lettuce, tomato, and pickles",
      price: 450,
      discountedPrice: 399,
      businessId: MOCK_BUSINESS_ID,
      category: catBurgers,
      isAvailable: true,
      isBarItem: false,
      isSignature: true,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Classic+Burger"],
      details: { calories: "650 kcal", allergens: "Gluten, Dairy" },
      addonGroups: [sgSauces, sgExtras],
    });

    const chickenBurger = menuRepo.create({
      name: "Crispy Chicken Burger",
      description: "Crispy fried chicken with coleslaw and honey mustard",
      price: 420,
      businessId: MOCK_BUSINESS_ID,
      category: catBurgers,
      isAvailable: true,
      isBarItem: false,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY, MenuServiceEnum.HOME_DELIVERY],
      images: ["https://placehold.co/400x300?text=Chicken+Burger"],
      details: { calories: "580 kcal" },
      addonGroups: [sgSauces, sgExtras],
    });

    const veggieBurger = menuRepo.create({
      name: "Veggie Delight Burger",
      description: "Plant-based patty with fresh veggies and vegan mayo",
      price: 380,
      businessId: MOCK_BUSINESS_ID,
      category: catBurgers,
      isAvailable: true,
      isBarItem: false,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Veggie+Burger"],
      details: { calories: "420 kcal", allergens: "Gluten" },
      addonGroups: [sgSauces],
    });

    // ── Pizza ──
    const margheritaPizza = menuRepo.create({
      name: "Margherita Pizza",
      description: "Classic tomato base, fresh mozzarella, and basil",
      price: 650,
      businessId: MOCK_BUSINESS_ID,
      category: catPizza,
      isAvailable: true,
      isBarItem: false,
      isSignature: true,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.HOME_DELIVERY],
      images: ["https://placehold.co/400x300?text=Margherita"],
      details: { calories: "800 kcal", allergens: "Gluten, Dairy" },
      addonGroups: [sgToppings],
    });

    const bbqChickenPizza = menuRepo.create({
      name: "BBQ Chicken Pizza",
      description: "Smoky BBQ sauce, grilled chicken, red onions, and cheddar",
      price: 750,
      businessId: MOCK_BUSINESS_ID,
      category: catPizza,
      isAvailable: true,
      isBarItem: false,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.HOME_DELIVERY],
      images: ["https://placehold.co/400x300?text=BBQ+Chicken+Pizza"],
      details: { calories: "950 kcal" },
      addonGroups: [sgToppings, sgExtras],
    });

    // ── Pasta ──
    const carbonara = menuRepo.create({
      name: "Spaghetti Carbonara",
      description: "Creamy egg sauce, pancetta, parmesan, and black pepper",
      price: 520,
      businessId: MOCK_BUSINESS_ID,
      category: catPasta,
      isAvailable: true,
      isBarItem: false,
      isSignature: false,
      allowAddOns: false,
      services: [MenuServiceEnum.DINE_IN],
      images: ["https://placehold.co/400x300?text=Carbonara"],
      details: { calories: "720 kcal", allergens: "Gluten, Dairy, Eggs" },
    });

    const arabiata = menuRepo.create({
      name: "Penne Arrabiata",
      description: "Spicy tomato sauce with garlic and fresh chili",
      price: 480,
      businessId: MOCK_BUSINESS_ID,
      category: catPasta,
      isAvailable: true,
      isBarItem: false,
      isSignature: false,
      allowAddOns: false,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Arrabiata"],
      details: { calories: "620 kcal", allergens: "Gluten" },
    });

    // ── Coffee ──
    const espresso = menuRepo.create({
      name: "Espresso",
      description: "Rich, concentrated single shot of espresso",
      price: 150,
      businessId: MOCK_BUSINESS_ID,
      category: catCoffee,
      isAvailable: true,
      isBarItem: true,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Espresso"],
      details: { caffeine: "63mg" },
      addonGroups: [sgDrinkSize],
    });

    const cappuccino = menuRepo.create({
      name: "Cappuccino",
      description: "Espresso with steamed milk foam",
      price: 220,
      businessId: MOCK_BUSINESS_ID,
      category: catCoffee,
      isAvailable: true,
      isBarItem: true,
      isSignature: true,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Cappuccino"],
      details: { caffeine: "75mg", allergens: "Dairy" },
      addonGroups: [sgDrinkSize],
    });

    const icedLatte = menuRepo.create({
      name: "Iced Caramel Latte",
      description: "Cold espresso with milk and caramel syrup over ice",
      price: 280,
      businessId: MOCK_BUSINESS_ID,
      category: catCoffee,
      isAvailable: true,
      isBarItem: true,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Iced+Latte"],
      details: { caffeine: "90mg", allergens: "Dairy" },
      addonGroups: [sgDrinkSize],
    });

    // ── Juices ──
    const orangeJuice = menuRepo.create({
      name: "Fresh Orange Juice",
      description: "Freshly squeezed Valencia oranges",
      price: 200,
      businessId: MOCK_BUSINESS_ID,
      category: catJuices,
      isAvailable: true,
      isBarItem: true,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Orange+Juice"],
      details: { vitamin_c: "120mg" },
      addonGroups: [sgDrinkSize],
    });

    // ── Desserts ──
    const cheesecake = menuRepo.create({
      name: "New York Cheesecake",
      description: "Classic creamy cheesecake with berry compote",
      price: 320,
      businessId: MOCK_BUSINESS_ID,
      category: catDesserts,
      isAvailable: true,
      isBarItem: false,
      isSignature: true,
      allowAddOns: false,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Cheesecake"],
      details: { calories: "450 kcal", allergens: "Dairy, Eggs, Gluten" },
    });

    const tiramisu = menuRepo.create({
      name: "Tiramisu",
      description: "Italian classic with mascarpone, espresso, and cocoa",
      price: 350,
      businessId: MOCK_BUSINESS_ID,
      category: catDesserts,
      isAvailable: true,
      isBarItem: false,
      isSignature: false,
      allowAddOns: false,
      services: [MenuServiceEnum.DINE_IN],
      images: ["https://placehold.co/400x300?text=Tiramisu"],
      details: { calories: "380 kcal", allergens: "Dairy, Eggs, Gluten" },
    });

    const savedMenus = await menuRepo.save([
      classicBurger,
      chickenBurger,
      veggieBurger,
      margheritaPizza,
      bbqChickenPizza,
      carbonara,
      arabiata,
      espresso,
      cappuccino,
      icedLatte,
      orangeJuice,
      cheesecake,
      tiramisu,
    ]);

    // ── 4. Menu Variants ───────────────────────────────────────────────────
    log("Seeding menu variants...");

    const variantData: Array<{ menu: MenuEntity; variants: Array<{ name: string; price: number; sortOrder: number }> }> = [
      {
        menu: savedMenus[0], // Classic Beef Burger
        variants: [
          { name: "Single Patty", price: 450, sortOrder: 1 },
          { name: "Double Patty", price: 580, sortOrder: 2 },
          { name: "Triple Patty", price: 700, sortOrder: 3 },
        ],
      },
      {
        menu: savedMenus[1], // Crispy Chicken Burger
        variants: [
          { name: "Regular", price: 420, sortOrder: 1 },
          { name: "Spicy", price: 420, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[2], // Veggie Burger
        variants: [
          { name: "Standard", price: 380, sortOrder: 1 },
        ],
      },
      {
        menu: savedMenus[3], // Margherita Pizza
        variants: [
          { name: "Personal (6\")", price: 450, sortOrder: 1 },
          { name: "Medium (10\")", price: 650, sortOrder: 2 },
          { name: "Large (14\")", price: 850, sortOrder: 3 },
        ],
      },
      {
        menu: savedMenus[4], // BBQ Chicken Pizza
        variants: [
          { name: "Personal (6\")", price: 550, sortOrder: 1 },
          { name: "Medium (10\")", price: 750, sortOrder: 2 },
          { name: "Large (14\")", price: 950, sortOrder: 3 },
        ],
      },
      {
        menu: savedMenus[5], // Carbonara
        variants: [
          { name: "Regular", price: 520, sortOrder: 1 },
          { name: "Large", price: 680, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[6], // Arrabiata
        variants: [
          { name: "Regular", price: 480, sortOrder: 1 },
          { name: "Large", price: 620, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[7], // Espresso
        variants: [
          { name: "Single Shot", price: 150, sortOrder: 1 },
          { name: "Double Shot", price: 200, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[8], // Cappuccino
        variants: [
          { name: "Regular", price: 220, sortOrder: 1 },
          { name: "Large", price: 280, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[9], // Iced Caramel Latte
        variants: [
          { name: "Medium", price: 280, sortOrder: 1 },
          { name: "Large", price: 340, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[10], // Orange Juice
        variants: [
          { name: "Small (250ml)", price: 200, sortOrder: 1 },
          { name: "Large (500ml)", price: 320, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[11], // Cheesecake
        variants: [
          { name: "Slice", price: 320, sortOrder: 1 },
          { name: "Whole Cake", price: 2200, sortOrder: 2 },
        ],
      },
      {
        menu: savedMenus[12], // Tiramisu
        variants: [
          { name: "Individual", price: 350, sortOrder: 1 },
        ],
      },
    ];

    for (const { menu, variants } of variantData) {
      for (const v of variants) {
        await variantRepo.save(
          variantRepo.create({ ...v, isAvailable: true, menu })
        );
      }
    }

    log(`Menu items seeded: ${savedMenus.length} items with variants`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const [totalCats, totalGroups, totalMenus, totalVariants, totalAddons] =
    await Promise.all([
      categoryRepo.count(),
      addonGroupRepo.count(),
      menuRepo.count(),
      variantRepo.count(),
      addonRepo.count(),
    ]);

  log("─────────────────────────────────────────");
  log("Seed complete! Database summary:");
  log(`  Categories:   ${totalCats}`);
  log(`  Addon Groups: ${totalGroups}`);
  log(`  Addons:       ${totalAddons}`);
  log(`  Menu Items:   ${totalMenus}`);
  log(`  Variants:     ${totalVariants}`);
  log("─────────────────────────────────────────");
  log(`Mock Business ID used: ${MOCK_BUSINESS_ID}`);
  log("Set this as {{businessId}} in your Postman environment.");

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("[SEED] Fatal error:", err);
  process.exit(1);
});
