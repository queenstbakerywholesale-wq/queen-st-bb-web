import Stripe from "stripe";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { orders, orderItems, customers } from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { notifyOwner } from "../_core/notification";
import { FIXED_SHIPPING_FEE_AUD, isPickupOnlyType } from "../../shared/const";
import { calculateShipping, getQuickEstimate } from "../auspostShipping";

function getStripe() {
  if (!ENV.stripeSecretKey) throw new Error("Stripe secret key not configured");
  return new Stripe(ENV.stripeSecretKey);
}

const cartItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  price: z.number().min(0.5), // Stripe min $0.50
  quantity: z.number().int().min(1).max(99),
  size: z.string().optional(),
  imageUrl: z.string().optional(),
  productType: z.string().default("merchandise"),
});

export const stripeCheckoutRouter = router({
  /**
   * Calculate shipping cost dynamically based on postcode.
   * Used by the frontend to show real-time shipping estimates.
   */
  calculateShipping: publicProcedure
    .input(
      z.object({
        postcode: z.string().min(3).max(6),
      })
    )
    .query(async ({ input }) => {
      const result = await calculateShipping(input.postcode);
      return {
        quotes: result.quotes.map((q) => ({
          serviceName: q.serviceName,
          serviceCode: q.serviceCode,
          price: q.price,
          estimatedDays: q.estimatedDays || null,
          source: q.source,
        })),
        selectedPrice: result.selectedQuote.price,
        selectedService: result.selectedQuote.serviceName,
        estimatedDays: result.selectedQuote.estimatedDays || null,
      };
    }),

  createCheckoutSession: publicProcedure
    .input(
      z.object({
        items: z.array(cartItemSchema).min(1).max(50),
        customerName: z.string().min(1).max(200),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        fulfillmentType: z.enum(["shipping", "pickup"]).default("pickup"),
        shippingAddress: z.string().optional(),
        shippingPostcode: z.string().optional(),
        shippingServiceCode: z.string().optional(),
        pickupBranchId: z.number().optional(),
        pickupBranchName: z.string().optional(),
        pickupDate: z.string().optional(), // YYYY-MM-DD (for cake orders)
        pickupTime: z.string().optional(), // HH:mm (for cake orders)
        giftCardCode: z.string().optional(), // Gift card code to apply
        giftCardAmount: z.number().min(0).optional(), // Amount to deduct from gift card
      })
    )
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      const origin = ctx.req.headers.origin || "http://localhost:3000";

      // Determine if cart has cake items
      const hasCakeItems = input.items.some((item) =>
        isPickupOnlyType(item.productType)
      );

      // Enforce: if cart has cake items, fulfillment MUST be pickup
      const effectiveFulfillment = hasCakeItems ? "pickup" : input.fulfillmentType;

      // Validate: shipping requires address and postcode
      if (effectiveFulfillment === "shipping" && !input.shippingAddress) {
        throw new Error("Shipping address is required for shipping orders");
      }

      // Validate: cake pickup requires date and time
      if (hasCakeItems && effectiveFulfillment === "pickup") {
        if (!input.pickupDate || !input.pickupTime) {
          throw new Error("Pickup date and time are required for cake orders");
        }
        if (!input.pickupBranchId) {
          throw new Error("Pickup branch is required for cake orders");
        }
      }

      // Calculate subtotal
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Calculate shipping fee dynamically
      let shippingFee = 0;
      let shippingServiceName = "";
      if (effectiveFulfillment === "shipping") {
        if (input.shippingPostcode) {
          try {
            const shippingResult = await calculateShipping(input.shippingPostcode);
            // If a specific service was selected, find it
            if (input.shippingServiceCode) {
              const selected = shippingResult.quotes.find(
                (q) => q.serviceCode === input.shippingServiceCode
              );
              if (selected) {
                shippingFee = selected.price;
                shippingServiceName = selected.serviceName;
              } else {
                shippingFee = shippingResult.selectedQuote.price;
                shippingServiceName = shippingResult.selectedQuote.serviceName;
              }
            } else {
              shippingFee = shippingResult.selectedQuote.price;
              shippingServiceName = shippingResult.selectedQuote.serviceName;
            }
          } catch {
            // Fallback to default
            shippingFee = FIXED_SHIPPING_FEE_AUD;
            shippingServiceName = "Standard Parcel";
          }
        } else {
          shippingFee = FIXED_SHIPPING_FEE_AUD;
          shippingServiceName = "Standard Parcel";
        }
      }

      const total = subtotal + shippingFee;

      // Gift card discount
      let giftCardDiscount = 0;
      let giftCardApplied = false;
      if (input.giftCardCode && input.giftCardAmount && input.giftCardAmount > 0) {
        // Validate the gift card exists and has sufficient balance
        const { giftCards: gcTable } = await import("../../drizzle/schema");
        const db2 = await getDb();
        if (db2) {
          const [gc] = await db2
            .select()
            .from(gcTable)
            .where(eq(gcTable.code, input.giftCardCode.trim().toUpperCase()));
          if (!gc) throw new Error("Gift card not found");
          if (gc.status !== "active") throw new Error("Gift card is not active");
          const gcBalance = parseFloat(gc.currentBalance);
          if (input.giftCardAmount > gcBalance) {
            throw new Error(`Gift card balance insufficient. Available: $${gcBalance.toFixed(2)}`);
          }
          // Cap the discount at the total
          giftCardDiscount = Math.min(input.giftCardAmount, total);
          giftCardApplied = true;
        }
      }

      const stripeTotal = total - giftCardDiscount;

      // Generate order number
      const orderNumber = `QSB-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;

      // Create Stripe Checkout Session line items
      const lineItems = input.items.map((item) => ({
        price_data: {
          currency: "aud",
          product_data: {
            name: item.productName,
            ...(item.size ? { description: `Size: ${item.size}` } : {}),
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: Math.round(item.price * 100), // cents
        },
        quantity: item.quantity,
      }));

      // Add shipping fee as a line item if applicable
      if (shippingFee > 0) {
        lineItems.push({
          price_data: {
            currency: "aud",
            product_data: {
              name: "Shipping Fee",
              description: shippingServiceName || "Standard shipping within Australia",
            },
            unit_amount: Math.round(shippingFee * 100),
          },
          quantity: 1,
        });
      }

      // Create a one-time Stripe coupon for gift card discount
      let stripeCouponId: string | undefined;
      if (giftCardDiscount > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(giftCardDiscount * 100),
          currency: "aud",
          duration: "once",
          name: `Gift Card ${input.giftCardCode}`,
          max_redemptions: 1,
        });
        stripeCouponId = coupon.id;
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        customer_email: input.customerEmail,
        ...(stripeCouponId
          ? { discounts: [{ coupon: stripeCouponId }] }
          : { allow_promotion_codes: true }),
        metadata: {
          order_number: orderNumber,
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone || "",
          gift_card_code: input.giftCardCode || "",
          gift_card_discount: giftCardDiscount.toFixed(2),
          fulfillment_type: effectiveFulfillment,
          has_cake_items: hasCakeItems ? "true" : "false",
          shipping_address: input.shippingAddress || "",
          shipping_postcode: input.shippingPostcode || "",
          shipping_service: shippingServiceName,
          shipping_fee: shippingFee.toFixed(2),
          pickup_branch_id: input.pickupBranchId?.toString() || "",
          pickup_branch_name: input.pickupBranchName || "",
          pickup_date: input.pickupDate || "",
          pickup_time: input.pickupTime || "",
          items_json: JSON.stringify(
            input.items.map((i) => ({
              pid: i.productId,
              name: i.productName,
              qty: i.quantity,
              price: i.price,
              size: i.size,
              type: i.productType,
            }))
          ),
        },
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/objects`,
      });

      // Create pending order in DB
      const db = await getDb();
      if (db) {
        // Find or create customer
        let customerId: number | undefined;
        try {
          const existingCustomers = await db
            .select()
            .from(customers)
            .where(eq(customers.email, input.customerEmail))
            .limit(1);

          if (existingCustomers.length > 0) {
            customerId = existingCustomers[0].id;
          } else {
            const [result] = await db.insert(customers).values({
              name: input.customerName,
              email: input.customerEmail,
              phone: input.customerPhone || null,
            });
            customerId = result.insertId;
          }
        } catch {
          // Non-critical, continue without customer link
        }

        try {
          const [orderResult] = await db.insert(orders).values({
            orderNumber,
            customerId: customerId || null,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone || null,
            status: "pending",
            paymentStatus: "unpaid",
            subtotal: subtotal.toFixed(2),
            tax: "0.00",
            total: total.toFixed(2),
            fulfillmentType: effectiveFulfillment,
            shippingFee: shippingFee.toFixed(2),
            shippingAddress: effectiveFulfillment === "shipping" ? (input.shippingAddress || null) : null,
            pickupBranchId: effectiveFulfillment === "pickup" ? (input.pickupBranchId || null) : null,
            pickupDate: input.pickupDate || null,
            pickupTime: input.pickupTime || null,
            hasCakeItems,
            stripeSessionId: session.id,
          });

          // Insert order items
          const orderId = orderResult.insertId;
          if (orderId) {
            await db.insert(orderItems).values(
              input.items.map((item) => ({
                orderId,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.price.toFixed(2),
                totalPrice: (item.price * item.quantity).toFixed(2),
                size: item.size || null,
              }))
            );
          }
        } catch (e) {
          console.error("[Stripe] Failed to create order in DB:", e);
        }
      }

      return {
        checkoutUrl: session.url,
        orderNumber,
        fulfillmentType: effectiveFulfillment,
        hasCakeItems,
        shippingFee,
        shippingServiceName,
        giftCardApplied,
        giftCardDiscount,
      };
    }),

  // Verify a completed session (called from success page)
  verifySession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const stripe = getStripe();
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        return {
          status: session.payment_status,
          orderNumber: (session.metadata?.order_number as string) || null,
          customerEmail: session.customer_email || (session.metadata?.customer_email as string) || null,
          fulfillmentType: (session.metadata?.fulfillment_type as string) || "pickup",
          hasCakeItems: session.metadata?.has_cake_items === "true",
          pickupBranchName: (session.metadata?.pickup_branch_name as string) || null,
          pickupDate: (session.metadata?.pickup_date as string) || null,
          pickupTime: (session.metadata?.pickup_time as string) || null,
          shippingAddress: (session.metadata?.shipping_address as string) || null,
          shippingService: (session.metadata?.shipping_service as string) || null,
          shippingFee: (session.metadata?.shipping_fee as string) || null,
        };
      } catch {
        return {
          status: "unknown" as const,
          orderNumber: null,
          customerEmail: null,
          fulfillmentType: "pickup",
          hasCakeItems: false,
          pickupBranchName: null,
          pickupDate: null,
          pickupTime: null,
          shippingAddress: null,
          shippingService: null,
          shippingFee: null,
        };
      }
    }),
});
