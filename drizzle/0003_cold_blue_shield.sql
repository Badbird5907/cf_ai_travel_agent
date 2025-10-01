-- drop all agent data, this was written in dev anyway so I don't care
DELETE FROM `agents`;

CREATE TABLE `saved_trips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`trip_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `agents` ADD `owner_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `trips` ADD `is_public` integer DEFAULT false NOT NULL;