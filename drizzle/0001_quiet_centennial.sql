CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`changes` json,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignAllocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`deviceId` int NOT NULL,
	`allocationStartDate` date NOT NULL,
	`allocationEndDate` date NOT NULL,
	`status` enum('scheduled','active','completed','cancelled') DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaignAllocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`campaignName` varchar(255) NOT NULL,
	`description` text,
	`city` varchar(64) NOT NULL,
	`zoneId` int,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`numberOfCars` int NOT NULL,
	`dailyBudget` bigint NOT NULL,
	`totalBudget` bigint NOT NULL,
	`status` enum('draft','awaiting_creative','awaiting_approval','approved','active','completed','cancelled') DEFAULT 'draft',
	`complianceApprovedAt` timestamp,
	`complianceApprovedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyVatId` varchar(32),
	`companyCountry` enum('NL','LV','OTHER') NOT NULL,
	`contactPerson` varchar(255),
	`walletBalance` bigint DEFAULT 0,
	`totalSpent` bigint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `complianceQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('creative','campaign','driver') NOT NULL,
	`entityId` int NOT NULL,
	`status` enum('pending','approved','rejected','escalated') DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`restrictedCategories` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`assetUrl` text NOT NULL,
	`assetKey` varchar(255) NOT NULL,
	`creativeType` enum('template','custom','ai_generated') DEFAULT 'template',
	`templateId` varchar(64),
	`approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending',
	`clientApprovedAt` timestamp,
	`complianceApprovedAt` timestamp,
	`complianceApprovedBy` int,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deviceTelemetry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`heartbeatAt` timestamp,
	`contentHash` varchar(64),
	`uptime` int,
	`batteryLevel` int,
	`signalStrength` int,
	`errorCode` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deviceTelemetry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`deviceSecret` varchar(255) NOT NULL,
	`model` varchar(64),
	`resolution` varchar(32),
	`colorMode` varchar(32),
	`status` enum('provisioning','active','offline','error') DEFAULT 'provisioning',
	`lastHeartbeat` timestamp,
	`lastContentHash` varchar(64),
	`currentImageUrl` text,
	`firmwareVersion` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_vehicleId_unique` UNIQUE(`vehicleId`),
	CONSTRAINT `devices_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `driverProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`licenseNumber` varchar(32),
	`licenseExpiry` date,
	`documentStatus` enum('pending','approved','rejected') DEFAULT 'pending',
	`documentReviewedAt` timestamp,
	`documentReviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `driverProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `driverProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`invoiceNumber` varchar(32) NOT NULL,
	`campaignId` int,
	`invoiceDate` date NOT NULL,
	`dueDate` date NOT NULL,
	`subtotal` bigint NOT NULL,
	`vatAmount` bigint NOT NULL,
	`total` bigint NOT NULL,
	`vatRate` decimal(5,2) NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
	`pdfUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`campaignAllocationId` int NOT NULL,
	`earningAmount` bigint NOT NULL,
	`formula` varchar(255),
	`activeDays` int,
	`averageUptime` decimal(5,2),
	`status` enum('pending','approved','paid','disputed') DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticketType` enum('driver_issue','campaign_issue','payment_issue','device_issue','other') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`assignedTo` int,
	`resolution` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`licensePlate` varchar(32) NOT NULL,
	`make` varchar(64),
	`model` varchar(64),
	`year` int,
	`color` varchar(32),
	`approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending',
	`approvedAt` timestamp,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_licensePlate_unique` UNIQUE(`licensePlate`)
);
--> statement-breakpoint
CREATE TABLE `walletLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`transactionType` enum('topup','spend','refund','adjustment') NOT NULL,
	`amount` bigint NOT NULL,
	`balanceBefore` bigint NOT NULL,
	`balanceAfter` bigint NOT NULL,
	`reference` varchar(255),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletLedger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(64) NOT NULL,
	`zoneName` varchar(128),
	`polygonGeoJson` json,
	`priceModifier` decimal(3,2) DEFAULT '1.0',
	`exclusivityFlag` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','client','driver') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `companyVatId` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `companyCountry` enum('NL','LV','OTHER');--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('pending','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
CREATE INDEX `entityType_id_idx` ON `auditLog` (`entityType`,`entityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `campaign_status_idx` ON `campaignAllocations` (`campaignId`,`status`);--> statement-breakpoint
CREATE INDEX `status_startDate_idx` ON `campaigns` (`status`,`startDate`);--> statement-breakpoint
CREATE INDEX `status_created_idx` ON `complianceQueue` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `device_heartbeat_idx` ON `deviceTelemetry` (`deviceId`,`heartbeatAt`);--> statement-breakpoint
CREATE INDEX `status_heartbeat_idx` ON `devices` (`status`,`lastHeartbeat`);--> statement-breakpoint
CREATE INDEX `status_due_idx` ON `invoices` (`status`,`dueDate`);--> statement-breakpoint
CREATE INDEX `status_created_idx` ON `payouts` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `status_priority_idx` ON `supportTickets` (`status`,`priority`,`createdAt`);--> statement-breakpoint
CREATE INDEX `client_created_idx` ON `walletLedger` (`clientId`,`createdAt`);