ALTER TABLE `staff_members` MODIFY COLUMN `staffRole` enum('staff','manager','owner') NOT NULL DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `pos_order_items` ADD `modifiers` json;