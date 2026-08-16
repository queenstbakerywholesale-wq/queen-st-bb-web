
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

## Admin Real-time Order Notification
- [x] Server: add endpoint to check for new orders since last check timestamp
- [x] Admin UI: polling mechanism to check for new orders every 15-30 seconds
- [x] Admin UI: play notification sound when new order detected
- [x] Admin UI: show popup/toast notification with order summary
- [x] Admin UI: notification badge on Orders menu item showing unread count
- [x] Admin UI: sound toggle to enable/disable notification sound

## Customer My Page
- [x] Server: customer order history endpoint (by email, authenticated)
- [x] Server: customer order detail with shipping tracking info
- [x] Server: customer gift card usage history (by email)
- [x] Customer UI: /my-page route with order list, status badges, shipping tracking
- [x] Customer UI: order detail view with items, fulfillment status, tracking info
- [x] Customer UI: gift card section showing balance and transaction history
- [x] Navigation: add My Page link (visible when logged in)

## Resend Email API Setup
- [x] Request RESEND_API_KEY and SENDER_EMAIL secrets from user
- [x] Verify email sending works with Resend API
- [x] Write vitest test to validate Resend configuration

## Australia Post API Setup
- [x] Request AUSPOST_API_KEY secret from user (user declined — using zone-based fallback rates)
- [x] Verify zone-based fallback shipping rate calculation works correctly
- [x] Write vitest test to validate AusPost shipping configuration

## Test Products & Stripe Payment Flow
- [x] Register sample test products via admin panel (Tiramisu Cup $12, Vanilla Bean Gelato $8.50, Postcard Set $5)
- [x] Fix Stripe "Not a valid URL" error (product image URLs must be absolute for Stripe)
- [x] Verify Stripe checkout flow end-to-end — checkout session created successfully
- [x] Document testing instructions for the user

## Admin Image Upload UX Improvement
- [x] Redesign admin page images to show visual page layout with labeled slots
- [x] Each slot shows preview of current image + page section name (e.g. "Home Hero", "About Section 1")
- [x] Clear upload/replace button per slot with live preview
- [x] Show where each image appears on the public site (accordion layout with wireframe preview)

## Staff Authentication System
- [x] Database: staff_members table (id, username, passwordHash, displayName, branchId, role, isActive, lastLoginAt)
- [x] Staff roles: staff (POS + view online orders), manager (staff + some admin features)
- [x] Staff login page at /pos (integrated with POS)
- [x] Staff session management with JWT
- [x] Admin UI: manage staff accounts (create, reset password, deactivate, assign branch)
- [x] Per-branch staff assignment (Hawthorn, Windsor, CBD)

## POS System - Backend
- [x] Database: pos_orders table (id, orderNumber, branchId, staffId, items JSON, subtotal, tax, total, paymentMethod, status, createdAt)
- [x] Database: pos_menu_items table (id, branchId, name, category, priceType [fixed/weight], unitPrice, unit [g/kg/each], imageUrl, isActive, sortOrder)
- [x] Database: pos_categories table (id, branchId, name, sortOrder, isActive)
- [x] Server: POS order creation endpoint (staff-authenticated)
- [x] Server: POS menu item CRUD (admin-only, per-branch)
- [x] Server: POS category CRUD (admin-only, per-branch)
- [x] Weight-based pricing: input grams → calculate price from per-gram unit price
- [x] Fixed-price items: click to add, quantity adjustment
- [x] Custom amount entry: manual price input for unlisted items
- [x] Cash payment processing (mark as paid immediately)
- [x] Card payment placeholder (for future bank integration)

## POS System - Frontend
- [x] POS screen at /pos (staff-authenticated, tablet/PC optimized)
- [x] Left panel: menu items grid by category (large touch-friendly buttons)
- [x] Right panel: current order with running total
- [x] Weight input modal: gram entry → auto-calculate price
- [x] Custom amount button: manual price entry
- [x] Quantity +/- for fixed-price items (click to add, x to remove)
- [x] Payment buttons: CASH (immediate complete), CARD (placeholder)
- [x] Receipt/order summary after completion (toast with order number + total)
- [x] Branch-specific menu (only show items for current branch)
- [x] Full-screen mode for tablet use (h-screen layout)

## Invoice System
- [x] Database: invoices table (id, invoiceNumber, customerName, customerEmail, customerPhone, items, subtotal, tax, total, status, dueDate, sentVia, branchId)
- [x] Server: create invoice with line items and auto-calculated totals
- [x] Server: send invoice via email (Resend) with branded HTML template
- [x] Server: send invoice via SMS (placeholder for future)
- [x] Invoice template: branded HTML email with Queen St BB styling
- [x] Admin UI: invoice list, create with line items, send via email
- [x] Admin UI: mark invoice as paid
- [x] PDF generation for invoice download (PDFKit, stored in S3, downloadable from admin)

## Sales Dashboard
- [x] Server: sales analytics endpoints (per-item, per-hour, per-day, per-branch)
- [x] Admin UI: sales overview page with date range picker
- [x] Chart: hourly sales bar chart (peak hours analysis)
- [x] Chart: top-selling items (quantity and revenue)
- [x] Summary cards: total revenue, order count, average order value
- [x] Branch filter for multi-location comparison
- [x] Chart: daily revenue trend over time
- [x] Chart: revenue by branch comparison
- [x] Table: detailed transaction list with filters (paginated, 20 per page)
- [x] Export to CSV option

## Staff Online Order View
- [x] Staff dashboard: view pending online orders for their branch (Online Orders tab in POS)
- [x] Staff can see goods orders needing packing/shipping (shipping filter)
- [x] Staff can see cake pickup orders for their branch (pickup filter)
- [x] Staff can update order status (paid → preparing → ready → shipped → completed)
- [x] Staff cannot access admin settings, sales, or staff management (separate auth)

## POS Redesign (Square-style)
- [x] Register all categories from Square: bb goods, post card, Envelope/sticker, Tumbler, MUG, eco bag, Tshirts, classic coffee, Italian coffee, Black coffee, White coffee, BB non coffee, AU Wine, spritz, BB Pairing, BB Gelato, Beverage, italian beer, etc, surcharges
- [x] Redesign POS layout: left sidebar (Keypad/Library/Favourites), center tile grid, right order panel
- [x] Large square tile buttons with abbreviation + name (like Square POS)
- [x] Bottom navigation: Checkout, Transactions, Orders
- [x] Keypad mode for manual amount entry
- [x] Surcharge buttons (10% weekend, 15% holiday) as special items
- [x] Create staff accounts for Hawthorn (sarah_h), Windsor (windsor_staff), CBD (cbd_staff) — all password: staff123

## POS Orders Tab - Online Order Integration
- [x] POS Orders tab shows online orders (goods shipping + cake pickup) from website
- [x] Filter by order type (all / shipping / pickup) with counts
- [x] Show order details: customer name, items, total, order date, current status, shipping address, contact
- [x] Staff can update order status (paid → preparing → ready → shipped/completed) with contextual action buttons
- [x] Visual status badges and color coding (left border accent by status, color-coded action buttons)
- [x] Auto-refresh every 10s with green pulse indicator + last updated time + manual Refresh button

## POS Enhancement - Square-style Features
- [x] Per-item images: each POS menu item can have an image (displayed on tile grid)
- [x] Modifiers/Options per item: e.g. size (S/M/L), extras (cream, sauce), temperature (hot/iced)
- [x] Admin POS Menu: image upload per item
- [x] Admin POS Menu: create/edit modifiers and options per item with price adjustments
- [x] POS Frontend: show item images on tiles
- [x] POS Frontend: modifier selection popup when tapping an item with modifiers
- [x] Custom Amount input: ability to type a custom price amount directly (for weight-based items like tiramisu per gram)
- [x] Weight-based pricing UX: enter weight in grams → auto-calculate price based on per-gram rate
- [x] POS Keypad mode: type custom dollar amount and add to order

## E-Card System Enhancement
- [x] Admin: upload/manage 6 e-Card background designs (new E-Card Designs page)
- [x] Admin: upload/manage character PNG stickers for decoration (Brand Stickers page)
- [x] Customer: pick e-Card design from admin-uploaded designs + preset gradients
- [x] Customer: decorate e-Card with character stickers (drag & drop canvas editor)
- [x] Customer: purchase e-Card with Stripe (amount selection $30-$200)
- [x] Customer: send e-Card to friend (recipient name + email auto-send)
- [x] Customer: check e-Card balance by code (with URL param auto-fill)
- [x] Customer: view transaction history for e-Card (including recharge type)
- [x] Customer: recharge existing e-Card (add funds via Stripe, $20-$200)
- [x] Policy: balance is non-refundable (yellow warning banner)
- [x] Policy: recharge is allowed (top-up button on balance page)

## Branch Info Update
- [x] Remove phone and email fields from branches UI
- [x] CBD branch: address "408 Queen Street, Melbourne", hours 2PM-11PM
- [x] Hawthorn branch: address "616 Glenferrie Rd, Hawthorn", show "Open Soon"
- [x] Windsor branch: address "57 Chapel St, Windsor", show "Open Soon"

## Merchandise Mug Section Upgrade
- [x] Generate lifestyle images for 5 mugs (Italian café premium style, correct proportions 9.5W x 8.5H)
- [x] Generate lifestyle images for 5 tumblers (trendy/hip style, correct proportions 13H x 7.5W, no straw)
- [x] Generate lifestyle images for 3 caps (women wearing, trendy style)
- [x] Upload real eco bag product photos (4 designs)
- [x] Upload all images to webdev storage
- [x] Create categories: Mugs, Tumblers, Caps, Eco Bags, Postcards
- [x] Register all products in DB with correct images and categories
- [x] Update Objects page to show all merchandise by category
- [x] Set all mug prices to AUD $35.90
- [x] Unify product card design across all items (2-col mobile, 3-col desktop, object-cover, consistent spacing)

## Square POS Replication
- [x] Rebuild POS categories from June 2026 menu PDF: Black Coffee, White Coffee, Italian Coffee, Tea, Matcha, Non Coffee, Queen Milk, Ade (Sparkling), BB Gelato, Classic Wine, Spritz & Beer, Beverage, BB Snack, BB Goods, Etc
- [x] Recreate items within each category with correct pricing from menu PDF (97 items total)
- [x] Recreate modifier groups: Size (S/M/L), Milk (Full Cream/Skim/Oat/Almond/Soy), Sugar (0-3), Syrup (Vanilla/Hazelnut/Caramel), Decaf, Temperature (Hot/Iced), Style (Hot/Ice/Gelato), Add Gelato Top
- [x] Add fulfilment methods to POS: For Here, To Go, Delivery, Pick Up
- [x] Add GST 10% tax handling
- [x] Add weekend surcharge (10%) and holiday surcharge (15%) options
- [x] Correct mug product images to match real proportions (wider than tall, 9.5cm W × 8.5cm H)

## POS Menu Data Import (June 2026 PDF)
- [x] Extract all menu items, categories, prices, and modifiers from June 2026 menu PDF
- [x] Rebuild POS categories: Black Coffee, White Coffee, Italian Coffee, Tea, Matcha, Non Coffee, Queen Milk, Ade (Sparkling), BB Gelato, Classic Wine, Spritz & Beer, Beverage, BB Snack, BB Goods, Etc
- [x] Insert all 97 menu items with correct pricing per category
- [x] Add Size modifier (S/M/L +$0.50/+$1) to Black Coffee items
- [x] Add Sugar modifier (No Sugar/1/2/3) to Black Coffee items
- [x] Add Size modifier (S/M/L) to White Coffee items
- [x] Add Milk modifier (Full Cream/Skim/Oat +$1/Almond +$1/Soy +$1) to White Coffee items
- [x] Add Sugar modifier to White Coffee items
- [x] Add Syrup modifier (None/Vanilla/Hazelnut/Caramel +$1) to White Coffee items
- [x] Add Decaf modifier (Regular/Decaf +$1) to White Coffee items
- [x] Add Temperature modifier (Hot/Iced) to Matcha and Non Coffee items
- [x] Add Milk modifier to Matcha items (Balanced, Strawberry)
- [x] Add Style modifier (Hot/Ice +$2/Gelato +$4) to Queen Milk items
- [x] Add Gelato Top modifier (+$2.90) to Ade items
- [x] Replicate all categories, items, and modifiers to Hawthorn (branch 1) and Windsor (branch 2)
- [x] All 3 branches now have identical menu: 15 categories, 97 items, 71 modifiers each

## POS Discount Buttons
- [x] Add Staff Discount 30% button to POS order panel
- [x] Add Influencer 100% discount button to POS order panel
- [x] Store discount type and amount in pos_orders table
- [x] Calculate discount before GST and surcharge

## Automatic Weekend Surcharge
- [x] Auto-detect Saturday/Sunday and apply 10% surcharge automatically
- [x] Exclude merchandise/goods items from surcharge calculation
- [x] Display "Weekend Surcharge 10%" label clearly in order panel
- [x] Pre-select weekend surcharge button on Sat/Sun

## Auto Holiday Surcharge + Goods Exemption
- [x] Add VIC public holiday list for 2026 and auto-detect holiday
- [x] Auto-apply 15% surcharge on public holidays
- [x] Exclude BB Goods and Etc categories from surcharge calculation
- [x] Display "Weekend Surcharge 10%" or "Holiday Surcharge 15%" label clearly

## Staff Role Restrictions
- [x] Hide Transactions/Sales tab from Staff role in POS
- [x] Staff can only: enter orders, process payments, change order status
- [x] Manager and Admin can still see sales data

## Manager Role
- [x] Add "manager" role to staff_members table (already exists in schema)
- [x] Manager can: manage orders, view sales, partial staff management
- [x] Manager cannot: change settings, manage menu (admin panel only)

## Shift Management System
- [x] Create shifts table (branch, staff, date, start_time, end_time, status)
- [x] Shift schedule calendar view per branch
- [x] Staff can view own shifts
- [x] Staff can request shift swap
- [x] Manager/Admin can assign and approve shifts
- [x] Shift tab in Staff POS interface

## EFTPOS (ANZ) Card Payment
- [x] Card payment button shows amount and "EFTPOS Payment Complete" confirmation

## Staff Attendance (Clock In/Out) System
- [x] Create staff_attendance table (staffId, branchId, date, clockInTime, clockOutTime, clockInPhoto, clockOutPhoto)
- [x] Backend API: clock in with photo upload
- [x] Backend API: clock out with photo upload
- [x] Clock In/Out UI in Staff POS with camera capture
- [x] Admin Excel export with calculated total hours per staff

## Customer Loyalty Points System
- [x] Create loyalty_points table (customerId, totalPoints, lifetimePoints, tier)
- [x] Create points_transactions table (earn/redeem history)
- [x] Create loyalty_rewards table (available rewards with point costs)
- [x] Auto-earn points on POS order completion ($1 = 1pt, Regular 1.5x, VIP 2x)
- [x] Tier system: New (default), Regular (monthly 5+ visits or $200+), VIP (10+ visits or $500+)
- [x] Reward redemption: 100pt = free regular coffee, 200pt = free large, 500pt = gelato+coffee set
- [x] Birthday reward: VIP = free cake, Regular = free coffee (auto-coupon 7 days before birthday)
- [x] Customer My Page: show points balance, tier, available rewards
- [x] POS: show customer points and allow redemption at checkout

## PWA App Setup
- [x] Add web app manifest (name: Queen BB, icons, theme color)
- [x] Add service worker for offline caching
- [x] Add install prompt for iOS/Android home screen
- [x] Configure for App Store/Play Store submission (TWA/Capacitor ready)

## Real Product Images Upload
- [x] Upload all postcard images (10 front designs) to webdev storage
- [x] Create postcard products in DB with images
- [x] Upload mug lifestyle images (5 mugs, Italian café style)
- [x] Upload tumbler lifestyle images (5 tumblers, trendy style)
- [x] Upload cap lifestyle images (3 caps, women wearing)
- [x] Upload eco bag real product photos (4 designs)
- [x] Upload tiramisu/gelato images for menu section when provided (placeholder images in use; real photos pending from owner)

## Menu Section - Dine-in Only
- [x] Update menu section to indicate dine-in only (Tiramisu + Gelato pages)

## Objects Page UX Improvements
- [x] Add category filter tabs at top of merchandise section (All, Mugs, Tumblers, Caps, Eco Bags, Postcards)
- [x] Add product detail modal with large image and full description on product click
- [x] Fix eco bag duplicate image (Birthday Koala now uses correct lifestyle image)
- [x] Fix transient tRPC HTML response error (updated SW to v3, added retry logic to QueryClient)

## Offline Status Banner
- [x] Add top banner that appears when network is offline and auto-hides when connection is restored

## Offline UX Improvements
- [x] Offline cart preservation: save cart data to localStorage when offline, auto-sync when connection restored
- [x] Add "Retry" button to offline banner for manual connection check
- [x] Show "다시 연결되었습니다" toast message briefly when connection is restored

## Advanced Offline UX
- [x] Cart sync queue: queue cart actions while offline, auto-sync with server when connection restored
- [x] Image loading skeleton/blur placeholder for slow network conditions
- [x] Offline read-only mode: show cached menu pages from service worker when offline

## Email Receipt & Search & Sales Chart
- [x] Order email receipt: include detailed line items (product name, quantity, price, subtotal, shipping, total) in order confirmation email (already implemented in orderEmail.ts)
- [x] Objects page product search: text input to filter products by name/description
- [x] Admin dashboard sales chart: daily/weekly revenue visualization with chart

## Product Image Update

- [x] Replace the Objects page image for Queen St. BB Cream & Khaki Cap with the user-provided original image
- [x] Run regression tests and save a checkpoint after the cap image replacement


## Product Image Edit

- [x] Edit the user-provided cap image to a 3:4 composition while preserving the cap and removing the extra person
- [x] Update Queen St. BB Cream & Khaki Cap with the edited image, run tests, and save a checkpoint

## Restore Original Cap Image

- [x] Restore Queen St. BB Cream & Khaki Cap to the user's original uploaded photo
- [x] Run regression tests and save a checkpoint for the restored image

## Location Update: Brisbane to Melbourne

- [x] Search and locate all occurrences of Brisbane in code and database
- [x] Replace all Brisbane references with Melbourne
- [x] Run regression tests and save checkpoint for the location update

## Opening Hours Update

- [x] Replace all user-visible occurrences of Open daily, 8:00 AM — 10:00 PM with Open daily, 2:00 PM — 11:00 PM
- [x] Run regression tests and save a checkpoint for the opening-hours update

## Footer Wholesale and Franchise Links

- [x] Locate the footer navigation and confirm the Wholesale and Franchise routes
- [x] Replace the combined Wholesale & Franchise footer link with separate Wholesale and Franchise links
- [x] Run regression tests and save a checkpoint for the footer navigation update

## Customer Care Opening Hours FAQ

- [x] Replace the Customer Care FAQ wording from 8:00 AM–10:00 PM to 2:00 PM–11:00 PM
- [x] Run regression tests and save a checkpoint for the Customer Care wording update

## Customer Care Footer Hours

- [x] Replace the Customer Care footer hours from Daily, 8 AM — 10 PM to Daily, 2 PM — 11 PM
- [x] Run regression tests and save a checkpoint for the footer-hours update

## Production Connection Diagnosis

- [x] Diagnose intermittent ERR_CONNECTION_CLOSED responses on queenstbb.com and verify the stable Manus fallback domain
- [x] Document the domain-edge finding and confirm both domains are reachable

## Replace Khaki Cap Product Image

- [x] Upload the user's original cap photo and replace the Queen St. BB Cream & Khaki Cap image
- [x] Run regression tests and save a checkpoint for the cap image replacement

## Replace Check Pattern Cap Product Image

- [x] Upload the user's original Check Pattern Cap photo and replace the product image
- [x] Run regression tests and save a checkpoint for the Check Pattern Cap image replacement

## Add Queen Street Melbourne Mug Green

- [x] Upload the user's original mug image and create Queen Street Melbourne Mug (Green) in the Mugs category at AUD 35.90 with stock available
- [x] Run regression tests and save a checkpoint for the new mug
