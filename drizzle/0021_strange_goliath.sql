CREATE TABLE `pos_daily_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`settlementDate` varchar(10) NOT NULL,
	`expectedCash` decimal(10,2) NOT NULL DEFAULT '0',
	`expectedCard` decimal(10,2) NOT NULL DEFAULT '0',
	`countedCash` decimal(10,2) NOT NULL DEFAULT '0',
	`countedCard` decimal(10,2) NOT NULL DEFAULT '0',
	`zellerFee` decimal(10,2) NOT NULL DEFAULT '0',
	`discrepancy` decimal(10,2) NOT NULL DEFAULT '0',
	`notes` text,
	`recordedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_daily_settlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `pos_daily_settlement_branch_date` UNIQUE(`branchId`,`settlementDate`)
);
