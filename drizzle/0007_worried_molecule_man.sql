CREATE TABLE `pos_item_modifiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`options` json NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pos_item_modifiers_id` PRIMARY KEY(`id`)
);
