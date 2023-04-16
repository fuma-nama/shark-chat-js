ALTER TABLE `Attachment` MODIFY COLUMN `message_id` int;--> statement-breakpoint
ALTER TABLE `Attachment` ADD `direct_message_id` int;--> statement-breakpoint
CREATE INDEX `Direct_message_id_idx` ON `Attachment` (`direct_message_id`);