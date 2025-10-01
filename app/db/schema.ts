
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { generateId } from "../lib/utils";
import * as authSchema from "./auth-schema";

export * from "./auth-schema";


export const usersRelations = relations(authSchema.user, ({ one, many }) => ({
  savedTrips: many(savedTrips),
  agents: many(agents),
}));

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => authSchema.user.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  initialPromptUsed: integer("initial_prompt_used", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("active"), // active, completed, failed
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agentsRelations = relations(agents, ({ one }) => ({
  owner: one(authSchema.user, {
    fields: [agents.ownerId],
    references: [authSchema.user.id],
  }),
}));

export const savedTrips = sqliteTable("saved_trips", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => authSchema.user.id, { onDelete: "cascade" }),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch())`),
});

export const trips = sqliteTable("trips", {
  id: text("id").primaryKey().$defaultFn(() => generateId("trip")),
  createdById: text("created_by_id").notNull().references(() => authSchema.user.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  duration: text("duration").notNull(),
  dates: text("dates").notNull(),
  estimatedMealsCost: real("estimated_meals_cost").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch())`),
});

export const flightGroups = sqliteTable("flight_groups", {
  id: text("id").primaryKey().$defaultFn(() => generateId("flight_group")),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  totalPrice: real("total_price").notNull(),
  layoverTime: text("layover_time"),
  url: text("url"), // either the flight group has the url or a specific flight does
});

export const flights = sqliteTable("flights", {
  id: text("id").primaryKey().$defaultFn(() => generateId("flight")),
  flightGroupId: text("flight_group_id").notNull().references(() => flightGroups.id, { onDelete: "cascade" }),
  airline: text("airline").notNull(),
  class: text("class").notNull(),
  carryOn: integer("carry_on").notNull(),
  checkedBags: integer("checked_bags").notNull(),
  mealIncluded: text("meal_included").notNull(),
  from: text("from").notNull(),
  fromAirportCode: text("from_airport_code").notNull(),
  fromCity: text("from_city").notNull(),
  to: text("to").notNull(),
  toAirportCode: text("to_airport_code").notNull(),
  toCity: text("to_city").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  date: text("date").notNull(),
  arrivalDate: text("arrival_date").notNull(),
  duration: text("duration").notNull(),
  aircraft: text("aircraft").notNull(),
  seat: text("seat").notNull(),
  price: real("price").notNull(),
  url: text("url"),
});

export const hotels = sqliteTable("hotels", {
  id: text("id").primaryKey().$defaultFn(() => generateId("hotel")),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  rating: real("rating").notNull(),
  nights: integer("nights").notNull(),
  pricePerNight: real("price_per_night").notNull(),
  totalPrice: real("total_price").notNull(),
  amenities: text("amenities", { mode: "json" }).$type<string[]>().notNull(),
});

export const restaurants = sqliteTable("restaurants", {
  id: text("id").primaryKey().$defaultFn(() => generateId("restaurant")),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  rating: real("rating").notNull(),
  priceRange: text("price_range").notNull(),
  location: text("location").notNull(),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().$defaultFn(() => generateId("activity")),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  duration: text("duration").notNull(),
  price: real("price").notNull(),
  location: text("location").notNull(),
});

export const itineraryDays = sqliteTable("itinerary_days", {
  id: text("id").primaryKey().$defaultFn(() => generateId("itinerary_day")),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  day: integer("day").notNull(),
  title: text("title").notNull(),
  activities: text("activities", { mode: "json" }).$type<string[]>().notNull(),
});

export const tripsRelations = relations(trips, ({ many, one }) => ({
  flightGroups: many(flightGroups),
  hotels: many(hotels),
  restaurants: many(restaurants),
  activities: many(activities),
  itinerary: many(itineraryDays),
}));

export const flightGroupsRelations = relations(flightGroups, ({ one, many }) => ({
  trip: one(trips, {
    fields: [flightGroups.tripId],
    references: [trips.id],
  }),
  flights: many(flights),
}));

export const flightsRelations = relations(flights, ({ one }) => ({
  flightGroup: one(flightGroups, {
    fields: [flights.flightGroupId],
    references: [flightGroups.id],
  }),
}));

export const hotelsRelations = relations(hotels, ({ one }) => ({
  trip: one(trips, {
    fields: [hotels.tripId],
    references: [trips.id],
  }),
}));

export const restaurantsRelations = relations(restaurants, ({ one }) => ({
  trip: one(trips, {
    fields: [restaurants.tripId],
    references: [trips.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  trip: one(trips, {
    fields: [activities.tripId],
    references: [trips.id],
  }),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one }) => ({
  trip: one(trips, {
    fields: [itineraryDays.tripId],
    references: [trips.id],
  }),
}));
