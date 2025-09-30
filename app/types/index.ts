import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from "drizzle-orm";

import * as schema from "../db/schema";

type TSchema = ExtractTablesWithRelations<typeof schema>;

export type IncludeRelation<TableName extends keyof TSchema> = DBQueryConfig<
  "one" | "many",
  boolean,
  TSchema,
  TSchema[TableName]
>["with"];

export type InferResultType<
  TableName extends keyof TSchema,
  With extends IncludeRelation<TableName> | undefined = undefined,
> = BuildQueryResult<
  TSchema,
  TSchema[TableName],
  {
    with: With;
  }
>;

export type Flight = InferResultType<"flights">;
export type FlightGroup = InferResultType<"flightGroups", { flights: true }>;
export type Hotel = InferResultType<"hotels">;
export type Restaurant = InferResultType<"restaurants">;
export type Activity = InferResultType<"activities">;
export type ItineraryDay = InferResultType<"itineraryDays">;
export type TripData = InferResultType<"trips", {
  flightGroups: { with: { flights: true } },
  hotels: true,
  restaurants: true,
  activities: true,
  itinerary: true
}>;

export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;