CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`itemId` text,
	`name` text NOT NULL,
	`direction` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`itemId`) REFERENCES `budgetItems`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transaction_date` ON `transactions` (`date`);