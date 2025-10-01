import { trips, flightGroups, flights, hotels, activities, itineraryDays, restaurants } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const zFlight = createSelectSchema(flights, {
  fromAirportCode: z.string().max(3).describe("The airport code of the departure airport"),
  toAirportCode: z.string().max(3).describe("The airport code of the arrival airport"),
  departureTime: z.iso.datetime({ offset: true }).describe("The departure time of the flight in iso 8601 format (with offset of departure airport)"),
  arrivalTime: z.iso.datetime({ offset: true }).describe("The arrival time of the flight in iso 8601 format (with offset of arrival airport)"),
});
export const zFlightGroup = createSelectSchema(flightGroups).extend({
  flights: z.array(zFlight),
});
export const zHotel = createSelectSchema(hotels);
export const zActivity = createSelectSchema(activities);
export const zItineraryDay = createSelectSchema(itineraryDays);
export const zRestaurant = createSelectSchema(restaurants);
export const zTripDataBare = createSelectSchema(trips);

export const zTripData = zTripDataBare.extend({
  flightGroups: z.array(zFlightGroup),
  hotels: z.array(zHotel),
  activities: z.array(zActivity),
  itineraryDays: z.array(zItineraryDay),
  restaurants: z.array(zRestaurant),
});

export const zGoogleFlightsQueryParams = z.object({
  departure_id: z.string().min(1).describe("IATA code of the departure airport"),
  arrival_id: z.string().min(1).describe("IATA code of the arrival airport"),
  outbound_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Departure date in YYYY-MM-DD format"),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Return date in YYYY-MM-DD format for round-trip flights"),
  travel_class: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional().default('ECONOMY').describe("Preferred cabin class"),
  adults: z.string().regex(/^\d+$/).optional().default('1').describe("Number of adult passengers (12+)"),
  children: z.string().regex(/^\d+$/).optional().default('0').describe("Number of child passengers (2-11)"),
  infant_on_lap: z.string().regex(/^\d+$/).optional().default('0').describe("Number of infants without seat (<2 years)"),
  infant_in_seat: z.string().regex(/^\d+$/).optional().default('0').describe("Number of infants with seat (<2 years)"),
  show_hidden: z.enum(['0', '1']).optional().default('0').describe("Include hidden results: 0=NO, 1=YES"),
  currency: z.string().min(1).optional().default('USD').describe("Currency code for pricing"),
  language_code: z.string().min(1).optional().default('en-US').describe("Language code for response"),
  country_code: z.string().min(1).optional().default('US').describe("Country code for filtering"),
  search_type: z.enum(['best', 'cheap']).optional().describe("Search strategy: best for balanced, cheap for lowest cost"),
});