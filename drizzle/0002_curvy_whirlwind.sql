CREATE TABLE `enquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('wholesale','customer_care') NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`company` varchar(300),
	`interest` varchar(200),
	`subject` varchar(500),
	`message` text NOT NULL,
	`enquiryStatus` enum('new','in_progress','responded','closed') NOT NULL DEFAULT 'new',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageSlug` varchar(100) NOT NULL,
	`slotKey` varchar(100) NOT NULL,
	`imageUrl` text NOT NULL,
	`storageKey` text,
	`altText` varchar(500),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `stripeSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `stripePaymentIntentId` varchar(255);