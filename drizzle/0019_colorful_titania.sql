ALTER TABLE `pos_orders` ADD `customerEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `pos_orders` ADD `receiptToken` varchar(80);--> statement-breakpoint
ALTER TABLE `pos_orders` ADD CONSTRAINT `pos_orders_receiptToken_unique` UNIQUE(`receiptToken`);