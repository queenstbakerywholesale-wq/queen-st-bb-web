import Stripe from "stripe";
import { z } from "zod";
import { eq, sql, like, or, desc, count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { giftCards, giftCardTransactions } from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../emailService";
import { createSquareGiftCard, redeemSquareGiftCard, isSquareEnabled } from "../squareGiftCard";

function getStripe() {
  if (!ENV.stripeSecretKey) throw new Error("Stripe secret key not configured");
  return new Stripe(ENV.stripeSecretKey);
}

/** Generate a unique gift card code: QSB-XXXX-XXXX-XXXX */
function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 for clarity
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `QSB-${segment()}-${segment()}-${segment()}`;
}

const VALID_AMOUNTS = [30, 50, 70, 100, 150, 200];
const GIFT_CARD_IMAGES = ["classic", "floral", "minimal", "celebration", "coffee", "dessert"] as const;

export const giftCardRouter = router({
  /** Get available gift card options (amounts and images) */
  getOptions: publicProcedure.query(() => ({
    amounts: VALID_AMOUNTS,
    images: GIFT_CARD_IMAGES.map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) })),
  })),

  /** Create a gift card purchase checkout session */
  purchaseGiftCard: publicProcedure
    .input(
      z.object({
        amount: z.number().refine((v) => VALID_AMOUNTS.includes(v), "Invalid amount"),
        selectedImage: z.enum(GIFT_CARD_IMAGES),
        purchaserName: z.string().min(1).max(200),
        purchaserEmail: z.string().email(),
        recipientName: z.string().max(200).optional(),
        recipientEmail: z.string().email().optional().or(z.literal("")),
        personalMessage: z.string().max(500).optional(),
        origin: z.string(), // for redirect URLs
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate unique code
      let code = generateGiftCardCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db
          .select({ id: giftCards.id })
          .from(giftCards)
          .where(eq(giftCards.code, code))
          .limit(1);
        if (existing.length === 0) break;
        code = generateGiftCardCode();
        attempts++;
      }

      // Create pending gift card in DB
      const result = await db.insert(giftCards).values({
        code,
        initialAmount: input.amount.toFixed(2),
        currentBalance: input.amount.toFixed(2),
        status: "pending",
        purchaserName: input.purchaserName,
        purchaserEmail: input.purchaserEmail,
        recipientName: input.recipientName || null,
        recipientEmail: input.recipientEmail || null,
        personalMessage: input.personalMessage || null,
        selectedImage: input.selectedImage,
        expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years
      });

      const giftCardId = Number(result[0].insertId);

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "aud",
              product_data: {
                name: `Queen St BB Gift Card — $${input.amount}`,
                description: input.recipientName
                  ? `Gift card for ${input.recipientName}`
                  : "Digital gift card",
              },
              unit_amount: input.amount * 100,
            },
            quantity: 1,
          },
        ],
        customer_email: input.purchaserEmail,
        metadata: {
          type: "gift_card",
          gift_card_id: giftCardId.toString(),
          gift_card_code: code,
          purchaser_name: input.purchaserName,
          amount: input.amount.toString(),
        },
        success_url: `${input.origin}/gift-cards/success?code=${code}`,
        cancel_url: `${input.origin}/gift-cards?cancelled=true`,
        allow_promotion_codes: true,
      });

      // Save session ID
      await db
        .update(giftCards)
        .set({ stripeSessionId: session.id })
        .where(eq(giftCards.id, giftCardId));

      return { checkoutUrl: session.url, code };
    }),

  /** Check gift card balance (public — by code) */
  checkBalance: publicProcedure
    .input(z.object({ code: z.string().min(5).max(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [card] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.code, input.code.toUpperCase().trim()));

      if (!card || card.status === "pending") return null;

      return {
        code: card.code,
        initialAmount: card.initialAmount,
        currentBalance: card.currentBalance,
        status: card.status,
        recipientName: card.recipientName,
        selectedImage: card.selectedImage,
        expiresAt: card.expiresAt,
        createdAt: card.createdAt,
      };
    }),

  /** Get gift card details after purchase (for download page) */
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [card] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.code, input.code.toUpperCase().trim()));

      if (!card) return null;

      return {
        id: card.id,
        code: card.code,
        initialAmount: card.initialAmount,
        currentBalance: card.currentBalance,
        status: card.status,
        purchaserName: card.purchaserName,
        recipientName: card.recipientName,
        personalMessage: card.personalMessage,
        selectedImage: card.selectedImage,
        expiresAt: card.expiresAt,
        createdAt: card.createdAt,
      };
    }),

  // ─── Admin Endpoints ──────────────────────────────────────────

  /** Admin: list all gift cards */
  adminList: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(giftCards.code, `%${input.search}%`),
            like(giftCards.purchaserName, `%${input.search}%`),
            like(giftCards.purchaserEmail, `%${input.search}%`),
            like(giftCards.recipientName, `%${input.search}%`)
          )
        );
      }
      if (input.status) {
        conditions.push(eq(giftCards.status, input.status as any));
      }

      const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(giftCards)
        .where(where);

      const items = await db
        .select()
        .from(giftCards)
        .where(where)
        .orderBy(desc(giftCards.createdAt))
        .limit(input.limit)
        .offset(offset);

      return { items, total: totalResult?.count ?? 0 };
    }),

  /** Admin: get gift card detail with transactions */
  adminGetById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [card] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.id, input.id));

      if (!card) return null;

      const transactions = await db
        .select()
        .from(giftCardTransactions)
        .where(eq(giftCardTransactions.giftCardId, input.id))
        .orderBy(desc(giftCardTransactions.createdAt));

      return { ...card, transactions };
    }),

  /** Admin: deduct balance (partial redemption) */
  adminDeductBalance: publicProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.number().min(0.01),
        note: z.string().max(500).optional(),
        performedBy: z.string().default("Admin"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [card] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.id, input.id));

      if (!card) throw new Error("Gift card not found");
      if (card.status !== "active") throw new Error("Gift card is not active");

      const currentBalance = parseFloat(card.currentBalance);
      if (input.amount > currentBalance) {
        throw new Error(`Insufficient balance. Current: $${currentBalance.toFixed(2)}`);
      }

      const newBalance = currentBalance - input.amount;
      const newStatus = newBalance <= 0 ? "depleted" : "active";

      await db
        .update(giftCards)
        .set({
          currentBalance: newBalance.toFixed(2),
          status: newStatus as any,
        })
        .where(eq(giftCards.id, input.id));

      await db.insert(giftCardTransactions).values({
        giftCardId: input.id,
        type: "redemption",
        amount: input.amount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        note: input.note || null,
        performedBy: input.performedBy,
      });

      // Sync with Square if configured
      if (card.squareGiftCardId) {
        await redeemSquareGiftCard(
          card.squareGiftCardId,
          input.amount,
          `deduct-${input.id}-${Date.now()}`
        ).catch((err: any) => console.error("[Square] Sync failed:", err));
      }

      return {
        success: true,
        newBalance: newBalance.toFixed(2),
        status: newStatus,
      };
    }),

  /** Redeem gift card for an order (used at checkout) */
  redeemForOrder: publicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        amount: z.number().min(0.01),
        orderId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [card] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.code, input.code.trim().toUpperCase()));

      if (!card) throw new Error("Gift card not found");
      if (card.status !== "active") throw new Error("Gift card is not active");

      const currentBalance = parseFloat(card.currentBalance);
      if (input.amount > currentBalance) {
        throw new Error(`Insufficient balance. Available: $${currentBalance.toFixed(2)}`);
      }

      const newBalance = currentBalance - input.amount;
      const newStatus = newBalance <= 0 ? "depleted" : "active";

      await db
        .update(giftCards)
        .set({
          currentBalance: newBalance.toFixed(2),
          status: newStatus as any,
        })
        .where(eq(giftCards.id, card.id));

      await db.insert(giftCardTransactions).values({
        giftCardId: card.id,
        type: "redemption",
        amount: input.amount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        note: input.orderId ? `Order: ${input.orderId}` : "Online order redemption",
        performedBy: "Customer",
      });

      // Sync with Square if configured
      if (card.squareGiftCardId) {
        await redeemSquareGiftCard(
          card.squareGiftCardId,
          input.amount,
          `order-${input.orderId || Date.now()}`
        ).catch((err: any) => console.error("[Square] Sync failed:", err));
      }

      return {
        success: true,
        amountDeducted: input.amount.toFixed(2),
        newBalance: newBalance.toFixed(2),
        cardCode: card.code,
      };
    }),

  /** Admin: void/cancel a gift card */
  adminVoidCard: publicProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [card] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.id, input.id));

      if (!card) throw new Error("Gift card not found");

      const previousBalance = parseFloat(card.currentBalance);

      await db
        .update(giftCards)
        .set({
          status: "voided" as any,
          currentBalance: "0.00",
        })
        .where(eq(giftCards.id, input.id));

      await db.insert(giftCardTransactions).values({
        giftCardId: input.id,
        type: "void",
        amount: previousBalance.toFixed(2),
        balanceAfter: "0.00",
        note: input.reason || "Voided by admin",
        performedBy: "Admin",
      });

      return { success: true };
    }),
});

// ─── Gift Card Activation (called from webhook) ──────────────────
export async function activateGiftCard(
  giftCardId: number,
  stripePaymentIntentId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [card] = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.id, giftCardId));

    if (!card || card.status !== "pending") return false;

    // Try to create in Square POS if configured
    let squareData: { giftCardId: string; gan: string } | null = null;
    try {
      squareData = await createSquareGiftCard(
        parseFloat(card.initialAmount),
        `gc-${giftCardId}-${Date.now()}`
      );
    } catch (err) {
      console.error("[Square] Failed to create gift card, continuing without Square sync:", err);
    }

    await db
      .update(giftCards)
      .set({
        status: "active" as any,
        stripePaymentIntentId,
        activatedAt: new Date(),
        ...(squareData ? {
          squareGiftCardId: squareData.giftCardId,
          squareGan: squareData.gan,
        } : {}),
      })
      .where(eq(giftCards.id, giftCardId));

    // Record activation transaction
    await db.insert(giftCardTransactions).values({
      giftCardId,
      type: "activation",
      amount: card.initialAmount,
      balanceAfter: card.initialAmount,
      note: "Gift card activated after payment",
      performedBy: "System",
    });

    // Send notification to admin
    await notifyOwner({
      title: `New Gift Card Purchased: ${card.code}`,
      content: `A $${card.initialAmount} gift card has been purchased.\n\nCode: ${card.code}\nPurchaser: ${card.purchaserName} (${card.purchaserEmail})${card.recipientName ? `\nRecipient: ${card.recipientName}` : ""}\nImage: ${card.selectedImage}`,
    }).catch(() => {});

    // Send email to purchaser
    const emailHtml = buildGiftCardEmailHtml(card);
    await sendEmail({
      to: card.purchaserEmail,
      subject: `Your Queen St BB Gift Card — $${card.initialAmount}`,
      html: emailHtml,
    }).catch(() => {});

    // If recipient email provided, send to them too
    if (card.recipientEmail) {
      const recipientHtml = buildGiftCardRecipientEmailHtml(card);
      await sendEmail({
        to: card.recipientEmail,
        subject: `You've received a Queen St BB Gift Card from ${card.purchaserName}!`,
        html: recipientHtml,
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error("[GiftCard] Activation failed:", err);
    return false;
  }
}

function buildGiftCardEmailHtml(card: any): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(90,58,46,0.08);">
<tr><td style="background:#3A2A1E;padding:32px 40px;text-align:center;">
  <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:500;color:#FFFFFF;margin:0;">Queen St BB</h1>
  <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;color:#D8C3A8;margin:8px 0 0;letter-spacing:0.05em;text-transform:uppercase;">Gift Card</p>
</td></tr>
<tr><td style="padding:40px;">
  <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#3A2A1E;margin:0 0 16px;">Your Gift Card is Ready</h2>
  <p style="font-size:15px;color:#5A4A3E;line-height:1.6;margin:0 0 24px;">Thank you for your purchase! Your digital gift card is now active and ready to use.</p>
  <div style="background:#FAF7F2;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
    <p style="font-size:13px;color:#8B7355;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Gift Card Value</p>
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:36px;color:#3A2A1E;margin:0 0 16px;font-weight:500;">$${card.initialAmount} AUD</p>
    <p style="font-size:13px;color:#8B7355;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Card Code</p>
    <p style="font-family:monospace;font-size:20px;color:#3A2A1E;margin:0;font-weight:700;letter-spacing:0.05em;">${card.code}</p>
  </div>
  ${card.recipientName ? `<p style="font-size:14px;color:#5A4A3E;">Recipient: <strong>${card.recipientName}</strong></p>` : ""}
  ${card.personalMessage ? `<p style="font-size:14px;color:#5A4A3E;font-style:italic;border-left:3px solid #D8C3A8;padding-left:12px;">"${card.personalMessage}"</p>` : ""}
  <p style="font-size:13px;color:#8B7355;margin:24px 0 0;">Present this code in-store or use it online. Valid for 3 years from purchase date.</p>
</td></tr>
<tr><td style="background:#FAF7F2;padding:20px 40px;text-align:center;border-top:1px solid #E8DDD0;">
  <p style="font-size:13px;color:#8B7355;margin:0;">Queen St BB — A Dessert Atelier</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildGiftCardRecipientEmailHtml(card: any): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(90,58,46,0.08);">
<tr><td style="background:#3A2A1E;padding:32px 40px;text-align:center;">
  <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:500;color:#FFFFFF;margin:0;">Queen St BB</h1>
  <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;color:#D8C3A8;margin:8px 0 0;letter-spacing:0.05em;text-transform:uppercase;">Gift Card</p>
</td></tr>
<tr><td style="padding:40px;">
  <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#3A2A1E;margin:0 0 16px;">You've Received a Gift!</h2>
  <p style="font-size:15px;color:#5A4A3E;line-height:1.6;margin:0 0 8px;">${card.purchaserName} has sent you a Queen St BB gift card.</p>
  ${card.personalMessage ? `<p style="font-size:15px;color:#5A4A3E;font-style:italic;border-left:3px solid #D8C3A8;padding-left:12px;margin:16px 0;">"${card.personalMessage}"</p>` : ""}
  <div style="background:#FAF7F2;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
    <p style="font-size:13px;color:#8B7355;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Gift Card Value</p>
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:36px;color:#3A2A1E;margin:0 0 16px;font-weight:500;">$${card.initialAmount} AUD</p>
    <p style="font-size:13px;color:#8B7355;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Card Code</p>
    <p style="font-family:monospace;font-size:20px;color:#3A2A1E;margin:0;font-weight:700;letter-spacing:0.05em;">${card.code}</p>
  </div>
  <p style="font-size:13px;color:#8B7355;margin:24px 0 0;">Present this code at any Queen St BB location or use it online. Valid for 3 years.</p>
</td></tr>
<tr><td style="background:#FAF7F2;padding:20px 40px;text-align:center;border-top:1px solid #E8DDD0;">
  <p style="font-size:13px;color:#8B7355;margin:0;">Queen St BB — A Dessert Atelier</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
