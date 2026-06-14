ALTER TABLE `pos_orders` ADD `posFulfillmentType` enum('for_here','to_go','delivery','pickup') DEFAULT 'for_here' NOT NULL;--> statement-breakpoint
ALTER TABLE `pos_orders` ADD `posSurchargeType` enum('none','weekend','holiday') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `pos_orders` ADD `surchargePercent` decimal(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `pos_orders` ADD `surchargeAmount` decimal(10,2) DEFAULT '0' NOT NULL;