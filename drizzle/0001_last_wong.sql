CREATE TABLE `game_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_cache_appid_unique` ON `game_cache` (`appid`);