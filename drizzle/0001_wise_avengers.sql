CREATE TABLE `bankAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`fintechId` int NOT NULL,
	`accountNumber` varchar(20) NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`bankCode` varchar(10) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '15000',
	`kycType` enum('BVN','NIN') NOT NULL,
	`kycId` varchar(20) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankAccounts_accountNumber_unique` UNIQUE(`accountNumber`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`fintechId` int NOT NULL,
	`kycType` enum('BVN','NIN') NOT NULL,
	`kycId` varchar(20) NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`dateOfBirth` varchar(10) NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationStatus` enum('PENDING','VERIFIED','FAILED') NOT NULL DEFAULT 'PENDING',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fintechs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`apiKey` varchar(255) NOT NULL,
	`apiSecret` varchar(255) NOT NULL,
	`bankCode` varchar(10),
	`bankName` varchar(255),
	`jwtToken` text,
	`tokenExpiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fintechs_id` PRIMARY KEY(`id`),
	CONSTRAINT `fintechs_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `identityRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identityType` enum('BVN','NIN') NOT NULL,
	`identityNumber` varchar(20) NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`dateOfBirth` varchar(10) NOT NULL,
	`phone` varchar(20),
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `identityRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `identityRecords_identityNumber_unique` UNIQUE(`identityNumber`)
);
--> statement-breakpoint
CREATE TABLE `transactionStatuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` varchar(50) NOT NULL,
	`nibssTransactionId` varchar(50),
	`status` enum('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
	`statusMessage` text,
	`lastCheckedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactionStatuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactionStatuses_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` varchar(50) NOT NULL,
	`fintechId` int NOT NULL,
	`fromAccountId` int NOT NULL,
	`toAccountId` int,
	`fromAccountNumber` varchar(20) NOT NULL,
	`toAccountNumber` varchar(20) NOT NULL,
	`toAccountName` varchar(255),
	`toBankCode` varchar(10),
	`toBankName` varchar(255),
	`amount` decimal(15,2) NOT NULL,
	`transactionType` enum('INTRA_BANK','INTER_BANK') NOT NULL,
	`status` enum('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_transactionId_unique` UNIQUE(`transactionId`)
);
