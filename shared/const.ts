export const COOKIE_NAME = "app_session_id";
export const ADMIN_COOKIE_NAME = "admin_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Fulfillment constants
export const CAKE_PRODUCT_TYPES = ['cake'] as const;
export const PICKUP_ONLY_TYPES = CAKE_PRODUCT_TYPES;
export const FIXED_SHIPPING_FEE_AUD = 12.00;
export const PRODUCT_TYPES = ['tiramisu', 'gelato', 'cake', 'merchandise', 'postcards', 'objects', 'wholesale'] as const;

/** Returns true if the product type is pickup-only (no shipping) */
export function isPickupOnlyType(productType: string): boolean {
  return (PICKUP_ONLY_TYPES as readonly string[]).includes(productType);
}
