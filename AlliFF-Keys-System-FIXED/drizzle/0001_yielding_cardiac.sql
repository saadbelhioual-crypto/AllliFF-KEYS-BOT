CREATE TABLE `gems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keyPackages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`durationDays` int NOT NULL,
	`botCount` int NOT NULL,
	`gemsPrice` int NOT NULL,
	`cashPrice` decimal(10,2),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keyPackages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`linkId` int NOT NULL,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `linkUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` enum('key','message','payment','system') NOT NULL DEFAULT 'system',
	`relatedData` json,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`purchaseId` int NOT NULL,
	`proofImageUrl` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`rejectionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`packageId` int NOT NULL,
	`paymentMethod` enum('gems','cash') NOT NULL,
	`status` enum('pending','completed','failed','rejected') NOT NULL DEFAULT 'pending',
	`generatedKey` varchar(255),
	`generatedUsername` varchar(255),
	`generatedPassword` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shortLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkId` varchar(64) NOT NULL,
	`gemsPerUse` int NOT NULL,
	`maxUsers` int NOT NULL,
	`usedCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shortLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `shortLinks_linkId_unique` UNIQUE(`linkId`)
);
--> statement-breakpoint
CREATE TABLE `telegramUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`telegramUsername` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telegramUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegramUsers_telegramId_unique` UNIQUE(`telegramId`)
);
--> statement-breakpoint
CREATE TABLE `userBans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reason` text,
	`bannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBans_id` PRIMARY KEY(`id`),
	CONSTRAINT `userBans_userId_unique` UNIQUE(`userId`)
);
