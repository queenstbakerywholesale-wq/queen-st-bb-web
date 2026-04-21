
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
- [ ] Notifications: customer confirmation emails, booking confirmations, shipping updates, order-ready notifications, admin new order/booking alerts
- [x] Connect admin to public site: Objects page with live product data, Cake Booking page with live booking system
- [x] Hide all admin features from public users, no search engine indexing

## Gap Fixes

- [x] Add noindex/robots meta for admin routes
- [x] Enforce min prep notice hours and same-day booking rules in public booking submit/check
- [x] Seed 3 default branches in the database
- [x] Add recent customers section to admin dashboard
