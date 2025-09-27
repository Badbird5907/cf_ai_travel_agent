
CREATE TABLE IF NOT EXISTS `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`destination` text NOT NULL,
	`duration` text NOT NULL,
	`dates` text NOT NULL,
	`total_cost` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`duration` text NOT NULL,
	`price` real NOT NULL,
	`location` text NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `flight_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`description` text NOT NULL,
	`total_price` real NOT NULL,
	`layover_time` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `flights` (
	`id` text PRIMARY KEY NOT NULL,
	`flight_group_id` text NOT NULL,
	`airline` text NOT NULL,
	`from` text NOT NULL,
	`from_city` text NOT NULL,
	`to` text NOT NULL,
	`to_city` text NOT NULL,
	`departure_time` text NOT NULL,
	`arrival_time` text NOT NULL,
	`date` text NOT NULL,
	`arrival_date` text NOT NULL,
	`duration` text NOT NULL,
	`aircraft` text NOT NULL,
	`seat` text NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`flight_group_id`) REFERENCES `flight_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `hotels` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`rating` real NOT NULL,
	`nights` integer NOT NULL,
	`price_per_night` real NOT NULL,
	`total_price` real NOT NULL,
	`amenities` text NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `itinerary_days` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`day` integer NOT NULL,
	`title` text NOT NULL,
	`activities` text NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `restaurants` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`rating` real NOT NULL,
	`price_range` text NOT NULL,
	`location` text NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint