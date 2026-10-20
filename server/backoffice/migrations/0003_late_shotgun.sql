CREATE TABLE `workSessions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`note` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `work_date` ON `workSessions` (`date`);