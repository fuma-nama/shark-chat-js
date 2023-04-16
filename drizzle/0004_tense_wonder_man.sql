ALTER TABLE `Attachment` MODIFY COLUMN `type` enum('image','video','raw') NOT NULL;--> statement-breakpoint
ALTER TABLE `Attachment` ADD `bytes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `Attachment` ADD `width` int;--> statement-breakpoint
ALTER TABLE `Attachment` ADD `height` int;