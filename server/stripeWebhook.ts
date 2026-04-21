import Stripe from "stripe";
import { Request, Response, Express } from "express";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { orders, customers } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

function getStripe() {
  if (!ENV.stripeSecretKey) throw new Error("Stripe secret key not configured");
  return new Stripe(ENV.stripeSecretKey);
}

export function registerStripeWebhook(app: Express) {
  // IMPORTANT: Must use express.raw BEFORE express.json for this route
  app.post(
    "/api/stripe/webhook",
    (req: Request, res: Response) => {
      // express.raw should be applied, but we handle raw body manually
      void handleWebhook(req, res);
    }
  );
}

async function handleWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;

  try {
    // req.body should be raw buffer from express.raw middleware
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    res.json({ verified: true });
    return;
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "payment_intent.succeeded": {
        console.log("[Stripe Webhook] Payment intent succeeded:", event.data.object);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
  }

  res.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) return;

  const orderNumber = session.metadata?.order_number;
  if (!orderNumber) {
    console.warn("[Stripe Webhook] No order_number in session metadata");
    return;
  }

  try {
    // Update order status to paid
    await db
      .update(orders)
      .set({
        status: "paid",
        paymentStatus: "paid",
        stripePaymentIntentId: (session.payment_intent as string) || null,
      })
      .where(eq(orders.orderNumber, orderNumber));

    // Update customer totalOrders
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (orderRows.length > 0 && orderRows[0].customerId) {
      await db
        .update(customers)
        .set({
          totalOrders: (orderRows[0] as any).totalOrders
            ? (orderRows[0] as any).totalOrders + 1
            : 1,
        })
        .where(eq(customers.id, orderRows[0].customerId));
    }

    // Notify owner
    await notifyOwner({
      title: `New Paid Order: ${orderNumber}`,
      content: `Order ${orderNumber} has been paid via Stripe.\nCustomer: ${session.metadata?.customer_name || "Unknown"}\nEmail: ${session.customer_email || session.metadata?.customer_email || "N/A"}\nAmount: $${((session.amount_total || 0) / 100).toFixed(2)} AUD`,
    });

    console.log(`[Stripe Webhook] Order ${orderNumber} marked as paid`);
  } catch (err) {
    console.error("[Stripe Webhook] Failed to update order:", err);
  }
}
