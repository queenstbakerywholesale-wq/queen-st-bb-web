CREATE TABLE `gift_card_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`giftCardId` int NOT NULL,
	`transactionType` enum('activation','redemption','refund','void','adjustment') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`balanceAfter` decimal(10,2) NOT NULL,
	`note` text,
	`performedBy` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gift_card_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gift_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`initialAmount` decimal(10,2) NOT NULL,
	`currentBalance` decimal(10,2) NOT NULL,
	`giftCardStatus` enum('pending','active','depleted','expired','voided') NOT NULL DEFAULT 'pending',
	`purchaserName` varchar(200) NOT NULL,
	`purchaserEmail` varchar(320) NOT NULL,
	`recipientName` varchar(200),
	`recipientEmail` varchar(320),
	`personalMessage` text,
	`selectedImage` varchar(50) NOT NULL DEFAULT 'classic',
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`squareGiftCardId` varchar(255),
	`squareGan` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`activatedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `gift_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `gift_cards_code_unique` UNIQUE(`code`)
);
