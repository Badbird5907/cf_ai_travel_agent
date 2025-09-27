import { generateObject } from "ai";
import { z } from "zod";
import { mockTripData } from "@/lib/mock";
import { generateId } from "@/lib/utils";

const models = {
  planner: "@cf/openai/gpt-oss-120b",
  worker: "@cf/openai/gpt-oss-120b",
};

const zFlight = z.object({
  id: z.string(),
  flightGroupId: z.string(),
  airline: z.string(),
  from: z.string(),
  fromCity: z.string(),
  to: z.string(),
  toCity: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  date: z.string(),
  arrivalDate: z.string().optional().default(""),
  duration: z.string(),
  class: z.string(),
  carryOn: z.number().int().nonnegative().optional().default(1),
  checkedBags: z.number().int().nonnegative().optional().default(0),
  mealIncluded: z.string().optional().default(""),
  aircraft: z.string().optional().default(""),
  seat: z.string().optional().default(""),
  price: z.number().nonnegative(),
});

const zFlightGroup = z.object({
  id: z.string(),
  tripId: z.string(),
  description: z.string(),
  totalPrice: z.number().nonnegative(),
  flights: z.array(zFlight).min(1),
  layoverTime: z.string().optional().default(""),
});

const zHotel = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  location: z.string(),
  rating: z.number().min(0).max(5),
  nights: z.number().int().positive(),
  pricePerNight: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  amenities: z.array(z.string()).optional().default([]),
});

const zRestaurant = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  type: z.string(),
  rating: z.number().min(0).max(5),
  priceRange: z.string(),
  location: z.string(),
});

const zActivity = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  type: z.string(),
  duration: z.string(),
  price: z.number().nonnegative(),
  location: z.string(),
});

const zItineraryDay = z.object({
  id: z.string(),
  tripId: z.string(),
  day: z.number().int().positive(),
  title: z.string(),
  activities: z.array(z.string()).default([]),
});

const zTripData = z.object({
  id: z.string(),
  destination: z.string(),
  duration: z.string(),
  dates: z.string(),
  totalCost: z.number().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
  flightGroups: z.array(zFlightGroup).default([]),
  hotels: z.array(zHotel).default([]),
  restaurants: z.array(zRestaurant).default([]),
  activities: z.array(zActivity).default([]),
  itinerary: z.array(zItineraryDay).default([]),
});

type TripDataLike = z.infer<typeof zTripData>;


export const optimizePrompt = async (
  prompt: string,
  userLocation: string
): Promise<string> => {
  const { object: req } = await generateObject({
    model: models.worker,
    system:
      "You are a travel request normalizer. Extract structured fields from a user prompt.",
    schema: z.object({
      origin: z.string().optional(),
      destination: z.string().optional(),
      durationDays: z.number().int().positive().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budgetUsd: z.number().positive().optional(),
      travelers: z.number().int().positive().optional(),
      preferences: z.array(z.string()).optional().default([]),
      notes: z.string().optional().default(""),
    }),
    prompt: `User location: ${userLocation}\n\nUser request: ${prompt}\n\nExtract as many fields as possible from the request. If the user does not specify an origin, use the user's location. If dates are ranges (e.g., May 3-7), map them into startDate and endDate (ISO or human-readable).`,
  });

  const origin = req.origin && req.origin.trim().length > 0 ? req.origin : userLocation;
  const durationDays = req.durationDays ?? 5;
  function toISO(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
  let startDate = req.startDate;
  let endDate = req.endDate;
  if (!startDate || !endDate) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() + 30);
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);
    startDate = startDate ?? toISO(start);
    endDate = endDate ?? toISO(end);
  }
  const budgetUsd = req.budgetUsd ?? Math.max(1200, durationDays * 250);
  const travelers = req.travelers ?? 1;

  const normalized = `Plan a trip with these constraints:\n- origin: ${origin}\n- destination: ${req.destination ?? "best-fit for interests"}\n- dates: ${startDate} to ${endDate} (${durationDays} days)\n- budget: $${budgetUsd} total for ${travelers} traveler(s)\n- preferences: ${(req.preferences ?? []).join(", ") || "none"}\n- notes: ${req.notes || ""}`;
  return normalized;
}

export const planTrip = async (
  prompt: string,
  userLocation: string
): Promise<TripDataLike> => {
  try {
  const { object: plan } = await generateObject({
      model: models.planner,
      system:
        "You are a senior travel architect. Extract structured trip requirements.",
    schema: z.object({
      destination: z.string(),
      duration: z.string(),
      dates: z.string(),
        budget: z.number().optional(),
        preferences: z.array(z.string()).optional().default([]),
        notes: z.string().optional().default(""),
      }),
      prompt: `User location: ${userLocation}\n\nTrip request: ${prompt}\n\nReturn the best guess for destination, duration, and dates.`,
    });

    const tripId = generateId("trip");

    const [flightsRes, hotelsRes, restaurantsRes, activitiesRes, itineraryRes] =
      await Promise.all([
        generateObject({
          model: models.worker,
          system:
            "You are an expert flight planner producing realistic flight options and prices.",
          schema: z.object({ flights: z.array(zFlightGroup) }),
          prompt: `Plan flights for a trip from ${userLocation} to ${plan.destination} for ${plan.dates}. Include 1-2 flight groups (outbound/return), each with 1-2 flights. Use realistic times, airlines, and prices. Use tripId='${tripId}'. Ensure 'totalPrice' matches the sum of nested 'price' fields.`,
        }),
        generateObject({
          model: models.worker,
          system:
            "You are a hotel concierge generating great hotels with prices and amenities.",
          schema: z.object({ hotels: z.array(zHotel) }),
          prompt: `Suggest 1-2 hotels in ${plan.destination} aligned with preferences: ${(plan.preferences ?? []).join(", ")}. Nights should match ${plan.duration}. Use tripId='${tripId}'. Compute totalPrice = nights * pricePerNight.`,
        }),
        generateObject({
          model: models.worker,
          system:
            "You are a foodie guide recommending popular and authentic restaurants.",
          schema: z.object({ restaurants: z.array(zRestaurant) }),
          prompt: `Suggest 2-3 restaurants in ${plan.destination} with cuisine type, rating, and priceRange. Use tripId='${tripId}'.`,
        }),
        generateObject({
          model: models.worker,
          system:
            "You are a local guide proposing activities with durations and approximate prices.",
          schema: z.object({ activities: z.array(zActivity) }),
          prompt: `Suggest 3-5 activities in ${plan.destination} balanced across culture, sightseeing, and food. Use tripId='${tripId}'.`,
        }),
        generateObject({
          model: models.worker,
          system:
            "You are an itinerary planner organizing days with titles and activity names (strings).",
          schema: z.object({ itinerary: z.array(zItineraryDay) }),
          prompt: `Build a ${plan.duration} day-by-day itinerary for ${plan.destination} on ${plan.dates}. Titles should be concise, activities as string names. Use tripId='${tripId}'.`,
        }),
      ]);

    const flightGroups = flightsRes.object.flights.map((g) => ({
      ...g,
      totalPrice:
        g.totalPrice > 0
          ? g.totalPrice
          : g.flights.reduce((sum, f) => sum + (f.price ?? 0), 0),
    }));

    const hotels = hotelsRes.object.hotels.map((h) => ({
      ...h,
      totalPrice:
        h.totalPrice > 0 ? h.totalPrice : (h.nights ?? 0) * (h.pricePerNight ?? 0),
    }));

    const restaurants = restaurantsRes.object.restaurants;
    const activities = activitiesRes.object.activities;
    const itinerary = itineraryRes.object.itinerary;

    const totalCost =
      flightGroups.reduce((s, g) => s + (g.totalPrice ?? 0), 0) +
      hotels.reduce((s, h) => s + (h.totalPrice ?? 0), 0) +
      activities.reduce((s, a) => s + (a.price ?? 0), 0);

    const candidate: TripDataLike = {
      id: tripId,
      destination: plan.destination,
      duration: plan.duration,
      dates: plan.dates,
      totalCost,
      createdAt: new Date(),
      updatedAt: new Date(),
      flightGroups,
      hotels,
      restaurants,
      activities,
      itinerary,
    };

    const parsed = zTripData.safeParse(candidate);
    if (!parsed.success) {
      throw new Error("Failed to parse returned LLM data");
    }
    return parsed.data;
  } catch (_err) {
    throw new Error("Failed to generate trip data", { cause: _err });
  }
};

export type { TripDataLike };