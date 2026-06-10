CREATE TABLE `ecard_designs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(500) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ecard_designs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `gift_card_transactions` MODIFY COLUMN `transactionType` enum('activation','redemption','refund','void','adjustment','recharge') NOT NULL;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `customDesignUrl` text;