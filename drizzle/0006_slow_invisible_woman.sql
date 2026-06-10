CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`branchId` int,
	`orderId` int,
	`posOrderId` int,
	`customerName` varchar(200) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(50),
	`items` json NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`invoiceStatus` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`dueDate` varchar(20),
	`paidAt` timestamp,
	`sentAt` timestamp,
	`sentVia` enum('email','sms'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `pos_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`color` varchar(20),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(300) NOT NULL,
	`priceType` enum('fixed','weight','custom') NOT NULL DEFAULT 'fixed',
	`unitPrice` decimal(10,2) NOT NULL,
	`unit` varchar(20) DEFAULT 'each',
	`imageUrl` text,
	`color` varchar(20),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`posOrderId` int NOT NULL,
	`menuItemId` int,
	`itemName` varchar(300) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`weightGrams` int,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pos_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`branchId` int NOT NULL,
	`staffId` int NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`posPaymentMethod` enum('cash','card','gift_card','mixed') NOT NULL DEFAULT 'cash',
	`posPaymentStatus` enum('paid','pending','refunded') NOT NULL DEFAULT 'paid',
	`cashReceived` decimal(10,2),
	`changeGiven` decimal(10,2),
	`customerName` varchar(200),
	`customerPhone` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pos_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `pos_orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `staff_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`displayName` varchar(200) NOT NULL,
	`branchId` int NOT NULL,
	`staffRole` enum('staff','manager') NOT NULL DEFAULT 'staff',
	`pin` varchar(10),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_members_username_unique` UNIQUE(`username`)
);
