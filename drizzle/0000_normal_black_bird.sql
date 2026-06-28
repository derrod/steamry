CREATE TABLE `dailies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dailies_date_unique` ON `dailies` (`date`);--> statement-breakpoint
CREATE TABLE `event_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games` (
	`daily_id` integer NOT NULL,
	`round` integer NOT NULL,
	`appid` integer NOT NULL,
	`name` text NOT NULL,
	`reviews_positive` integer NOT NULL,
	`reviews_negative` integer NOT NULL,
	`description` text NOT NULL,
	`price` text,
	`release_date` text NOT NULL,
	`header_image` text NOT NULL,
	`developers` text NOT NULL,
	`publishers` text NOT NULL,
	`tags` text,
	`categories` text NOT NULL,
	`genres` text NOT NULL,
	`screenshots` text NOT NULL,
	`trailers` text NOT NULL,
	`content_descriptors` text NOT NULL,
	`required_age` integer DEFAULT 0 NOT NULL,
	`marked_as_nsfw` integer DEFAULT false NOT NULL,
	`is_hand_picked` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`daily_id`, `round`, `appid`),
	FOREIGN KEY (`daily_id`) REFERENCES `dailies`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `results` (
	`daily_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ip_hashed` text NOT NULL,
	`correct_guesses` integer NOT NULL,
	`guesses` text NOT NULL,
	PRIMARY KEY(`daily_id`, `ip_hashed`),
	FOREIGN KEY (`daily_id`) REFERENCES `dailies`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `steam_apps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`appid` integer NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `steam_apps_appid_unique` ON `steam_apps` (`appid`);