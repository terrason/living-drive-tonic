CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`path` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `stats` (
	`path` text PRIMARY KEY,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_stat_count` ON `stats` (`count`);