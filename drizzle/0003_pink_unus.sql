ALTER TABLE `products` MODIFY COLUMN `productType` enum('tiramisu','gelato','cake','merchandise','postcards','objects','wholesale') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `fulfillmentType` enum('shipping','pickup') DEFAULT 'pickup' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingFee` decimal(10,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingAddress` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupBranchId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupDate` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupTime` varchar(10);--> statement-breakpoint
ALTER TABLE `orders` ADD `hasCakeItems` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `deliveryType`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `deliveryAddress`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `branchId`;