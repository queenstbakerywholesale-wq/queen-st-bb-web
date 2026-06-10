import Stripe from "stripe";
import { Request, Response, Express } from "express";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { orders, customers, giftCards, giftCardTransactions } from "../drizzle/schema";
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
        } else if (session.metadata?.type === "gift_card_recharge") {
          await handleGiftCardRecharge(session);
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

    // Deduct gift card balance if a gift card was applied
    const giftCardCode = session.metadata?.gift_card_code;
    const giftCardDiscountStr = session.metadata?.gift_card_discount;
    if (giftCardCode && giftCardDiscountStr) {
      const discountAmount = parseFloat(giftCardDiscountStr);
      if (discountAmount > 0) {
        try {
          const [gc] = await db
            .select()
            .from(giftCards)
            .where(eq(giftCards.code, giftCardCode.trim().toUpperCase()));

          if (gc && gc.status === "active") {
            const currentBalance = parseFloat(gc.currentBalance);
            const newBalance = Math.max(0, currentBalance - discountAmount);
            const newStatus = newBalance <= 0 ? "depleted" : "active";

            await db
              .update(giftCards)
              .set({
                currentBalance: newBalance.toFixed(2),
                status: newStatus as any,
              })
              .where(eq(giftCards.id, gc.id));

            await db.insert(giftCardTransactions).values({
              giftCardId: gc.id,
              type: "redemption",
              amount: discountAmount.toFixed(2),
              balanceAfter: newBalance.toFixed(2),
              note: `Order: ${orderNumber}`,
              performedBy: "System",
            });

            console.log(`[Stripe Webhook] Gift card ${giftCardCode} deducted $${discountAmount.toFixed(2)}, new balance: $${newBalance.toFixed(2)}`);
          }
        } catch (gcErr) {
          console.error(`[Stripe Webhook] Failed to deduct gift card balance:`, gcErr);
        }
      }
    }

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

async function handleGiftCardRecharge(session: Stripe.Checkout.Session) {
  const giftCardId = session.metadata?.gift_card_id;
  const giftCardCode = session.metadata?.gift_card_code;
  const rechargeAmount = session.metadata?.recharge_amount;

  if (!giftCardId || !rechargeAmount) {
    console.warn("[Stripe Webhook] Recharge checkout missing metadata");
    return;
  }

  const db = await getDb();
  if (!db) return;

  try {
    const [card] = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.id, Number(giftCardId)));

    if (!card) {
      console.warn(`[Stripe Webhook] Recharge: card ${giftCardCode} not found`);
      return;
    }

    const amount = parseFloat(rechargeAmount);
    const currentBalance = parseFloat(card.currentBalance);
    const newBalance = currentBalance + amount;

    await db
      .update(giftCards)
      .set({
        currentBalance: newBalance.toFixed(2),
        status: "active" as any,
      })
      .where(eq(giftCards.id, card.id));

    await db.insert(giftCardTransactions).values({
      giftCardId: card.id,
      type: "recharge",
      amount: amount.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      note: `Recharged $${amount.toFixed(2)} via Stripe`,
      performedBy: "Customer",
    });

    console.log(`[Stripe Webhook] Gift card ${giftCardCode} recharged +$${amount} → $${newBalance.toFixed(2)}`);

    // Notify admin
    await notifyOwner({
      title: `E-Card Recharged: ${giftCardCode}`,
      content: `Card ${giftCardCode} was recharged with $${amount.toFixed(2)}.\nNew balance: $${newBalance.toFixed(2)}`,
    }).catch(() => {});

    // Send confirmation email to purchaser
    if (card.purchaserEmail) {
      const { sendEmail } = await import("./emailService");
      await sendEmail({
        to: card.purchaserEmail,
        subject: `Your Queen St BB E-Card has been recharged — $${amount.toFixed(2)}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;">
<tr><td style="background:#3A2A1E;padding:24px 40px;text-align:center;">
  <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#FFFFFF;margin:0;">Queen St BB</h1>
</td></tr>
<tr><td style="padding:32px 40px;">
  <h2 style="font-size:20px;color:#3A2A1E;margin:0 0 16px;">E-Card Recharged</h2>
  <p style="font-size:14px;color:#5A4A3E;line-height:1.6;">Your e-card <strong>${card.code}</strong> has been successfully recharged.</p>
  <div style="background:#FAF7F2;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
    <p style="font-size:12px;color:#8B7355;margin:0 0 4px;">Amount Added</p>
    <p style="font-size:28px;color:#3A2A1E;margin:0 0 12px;font-weight:600;">+$${amount.toFixed(2)} AUD</p>
    <p style="font-size:12px;color:#8B7355;margin:0 0 4px;">New Balance</p>
    <p style="font-size:24px;color:#3A2A1E;margin:0;font-weight:600;">$${newBalance.toFixed(2)} AUD</p>
  </div>
  <p style="font-size:12px;color:#8B7355;">This balance is non-refundable. Use it at any Queen St BB location or online.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
      }).catch(() => {});
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Recharge failed for ${giftCardCode}:`, err);
    await notifyOwner({
      title: `E-Card Recharge Failed: ${giftCardCode}`,
      content: `Payment received but recharge failed.\nCard: ${giftCardCode}\nAmount: $${rechargeAmount}`,
    }).catch(() => {});
  }
}
