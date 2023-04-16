CREATE TABLE `Attachment` (
	`id` varchar(32) PRIMARY KEY NOT NULL,
	`url` varchar(255) NOT NULL,
	`type` enum('image','raw') NOT NULL,
	`message_id` int NOT NULL
);
--> statement-breakpoint
CREATE INDEX `Message_id_idx` ON `Attachment` (`message_id`);