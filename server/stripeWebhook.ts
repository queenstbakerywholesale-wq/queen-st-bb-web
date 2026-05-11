import Stripe from "stripe";
import { Request, Response, Express } from "express";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { orders, customers } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { sendOrderConfirmation } from "./orderEmail";
import { activateGiftCard } from "./routers/giftCards";

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
        // Check if this is a gift card purchase
        if (session.metadata?.type === "gift_card") {
          await handleGiftCardCheckoutCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
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

    // Update customer totalOrders and totalSpent
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (orderRows.length > 0 && orderRows[0].customerId) {
      const existingCustomer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, orderRows[0].customerId))
        .limit(1);

      if (existingCustomer.length > 0) {
        const newTotal = existingCustomer[0].totalOrders + 1;
        const newSpent = (
          parseFloat(existingCustomer[0].totalSpent) +
          parseFloat(orderRows[0].total)
        ).toFixed(2);

        await db
          .update(customers)
          .set({
            totalOrders: newTotal,
            totalSpent: newSpent,
          })
          .where(eq(customers.id, orderRows[0].customerId));
      }
    }

    console.log(`[Stripe Webhook] Order ${orderNumber} marked as paid`);

    // Send order confirmation email and admin notification
    try {
      await sendOrderConfirmation(orderNumber);
      console.log(`[Stripe Webhook] Order confirmation sent for ${orderNumber}`);
    } catch (emailErr) {
      console.error(`[Stripe Webhook] Failed to send order confirmation for ${orderNumber}:`, emailErr);
      // Non-critical — order is still marked as paid
      // Fallback: send basic admin notification
      try {
        await notifyOwner({
          title: `New Paid Order: ${orderNumber}`,
          content: `Order ${orderNumber} has been paid via Stripe.\nCustomer: ${session.metadata?.customer_name || "Unknown"}\nEmail: ${session.customer_email || session.metadata?.customer_email || "N/A"}\nAmount: $${((session.amount_total || 0) / 100).toFixed(2)} AUD\n\nNote: Detailed confirmation email failed to send.`,
        });
      } catch {
        // Notification service unavailable
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Failed to update order:", err);
  }
}

async function handleGiftCardCheckoutCompleted(session: Stripe.Checkout.Session) {
  const giftCardId = session.metadata?.gift_card_id;
  const giftCardCode = session.metadata?.gift_card_code;

  if (!giftCardId) {
    console.warn("[Stripe Webhook] Gift card checkout missing gift_card_id in metadata");
    return;
  }

  const paymentIntentId = (session.payment_intent as string) || "";

  try {
    const activated = await activateGiftCard(Number(giftCardId), paymentIntentId);
    if (activated) {
      console.log(`[Stripe Webhook] Gift card ${giftCardCode} activated successfully`);
    } else {
      console.warn(`[Stripe Webhook] Gift card ${giftCardCode} activation returned false`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Gift card activation failed for ${giftCardCode}:`, err);
    // Notify admin of failure
    await notifyOwner({
      title: `Gift Card Activation Failed: ${giftCardCode}`,
      content: `Payment was received but gift card activation failed.\nGift Card ID: ${giftCardId}\nCode: ${giftCardCode}\nPayment Intent: ${paymentIntentId}\n\nPlease activate manually.`,
    }).catch(() => {});
  }
}
