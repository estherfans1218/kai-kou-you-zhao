CREATE TABLE `case_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scene` text NOT NULL,
	`response` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
