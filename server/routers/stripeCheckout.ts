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
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        items: z.array(cartItemSchema).min(1).max(50),
        customerName: z.string().min(1).max(200),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        fulfillmentType: z.enum(["shipping", "pickup"]).default("pickup"),
        shippingAddress: z.string().optional(),
        pickupBranchId: z.number().optional(),
        pickupBranchName: z.string().optional(),
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

      // Validate: shipping requires address
      if (effectiveFulfillment === "shipping" && !input.shippingAddress) {
        throw new Error("Shipping address is required for shipping orders");
      }

      // Calculate totals
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const shippingFee = effectiveFulfillment === "shipping" ? FIXED_SHIPPING_FEE_AUD : 0;
      const total = subtotal + shippingFee;

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
              description: "Standard shipping within Australia",
            },
            unit_amount: Math.round(shippingFee * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        customer_email: input.customerEmail,
        allow_promotion_codes: true,
        metadata: {
          order_number: orderNumber,
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone || "",
          fulfillment_type: effectiveFulfillment,
          has_cake_items: hasCakeItems ? "true" : "false",
          shipping_address: input.shippingAddress || "",
          pickup_branch_id: input.pickupBranchId?.toString() || "",
          pickup_branch_name: input.pickupBranchName || "",
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
          shippingAddress: (session.metadata?.shipping_address as string) || null,
        };
      } catch {
        return {
          status: "unknown" as const,
          orderNumber: null,
          customerEmail: null,
          fulfillmentType: "pickup",
          hasCakeItems: false,
          pickupBranchName: null,
          shippingAddress: null,
        };
      }
    }),
});
