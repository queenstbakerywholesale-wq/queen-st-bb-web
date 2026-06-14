ALTER TABLE `pos_orders` ADD `posDiscountType` enum('none','staff','influencer') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `pos_orders` ADD `discountPercent` decimal(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `pos_orders` ADD `discountAmount` decimal(10,2) DEFAULT '0' NOT NULL;