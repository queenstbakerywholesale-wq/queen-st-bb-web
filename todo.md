
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
