CREATE TABLE `customer_loyalty` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`lifetimePoints` int NOT NULL DEFAULT 0,
	`loyaltyTier` enum('new','regular','vip') NOT NULL DEFAULT 'new',
	`monthlyVisits` int NOT NULL DEFAULT 0,
	`monthlySpent` decimal(12,2) NOT NULL DEFAULT '0',
	`birthday` varchar(5),
	`birthdayRewardClaimed` boolean NOT NULL DEFAULT false,
	`lastVisitAt` timestamp,
	`tierUpdatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_loyalty_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_loyalty_customerId_unique` UNIQUE(`customerId`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`pointsCost` int NOT NULL,
	`requiredTier` enum('new','regular','vip') NOT NULL DEFAULT 'new',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyalty_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `points_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`pointsType` enum('earn','redeem','bonus','birthday') NOT NULL,
	`points` int NOT NULL,
	`description` varchar(500),
	`orderId` int,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_transactions_id` PRIMARY KEY(`id`)
);
