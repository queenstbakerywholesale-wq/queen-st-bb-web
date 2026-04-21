CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`displayName` varchar(200),
	`email` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`openingHours` json,
	`pickupSlotDuration` int NOT NULL DEFAULT 30,
	`maxBookingsPerSlot` int NOT NULL DEFAULT 3,
	`minPrepNoticeHours` int NOT NULL DEFAULT 24,
	`allowSameDayBooking` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`closedDates` json,
	`closedSlots` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cake_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingNumber` varchar(50) NOT NULL,
	`customerId` int,
	`customerName` varchar(200) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(50) NOT NULL,
	`branchId` int NOT NULL,
	`productId` int,
	`productName` varchar(300) NOT NULL,
	`size` varchar(100),
	`customMessage` text,
	`customRequest` text,
	`pickupDate` varchar(20) NOT NULL,
	`pickupTime` varchar(10) NOT NULL,
	`status` enum('pending','confirmed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('online','pickup') NOT NULL DEFAULT 'pickup',
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`totalPrice` decimal(10,2),
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cake_bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `cake_bookings_bookingNumber_unique` UNIQUE(`bookingNumber`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`notes` text,
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalSpent` decimal(12,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('order_confirmation','booking_confirmation','shipping_update','order_ready','admin_new_order','admin_new_booking','general') NOT NULL,
	`recipientType` enum('customer','admin') NOT NULL,
	`recipientEmail` varchar(320),
	`subject` varchar(500),
	`content` text,
	`relatedOrderId` int,
	`relatedBookingId` int,
	`isSent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`productName` varchar(300) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`size` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerId` int,
	`customerName` varchar(200) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(50),
	`status` enum('pending','paid','preparing','ready','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','paid','refunded','partial') NOT NULL DEFAULT 'unpaid',
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`deliveryType` enum('pickup','delivery') NOT NULL DEFAULT 'pickup',
	`deliveryAddress` text,
	`branchId` int,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`slug` varchar(300) NOT NULL,
	`description` text,
	`shortDescription` varchar(500),
	`categoryId` int,
	`price` decimal(10,2) NOT NULL,
	`compareAtPrice` decimal(10,2),
	`imageUrl` text,
	`images` json,
	`stock` int NOT NULL DEFAULT 0,
	`lowStockThreshold` int NOT NULL DEFAULT 5,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`productType` enum('tiramisu','gelato','cake','merchandise','wholesale') NOT NULL,
	`sizes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `shipping_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`courierName` varchar(200),
	`trackingNumber` varchar(200),
	`status` enum('processing','shipped','in_transit','out_for_delivery','delivered','failed') NOT NULL DEFAULT 'processing',
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_tracking_id` PRIMARY KEY(`id`)
);
