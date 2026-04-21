import { sql, eq, and, gte, lte, count, sum } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  orders,
  cakeBookings,
  products,
  customers,
} from "../../drizzle/schema";

export const adminDashboardRouter = router({
  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const startOfDay = new Date(todayStr + "T00:00:00Z");
    const endOfDay = new Date(todayStr + "T23:59:59Z");

    // Today's orders
    const [todayOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay)));

    // Today's bookings
    const [todayBookingsResult] = await db
      .select({ count: count() })
      .from(cakeBookings)
      .where(eq(cakeBookings.pickupDate, todayStr));

    // Pending orders
    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));

    // Low stock products
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        lowStockThreshold: products.lowStockThreshold,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stock} <= ${products.lowStockThreshold}`
        )
      );

    // Total revenue (all time)
    const [revenueResult] = await db
      .select({ total: sum(orders.total) })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"));

    // Today's revenue
    const [todayRevenueResult] = await db
      .select({ total: sum(orders.total) })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay)
        )
      );

    // Total customers
    const [totalCustomersResult] = await db
      .select({ count: count() })
      .from(customers);

    // Recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(10);

    // Upcoming bookings
    const upcomingBookings = await db
      .select()
      .from(cakeBookings)
      .where(gte(cakeBookings.pickupDate, todayStr))
      .orderBy(sql`${cakeBookings.pickupDate} ASC, ${cakeBookings.pickupTime} ASC`)
      .limit(10);

    // Recent customers
    const recentCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        totalOrders: customers.totalOrders,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .orderBy(sql`${customers.createdAt} DESC`)
      .limit(5);

    return {
      todayOrders: todayOrdersResult?.count ?? 0,
      todayBookings: todayBookingsResult?.count ?? 0,
      pendingOrders: pendingOrdersResult?.count ?? 0,
      lowStockProducts,
      totalRevenue: revenueResult?.total ?? "0",
      todayRevenue: todayRevenueResult?.total ?? "0",
      totalCustomers: totalCustomersResult?.count ?? 0,
      recentOrders,
      upcomingBookings,
      recentCustomers,
    };
  }),
});
