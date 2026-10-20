CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_workSessions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`start` text,
	`end` text,
	`duration` integer,
	`note` text NOT NULL,
	`paidPeriod` text
);
--> statement-breakpoint
INSERT INTO `__new_workSessions`("id", "date", "kind", "start", "end", "duration", "note", "paidPeriod") SELECT "id", "date", "kind", "start", "end", NULL, "note", NULL FROM `workSessions`;--> statement-breakpoint
DROP TABLE `workSessions`;--> statement-breakpoint
ALTER TABLE `__new_workSessions` RENAME TO `workSessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `work_date` ON `workSessions` (`date`);