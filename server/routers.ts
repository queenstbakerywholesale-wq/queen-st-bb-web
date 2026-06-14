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
import { stripeCheckoutRouter } from "./routers/stripeCheckout";
import { publicEnquiriesRouter } from "./routers/publicEnquiries";
import { adminEnquiriesRouter } from "./routers/adminEnquiries";
import { adminPageImagesRouter, publicPageImagesRouter } from "./routers/adminPageImages";
import { giftCardRouter } from "./routers/giftCards";
import { adminBrandStickersRouter } from "./routers/adminBrandStickers";
import { customerMyPageRouter } from "./routers/customerMyPage";
import { staffAuthRouter } from "./routers/staffAuth";
import { adminStaffRouter } from "./routers/adminStaff";
import { posRouter } from "./routers/pos";
import { shiftsRouter } from "./routers/shifts";

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
  adminEnquiries: adminEnquiriesRouter,
  adminPageImages: adminPageImagesRouter,
  adminBrandStickers: adminBrandStickersRouter,
  adminStaff: adminStaffRouter,

  // Public APIs
  publicProducts: publicProductsRouter,
  publicBookings: publicBookingsRouter,
  stripe: stripeCheckoutRouter,
  publicEnquiries: publicEnquiriesRouter,
  publicPageImages: publicPageImagesRouter,
  giftCards: giftCardRouter,
  myPage: customerMyPageRouter,
  staffAuth: staffAuthRouter,
  pos: posRouter,
  shifts: shiftsRouter,
});

export type AppRouter = typeof appRouter;
