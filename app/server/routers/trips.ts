import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { savedTrips, agents, trips, flightGroups, flights, hotels, activities, itineraryDays, restaurants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { zTripData } from "@/types/zod";
import { TRPCError } from "@trpc/server";

export const tripsRouter = router({
  getFavouriteTrips: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0),
  })).query(async ({ input, ctx }) => {
    const { limit, offset } = input;
    const [saved, totalCountRows] = await Promise.all([
      ctx.db.select().from(savedTrips).where(eq(savedTrips.userId, ctx.session.user.id)).limit(limit).offset(offset),
      ctx.db.select({ count: savedTrips.id }).from(savedTrips).where(eq(savedTrips.userId, ctx.session.user.id))
    ]);
    const totalCount = totalCountRows.length;
    const hasMore = offset + limit < totalCount;
    return {
      savedTrips: saved,
      totalCount,
      hasMore,
    };
  }),

  favouriteTrip: protectedProcedure.input(z.object({
    tripId: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const { tripId } = input;
    await ctx.db.insert(savedTrips).values({
      id: generateId("st"),
      userId: ctx.session.user.id,
      tripId,
    });
  }),

  saveTrip: protectedProcedure.input(
    z.object({
      tripId: z.string().optional(),
      tripData: zTripData.omit({ id: true, createdById: true, createdAt: true, updatedAt: true }),
      isPublic: z.boolean().optional().default(false),
    })
  ).mutation(async ({ input, ctx }) => {
    const { tripId, tripData, isPublic } = input;
    
    if (tripId) { // existing, overwrite
      const existing = await ctx.db.select().from(trips).where(eq(trips.id, tripId));
      if (existing) {
        const existingTripData = existing[0];
        if (existingTripData.createdById !== ctx.session.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not allowed to overwrite this trip" });
        }
        await ctx.db.delete(trips).where(eq(trips.id, tripId));
      }      
    }
    
    const newTripId = tripId || generateId("trip");
    
    await ctx.db.insert(trips).values({
      id: newTripId,
      createdById: ctx.session.user.id,
      destination: tripData.destination,
      duration: tripData.duration,
      dates: tripData.dates,
      estimatedMealsCost: tripData.estimatedMealsCost,
      isPublic,
    });
    
    for (const flightGroup of tripData.flightGroups) {
      const flightGroupId = generateId("flight_group");
      await ctx.db.insert(flightGroups).values({
        id: flightGroupId,
        tripId: newTripId,
        description: flightGroup.description,
        totalPrice: flightGroup.totalPrice,
        layoverTime: flightGroup.layoverTime,
        url: flightGroup.url,
      });
      
      for (const flight of flightGroup.flights) {
        await ctx.db.insert(flights).values({
          id: generateId("flight"),
          flightGroupId,
          airline: flight.airline,
          class: flight.class,
          carryOn: flight.carryOn,
          checkedBags: flight.checkedBags,
          mealIncluded: flight.mealIncluded,
          from: flight.from,
          fromAirportCode: flight.fromAirportCode,
          fromCity: flight.fromCity,
          to: flight.to,
          toAirportCode: flight.toAirportCode,
          toCity: flight.toCity,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          date: flight.date,
          arrivalDate: flight.arrivalDate,
          duration: flight.duration,
          aircraft: flight.aircraft,
          seat: flight.seat,
          price: flight.price,
          url: flight.url,
        });
      }
    }
    
    for (const hotel of tripData.hotels) {
      await ctx.db.insert(hotels).values({
        id: generateId("hotel"),
        tripId: newTripId,
        name: hotel.name,
        location: hotel.location,
        rating: hotel.rating,
        nights: hotel.nights,
        pricePerNight: hotel.pricePerNight,
        totalPrice: hotel.totalPrice,
        amenities: hotel.amenities,
      });
    }
    
    for (const activity of tripData.activities) {
      await ctx.db.insert(activities).values({
        id: generateId("activity"),
        tripId: newTripId,
        name: activity.name,
        type: activity.type,
        duration: activity.duration,
        price: activity.price,
        location: activity.location,
      });
    }
    
    // Insert itinerary days
    for (const day of tripData.itineraryDays) {
      await ctx.db.insert(itineraryDays).values({
        id: generateId("itinerary_day"),
        tripId: newTripId,
        day: day.day,
        title: day.title,
        activities: day.activities,
      });
    }
    
    // Insert restaurants
    for (const restaurant of tripData.restaurants) {
      await ctx.db.insert(restaurants).values({
        id: generateId("restaurant"),
        tripId: newTripId,
        name: restaurant.name,
        type: restaurant.type,
        rating: restaurant.rating,
        priceRange: restaurant.priceRange,
        location: restaurant.location,
      });
    }
    
    return { tripId: newTripId };
  }),

  getAgents: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0),
  })).query(async ({ input, ctx }) => {
    const { limit, offset } = input;
    
    const userAgents = await ctx.db
      .select()
      .from(agents)
      .where(eq(agents.ownerId, ctx.session.user.id))
      .orderBy(desc(agents.createdAt))
      .limit(limit)
      .offset(offset);
    
    const totalCount = await ctx.db
      .select({ count: agents.id })
      .from(agents)
      .where(eq(agents.ownerId, ctx.session.user.id))
      .then(rows => rows.length);
    
    return {
      agents: userAgents,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }),

  shareAgentTrip: protectedProcedure.input(z.object({
    agentId: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const { agentId } = input;
    
    // Verify the agent belongs to the user
    const dbAgent = await ctx.db.select().from(agents).where(eq(agents.id, agentId)).get();
    if (!dbAgent || dbAgent.ownerId !== ctx.session.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this agent" });
    }
    
    // Get the agent state from the Durable Object
    const { getAgentByName } = await import("agents");
    const agent = await getAgentByName(ctx.env.PlannerAgent, agentId);
    
    if (!agent) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
    }
    
    const tripData = agent.getState() as any;
    
    // Validate that the trip has the required data
    if (!tripData.destination || !tripData.duration || !tripData.dates) {
      throw new TRPCError({ 
        code: "BAD_REQUEST", 
        message: "Trip data is incomplete. Please complete the trip planning first." 
      });
    }
    
    const newTripId = generateId("trip");
    
    // Save the trip with isPublic: true
    await ctx.db.insert(trips).values({
      id: newTripId,
      createdById: ctx.session.user.id,
      destination: tripData.destination,
      duration: tripData.duration,
      dates: tripData.dates,
      estimatedMealsCost: tripData.estimatedMealsCost || 0,
      isPublic: true,
    });
    
    // Save flight groups and flights
    if (tripData.flightGroups) {
      for (const flightGroup of tripData.flightGroups) {
        const flightGroupId = generateId("flight_group");
        await ctx.db.insert(flightGroups).values({
          id: flightGroupId,
          tripId: newTripId,
          description: flightGroup.description,
          totalPrice: flightGroup.totalPrice,
          layoverTime: flightGroup.layoverTime,
          url: flightGroup.url,
        });
        
        if (flightGroup.flights) {
          for (const flight of flightGroup.flights) {
            await ctx.db.insert(flights).values({
              id: generateId("flight"),
              flightGroupId,
              airline: flight.airline,
              class: flight.class,
              carryOn: flight.carryOn,
              checkedBags: flight.checkedBags,
              mealIncluded: flight.mealIncluded,
              from: flight.from,
              fromAirportCode: flight.fromAirportCode,
              fromCity: flight.fromCity,
              to: flight.to,
              toAirportCode: flight.toAirportCode,
              toCity: flight.toCity,
              departureTime: flight.departureTime,
              arrivalTime: flight.arrivalTime,
              date: flight.date,
              arrivalDate: flight.arrivalDate,
              duration: flight.duration,
              aircraft: flight.aircraft,
              seat: flight.seat,
              price: flight.price,
              url: flight.url,
            });
          }
        }
      }
    }
    
    // Save hotels
    if (tripData.hotels) {
      for (const hotel of tripData.hotels) {
        await ctx.db.insert(hotels).values({
          id: generateId("hotel"),
          tripId: newTripId,
          name: hotel.name,
          location: hotel.location,
          rating: hotel.rating,
          nights: hotel.nights,
          pricePerNight: hotel.pricePerNight,
          totalPrice: hotel.totalPrice,
          amenities: hotel.amenities,
        });
      }
    }
    
    // Save activities
    if (tripData.activities) {
      for (const activity of tripData.activities) {
        await ctx.db.insert(activities).values({
          id: generateId("activity"),
          tripId: newTripId,
          name: activity.name,
          type: activity.type,
          duration: activity.duration,
          price: activity.price,
          location: activity.location,
        });
      }
    }
    
    // Save itinerary days
    if (tripData.itineraryDays) {
      for (const day of tripData.itineraryDays) {
        await ctx.db.insert(itineraryDays).values({
          id: generateId("itinerary_day"),
          tripId: newTripId,
          day: day.day,
          title: day.title,
          activities: day.activities,
        });
      }
    }
    
    // Save restaurants
    if (tripData.restaurants) {
      for (const restaurant of tripData.restaurants) {
        await ctx.db.insert(restaurants).values({
          id: generateId("restaurant"),
          tripId: newTripId,
          name: restaurant.name,
          type: restaurant.type,
          rating: restaurant.rating,
          priceRange: restaurant.priceRange,
          location: restaurant.location,
        });
      }
    }
    
    return { tripId: newTripId };
  }),
});