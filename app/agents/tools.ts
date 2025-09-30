import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { Exa } from "exa-js";
import { zGoogleFlightsQueryParams } from "@/types/zod";
import queryString from "query-string";
import type { GoogleFlightsResponse } from "@/types/google-flights";
import mock from "./t.json";
import type { PlannerAgent } from "./plan";
import { zActivity, zFlight, zHotel, zItineraryDay, zRestaurant } from "@/types/zod";
import { generateId } from "@/lib/utils";

export const getTools = (env: Env) => {
  const webSearch = tool({
    name: "web_search",
    description: "Search the web for up-to-date information.",
    inputSchema: z.object({
      query: z.string().min(1).max(100).describe('The search query'),
    }),
    execute: async ({ query }) => {
      const exa = new Exa((env as Env).EXA_API_KEY);
      const { results } = await exa.searchAndContents(query, {
        summary: true,
        livecrawl: "preferred",
      })
      return results.map((result) => ({
        title: result.title,
        url: result.url,
        summary: result.summary,
        publishedDate: result.publishedDate,
        image: result.image,
      }))
    },
  });
  
  const readSite = tool({
    name: "read_site",
    description: "Read the full content of a URL",
    inputSchema: z.object({
      url: z.string().describe('The URL to read the content of'),
    }),
    execute: async ({ url }) => {
      const exa = new Exa((env as Env).EXA_API_KEY);
      const { results } = await exa.getContents(url, {
        livecrawl: "preferred",
      })
      return {
        url,
        text: results[0].text
      }
    },
  });

  const weather = tool({
    name: "weather",
    description: "Get current weather information for any location. Use this tool for all weather-related queries.",
    inputSchema: z.object({
      location: z.string().describe("The city or location to get weather for"),
    }),
    execute: async ({ location }) => {
      return "The weather in " + location + " is rainy";
    },
  });

  const searchFlights = tool({
    name: "search_flights",
    description: "Search for flights from Google Flights",
    inputSchema: zGoogleFlightsQueryParams,
    execute: async ({ departure_id, arrival_id, outbound_date, return_date, travel_class, adults, children, infant_on_lap, infant_in_seat, show_hidden, currency, language_code, country_code, search_type }) => {
      if (false) {
        return mock.itineraries;
      }
      const queryParams = queryString.stringify({
        departure_id,
        arrival_id,
        outbound_date,
        return_date,
        travel_class,
      });
      const url = `https://google-flights2.p.rapidapi.com/api/v1/searchFlights?${queryParams}`;
      try {
        const response = await fetch(url, {
          headers: {
            "X-RapidAPI-Key": (env as Env).RAPIDAPI_KEY,
            "X-RapidAPI-Host": "google-flights2.p.rapidapi.com",
          },
        });
        const data = await response.json() as GoogleFlightsResponse;
        console.dir(data);
        return data.data.itineraries; //data.data.itineraries.topFlights;
      } catch (error) {
        console.error(error);
        return { error: "Failed to search for flights" };
      }
    },
  });
  return {
    webSearch,
    weather,
    readSite,
    searchFlights,
  }
}

export const getPlannerTools = (agent: PlannerAgent): ToolSet => {
  return {
    getState: tool({
      name: "dev_getState",
      description: "[dev] Get the current state of the agent",
      inputSchema: z.object({}),
      execute: async () => {
        return agent.getState();
      }
    }),
    writeState: tool({
      name: "writeState",
      description: "Overwrite some keys of the current state",
      inputSchema: z.object({
        state: z.object({
          destination: z.string().optional(),
          duration: z.string().optional(),
        })
      }),
      execute: async ({ state }) => {
        agent.setState({ ...agent.getState(), ...state });
        return agent.getState();
      }
    }),
    writeMetadata: tool({
      name: "writeMetadata",
      description: "Overwrite the metadata of the trip",
      inputSchema: z.object({
        metadata: z.object({
          destination: z.string().optional().describe("The destination of the trip"),
          duration: z.string().optional().describe("The duration of the trip (e.g. 5 days, 4 nights)"),
          dates: z.string().optional().describe("The dates of the trip (e.g. Mar 15-20, 2024)"),
          estimatedMealsCost: z.number().optional().describe("The estimated cost of meals for the trip"),
        })
      }),
      execute: async ({ metadata }) => {
        const updates = Object.fromEntries(
          Object.entries(metadata).filter(([_, value]) => value !== undefined)
        );
        agent.setState({
          ...agent.getState(),
          ...updates
        });
        return { success: true };
      }
    }),
    getMetadata: tool({
      name: "getMetadata",
      description: "Get the metadata of the trip",
      inputSchema: z.object({}),
      execute: async () => {
        const state = agent.getState();
        return {
          destination: state.destination,
          duration: state.duration,
          dates: state.dates,
          estimatedMealsCost: state.estimatedMealsCost
        };
      }
    }),
    clearState: tool({
      name: "clearState",
      description: "Clear the current state of the agent",
      inputSchema: z.object({}),
      execute: async () => {
        agent.setState({});
      }
    }),
    listFlights: tool({
      name: "listFlights",
      description: "List all flight groups in the trip",
      inputSchema: z.object({}),
      execute: async () => {
        return agent.getState().flightGroups;
      }
    }),
    addFlight: tool({
      name: "addFlight",
      description: "Add a flight to the trip. Returns the updated/new flight group. Remember the ID",
      inputSchema: z.object({
        flight: zFlight.omit({ id: true, flightGroupId: true }),
        groupId: z.string().optional().describe("The ID of the flight group to add the flight to. Leave empty to create a new flight group."),
      }),
      execute: async ({ flight, groupId }) => {
        const newGroupId = groupId || generateId("flight_group");

        const state = agent.getState();
        const flightGroups = state.flightGroups || [];
        // Find or create flight group
        let flightGroup = flightGroups.find(g => g?.id === groupId);
        if (!flightGroup) {
          flightGroup = {
            id: newGroupId,
            tripId: agent.name,
            description: `Flight from ${flight.fromCity} to ${flight.toCity}`,
            totalPrice: flight.price,
            flights: []
          };
          flightGroups.push(flightGroup);
        }

        // Add flight to group
        const flights = flightGroup.flights || [];
        flights.push({
          ...flight,
          id: generateId("flight"),
          flightGroupId: flightGroup.id,
        });
        flightGroup.flights = flights;
        flightGroup.totalPrice = flights.reduce((sum, f) => sum + (f?.price ?? 0), 0);

        try {
          flightGroup = cleanFlightGroup(flightGroup);
        } catch (error) {
          console.error(error);
          return { error: "Invalid flight group", message: error as string };
        }

        agent.setState({
          ...state,
          flightGroups
        });

        return flightGroup;
      }
    }),
    removeFlight: tool({
      name: "removeFlight",
      description: "Remove a flight from the trip. If the last flight in a group is removed, the group will be removed as well.",
      inputSchema: z.object({
        flightId: z.string().describe("The ID of the flight to remove"),
      }),
      execute: async ({ flightId }) => {
        const state = agent.getState();
        let flightGroups = state.flightGroups || [];

        // Find the flight group that contains this flight
        const flightGroup = flightGroups.find(g =>
          g?.flights?.some(f => f?.id === flightId)
        );

        if (flightGroup) {
          // Remove the specific flight from this group
          flightGroup.flights = flightGroup.flights?.filter(f => f?.id !== flightId) || [];
          flightGroup.totalPrice = flightGroup.flights?.reduce((sum, f) => sum + (f?.price ?? 0), 0) || 0;
          if (flightGroup.flights?.length === 0) {
            flightGroups = flightGroups.filter(g => g?.id !== flightGroup.id);
            state.flightGroups = flightGroups;
          }
        }

        agent.setState({
          ...state,
          flightGroups
        });
        return { success: true };
      }
    }),
    listHotels: tool({
      name: "listHotels",
      description: "List all hotels in the trip",
      inputSchema: z.object({}),
      execute: async () => {
        return agent.getState().hotels;
      }
    }),
    addHotel: tool({
      name: "addHotel",
      description: "Add a hotel to the trip",
      inputSchema: z.object({
        hotel: zHotel.omit({ id: true }),
      }),
      execute: async ({ hotel }) => {
        const state = agent.getState();
        const hotels = state.hotels || [];
        const hotelWithId = {
          ...hotel,
          id: generateId("hotel")
        };
        hotels.push(hotelWithId);
        agent.setState({ ...state, hotels });
        return hotelWithId;
      }
    }),
    removeHotel: tool({
      name: "removeHotel",
      description: "Remove a hotel from the trip",
      inputSchema: z.object({
        hotelId: z.string().describe("The ID of the hotel to remove"),
      }),
      execute: async ({ hotelId }) => {
        const state = agent.getState();
        const hotels = state.hotels || [];
        const filteredHotels = hotels.filter(h => h?.id !== hotelId);
        agent.setState({
          ...state,
          hotels: filteredHotels
        });
        return { success: true };
      }
    }),
    listActivities: tool({
      name: "listActivities",
      description: "List all activities in the trip",
      inputSchema: z.object({}),
      execute: async () => {
        return agent.getState().activities;
      }
    }),
    addActivities: tool({
      name: "addActivities",
      description: "Add an activity to the trip",
      inputSchema: z.object({
        activities: z.array(zActivity.omit({ id: true })),
      }),
      execute: async ({ activities: newActivities }) => {
        const state = agent.getState();
        const existingActivities = state.activities || [];
        const activitiesWithIds = newActivities.map(activity => ({
          ...activity,
          id: generateId("activity")
        }));
        const updatedActivities = [...existingActivities, ...activitiesWithIds];
        agent.setState({ ...state, activities: updatedActivities });
        return activitiesWithIds;
      }
    }),
    removeActivity: tool({
      name: "removeActivity",
      description: "Remove an activity from the trip",
      inputSchema: z.object({
        activityId: z.string().describe("The ID of the activity to remove"),
      }),
      execute: async ({ activityId }) => {
        const state = agent.getState();
        const activities = state.activities || [];
        const filteredActivities = activities.filter(a => a?.id !== activityId);
        agent.setState({
          ...state,
          activities: filteredActivities
        });
        return { success: true };
      }
    }),
    listRestaurants: tool({
      name: "listRestaurants",
      description: "List all restaurants in the trip",
      inputSchema: z.object({}),
      execute: async () => {
        return agent.getState().restaurants;
      }
    }),
    addRestaurant: tool({
      name: "addRestaurant",
      description: "Add a restaurant to the trip",
      inputSchema: z.object({
        restaurant: zRestaurant.omit({ id: true }),
      }),
      execute: async ({ restaurant }) => {
        const state = agent.getState();
        const restaurants = state.restaurants || [];
        const restaurantWithId = {
          ...restaurant,
          id: generateId("restaurant")
        };
        restaurants.push(restaurantWithId);
        agent.setState({ ...state, restaurants });
        return restaurantWithId;
      }
    }),
    removeRestaurant: tool({
      name: "removeRestaurant",
      description: "Remove a restaurant from the trip",
      inputSchema: z.object({
        restaurantId: z.string().describe("The ID of the restaurant to remove"),
      }),
      execute: async ({ restaurantId }) => {
        const state = agent.getState();
        const restaurants = state.restaurants || [];
        const filteredRestaurants = restaurants.filter(r => r?.id !== restaurantId);
        agent.setState({
          ...state,
          restaurants: filteredRestaurants
        });
        return { success: true };
      }
    }),
    listItinerary: tool({
      name: "listItinerary",
      description: "List the itinerary of the trip",
      inputSchema: z.object({}),
      execute: async () => {
        return agent.getState().itinerary;
      }
    }),
    addItinerary: tool({
      name: "addItinerary",
      description: "Add an itinerary to the trip",
      inputSchema: z.object({
        itinerary: z.array(zItineraryDay.omit({ id: true })),
      }),
      execute: async (value) => {
        const state = agent.getState();
        const itineraryDays = state.itinerary || [];
        const itineraryDaysWithIds = value.itinerary.map(day => ({
          ...day,
          id: generateId("itinerary")
        }));
        itineraryDays.push(...itineraryDaysWithIds);
        agent.setState({ ...state, itinerary: itineraryDays });
        return itineraryDays;
      }
    }),
    removeItinerary: tool({
      name: "removeItinerary",
      description: "Remove an itinerary from the trip",
      inputSchema: z.object({
        itineraryId: z.string().describe("The ID of the itinerary to remove"),
      }),
      execute: async ({ itineraryId }) => {
        const state = agent.getState();
        const itinerary = state.itinerary || [];
        const filteredItinerary = itinerary.filter(i => i?.id !== itineraryId);
        agent.setState({
          ...state,
          itinerary: filteredItinerary
        });
        return { success: true };
      }
    }),
  };
};

// Helper function for cleaning flight groups (moved from plan.ts)
const cleanFlightGroup = (flightGroup: any): any => {
  if (flightGroup.flights?.length && flightGroup.flights?.length > 0) {
    // if there is a layover
    const flights = flightGroup.flights;
    if (flights.length > 1) {
      // check if the layover time is valid (time between flights)
      let layoverTime = 0;
      for (let i = 0; i < flights.length - 1; i++) {
        const flight = flights[i];
        const nextFlight = flights[i + 1];
        if (!flight || !nextFlight?.departureTime || !flight.arrivalTime) continue;
        const thisLayoverTime = new Date(nextFlight.departureTime).getTime() - new Date(flight.arrivalTime).getTime();
        if (thisLayoverTime < 0) {
          layoverTime = 0;
          console.error(`Invalid layover time for flight connection: ${flight.from} to ${nextFlight.to}`);
        } else {
          layoverTime += thisLayoverTime;
        }
      }
      flightGroup.layoverTime = `${Math.floor(layoverTime / (1000 * 60 * 60))}h ${Math.floor((layoverTime / (1000 * 60)) % 60)}m`;
      flightGroup.totalPrice = flights.reduce((sum: number, f: any) => sum + (f?.price ?? 0), 0);
    }
  }

  return flightGroup;
};