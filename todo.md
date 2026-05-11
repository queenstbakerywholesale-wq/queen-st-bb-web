
## Admin System

- [x] Database schema: products, categories, orders, order_items, customers, branches, cake_bookings, booking_time_slots, shipping_tracking, admin_users, notifications
- [x] Admin authentication: secure login at /admin-angela91, password-protected, session persistence, role-based access
- [x] Admin dashboard overview: today's orders, today's cake bookings, pending orders, low stock alerts, revenue summary, recent customers
- [x] Product management: CRUD, image upload, categories, stock/inventory, pricing, active/inactive, featured
- [x] Order management: view all, filter by status, search by customer/email/phone/order#, update status, payment status, pickup/delivery details, admin notes, order history
- [x] Shipping and tracking: mark shipped, courier name, tracking number, update status, send tracking to customer
- [x] Cake booking system: branch selection (3 stores), pickup date/time, cake/product selection, size, custom message, customer info, online/pickup payment
- [x] Booking rules and availability: min preparation notice, time-slot logic per branch, admin close dates/slots, fully booked states, no same-day bookings unless enabled, branch capacity
- [x] Branch system: 3 branches with own availability, address, opening hours, booking slots, booking rules
- [x] Customer management: view list, search, order history, booking history, contact info
- [x] Notifications: owner alerts on new bookings, order status changes (ready/shipped/cancelled), booking status changes (confirmed/ready/cancelled), shipping updates (shipped/delivered/failed)
- [x] Connect admin to public site: Objects page with live product data, Cake Booking page with live booking system
- [x] Hide all admin features from public users, no search engine indexing

## Gap Fixes

- [x] Add noindex/robots meta for admin routes
- [x] Enforce min prep notice hours and same-day booking rules in public booking submit/check
- [x] Seed 3 default branches in the database
- [x] Add recent customers section to admin dashboard

## New Features (Batch 2)

- [x] Stripe payment integration on Objects page — checkout, payment processing, order creation on success
- [x] Wholesale & Franchise enquiry form — backend storage, admin view, owner notification on submit
- [x] Customer Care enquiry form — backend storage, admin view, owner notification on submit
- [x] Admin image/content management — upload/replace/remove images for homepage, Objects, Space, About, Customer Care, Wholesale, Cake Booking pages
- [x] Connect public pages to admin-managed images (hero images, section images)
- [x] Update admin dashboard with new enquiry submissions count
- [x] Admin page for viewing/managing wholesale enquiries
- [x] Admin page for viewing/managing customer care enquiries
- [x] DB schema: enquiries table (wholesale + customer care), page_images table

## Gap Resolution

- [x] Browser QA: Wholesale and Customer Care form submissions
- [x] Fix admin login page redirect — auto-redirect to dashboard after successful login
- [x] Verify admin enquiries appear in admin panel after form submissions
- [x] Browser QA: Objects cart + checkout flow
- [x] Verify admin page images management in browser

## Image Editor Enhancement

- [x] Add image crop functionality to admin page images upload
- [x] Add image rotate functionality to admin page images upload
- [x] Create reusable ImageEditor component with crop/rotate controls
- [x] Integrate ImageEditor into AdminPageImages upload flow
- [x] Verify image editor works in browser

## Watermark Feature

- [x] Add server-side automatic watermark to all uploaded images
- [x] Watermark should use brand text "QUEEN ST BB" in subtle overlay
- [x] Watermark applied during upload before saving to S3
- [x] Admin toggle option for watermark on/off (optional)

## Typography Refinement (Miu Miu-inspired)

- [x] Switch heading font to Playfair Display (weight 500)
- [x] Switch body font to Inter (weight 400-500)
- [x] Update index.css global tokens: font families, sizes, spacing
- [x] Update Google Fonts CDN link in index.html
- [x] Hero headings: 56-72px, tight letter-spacing (0-0.01em), line-height 1.1-1.2
- [x] Section titles: 28-36px with same tight spacing
- [x] Body text: 14-16px, line-height 1.5-1.7
- [x] Navigation: Inter/Helvetica weight 500, letter-spacing 0.05em max
- [x] Text over images: pure white #FFFFFF, no opacity reduction
- [x] Fix all ultra-light font weights across all pages
- [x] Update Home page typography
- [x] Update Tiramisu page typography
- [x] Update Gelato page typography
- [x] Update Space page typography
- [x] Update Objects page typography
- [x] Update Wholesale page typography
- [x] Update Cake Booking page typography
- [x] Update About page typography
- [x] Update Customer Care page typography
- [x] Update navigation/header typography
- [x] Update footer typography
- [x] Update NotFound page typography
- [x] Update Objects page cart/checkout typography
- [x] Update all admin pages typography (AdminLogin, AdminLayout, AdminDashboard, AdminProducts, AdminOrders, AdminShipping, AdminBookings, AdminCustomers, AdminBranches, AdminEnquiries, AdminPageImages)
- [x] Remove all font-light usage across entire codebase
- [x] Reduce excessive letter-spacing (tracking) across all pages

## Fulfillment System Refinement

- [x] Add product category field to distinguish cake vs non-cake products
- [x] Cake products: pickup-only, non-cake products: shipping + pickup
- [x] Admin product form: category selection (Merchandise, Postcards, Objects, Cakes)
- [x] Admin product list: show fulfillment type badge (Pickup Only / Shipping + Pickup)
- [x] Admin order details: show fulfillment method clearly
- [x] Checkout: fulfillment method selection (Shipping vs Store Pickup) for non-cake orders
- [x] Checkout: auto-detect cake in cart and force pickup-only with clear messaging
- [x] Mixed cart rule: if any cake in cart, entire order becomes pickup-only
- [x] Shipping option: fixed shipping fee for non-cake orders
- [x] Pickup option: branch selection, pickup date/time for cake orders
- [x] Customer messaging: clear labels for fulfillment type on product cards and checkout
- [x] Store fulfillment method in orders table
- [x] Update Stripe checkout to include fulfillment metadata
- [x] Write vitest tests for fulfillment logic

## Fulfillment Gap Resolution

- [x] Verify AdminProducts form includes product type selection (Merchandise, Postcards, Objects, Cakes) and persists correctly
- [x] Browser QA: test cake product in cart to verify pickup-only enforcement and messaging
- [x] Browser QA: test mixed cart (cake + non-cake) to verify auto-pickup enforcement
- [x] Browser QA: add a cake product to an otherwise empty cart and verify shipping is hidden/disabled, pickup is the only option

## Australia Post Dynamic Shipping

- [x] Create server-side Australia Post shipping calculator module
- [x] Integrate AusPost PAC API for real-time rate calculation (postcode-based)
- [x] Fallback to flat rate ($14 AUD) if API unavailable or errors
- [x] Frontend: add postcode input at checkout for shipping cost calculation
- [x] Frontend: display calculated shipping cost before payment
- [x] Update Stripe checkout session to include dynamic shipping fee
- [x] Store shipping cost in order record

## Order Confirmation & Notification System

- [x] Create email template system for order confirmations
- [x] Send customer confirmation email after successful payment (via webhook)
- [x] Email includes: order number, product details, total, fulfillment method
- [x] Email includes shipping address OR pickup details based on fulfillment type
- [x] Send admin notification for each new order
- [x] Handle webhook event for payment completion to trigger emails

## Cake Pickup Booking in Checkout

- [x] Add pickup branch selector to checkout form (required for cake orders)
- [x] Add pickup date selector with closed-day validation
- [x] Add pickup time selector with available time slots
- [x] Make branch/date/time required before payment for cake orders
- [x] Store booking data (branch, date, time) in order record
- [x] Display booking info in admin order view
- [x] Include booking info in customer confirmation email
- [x] Ensure seamless integration with pickup-only rule for cakes

## Gift Card System

- [x] Database schema: gift_cards table (id, code, initialAmount, currentBalance, status, purchaserName, purchaserEmail, recipientName, recipientMessage, selectedImage, stripePaymentId, squareGiftCardId, createdAt, redeemedAt, expiresAt)
- [x] Database schema: gift_card_transactions table (id, giftCardId, type, amount, note, performedBy, createdAt)
- [x] Server: gift card purchase flow — create pending card, Stripe checkout, activate on payment success
- [x] Server: gift card balance check endpoint (by code)
- [x] Server: gift card partial deduction endpoint (admin only)
- [x] Server: gift card transaction history endpoint
- [x] Public page: /gift-cards with amount selection ($30, $50, $70, $100, $150, $200)
- [x] Public page: gift card image selection (multiple beautiful designs)
- [x] Public page: recipient name, message, purchaser info form
- [x] Public page: Stripe payment integration for gift card purchase
- [x] Public page: after purchase — downloadable gift card image with code, amount, message
- [x] Admin: gift card management page — list all cards, search by code
- [x] Admin: view gift card details — balance, transaction history
- [x] Admin: deduct balance (partial redemption) with note
- [x] Admin: void/cancel gift card
- [x] Square POS integration: optional sync when SQUARE_ACCESS_TOKEN configured
- [x] Square POS integration: create gift card in Square on purchase
- [x] Square POS integration: sync redemptions between systems
- [x] Navigation: add Gift Cards link to main nav

## Gift Card Custom Design Editor

- [x] Build canvas-based gift card editor with drag-and-drop functionality
- [x] Allow users to drag stickers, logos, and decorations onto the card
- [x] Allow users to upload their own photos as card background
- [x] Include brand stickers/logos as default decorative elements
- [x] Support text overlay with custom message on the card
- [x] Generate final card image from canvas for download
- [x] Integrate editor into the gift card purchase flow

## Gift Card as Payment Method

- [x] Add gift card code input field to Objects checkout
- [x] Server: validate gift card code and check balance
- [x] Server: apply gift card balance as discount to order total
- [x] Server: deduct gift card balance on successful payment
- [x] Handle partial payment (gift card + Stripe for remainder)
- [x] Show applied gift card discount in checkout summary

## Gift Card Auto-Send to Recipient

- [x] Auto-send gift card email to recipient when email is provided
- [x] Email includes card image, code, amount, and personal message
- [x] Confirmation to purchaser that card was sent to recipient

## Admin Brand Sticker Management
- [x] Create brand_stickers DB table (id, name, imageUrl, imageKey, sortOrder, createdAt)
- [x] Server: admin upload sticker endpoint (JPG/PNG upload to S3)
- [x] Server: admin delete sticker endpoint
- [x] Server: admin list stickers + public list stickers endpoints
- [x] Admin UI: sticker management page with upload, preview, reorder, delete
- [x] Gift card editor: load brand stickers from server dynamically

## Order Fulfillment System (Goods Only)
- [x] Use existing orders.status field for fulfillment workflow (pending → paid → preparing → ready → shipped → completed)
- [x] Use existing shippingTracking table for trackingNumber and courierName
- [x] Server: update order fulfillment status endpoint
- [x] Server: add tracking code endpoint with email notification
- [x] Admin UI: real-time order list with fulfillment status badges and filters
- [x] Admin UI: "Mark Packing" and "Mark Ready" buttons
- [x] Admin UI: "Ship" button with tracking code/carrier input
- [x] Admin UI: send tracking email to customer on ship
- [x] Restrict fulfillment workflow to goods orders only (not cake/pickup)

## PWA Admin App
- [x] Create PWA manifest.json with app name, icons, theme color
- [x] Add service worker for basic caching
- [x] Add install prompt banner for mobile users on admin pages
- [x] Ensure all admin pages are mobile-responsive

## Customer Gift Card Balance Page
- [x] Create customer /gift-cards/balance page
- [x] Balance check by code (no auth required)
- [x] Display balance, transaction history per card
- [x] Link from gift cards page and navigation
