ALTER TABLE `enquiries` MODIFY COLUMN `type` enum('wholesale','franchise','customer_care') NOT NULL;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `storeAddress` varchar(500);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `deliveryAddress` varchar(500);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `estimatedOrderQuantity` varchar(200);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `businessType` varchar(200);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `preferredLocation` varchar(300);