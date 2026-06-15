import { sql, eq, and, gte, lte, count, sum } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  orders,
  cakeBookings,
  products,
  customers,
  enquiries,
} from "../../drizzle/schema";

export const adminDashboardRouter = router({
  /** Daily/weekly revenue chart data for the past 30 days */
  salesChart: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { daily: [], weekly: [] };

    // Get daily revenue for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`.as("date"),
        revenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`.as("revenue"),
        orderCount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          gte(orders.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt}) ASC`);

    // Fill in missing dates with 0 revenue
    const daily: Array<{ date: string; revenue: number; orderCount: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = dailyRevenue.find((r) => r.date === dateStr);
      daily.push({
        date: dateStr,
        revenue: found ? parseFloat(found.revenue) : 0,
        orderCount: found ? found.orderCount : 0,
      });
    }

    // Aggregate into weekly data (last 4 weeks)
    const weekly: Array<{ weekStart: string; weekEnd: string; revenue: number; orderCount: number }> = [];
    for (let w = 0; w < 4; w++) {
      const weekSlice = daily.slice(30 - 28 + w * 7, 30 - 28 + (w + 1) * 7);
      if (weekSlice.length > 0) {
        weekly.push({
          weekStart: weekSlice[0].date,
          weekEnd: weekSlice[weekSlice.length - 1].date,
          revenue: weekSlice.reduce((sum, d) => sum + d.revenue, 0),
          orderCount: weekSlice.reduce((sum, d) => sum + d.orderCount, 0),
        });
      }
    }

    return { daily, weekly };
  }),

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

    // Enquiry stats
    const [totalEnquiriesResult] = await db
      .select({ count: count() })
      .from(enquiries);

    const [pendingEnquiriesResult] = await db
      .select({ count: count() })
      .from(enquiries)
      .where(eq(enquiries.status, "new"));

    const [todayEnquiriesResult] = await db
      .select({ count: count() })
      .from(enquiries)
      .where(and(gte(enquiries.createdAt, startOfDay), lte(enquiries.createdAt, endOfDay)));

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
      totalEnquiries: totalEnquiriesResult?.count ?? 0,
      pendingEnquiries: pendingEnquiriesResult?.count ?? 0,
      todayEnquiries: todayEnquiriesResult?.count ?? 0,
    };
  }),
});
