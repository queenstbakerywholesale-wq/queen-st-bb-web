CREATE TABLE `staff_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`branchId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`clockInTime` timestamp,
	`clockOutTime` timestamp,
	`clockInPhotoUrl` text,
	`clockOutPhotoUrl` text,
	`totalMinutes` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_attendance_id` PRIMARY KEY(`id`)
);
