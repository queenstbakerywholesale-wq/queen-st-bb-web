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

// ─── Gift Cards ─────────────────────────────────────────────────
export const giftCards = mysqlTable("gift_cards", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  initialAmount: decimal("initialAmount", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("giftCardStatus", ["pending", "active", "depleted", "expired", "voided"]).default("pending").notNull(),
  purchaserName: varchar("purchaserName", { length: 200 }).notNull(),
  purchaserEmail: varchar("purchaserEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 200 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  personalMessage: text("personalMessage"),
  selectedImage: varchar("selectedImage", { length: 50 }).default("classic").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  squareGiftCardId: varchar("squareGiftCardId", { length: 255 }),
  squareGan: varchar("squareGan", { length: 50 }),
  customDesignUrl: text("customDesignUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
});
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = typeof giftCards.$inferInsert;

// ─── Gift Card Transactions ─────────────────────────────────────
export const giftCardTransactions = mysqlTable("gift_card_transactions", {
  id: int("id").autoincrement().primaryKey(),
  giftCardId: int("giftCardId").notNull(),
  type: mysqlEnum("transactionType", ["activation", "redemption", "refund", "void", "adjustment", "recharge"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  performedBy: varchar("performedBy", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type InsertGiftCardTransaction = typeof giftCardTransactions.$inferInsert;

// ─── E-Card Designs (admin-uploaded background templates) ───────
export const ecardDesigns = mysqlTable("ecard_designs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EcardDesign = typeof ecardDesigns.$inferSelect;
export type InsertEcardDesign = typeof ecardDesigns.$inferInsert;

// ─── Brand Stickers (for Gift Card Editor) ──────────────────────
export const brandStickers = mysqlTable("brand_stickers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BrandSticker = typeof brandStickers.$inferSelect;
export type InsertBrandSticker = typeof brandStickers.$inferInsert;

// ─── Staff Members ──────────────────────────────────────────────
export const staffMembers = mysqlTable("staff_members", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 200 }).notNull(),
  branchId: int("branchId").notNull(),
  role: mysqlEnum("staffRole", ["staff", "manager"]).default("staff").notNull(),
  pin: varchar("pin", { length: 10 }), // Quick PIN for POS login
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffMember = typeof staffMembers.$inferSelect;
export type InsertStaffMember = typeof staffMembers.$inferInsert;

// ─── POS Categories (per-branch) ───────────────────────────────
export const posCategories = mysqlTable("pos_categories", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  color: varchar("color", { length: 20 }), // For UI button color
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PosCategory = typeof posCategories.$inferSelect;
export type InsertPosCategory = typeof posCategories.$inferInsert;

// ─── POS Menu Items (per-branch) ───────────────────────────────
export const posMenuItems = mysqlTable("pos_menu_items", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 300 }).notNull(),
  priceType: mysqlEnum("priceType", ["fixed", "weight", "custom"]).default("fixed").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // For fixed: item price, for weight: price per 100g
  unit: varchar("unit", { length: 20 }).default("each"), // "each", "g", "kg", "100g"
  imageUrl: text("imageUrl"),
  color: varchar("color", { length: 20 }), // Button color
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PosMenuItem = typeof posMenuItems.$inferSelect;
export type InsertPosMenuItem = typeof posMenuItems.$inferInsert;

// ─── POS Orders ─────────────────────────────────────────────────
export const posOrders = mysqlTable("pos_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  branchId: int("branchId").notNull(),
  staffId: int("staffId").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("posPaymentMethod", ["cash", "card", "gift_card", "mixed"]).default("cash").notNull(),
  paymentStatus: mysqlEnum("posPaymentStatus", ["paid", "pending", "refunded"]).default("paid").notNull(),
  cashReceived: decimal("cashReceived", { precision: 10, scale: 2 }),
  changeGiven: decimal("changeGiven", { precision: 10, scale: 2 }),
  fulfillmentType: mysqlEnum("posFulfillmentType", ["for_here", "to_go", "delivery", "pickup"]).default("for_here").notNull(),
  surchargeType: mysqlEnum("posSurchargeType", ["none", "weekend", "holiday"]).default("none").notNull(),
  surchargePercent: decimal("surchargePercent", { precision: 5, scale: 2 }).default("0").notNull(),
  surchargeAmount: decimal("surchargeAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  discountType: mysqlEnum("posDiscountType", ["none", "staff", "influencer"]).default("none").notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  customerName: varchar("customerName", { length: 200 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PosOrder = typeof posOrders.$inferSelect;
export type InsertPosOrder = typeof posOrders.$inferInsert;

// ─── POS Order Items ────────────────────────────────────────────
export const posOrderItems = mysqlTable("pos_order_items", {
  id: int("id").autoincrement().primaryKey(),
  posOrderId: int("posOrderId").notNull(),
  menuItemId: int("menuItemId"),
  itemName: varchar("itemName", { length: 300 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  weightGrams: int("weightGrams"), // For weight-based items
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PosOrderItem = typeof posOrderItems.$inferSelect;
export type InsertPosOrderItem = typeof posOrderItems.$inferInsert;

// ─── POS Item Modifiers (per-item options like size, temperature, extras) ──
export const posItemModifiers = mysqlTable("pos_item_modifiers", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  name: varchar("name", { length: 200 }).notNull(), // e.g. "Size", "Temperature", "Extras"
  options: json("options").$type<{ label: string; priceAdjustment: number }[]>().notNull(), // [{label: "Small", priceAdjustment: 0}, {label: "Large", priceAdjustment: 2.5}]
  required: boolean("required").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PosItemModifier = typeof posItemModifiers.$inferSelect;
export type InsertPosItemModifier = typeof posItemModifiers.$inferInsert;

// ─── Invoices ───────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  branchId: int("branchId"),
  orderId: int("orderId"), // Link to online order
  posOrderId: int("posOrderId"), // Link to POS order
  customerName: varchar("customerName", { length: 200 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  items: json("items").$type<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    weightGrams?: number;
  }[]>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("invoiceStatus", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  dueDate: varchar("dueDate", { length: 20 }),
  paidAt: timestamp("paidAt"),
  sentAt: timestamp("sentAt"),
  sentVia: mysqlEnum("sentVia", ["email", "sms"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Staff Shifts ─────────────────────────────────────────────────
export const staffShifts = mysqlTable("staff_shifts", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  staffId: int("staffId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM
  status: mysqlEnum("shiftStatus", ["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy"), // manager/admin who created
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffShift = typeof staffShifts.$inferSelect;
export type InsertStaffShift = typeof staffShifts.$inferInsert;

// ─── Shift Swap Requests ──────────────────────────────────────────
export const shiftSwapRequests = mysqlTable("shift_swap_requests", {
  id: int("id").autoincrement().primaryKey(),
  shiftId: int("shiftId").notNull(),
  requesterId: int("requesterId").notNull(), // staff who wants to swap
  targetStaffId: int("targetStaffId"), // staff they want to swap with (null = open request)
  status: mysqlEnum("swapStatus", ["pending", "accepted", "rejected", "cancelled"]).default("pending").notNull(),
  reason: text("reason"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;
export type InsertShiftSwapRequest = typeof shiftSwapRequests.$inferInsert;

// ─── Staff Attendance (Clock In/Out) ──────────────────────────────
export const staffAttendance = mysqlTable("staff_attendance", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  branchId: int("branchId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  clockInTime: timestamp("clockInTime"), // actual clock-in timestamp
  clockOutTime: timestamp("clockOutTime"), // actual clock-out timestamp
  clockInPhotoUrl: text("clockInPhotoUrl"), // S3 URL of clock-in photo
  clockOutPhotoUrl: text("clockOutPhotoUrl"), // S3 URL of clock-out photo
  totalMinutes: int("totalMinutes"), // calculated total work minutes
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffAttendance = typeof staffAttendance.$inferSelect;
export type InsertStaffAttendance = typeof staffAttendance.$inferInsert;
