ALTER TABLE `customer_loyalty` ADD `totalStamps` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_loyalty` ADD `lifetimeStamps` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `points_transactions` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `points_transactions` ADD `staffId` int;--> statement-breakpoint
ALTER TABLE `points_transactions` ADD `stamps` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `points_transactions` ADD `stampBalanceAfter` int DEFAULT 0 NOT NULL;