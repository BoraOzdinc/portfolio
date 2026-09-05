CREATE TABLE `billingPlans` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`resourceId` text,
	`name` text NOT NULL,
	`direction` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`frequency` text NOT NULL,
	`anchor` text NOT NULL,
	`nextIndex` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`pendingAmount` integer,
	`pendingFrequency` text,
	`pendingFrom` text,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_plan_per_resource` ON `billingPlans` (`resourceId`);--> statement-breakpoint
CREATE TABLE `checks` (
	`id` text PRIMARY KEY NOT NULL,
	`monitorId` text NOT NULL,
	`checkedAt` text NOT NULL,
	`ok` integer NOT NULL,
	`status` integer,
	`latency` integer NOT NULL,
	`error` text,
	FOREIGN KEY (`monitorId`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `monitor_checks` ON `checks` (`monitorId`,`checkedAt`);--> statement-breakpoint
CREATE INDEX `check_retention` ON `checks` (`checkedAt`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`createdAt` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`nextAttemptAt` text NOT NULL,
	`sentAt` text,
	`lastError` text
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`monitorId` text NOT NULL,
	`openedAt` text NOT NULL,
	`resolvedAt` text,
	FOREIGN KEY (`monitorId`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `monitors` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`resourceId` text,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`active` integer NOT NULL,
	`statusMin` integer NOT NULL,
	`statusMax` integer NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`lastCheckedAt` text,
	`lastSuccessAt` text,
	`lastError` text,
	`lastStatus` integer,
	`lastLatency` integer,
	`nextCheckAt` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`projectId` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`kind` text NOT NULL,
	`createdAt` text NOT NULL,
	`readAt` text,
	`deliveryId` text,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_key_unique` ON `notifications` (`key`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`planId` text NOT NULL,
	`projectId` text NOT NULL,
	`resourceId` text,
	`name` text NOT NULL,
	`direction` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`dueOn` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paidAt` text,
	FOREIGN KEY (`planId`) REFERENCES `billingPlans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_period` ON `payments` (`planId`,`dueOn`);--> statement-breakpoint
CREATE INDEX `payment_due` ON `payments` (`status`,`dueOn`);--> statement-breakpoint
CREATE TABLE `projectResources` (
	`projectId` text NOT NULL,
	`resourceId` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_resource` ON `projectResources` (`projectId`,`resourceId`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`description` text NOT NULL,
	`url` text NOT NULL,
	`portfolioSlug` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerProjectId` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`panelUrl` text NOT NULL,
	`notes` text NOT NULL,
	`active` integer NOT NULL,
	`domain` text NOT NULL,
	`expiresOn` text,
	`autoRenew` integer NOT NULL,
	`hostname` text NOT NULL,
	`region` text NOT NULL,
	`capacity` text NOT NULL,
	`addresses` text NOT NULL,
	`customType` text NOT NULL,
	FOREIGN KEY (`ownerProjectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
