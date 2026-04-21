import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (OAuth) ───────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admin Users (separate password-based auth) ──────────────────
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 200 }),
  email: varchar("email", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// ─── Categories ──────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  categoryId: int("categoryId"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  images: json("images").$type<string[]>(),
  stock: int("stock").default(0).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(5).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  productType: mysqlEnum("productType", [
    "tiramisu",
    "gelato",
    "cake",
    "merchandise",
    "postcards",
    "objects",
    "wholesale",
  ]).notNull(),
  sizes: json("sizes").$type<{ name: string; priceAdjustment: number }[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Customers ───────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  totalOrders: int("totalOrders").default(0).notNull(),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Branches ────────────────────────────────────────────────────
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  openingHours: json("openingHours").$type<{
    [day: string]: { open: string; close: string; closed?: boolean };
  }>(),
  pickupSlotDuration: int("pickupSlotDuration").default(30).notNull(), // minutes
  maxBookingsPerSlot: int("maxBookingsPerSlot").default(3).notNull(),
  minPrepNoticeHours: int("minPrepNoticeHours").default(24).notNull(),
  allowSameDayBooking: boolean("allowSameDayBooking").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  closedDates: json("closedDates").$type<string[]>(), // ISO date strings
  closedSlots: json("closedSlots").$type<{ date: string; time: string }[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

// ─── Orders ──────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId"),
  customerName: varchar("customerName", { length: 200 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  status: mysqlEnum("status", [
    "pending",
    "paid",
    "preparing",
    "ready",
    "shipped",
    "completed",
    "cancelled",
  ]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", [
    "unpaid",
    "paid",
    "refunded",
    "partial",
  ]).default("unpaid").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  fulfillmentType: mysqlEnum("fulfillmentType", ["shipping", "pickup"]).default("pickup").notNull(),
  shippingFee: decimal("shippingFee", { precision: 10, scale: 2 }).default("0").notNull(),
  shippingAddress: text("shippingAddress"),
  pickupBranchId: int("pickupBranchId"),
  pickupDate: varchar("pickupDate", { length: 20 }),
  pickupTime: varchar("pickupTime", { length: 10 }),
  hasCakeItems: boolean("hasCakeItems").default(false).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ─────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId"),
  productName: varchar("productName", { length: 300 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  size: varchar("size", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Shipping / Tracking ─────────────────────────────────────────
export const shippingTracking = mysqlTable("shipping_tracking", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  courierName: varchar("courierName", { length: 200 }),
  trackingNumber: varchar("trackingNumber", { length: 200 }),
  status: mysqlEnum("status", [
    "processing",
    "shipped",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "failed",
  ]).default("processing").notNull(),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShippingTracking = typeof shippingTracking.$inferSelect;
export type InsertShippingTracking = typeof shippingTracking.$inferInsert;

// ─── Cake Bookings ───────────────────────────────────────────────
export const cakeBookings = mysqlTable("cake_bookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingNumber: varchar("bookingNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId"),
  customerName: varchar("customerName", { length: 200 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  branchId: int("branchId").notNull(),
  productId: int("productId"),
  productName: varchar("productName", { length: 300 }).notNull(),
  size: varchar("size", { length: 100 }),
  customMessage: text("customMessage"),
  customRequest: text("customRequest"),
  pickupDate: varchar("pickupDate", { length: 20 }).notNull(), // YYYY-MM-DD
  pickupTime: varchar("pickupTime", { length: 10 }).notNull(), // HH:mm
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["online", "pickup"]).default("pickup").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", [
    "unpaid",
    "paid",
    "refunded",
  ]).default("unpaid").notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CakeBooking = typeof cakeBookings.$inferSelect;
export type InsertCakeBooking = typeof cakeBookings.$inferInsert;

// ─── Notifications ───────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "order_confirmation",
    "booking_confirmation",
    "shipping_update",
    "order_ready",
    "admin_new_order",
    "admin_new_booking",
    "general",
  ]).notNull(),
  recipientType: mysqlEnum("recipientType", ["customer", "admin"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  subject: varchar("subject", { length: 500 }),
  content: text("content"),
  relatedOrderId: int("relatedOrderId"),
  relatedBookingId: int("relatedBookingId"),
  isSent: boolean("isSent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Enquiries (Wholesale + Customer Care) ──────────────────────
export const enquiries = mysqlTable("enquiries", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["wholesale", "customer_care"]).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 300 }),
  interest: varchar("interest", { length: 200 }),
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  status: mysqlEnum("enquiryStatus", [
    "new",
    "in_progress",
    "responded",
    "closed",
  ]).default("new").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = typeof enquiries.$inferInsert;

// ─── Page Images (Admin-managed content) ────────────────────────
export const pageImages = mysqlTable("page_images", {
  id: int("id").autoincrement().primaryKey(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(), // e.g. "home", "about", "space", "objects"
  slotKey: varchar("slotKey", { length: 100 }).notNull(), // e.g. "hero", "section1", "section2"
  imageUrl: text("imageUrl").notNull(),
  storageKey: text("storageKey"),
  altText: varchar("altText", { length: 500 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageImage = typeof pageImages.$inferSelect;
export type InsertPageImage = typeof pageImages.$inferInsert;
