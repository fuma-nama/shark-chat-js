CREATE TABLE `Account` (
	`id` varchar(32) PRIMARY KEY NOT NULL,
	`userId` varchar(32) NOT NULL,
	`type` varchar(191) NOT NULL,
	`provider` varchar(191) NOT NULL,
	`providerAccountId` varchar(191) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(30),
	`scope` varchar(191),
	`id_token` text,
	`session_state` varchar(191)
);

CREATE TABLE `DirectMessageChannel` (
	`author_id` varchar(191) NOT NULL,
	`receiver_id` varchar(191) NOT NULL
);
ALTER TABLE `DirectMessageChannel` ADD PRIMARY KEY(`receiver_id`,`author_id`);

CREATE TABLE `DirectMessage` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`author_id` varchar(191) NOT NULL,
	`receiver_id` varchar(191) NOT NULL,
	`content` varchar(2000) NOT NULL,
	`timestamp` timestamp(3) NOT NULL DEFAULT (now())
);

CREATE TABLE `GroupInvite` (
	`group_id` int PRIMARY KEY NOT NULL,
	`code` varchar(191) NOT NULL
);

CREATE TABLE `Group` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` varchar(256) NOT NULL,
	`unique_name` varchar(32) NOT NULL,
	`icon_hash` int,
	`owner_id` varchar(191) NOT NULL,
	`public` boolean NOT NULL DEFAULT false
);

CREATE TABLE `Member` (
	`group_id` int NOT NULL,
	`user_id` varchar(191) NOT NULL
);
ALTER TABLE `Member` ADD PRIMARY KEY(`group_id`,`user_id`);

CREATE TABLE `Message` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`group_id` int NOT NULL,
	`author_id` varchar(191) NOT NULL,
	`content` varchar(2000) NOT NULL,
	`timestamp` timestamp(3) NOT NULL DEFAULT (now())
);

CREATE TABLE `Session` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`sessionToken` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`expires` datetime(3) NOT NULL
);

CREATE TABLE `User` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`name` varchar(191) NOT NULL DEFAULT 'User',
	`email` varchar(191),
	`emailVerified` datetime(3),
	`image` varchar(191),
	`is_ai` boolean NOT NULL DEFAULT false
);

CREATE TABLE `VerificationToken` (
	`identifier` varchar(191) NOT NULL,
	`token` varchar(191) NOT NULL,
	`expires` datetime(3) NOT NULL
);

CREATE UNIQUE INDEX `Account_provider_providerAccountId_key` ON `Account` (`provider`,`providerAccountId`);
CREATE INDEX `Account_userId_idx` ON `Account` (`userId`);
CREATE INDEX `DirectMessageChannel_author_id_idx` ON `DirectMessageChannel` (`author_id`);
CREATE INDEX `DirectMessageChannel_receiver_id_idx` ON `DirectMessageChannel` (`receiver_id`);
CREATE INDEX `DirectMessage_receiver_id_idx` ON `DirectMessage` (`receiver_id`);
CREATE INDEX `DirectMessage_author_id_idx` ON `DirectMessage` (`author_id`);
CREATE UNIQUE INDEX `Group_unique_name_key` ON `Group` (`unique_name`);
CREATE UNIQUE INDEX `Group_owner_id_idx` ON `Group` (`owner_id`);
CREATE INDEX `Member_group_id_idx` ON `Member` (`group_id`);
CREATE INDEX `Member_user_id_idx` ON `Member` (`user_id`);
CREATE INDEX `Message_group_id_idx` ON `Message` (`group_id`);
CREATE INDEX `Message_author_id_idx` ON `Message` (`author_id`);
CREATE UNIQUE INDEX `Session_sessionToken_key` ON `Session` (`sessionToken`);
CREATE INDEX `Session_userId_idx` ON `Session` (`userId`);
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);
CREATE UNIQUE INDEX `VerificationToken_token_key` ON `VerificationToken` (`token`);
CREATE UNIQUE INDEX `VerificationToken_identifier_token_key` ON `VerificationToken` (`identifier`,`token`);