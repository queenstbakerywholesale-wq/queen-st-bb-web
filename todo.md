
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
