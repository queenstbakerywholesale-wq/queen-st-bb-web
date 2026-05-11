/**
 * Square Gift Card Integration
 * 
 * When SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID are configured,
 * this module syncs gift cards with Square POS system.
 * 
 * Flow:
 * 1. When a gift card is purchased on the website, we optionally create it in Square too
 * 2. When admin deducts balance on the website, we optionally deduct in Square too
 * 3. Square POS staff can also look up the gift card by GAN (Gift card Account Number)
 * 
 * If Square is not configured, the website manages gift cards independently.
 */
import { ENV } from "./_core/env";

const SQUARE_BASE_URL =
  ENV.squareEnvironment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

function isSquareConfigured(): boolean {
  return !!(ENV.squareAccessToken && ENV.squareLocationId);
}

async function squareFetch(path: string, options: RequestInit = {}) {
  const url = `${SQUARE_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Square-Version": "2024-01-18",
      Authorization: `Bearer ${ENV.squareAccessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("[Square] API error:", JSON.stringify(data));
    throw new Error(data.errors?.[0]?.detail || "Square API error");
  }
  return data;
}

/**
 * Create a gift card in Square and activate it with initial balance.
 * Returns the Square gift card ID and GAN (Gift card Account Number).
 */
export async function createSquareGiftCard(
  amount: number,
  idempotencyKey: string
): Promise<{ giftCardId: string; gan: string } | null> {
  if (!isSquareConfigured()) {
    console.log("[Square] Not configured, skipping gift card creation");
    return null;
  }

  try {
    // Step 1: Create the gift card
    const createResponse = await squareFetch("/v2/gift-cards", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: `create-${idempotencyKey}`,
        location_id: ENV.squareLocationId,
        gift_card: {
          type: "DIGITAL",
        },
      }),
    });

    const giftCard = createResponse.gift_card;
    console.log(`[Square] Gift card created: ${giftCard.id}, GAN: ${giftCard.gan}`);

    // Step 2: Activate with initial balance
    await squareFetch("/v2/gift-cards/activities", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: `activate-${idempotencyKey}`,
        gift_card_activity: {
          gift_card_id: giftCard.id,
          type: "ACTIVATE",
          location_id: ENV.squareLocationId,
          activate_activity_details: {
            amount_money: {
              amount: Math.round(amount * 100), // Square uses cents
              currency: "AUD",
            },
          },
        },
      }),
    });

    console.log(`[Square] Gift card ${giftCard.id} activated with $${amount}`);

    return {
      giftCardId: giftCard.id,
      gan: giftCard.gan,
    };
  } catch (err) {
    console.error("[Square] Failed to create gift card:", err);
    return null;
  }
}

/**
 * Deduct balance from a Square gift card (uses REDEEM activity for partial deductions).
 * This is an alias for redeemSquareGiftCard for backward compatibility.
 */
export async function deductSquareGiftCardBalance(
  squareGiftCardId: string,
  amount: number,
  idempotencyKey: string
): Promise<boolean> {
  return redeemSquareGiftCard(squareGiftCardId, amount, idempotencyKey);
}

/**
 * Redeem (partially use) a Square gift card.
 */
export async function redeemSquareGiftCard(
  squareGiftCardId: string,
  amount: number,
  idempotencyKey: string
): Promise<boolean> {
  if (!isSquareConfigured() || !squareGiftCardId) return false;

  try {
    await squareFetch("/v2/gift-cards/activities", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: `redeem-${idempotencyKey}`,
        gift_card_activity: {
          gift_card_id: squareGiftCardId,
          type: "REDEEM",
          location_id: ENV.squareLocationId,
          redeem_activity_details: {
            amount_money: {
              amount: Math.round(amount * 100),
              currency: "AUD",
            },
          },
        },
      }),
    });

    console.log(`[Square] Redeemed $${amount} from gift card ${squareGiftCardId}`);
    return true;
  } catch (err) {
    console.error("[Square] Failed to redeem gift card:", err);
    return false;
  }
}

/**
 * Check if Square integration is available.
 */
export function isSquareEnabled(): boolean {
  return isSquareConfigured();
}
