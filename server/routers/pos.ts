import { z } from "zod";
import { eq, and, asc, desc, sql, gte, lte, count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  posCategories,
  posMenuItems,
  posOrders,
  posOrderItems,
  posItemModifiers,
  branches,
  staffMembers,
  invoices,
  orders,
  orderItems,
} from "../../drizzle/schema";
import { ENV } from "../_core/env";

export const posRouter = router({
  // ─── Categories ───────────────────────────────────────────────
  listCategories: publicProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(posCategories)
        .where(and(eq(posCategories.branchId, input.branchId), eq(posCategories.isActive, true)))
        .orderBy(asc(posCategories.sortOrder));
    }),

  createCategory: publicProcedure
    .input(z.object({
      branchId: z.number(),
      name: z.string().min(1),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(posCategories).values({
        branchId: input.branchId,
        name: input.name,
        color: input.color || null,
      });
      return { success: true };
    }),

  deleteCategory: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(posCategories).set({ isActive: false }).where(eq(posCategories.id, input.id));
      return { success: true };
    }),

  // ─── Menu Items ───────────────────────────────────────────────
  listMenuItems: publicProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(posMenuItems)
        .where(and(eq(posMenuItems.branchId, input.branchId), eq(posMenuItems.isActive, true)))
        .orderBy(asc(posMenuItems.sortOrder));
    }),

  createMenuItem: publicProcedure
    .input(z.object({
      branchId: z.number(),
      categoryId: z.number(),
      name: z.string().min(1),
      priceType: z.enum(["fixed", "weight", "custom"]),
      unitPrice: z.string(),
      unit: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(posMenuItems).values({
        branchId: input.branchId,
        categoryId: input.categoryId,
        name: input.name,
        priceType: input.priceType,
        unitPrice: input.unitPrice,
        unit: input.unit || (input.priceType === "weight" ? "100g" : "each"),
      });
      return { success: true };
    }),

  updateMenuItem: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      priceType: z.enum(["fixed", "weight", "custom"]).optional(),
      unitPrice: z.string().optional(),
      unit: z.string().optional(),
      imageUrl: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      const setData: any = {};
      if (updates.name !== undefined) setData.name = updates.name;
      if (updates.priceType !== undefined) setData.priceType = updates.priceType;
      if (updates.unitPrice !== undefined) setData.unitPrice = updates.unitPrice;
      if (updates.unit !== undefined) setData.unit = updates.unit;
      if (updates.imageUrl !== undefined) setData.imageUrl = updates.imageUrl;
      if (updates.color !== undefined) setData.color = updates.color;
      if (Object.keys(setData).length > 0) {
        await db.update(posMenuItems).set(setData).where(eq(posMenuItems.id, id));
      }
      return { success: true };
    }),

  deleteMenuItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(posMenuItems).set({ isActive: false }).where(eq(posMenuItems.id, input.id));
      return { success: true };
    }),

  // ─── Item Modifiers ─────────────────────────────────────────────
  listModifiers: publicProcedure
    .input(z.object({ menuItemId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(posItemModifiers)
        .where(eq(posItemModifiers.menuItemId, input.menuItemId))
        .orderBy(asc(posItemModifiers.sortOrder));
    }),

  listModifiersByBranch: publicProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // Get all modifiers for items in this branch
      const items = await db
        .select({ id: posMenuItems.id })
        .from(posMenuItems)
        .where(and(eq(posMenuItems.branchId, input.branchId), eq(posMenuItems.isActive, true)));
      if (items.length === 0) return [];
      const itemIds = items.map(i => i.id);
      return db
        .select()
        .from(posItemModifiers)
        .where(sql`${posItemModifiers.menuItemId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`);
    }),

  createModifier: publicProcedure
    .input(z.object({
      menuItemId: z.number(),
      name: z.string().min(1),
      options: z.array(z.object({
        label: z.string(),
        priceAdjustment: z.number(),
      })),
      required: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(posItemModifiers).values({
        menuItemId: input.menuItemId,
        name: input.name,
        options: input.options,
        required: input.required,
      });
      return { success: true };
    }),

  updateModifier: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      options: z.array(z.object({
        label: z.string(),
        priceAdjustment: z.number(),
      })).optional(),
      required: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      const setData: any = {};
      if (updates.name !== undefined) setData.name = updates.name;
      if (updates.options !== undefined) setData.options = updates.options;
      if (updates.required !== undefined) setData.required = updates.required;
      await db.update(posItemModifiers).set(setData).where(eq(posItemModifiers.id, id));
      return { success: true };
    }),

  deleteModifier: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(posItemModifiers).where(eq(posItemModifiers.id, input.id));
      return { success: true };
    }),

  // ─── POS Orders ───────────────────────────────────────────────
  createOrder: publicProcedure
    .input(z.object({
      branchId: z.number(),
      staffId: z.number(),
      items: z.array(z.object({
        menuItemId: z.number().optional(),
        itemName: z.string(),
        quantity: z.number().default(1),
        weightGrams: z.number().optional(),
        unitPrice: z.string(),
        totalPrice: z.string(),
        notes: z.string().optional(),
      })),
      paymentMethod: z.enum(["cash", "card", "gift_card", "mixed"]),
      fulfillmentType: z.enum(["for_here", "to_go", "delivery", "pickup"]).default("for_here"),
      surchargeType: z.enum(["none", "weekend", "holiday"]).default("none"),
      discountType: z.enum(["none", "staff", "influencer"]).default("none"),
      cashReceived: z.string().optional(),
      changeGiven: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate order number: POS-BRANCH-YYYYMMDD-XXXX
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
      const orderNumber = `POS-${input.branchId}-${dateStr}-${random}`;

      // Calculate totals with discount, surcharge, and GST
      const subtotal = input.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

      // Apply discount first (staff 30%, influencer 100%)
      const discountPercent = input.discountType === "staff" ? 30 : input.discountType === "influencer" ? 100 : 0;
      const discountAmount = subtotal * (discountPercent / 100);
      const afterDiscount = subtotal - discountAmount;

      // Apply surcharge (10% weekend, 15% holiday) on discounted amount
      const surchargePercent = input.surchargeType === "weekend" ? 10 : input.surchargeType === "holiday" ? 15 : 0;
      const surchargeAmount = afterDiscount * (surchargePercent / 100);
      const afterSurcharge = afterDiscount + surchargeAmount;

      // GST 10% (inclusive — Australian standard: total is GST-inclusive, tax = total / 11)
      const tax = afterSurcharge / 11;
      const total = afterSurcharge;

      const [result] = await db.insert(posOrders).values({
        orderNumber,
        branchId: input.branchId,
        staffId: input.staffId,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: input.paymentMethod,
        paymentStatus: "paid",
        fulfillmentType: input.fulfillmentType,
        surchargeType: input.surchargeType,
        surchargePercent: surchargePercent.toFixed(2),
        surchargeAmount: surchargeAmount.toFixed(2),
        discountType: input.discountType,
        discountPercent: discountPercent.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        cashReceived: input.cashReceived || null,
        changeGiven: input.changeGiven || null,
        customerName: input.customerName || null,
        customerPhone: input.customerPhone || null,
        notes: input.notes || null,
      });

      const orderId = (result as any).insertId;

      // Insert order items
      if (input.items.length > 0) {
        await db.insert(posOrderItems).values(
          input.items.map((item) => ({
            posOrderId: orderId,
            menuItemId: item.menuItemId || null,
            itemName: item.itemName,
            quantity: item.quantity,
            weightGrams: item.weightGrams || null,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          }))
        );
      }

      return { success: true, orderNumber, orderId, total: total.toFixed(2), tax: tax.toFixed(2), surchargeAmount: surchargeAmount.toFixed(2), discountAmount: discountAmount.toFixed(2) };
    }),

  // ─── Sales Data ───────────────────────────────────────────────
  salesSummary: publicProcedure
    .input(z.object({
      branchId: z.number().optional(),
      startDate: z.string(), // ISO date
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalSales: 0, orderCount: 0, avgOrder: 0, items: [] };

      const conditions = [
        gte(posOrders.createdAt, new Date(input.startDate)),
        lte(posOrders.createdAt, new Date(input.endDate + "T23:59:59")),
        eq(posOrders.paymentStatus, "paid"),
      ];
      if (input.branchId) {
        conditions.push(eq(posOrders.branchId, input.branchId));
      }

      const orders = await db
        .select()
        .from(posOrders)
        .where(and(...conditions))
        .orderBy(desc(posOrders.createdAt));

      const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
      const orderCount = orders.length;
      const avgOrder = orderCount > 0 ? totalSales / orderCount : 0;

      // Get item-level sales
      const orderIds = orders.map((o) => o.id);
      let itemSales: any[] = [];
      if (orderIds.length > 0) {
        const allItems = await db
          .select()
          .from(posOrderItems)
          .where(sql`${posOrderItems.posOrderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);

        // Aggregate by item name
        const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        for (const item of allItems) {
          const existing = itemMap.get(item.itemName) || { name: item.itemName, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += parseFloat(item.totalPrice);
          itemMap.set(item.itemName, existing);
        }
        itemSales = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
      }

      // Hourly breakdown
      const hourly = new Array(24).fill(0);
      for (const order of orders) {
        const hour = new Date(order.createdAt).getHours();
        hourly[hour] += parseFloat(order.total);
      }

      return { totalSales, orderCount, avgOrder, items: itemSales, hourly, orders };
    }),

  // Recent orders for staff view
  recentOrders: publicProcedure
    .input(z.object({ branchId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(posOrders)
        .where(eq(posOrders.branchId, input.branchId))
        .orderBy(desc(posOrders.createdAt))
        .limit(input.limit);
    }),

  // ─── Invoices ─────────────────────────────────────────────────
  listInvoices: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(100);
  }),

  createInvoice: publicProcedure
    .input(z.object({
      customerName: z.string().min(1),
      customerEmail: z.string().optional(),
      customerPhone: z.string().optional(),
      branchId: z.number().optional(),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.string(),
      })),
      notes: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
      const invoiceNumber = `INV-${dateStr}-${random}`;

      const itemsWithTotal = input.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: item.quantity * parseFloat(item.unitPrice),
      }));

      const subtotal = itemsWithTotal.reduce((sum, i) => sum + i.totalPrice, 0);

      await db.insert(invoices).values({
        invoiceNumber,
        branchId: input.branchId || null,
        customerName: input.customerName,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        items: itemsWithTotal,
        subtotal: subtotal.toFixed(2),
        tax: "0",
        total: subtotal.toFixed(2),
        status: "draft",
        dueDate: input.dueDate || null,
        notes: input.notes || null,
      });

      return { success: true, invoiceNumber };
    }),

  markInvoicePaid: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(invoices).set({ status: "paid", paidAt: new Date() }).where(eq(invoices.id, input.id));
      return { success: true };
    }),

  downloadInvoicePdf: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, input.id)).limit(1);
      if (!invoice) throw new Error("Invoice not found");

      // Get branch name if available
      let branchName: string | undefined;
      if (invoice.branchId) {
        const [branch] = await db.select().from(branches).where(eq(branches.id, invoice.branchId)).limit(1);
        if (branch) branchName = branch.name;
      }

      const { generateInvoicePdf } = await import("../invoicePdf");
      const { url } = await generateInvoicePdf({
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerPhone: invoice.customerPhone,
        items: invoice.items as any[],
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        createdAt: invoice.createdAt,
        branchName,
      });

      return { url };
    }),

  sendInvoice: publicProcedure
    .input(z.object({ id: z.number(), via: z.enum(["email", "sms"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, input.id)).limit(1);
      if (!invoice) throw new Error("Invoice not found");

      if (input.via === "email" && invoice.customerEmail) {
        // Send email via Resend
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(ENV.resendApiKey);
          const itemsHtml = (invoice.items as any[]).map((item: any) =>
            `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.unitPrice.toFixed(2)}</td><td>$${item.totalPrice.toFixed(2)}</td></tr>`
          ).join("");

          await resend.emails.send({
            from: ENV.senderEmail,
            to: invoice.customerEmail,
            subject: `Invoice ${invoice.invoiceNumber} from Queen St BB`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #5A3A2E;">Invoice ${invoice.invoiceNumber}</h2>
                <p>Dear ${invoice.customerName},</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead><tr style="border-bottom: 2px solid #5A3A2E;"><th style="text-align:left;padding:8px;">Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                  <tbody>${itemsHtml}</tbody>
                  <tfoot><tr style="border-top: 2px solid #5A3A2E;"><td colspan="3" style="padding:8px;font-weight:bold;">Total</td><td style="font-weight:bold;">$${invoice.total}</td></tr></tfoot>
                </table>
                ${invoice.dueDate ? `<p>Due date: ${invoice.dueDate}</p>` : ""}
                ${invoice.notes ? `<p>Notes: ${invoice.notes}</p>` : ""}
                <p style="color: #888; font-size: 12px;">Queen St BB — Melbourne</p>
              </div>
            `,
          });
        } catch (e) {
          console.error("[Invoice] Email send failed:", e);
        }
      }

      await db.update(invoices).set({
        status: "sent",
        sentAt: new Date(),
        sentVia: input.via,
      }).where(eq(invoices.id, input.id));

      return { success: true };
    }),

  // ─── Staff Online Order View ─────────────────────────────────
  staffOnlineOrders: publicProcedure
    .input(z.object({
      branchId: z.number().optional(),
      statusFilter: z.enum(["all", "pending", "paid", "preparing", "ready", "shipped", "completed"]).default("all"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];
      if (input.statusFilter !== "all") {
        conditions.push(eq(orders.status, input.statusFilter));
      } else {
        // Show active orders (not completed/cancelled)
        conditions.push(
          sql`${orders.status} IN ('pending', 'paid', 'preparing', 'ready', 'shipped')`
        );
      }
      // Filter by branch for pickup orders
      if (input.branchId) {
        conditions.push(
          sql`(${orders.pickupBranchId} = ${input.branchId} OR ${orders.fulfillmentType} = 'shipping')`
        );
      }

      const result = await db
        .select()
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orders.createdAt))
        .limit(50);

      return result;
    }),

  staffUpdateOrderStatus: publicProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(["preparing", "ready", "shipped", "completed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.orderId));
      return { success: true };
    }),

  staffOrderItems: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
    }),
});
