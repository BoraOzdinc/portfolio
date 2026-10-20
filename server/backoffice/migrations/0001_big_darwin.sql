CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`balance` integer NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budgetItems` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`direction` text NOT NULL,
	`amount` integer NOT NULL,
	`frequency` text NOT NULL,
	`startOn` text NOT NULL,
	`endOn` text
);
--> statement-breakpoint
CREATE TABLE `cardStatements` (
	`id` text PRIMARY KEY NOT NULL,
	`cardId` text NOT NULL,
	`period` text NOT NULL,
	`dueOn` text NOT NULL,
	`balance` integer NOT NULL,
	`minimum` integer NOT NULL,
	`paidAmount` integer DEFAULT 0 NOT NULL,
	`paidAt` text,
	FOREIGN KEY (`cardId`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_period` ON `cardStatements` (`cardId`,`period`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bank` text NOT NULL,
	`creditLimit` integer NOT NULL,
	`dueDay` integer NOT NULL,
	`minRate` integer
);
--> statement-breakpoint
CREATE TABLE `holdings` (
	`id` text PRIMARY KEY NOT NULL,
	`asset` text NOT NULL,
	`quantity` real NOT NULL,
	`buyPrice` integer NOT NULL,
	`boughtOn` text NOT NULL,
	`note` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prices` (
	`asset` text PRIMARY KEY NOT NULL,
	`price` integer NOT NULL,
	`source` text NOT NULL,
	`updatedAt` text NOT NULL
);
