import Stripe from "stripe";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { orders, orderItems, customers } from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { notifyOwner } from "../_core/notification";

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
});

export const stripeCheckoutRouter = router({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        items: z.array(cartItemSchema).min(1).max(50),
        customerName: z.string().min(1).max(200),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        deliveryType: z.enum(["pickup", "delivery"]).default("pickup"),
        deliveryAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      const origin = ctx.req.headers.origin || "http://localhost:3000";

      // Calculate totals
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const total = subtotal; // No tax for now

      // Generate order number
      const orderNumber = `QSB-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;

      // Create Stripe Checkout Session
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
          delivery_type: input.deliveryType,
          items_json: JSON.stringify(
            input.items.map((i) => ({
              pid: i.productId,
              name: i.productName,
              qty: i.quantity,
              price: i.price,
              size: i.size,
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
            deliveryType: input.deliveryType,
            deliveryAddress: input.deliveryAddress || null,
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

      return { checkoutUrl: session.url, orderNumber };
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
        };
      } catch {
        return { status: "unknown" as const, orderNumber: null, customerEmail: null };
      }
    }),
});
