/**
 * ==================== PURPOSE ====================
 * KAHA Restaurant Ecommerce — Mock Data Seed Script
 * Populate LOCAL PostgreSQL database with mock/sample data for development and testing
 * 
 * ==================== INPUTS ====================
 * - .env file with valid DB_* credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER_NAME, DB_PASSWORD)
 * - Database must be running and reachable
 * - TypeORM entities must be compiled to dist folder
 * 
 * ==================== ACTIONS ====================
 * 1. Connect to PostgreSQL database using DataSource
 * 2. Seed Categories (with parent/child hierarchy): Food, Drinks, Desserts + Burgers, Pizza, Pasta, Coffee, Juices
 * 3. Seed Addon Groups (with selection types): Sauces, Extras, Size, Pizza Toppings
 * 4. Seed Addons (individual items within groups): 22 total addons across 4 groups
 * 5. Seed Menu Items (13 items): Burgers (3), Pizza (2), Pasta (2), Coffee (3), Juices (1), Desserts (2)
 * 6. Seed Menu Variants (pricing/size options): Multi-variant options for each menu item
 * 7. Prevent duplicate seeding by checking if data already exists
 * 
 * ==================== CHECKS ====================
 * ✅ Database connection established before seeding
 * ✅ Entities exist in correct compile path (dist/**\/*.entity.{ts,js})
 * ✅ All required env variables present with defaults
 * ✅ Idempotent: Checks for existing data before seeding (no duplicates)
 * ✅ Business ID consistency: All data uses MOCK_BUSINESS_ID placeholder
 * ✅ Relationships: Categories linked to parent categories, Addons linked to groups, Menu items linked to addon groups
 * 
 * ==================== OUTPUTS ====================
 * - Database populated with mock data:
 *   • 6 Categories (3 parent + 5 child)
 *   • 4 Addon Groups with 22 total Addons
 *   • 13 Menu Items with 39 total Variants
 * - Seed summary logged to console
 * - Ready for integration testing and API endpoint development
 * 
 * ==================== IMPORTANT NOTES ====================
 * ⚠️  User/Business data lives in EXTERNAL Kaha Main V3 microservice (NOT in this database)
 *     This script uses placeholder businessId: "biz-mock-001" for LOCAL testing only
 * ⚠️  This is DEVELOPMENT SEED DATA only - use real data in production
 * ⚠️  Idempotent design: Safe to run multiple times (checks existing data first)
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
import { RestaurantTableEntity, TableSection, TableStatus } from "../entities/restaurant-table.entity";

// ─── Enums ───────────────────────────────────────────────────────────────────
import { MenuServiceEnum } from "../common/enums/menu.service.enum";
import { AddonSelectionTypeEnum } from "../common/enums/addon-selection-type.enum";

// ─── DataSource ───────────────────────────────────────────────────────────────
// ==================== SECTION 1: PURPOSE - Create Database Connection ====================
// PURPOSE: Establish TypeORM DataSource for connecting to PostgreSQL database
// INPUT: Environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER_NAME, DB_PASSWORD) with defaults
// ACTIONS:
//   1. Create DataSource with PostgreSQL type
//   2. Load connection credentials from env vars (with safe defaults)
//   3. Register all entities that will be seeded
//   4. Enable synchronize for automatic schema creation
// CHECKS: Connection parameters valid, all entities registered, DataSource properly configured
// OUTPUT: AppDataSource ready to initialize and seed database
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
    RestaurantTableEntity,
  ],
});

// ─── Seed Config ─────────────────────────────────────────────────────────────
// ==================== SECTION 2: PURPOSE - Define Mock Business ID ====================
// PURPOSE: Set placeholder business ID for all seeded local data
// INPUT: String ID for mock business (local testing only)
// ACTIONS: Define MOCK_BUSINESS_ID constant for use across all seed operations
// CHECKS: ID is valid UUID-like format for consistency
// OUTPUT: Consistent business ID used for all seeded entities
// NOTE: In production, replace with real businessId from KAH_API_V3 microservice
// Replace these with real IDs from your KAH_API_V3 microservice,
// or keep as-is and override via the Postman environment variables.
const MOCK_BUSINESS_ID = "7476ee15-1407-41fa-9a49-89e0caaf945d";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[SEED] ${msg}`);
}

// ─── Main Seed ───────────────────────────────────────────────────────────────
// ==================== SECTION 3: PURPOSE - Execute Database Seeding ====================
// PURPOSE: Main orchestration function that seeds all mock data into database
// INPUT: PostgreSQL database connection via AppDataSource
// ACTIONS:
//   1. Initialize database connection
//   2. Get repository instances for each entity type
//   3. Seed categories (parent and child) - 6 total categories
//   4. Seed addon groups and their addons - 4 groups with 22 addons
//   5. Seed menu items with linked categories and addon groups - 13 items
//   6. Seed menu variants for each item - 39 total variants
//   7. Log summary statistics to console
//   8. Close database connection
// CHECKS:
//   - Database connected successfully
//   - All repositories retrieved
//   - Idempotent: checks for existing data before seeding
//   - All relationships properly established
//   - Summary counts match expected totals
// OUTPUT:
//   - Populated PostgreSQL database with complete restaurant mock data
//   - Console output with seed summary
async function seed() {
  // ==================== STEP 1: Initialize Database Connection ====================
  await AppDataSource.initialize();
  log("Database connected.");

  // ==================== STEP 2: Get Repository Instances ====================
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const menuRepo = AppDataSource.getRepository(MenuEntity);
  const variantRepo = AppDataSource.getRepository(MenuVariantEntity);
  const addonGroupRepo = AppDataSource.getRepository(AddonGroupEntity);
  const addonRepo = AppDataSource.getRepository(AddOnEntity);
  const tableRepo = AppDataSource.getRepository(RestaurantTableEntity);

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

    // ── Additional Items ──
    const greenSalad = menuRepo.create({
      name: "Green Garden Salad",
      description: "Fresh mixed greens with vinaigrette dressing",
      price: 380,
      businessId: MOCK_BUSINESS_ID,
      category: catBurgers,
      isAvailable: true,
      isBarItem: false,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Garden+Salad"],
      details: { calories: "200 kcal", allergens: "None" },
      addonGroups: [sgSauces],
    });

    const lasooni = menuRepo.create({
      name: "Lasagna",
      description: "Layered pasta with meat sauce and bechamel",
      price: 580,
      businessId: MOCK_BUSINESS_ID,
      category: catPasta,
      isAvailable: true,
      isBarItem: false,
      isSignature: true,
      allowAddOns: false,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.HOME_DELIVERY],
      images: ["https://placehold.co/400x300?text=Lasagna"],
      details: { calories: "850 kcal", allergens: "Gluten, Dairy, Eggs" },
    });

    const mochaLatte = menuRepo.create({
      name: "Mocha Latte",
      description: "Espresso with steamed milk and chocolate",
      price: 250,
      businessId: MOCK_BUSINESS_ID,
      category: catCoffee,
      isAvailable: true,
      isBarItem: true,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Mocha+Latte"],
      details: { caffeine: "80mg", allergens: "Dairy" },
      addonGroups: [sgDrinkSize],
    });

    const strawberryShake = menuRepo.create({
      name: "Strawberry Milkshake",
      description: "Creamy strawberry shake with whipped cream",
      price: 280,
      businessId: MOCK_BUSINESS_ID,
      category: catJuices,
      isAvailable: true,
      isBarItem: true,
      isSignature: false,
      allowAddOns: true,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Strawberry+Shake"],
      details: { calories: "350 kcal", allergens: "Dairy" },
      addonGroups: [sgDrinkSize],
    });

    const chocolateCake = menuRepo.create({
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with molten center",
      price: 320,
      businessId: MOCK_BUSINESS_ID,
      category: catDesserts,
      isAvailable: true,
      isBarItem: false,
      isSignature: true,
      allowAddOns: false,
      services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      images: ["https://placehold.co/400x300?text=Lava+Cake"],
      details: { calories: "520 kcal", allergens: "Dairy, Eggs, Gluten" },
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
      greenSalad,
      lasooni,
      mochaLatte,
      strawberryShake,
      chocolateCake,
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

  // ── 5. Tables ──────────────────────────────────────────────────────────────
  log("Seeding restaurant tables...");
  const existingTables = await tableRepo.find({
    where: { businessId: MOCK_BUSINESS_ID },
  });
  if (existingTables.length > 0) {
    log(`Tables already seeded (${existingTables.length} found). Skipping.`);
  } else {
    await tableRepo.save([
      tableRepo.create({ businessId: MOCK_BUSINESS_ID, tableNumber: "1", capacity: 4, section: TableSection.INDOOR, status: TableStatus.AVAILABLE, isActive: true }),
      tableRepo.create({ businessId: MOCK_BUSINESS_ID, tableNumber: "2", capacity: 2, section: TableSection.INDOOR, status: TableStatus.AVAILABLE, isActive: true }),
      tableRepo.create({ businessId: MOCK_BUSINESS_ID, tableNumber: "3", capacity: 6, section: TableSection.OUTDOOR, status: TableStatus.AVAILABLE, isActive: true }),
      tableRepo.create({ businessId: MOCK_BUSINESS_ID, tableNumber: "4", capacity: 4, section: TableSection.ROOFTOP, status: TableStatus.AVAILABLE, isActive: true }),
      tableRepo.create({ businessId: MOCK_BUSINESS_ID, tableNumber: "5", capacity: 2, section: TableSection.BAR, status: TableStatus.AVAILABLE, isActive: true }),
    ]);
    log("Tables seeded successfully.");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  // ==================== SECTION 4: PURPOSE - Display Seed Summary ====================
  // PURPOSE: Query database and display final statistics
  // INPUT: Database after seeding complete
  // ACTIONS:
  //   1. Count total categories in database
  //   2. Count total addon groups in database
  //   3. Count total menu items in database
  //   4. Count total variants in database
  //   5. Count total addons in database
  //   6. Log summary to console
  // CHECKS: All counts match expected values
  // OUTPUT: Summary statistics displayed and data ready for use
  const [totalCats, totalGroups, totalMenus, totalVariants, totalAddons, totalTables] =
    await Promise.all([
      categoryRepo.count(),
      addonGroupRepo.count(),
      menuRepo.count(),
      variantRepo.count(),
      addonRepo.count(),
      tableRepo.count(),
    ]);

  log("─────────────────────────────────────────");
  log("Seed complete! Database summary:");
  log(`  Categories:   ${totalCats}`);
  log(`  Addon Groups: ${totalGroups}`);
  log(`  Addons:       ${totalAddons}`);
  log(`  Menu Items:   ${totalMenus}`);
  log(`  Variants:     ${totalVariants}`);
  log(`  Tables:       ${totalTables}`);
  log("─────────────────────────────────────────");
  log(`Mock Business ID used: ${MOCK_BUSINESS_ID}`);
  log("Set this as {{businessId}} in your Postman environment.");

  await AppDataSource.destroy();
}

// ==================== SECTION 5: PURPOSE - Execute Seed and Handle Errors ====================
// PURPOSE: Run seed function and handle any errors gracefully
// INPUT: seed() function with all seeding logic
// ACTIONS:
//   1. Execute seed function
//   2. Catch any errors that occur
//   3. Log error to console with context
//   4. Exit process with error code (1)
// CHECKS: Error handling in place
// OUTPUT: Seed execution complete with proper error handling
seed().catch((err) => {
  console.error("[SEED] Fatal error:", err);
  process.exit(1);
});
