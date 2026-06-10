import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Branch IDs: 1=Hawthorn, 2=Windsor, 3=CBD
const branchIds = [1, 2, 3];

// Categories from Square POS screenshot
const categories = [
  { name: "BB Goods", color: "#8B8B8B", sortOrder: 1 },
  { name: "Post Card", color: "#8B8B8B", sortOrder: 2 },
  { name: "Envelope & Sticker", color: "#8B8B8B", sortOrder: 3 },
  { name: "Tumbler", color: "#7A7A7A", sortOrder: 4 },
  { name: "MUG", color: "#7A7A7A", sortOrder: 5 },
  { name: "Eco Bag", color: "#7A7A7A", sortOrder: 6 },
  { name: "T-shirts", color: "#7A7A7A", sortOrder: 7 },
  { name: "Classic Coffee", color: "#5A5A5A", sortOrder: 8 },
  { name: "Italian Coffee", color: "#5A5A5A", sortOrder: 9 },
  { name: "Black Coffee", color: "#5A5A5A", sortOrder: 10 },
  { name: "White Coffee", color: "#5A5A5A", sortOrder: 11 },
  { name: "BB Non Coffee", color: "#5A5A5A", sortOrder: 12 },
  { name: "AU Wine", color: "#4A4A4A", sortOrder: 13 },
  { name: "Spritz", color: "#4A4A4A", sortOrder: 14 },
  { name: "BB Pairing (Gelato)", color: "#4A4A4A", sortOrder: 15 },
  { name: "BB Gelato", color: "#4A4A4A", sortOrder: 16 },
  { name: "Beverage", color: "#6A6A6A", sortOrder: 17 },
  { name: "Italian Beer", color: "#6A6A6A", sortOrder: 18 },
  { name: "Etc", color: "#6A6A6A", sortOrder: 19 },
  { name: "Surcharge", color: "#B8860B", sortOrder: 20 },
];

// Menu items per category
const menuItems = {
  "BB Goods": [
    { name: "BB Tote Bag", priceType: "fixed", unitPrice: "25.00", unit: "each" },
    { name: "BB Candle", priceType: "fixed", unitPrice: "35.00", unit: "each" },
    { name: "BB Gift Set", priceType: "fixed", unitPrice: "55.00", unit: "each" },
    { name: "BB Apron", priceType: "fixed", unitPrice: "45.00", unit: "each" },
  ],
  "Post Card": [
    { name: "Postcard Single", priceType: "fixed", unitPrice: "3.00", unit: "each" },
    { name: "Postcard Set (5)", priceType: "fixed", unitPrice: "12.00", unit: "each" },
    { name: "Postcard Set (10)", priceType: "fixed", unitPrice: "20.00", unit: "each" },
  ],
  "Envelope & Sticker": [
    { name: "Envelope Pack", priceType: "fixed", unitPrice: "5.00", unit: "each" },
    { name: "Sticker Sheet", priceType: "fixed", unitPrice: "4.00", unit: "each" },
    { name: "Sticker Pack (3)", priceType: "fixed", unitPrice: "10.00", unit: "each" },
  ],
  "Tumbler": [
    { name: "BB Tumbler 350ml", priceType: "fixed", unitPrice: "38.00", unit: "each" },
    { name: "BB Tumbler 500ml", priceType: "fixed", unitPrice: "42.00", unit: "each" },
  ],
  "MUG": [
    { name: "BB Mug Standard", priceType: "fixed", unitPrice: "28.00", unit: "each" },
    { name: "BB Mug Large", priceType: "fixed", unitPrice: "32.00", unit: "each" },
  ],
  "Eco Bag": [
    { name: "Eco Bag Small", priceType: "fixed", unitPrice: "15.00", unit: "each" },
    { name: "Eco Bag Large", priceType: "fixed", unitPrice: "22.00", unit: "each" },
  ],
  "T-shirts": [
    { name: "BB T-shirt S", priceType: "fixed", unitPrice: "45.00", unit: "each" },
    { name: "BB T-shirt M", priceType: "fixed", unitPrice: "45.00", unit: "each" },
    { name: "BB T-shirt L", priceType: "fixed", unitPrice: "45.00", unit: "each" },
    { name: "BB T-shirt XL", priceType: "fixed", unitPrice: "45.00", unit: "each" },
  ],
  "Classic Coffee": [
    { name: "Espresso", priceType: "fixed", unitPrice: "4.00", unit: "each" },
    { name: "Long Black", priceType: "fixed", unitPrice: "4.50", unit: "each" },
    { name: "Flat White", priceType: "fixed", unitPrice: "5.00", unit: "each" },
    { name: "Cappuccino", priceType: "fixed", unitPrice: "5.00", unit: "each" },
    { name: "Latte", priceType: "fixed", unitPrice: "5.00", unit: "each" },
    { name: "Mocha", priceType: "fixed", unitPrice: "5.50", unit: "each" },
  ],
  "Italian Coffee": [
    { name: "Affogato", priceType: "fixed", unitPrice: "7.00", unit: "each" },
    { name: "Shakerato", priceType: "fixed", unitPrice: "6.50", unit: "each" },
    { name: "Marocchino", priceType: "fixed", unitPrice: "6.00", unit: "each" },
    { name: "Bicerin", priceType: "fixed", unitPrice: "7.50", unit: "each" },
  ],
  "Black Coffee": [
    { name: "Filter Coffee", priceType: "fixed", unitPrice: "5.00", unit: "each" },
    { name: "Cold Brew", priceType: "fixed", unitPrice: "6.00", unit: "each" },
    { name: "Americano", priceType: "fixed", unitPrice: "4.50", unit: "each" },
  ],
  "White Coffee": [
    { name: "Oat Flat White", priceType: "fixed", unitPrice: "5.50", unit: "each" },
    { name: "Almond Latte", priceType: "fixed", unitPrice: "5.50", unit: "each" },
    { name: "Soy Cappuccino", priceType: "fixed", unitPrice: "5.50", unit: "each" },
  ],
  "BB Non Coffee": [
    { name: "Hot Chocolate", priceType: "fixed", unitPrice: "5.50", unit: "each" },
    { name: "Matcha Latte", priceType: "fixed", unitPrice: "6.00", unit: "each" },
    { name: "Chai Latte", priceType: "fixed", unitPrice: "5.50", unit: "each" },
    { name: "Turmeric Latte", priceType: "fixed", unitPrice: "6.00", unit: "each" },
    { name: "Baby Chino", priceType: "fixed", unitPrice: "2.00", unit: "each" },
  ],
  "AU Wine": [
    { name: "House Red (glass)", priceType: "fixed", unitPrice: "12.00", unit: "each" },
    { name: "House White (glass)", priceType: "fixed", unitPrice: "12.00", unit: "each" },
    { name: "Sparkling (glass)", priceType: "fixed", unitPrice: "14.00", unit: "each" },
    { name: "Wine Bottle", priceType: "fixed", unitPrice: "45.00", unit: "each" },
  ],
  "Spritz": [
    { name: "Aperol Spritz", priceType: "fixed", unitPrice: "16.00", unit: "each" },
    { name: "Limoncello Spritz", priceType: "fixed", unitPrice: "16.00", unit: "each" },
    { name: "Hugo Spritz", priceType: "fixed", unitPrice: "16.00", unit: "each" },
  ],
  "BB Pairing (Gelato)": [
    { name: "Gelato + Espresso", priceType: "fixed", unitPrice: "10.00", unit: "each" },
    { name: "Gelato + Wine", priceType: "fixed", unitPrice: "18.00", unit: "each" },
    { name: "Gelato + Spritz", priceType: "fixed", unitPrice: "20.00", unit: "each" },
  ],
  "BB Gelato": [
    { name: "Gelato 1 Scoop", priceType: "fixed", unitPrice: "6.00", unit: "each" },
    { name: "Gelato 2 Scoops", priceType: "fixed", unitPrice: "10.00", unit: "each" },
    { name: "Gelato 3 Scoops", priceType: "fixed", unitPrice: "13.00", unit: "each" },
    { name: "Gelato Tub 500ml", priceType: "fixed", unitPrice: "16.00", unit: "each" },
    { name: "Gelato Tub 1L", priceType: "fixed", unitPrice: "28.00", unit: "each" },
    { name: "Gelato by Weight", priceType: "weight", unitPrice: "5.50", unit: "100g" },
  ],
  "Beverage": [
    { name: "Sparkling Water", priceType: "fixed", unitPrice: "4.00", unit: "each" },
    { name: "Still Water", priceType: "fixed", unitPrice: "3.50", unit: "each" },
    { name: "Fresh Juice", priceType: "fixed", unitPrice: "7.00", unit: "each" },
    { name: "Iced Tea", priceType: "fixed", unitPrice: "5.50", unit: "each" },
    { name: "Soft Drink", priceType: "fixed", unitPrice: "4.50", unit: "each" },
  ],
  "Italian Beer": [
    { name: "Peroni", priceType: "fixed", unitPrice: "9.00", unit: "each" },
    { name: "Moretti", priceType: "fixed", unitPrice: "9.00", unit: "each" },
    { name: "Menabrea", priceType: "fixed", unitPrice: "10.00", unit: "each" },
  ],
  "Etc": [
    { name: "Custom Item", priceType: "custom", unitPrice: "0.00", unit: "each" },
    { name: "Extra Shot", priceType: "fixed", unitPrice: "0.50", unit: "each" },
    { name: "Alt Milk", priceType: "fixed", unitPrice: "0.70", unit: "each" },
    { name: "Takeaway Cup", priceType: "fixed", unitPrice: "0.50", unit: "each" },
  ],
  "Surcharge": [
    { name: "Weekend Surcharge 10%", priceType: "custom", unitPrice: "0.00", unit: "each" },
    { name: "Holiday Surcharge 15%", priceType: "custom", unitPrice: "0.00", unit: "each" },
  ],
};

console.log("Inserting POS categories and menu items for all 3 branches...");

for (const branchId of branchIds) {
  for (const cat of categories) {
    const [result] = await conn.execute(
      `INSERT INTO pos_categories (branchId, name, color, sortOrder, isActive) VALUES (?, ?, ?, ?, 1)`,
      [branchId, cat.name, cat.color, cat.sortOrder]
    );
    const catId = result.insertId;

    const items = menuItems[cat.name] || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await conn.execute(
        `INSERT INTO pos_menu_items (branchId, categoryId, name, priceType, unitPrice, unit, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [branchId, catId, item.name, item.priceType, item.unitPrice, item.unit, i + 1]
      );
    }
  }
  console.log(`Branch ${branchId} done.`);
}

console.log("All POS data seeded successfully!");
await conn.end();
process.exit(0);
