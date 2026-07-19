CREATE TABLE `community_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_interactions` (
	`content_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`content_id`, `visitor_id`, `kind`)
);
--> statement-breakpoint
ALTER TABLE `case_submissions` ADD `kind` text DEFAULT 'help' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_submissions` ADD `title` text DEFAULT '匿名发布的真实情境' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_submissions` ADD `relation` text DEFAULT '其他' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_submissions` ADD `goal` text DEFAULT '想听听大家怎么说' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_submissions` ADD `source_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_submissions` ADD `source_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_submissions` ADD `image_key` text DEFAULT '' NOT NULL;