import React from "react"
import type { Route } from "./+types/results"
import { useSearchParams } from "react-router"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plane,
  Hotel,
  UtensilsCrossed,
  MapPin,
  Calendar,
  Clock,
  Star,
  DollarSign,
  Download,
  Share,
  Heart,
} from "lucide-react"
import { mockTripData } from "@/lib/mock"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Results" },
    { name: "description", content: "Results" },
  ];
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const tripId = params.tripId
  if (tripId === "trip_mock") {
    return {
      tripData: mockTripData,
    }
  }
  const tripData = await context.db.query.trips.findFirst({
    where: (trip, { eq }) => eq(trip.id, tripId),
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
  if (!tripData) {
    throw new Response(
      null,
      {
        status: 404,
        statusText: "Not Found",
      }
    )
  }
  return {
    tripData,
  }
}

export default function Results({ loaderData }: Route.ComponentProps): React.ReactElement {
  console.log(loaderData)
  const [searchParams] = useSearchParams()
  const prompt = searchParams.get("prompt") || "Plan a trip to Tokyo"

  const totalFlightCost = loaderData.tripData!.flightGroups.reduce((total, flight) => total + flight.totalPrice, 0) || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 bg-background/80 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">TravelAI</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Save Trip
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Trip Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Trip for:</span>
              <span className="italic">"{prompt}"</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{loaderData.tripData.destination}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {loaderData.tripData.dates}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {loaderData.tripData.duration}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Total: ${loaderData.tripData.totalCost.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Flights */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Plane className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Flights</h2>
                  <Badge variant="secondary">${totalFlightCost.toLocaleString()}</Badge>
                </div>

                <div className="space-y-8">
                  {loaderData.tripData.flightGroups.map((flightGroup, groupIndex) => (
                    <div key={groupIndex} className="relative">
                      {/* Flight Group Header */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg mb-1">{flightGroup.description}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Total: ${flightGroup.totalPrice}</span>
                          {flightGroup.layoverTime && <span>Layover: {flightGroup.layoverTime}</span>}
                        </div>
                      </div>

                      {/* Individual Flights */}
                      <div className="space-y-4">
                        {flightGroup.flights.map((flight, flightIndex) => (
                          <div key={flightIndex} className="relative">
                            {/* Connection line for multiple flights */}
                            {flightGroup.flights.length > 1 && flightIndex < flightGroup.flights.length - 1 && (
                              <div className="absolute left-6 top-full w-0.5 h-4 bg-gradient-to-b from-primary to-primary/20 z-10"></div>
                            )}

                            <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 rounded-xl p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Plane className={`w-5 h-5 text-primary ${groupIndex === 1 ? "rotate-180" : ""}`} />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-lg">{flight.airline}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {flightGroup.flights.length > 1
                                        ? `Segment ${flightIndex + 1}`
                                        : groupIndex === 0
                                          ? "Outbound Flight"
                                          : "Return Flight"}{" "}
                                      • {flight.class}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">${flight.price}</p>
                                  <p className="text-xs text-muted-foreground">per person</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 items-center">
                                <div className="text-center">
                                  <p className="text-2xl font-bold">{flight.from}</p>
                                  <p className="text-sm text-muted-foreground">{flight.fromCity}</p>
                                  <p className="text-lg font-semibold mt-1">{flight.departureTime}</p>
                                  <p className="text-xs text-muted-foreground">{flight.date}</p>
                                </div>

                                <div className="text-center relative">
                                  <div className="flex items-center justify-center mb-2">
                                    <div className="w-full h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
                                    <Plane
                                      className={`w-10 h-10 text-primary mx-2 ${groupIndex === 1 ? "-rotate-90" : "rotate-90"}`}
                                    />
                                    <div className="w-full h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
                                  </div>
                                  <p className="text-sm font-medium text-primary">{flight.duration}</p>
                                  <p className="text-xs text-muted-foreground">Non-stop</p>
                                </div>

                                <div className="text-center">
                                  <p className="text-2xl font-bold">{flight.to}</p>
                                  <p className="text-sm text-muted-foreground">{flight.toCity}</p>
                                  <p className="text-lg font-semibold mt-1">{flight.arrivalTime}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {flight.arrivalDate || flight.date}
                                    {flight.arrivalTime.includes("+1") && <span className="text-primary ml-1">+1</span>}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary/10">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>✈️ {flight.aircraft}</span>
                                  {flight.carryOn && <span>🎒 {flight.carryOn} Carry-on{flight.carryOn > 1 ? "s" : ""} included</span>}
                                  {flight.checkedBags && <span>👜 {flight.checkedBags} Checked bag{flight.checkedBags > 1 ? "s" : ""} included</span>}
                                  {flight.mealIncluded && <span>🍽️ Meal included</span>}
                                </div>
                                {flight.seat && <Badge variant="outline" className="text-xs">
                                  Seat {flight.seat}
                                </Badge>}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Layover Information */}
                        {flightGroup.layoverTime && flightGroup.flights.length > 1 && (
                          <div className="flex items-center justify-center py-2">
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-orange-500">
                                Layover in {flightGroup.flights[0].to}: {flightGroup.layoverTime}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Flight Summary */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">
                          Total Flight Time:{" "}
                          {Math.floor(loaderData.tripData.flightGroups.reduce((total, group) => {
                            const totalMinutes = group.flights.reduce((mins, flight) => {
                              const [hours, minutes] = flight.duration.replace(/[hm]/g, "").split(" ").map(Number)
                              return mins + hours * 60 + (minutes || 0)
                            }, 0)
                            return total + totalMinutes
                          }, 0) / 60)}
                          h{" "}
                          {Math.round(loaderData.tripData.flightGroups.reduce((total, group) => {
                            const totalMinutes = group.flights.reduce((mins, flight) => {
                              const [hours, minutes] = flight.duration.replace(/[hm]/g, "").split(" ").map(Number)
                              return mins + hours * 60 + (minutes || 0)
                            }, 0)
                            return total + totalMinutes
                          }, 0) % 60)}
                          m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Hotels */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Hotel className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Accommodation</h2>
                  <Badge variant="secondary">${loaderData.tripData.hotels.reduce((total, hotel) => total + hotel.totalPrice, 0).toLocaleString()}</Badge>
                </div>

                <div className="space-y-4">
                  {loaderData.tripData.hotels.map((hotel, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{hotel.name}</h3>
                          <p className="text-sm text-muted-foreground">{hotel.location}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{hotel.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${hotel.pricePerNight}/night</p>
                          <p className="text-xs text-muted-foreground">{hotel.nights} nights</p>
                          <p className="text-xs font-medium">${hotel.totalPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hotel.amenities.map((amenity: string, amenityIndex: number) => (
                          <Badge key={amenityIndex} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        )) || null}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Restaurants */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Dining</h2>
                </div>

                <div className="space-y-4">
                  {loaderData.tripData.restaurants.map((restaurant, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h3 className="font-medium">{restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.type} • {restaurant.location}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{restaurant.rating}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{restaurant.priceRange}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Activities */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Activities</h2>
                </div>

                <div className="space-y-4">
                  {loaderData.tripData.activities.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h3 className="font-medium">{activity.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activity.type} • {activity.location}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Duration: {activity.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{activity.price === 0 ? "Free" : `$${activity.price}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Flights</span>
                    <span className="text-sm font-medium">${totalFlightCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Hotels</span>
                    <span className="text-sm font-medium">${loaderData.tripData.hotels.reduce((total, hotel) => total + hotel.totalPrice, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Activities</span>
                    <span className="text-sm font-medium">$110</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Meals (estimated)</span>
                    <span className="text-sm font-medium">$400</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${loaderData.tripData.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              {/* Daily Itinerary */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Daily Itinerary</h3>
                <div className="space-y-4">
                  {loaderData.tripData.itinerary.map((day, index) => (
                    <div key={index} className="border-l-2 border-primary/20 pl-4">
                      <h4 className="font-medium text-sm">Day {day.day}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{day.title}</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {day.activities.map((activity: string, actIndex: number) => (
                          <li key={actIndex}>• {activity}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
