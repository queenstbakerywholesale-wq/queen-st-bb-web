CREATE TABLE `branch_sales_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`monthlyTarget` decimal(12,2) NOT NULL DEFAULT '0',
	`annualTarget` decimal(12,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branch_sales_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `branch_sales_targets_branchId_unique` UNIQUE(`branchId`)
);
