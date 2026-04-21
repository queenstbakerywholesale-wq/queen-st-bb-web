import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminAuthRouter } from "./routers/adminAuth";
import { adminDashboardRouter } from "./routers/adminDashboard";
import { adminProductsRouter } from "./routers/adminProducts";
import { adminOrdersRouter } from "./routers/adminOrders";
import { adminShippingRouter } from "./routers/adminShipping";
import { adminBookingsRouter } from "./routers/adminBookings";
import { adminCustomersRouter } from "./routers/adminCustomers";
import { adminUploadRouter } from "./routers/adminUpload";
import { publicProductsRouter } from "./routers/publicProducts";
import { publicBookingsRouter } from "./routers/publicBookings";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Admin system
  adminAuth: adminAuthRouter,
  adminDashboard: adminDashboardRouter,
  adminProducts: adminProductsRouter,
  adminOrders: adminOrdersRouter,
  adminShipping: adminShippingRouter,
  adminBookings: adminBookingsRouter,
  adminCustomers: adminCustomersRouter,
  adminUpload: adminUploadRouter,

  // Public APIs
  publicProducts: publicProductsRouter,
  publicBookings: publicBookingsRouter,
});

export type AppRouter = typeof appRouter;
