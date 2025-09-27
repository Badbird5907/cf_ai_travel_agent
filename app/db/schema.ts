
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const trips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  destination: text("destination").notNull(),
  duration: text("duration").notNull(),
  dates: text("dates").notNull(),
  totalCost: real("total_cost").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch())`),
});

export const flightGroups = sqliteTable("flight_groups", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  totalPrice: real("total_price").notNull(),
  layoverTime: text("layover_time"),
});

export const flights = sqliteTable("flights", {
  id: text("id").primaryKey(),
  flightGroupId: text("flight_group_id").notNull().references(() => flightGroups.id, { onDelete: "cascade" }),
  airline: text("airline").notNull(),
  from: text("from").notNull(),
  fromCity: text("from_city").notNull(),
  to: text("to").notNull(),
  toCity: text("to_city").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  date: text("date").notNull(),
  arrivalDate: text("arrival_date").notNull(),
  duration: text("duration").notNull(),
  aircraft: text("aircraft").notNull(),
  seat: text("seat").notNull(),
  price: real("price").notNull(),
});

export const hotels = sqliteTable("hotels", {
  id: text("id").primaryKey(),
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
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  rating: real("rating").notNull(),
  priceRange: text("price_range").notNull(),
  location: text("location").notNull(),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  duration: text("duration").notNull(),
  price: real("price").notNull(),
  location: text("location").notNull(),
});

export const itineraryDays = sqliteTable("itinerary_days", {
  id: text("id").primaryKey(),
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
