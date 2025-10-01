import React from "react"
import type { Route } from "./+types/$id"
import { Button } from "@/components/ui/button"
import { Plane, ArrowLeft } from "lucide-react"
import { Trip } from "@/components/trip"
import { trips, savedTrips } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { Link } from "react-router"

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.trip?.destination ? `${data.trip.destination} Trip` : "Trip" },
    { name: "description", content: "View trip details" },
  ]
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const tripId = params.id

  // Query the trip with all relations using Drizzle query API
  const trip = await context.db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      flightGroups: {
        with: {
          flights: true,
        },
      },
      hotels: true,
      restaurants: true,
      activities: true,
      itinerary: true,
    },
  })

  if (!trip) {
    throw new Response("Trip not found", { status: 404 })
  }

  // Check if trip is public
  if (!trip.isPublic) {
    // Trip is private, check authentication
    const session = await context.auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      throw new Response("Unauthorized - This trip is private", { status: 401 })
    }

    // Check if user is the creator or has saved this trip
    const isCreator = trip.createdById === session.user.id
    
    if (!isCreator) {
      const savedTrip = await context.db.select().from(savedTrips).where(
        and(
          eq(savedTrips.userId, session.user.id),
          eq(savedTrips.tripId, tripId)
        )
      ).get()

      if (!savedTrip) {
        throw new Response("Forbidden - You don't have access to this trip", { status: 403 })
      }
    }
  }

  return {
    trip,
  }
}

export default function TripView({ loaderData }: Route.ComponentProps): React.ReactElement {
  const { trip } = loaderData

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 bg-background/80 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">TravelAI</span>
              </div>
            </div>
            <div className="flex items-center gap-3"></div>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Trip tripData={trip} />
      </div>
    </div>
  )
}

