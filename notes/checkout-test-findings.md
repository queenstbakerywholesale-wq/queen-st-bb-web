# Checkout Flow Test Findings

## Cart & Checkout Flow Works
1. Products from DB are displayed on Objects page (Postcard Set, Vanilla Bean Gelato, Tiramisu Cup, Tote Bag, Strawberry Shortcake, Test Cake Direct)
2. Add to Bag button appears on hover over product cards
3. Cart sidebar opens with item, quantity controls, fulfillment options (Shipping/Store Pickup)
4. PROCEED TO CHECKOUT transitions to details form
5. Details form has: Full Name, Email, Phone, Shipping Address, Postcode
6. Postcode entry triggers shipping rate calculation - shows "Standard Parcel, Est. 3-7 business days, $16.00" for postcode 4000
7. Gift card code input available
8. PAY WITH STRIPE button at bottom

## Test Details
- Vanilla Bean Gelato ($8.50) + Shipping ($16.00) = $24.50 AUD total
- Shipping rate calculated correctly based on zone-based fallback (no AusPost API key)

## Next: Click PAY WITH STRIPE to test Stripe checkout session creation
