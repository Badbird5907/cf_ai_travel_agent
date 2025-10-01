import React, { useState, useMemo } from "react"
import type { Route } from "./+types/plan"
import { Button } from "@/components/ui/button"
import { Plane, Share, Heart, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { UtensilsCrossed } from "lucide-react"
import { MapPin } from "lucide-react"
import { Calendar } from "lucide-react"
import { Clock } from "lucide-react"
import { DollarSign } from "lucide-react"
import { CostBreakdown } from "@/components/cost-breakdown"
import { capitalize } from "@/lib/utils"
import { Hotel } from "lucide-react"
import type { DeepPartial } from "ai"
import type { TripData } from "@/types"
import { ChatSidebar } from "@/components/chat-sidebar"
import { getAgentByName } from "agents"
import { useAgent } from "agents/react"
import { agents } from "@/db/schema"
import { eq } from "drizzle-orm"
import { useMutation } from "@tanstack/react-query"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Plan" },
    { name: "description", content: "Plan" },
  ];
}

export type AgentState = DeepPartial<TripData>
export async function loader({ context, params, request }: Route.LoaderArgs) {
  const agentName = params.agentId

  // First check if the agent exists in the database
  const dbAgent = await context.db.select().from(agents).where(eq(agents.id, agentName)).get()

  if (!dbAgent) {
    throw new Response("Agent not found", { status: 404 })
  }

  // Get the Durable Object agent
  const agent = await getAgentByName(context.cloudflare.env.PlannerAgent, agentName)
  agent.setName(agentName)

  if (!agent) {
    throw new Response("Agent not found", { status: 404 })
  }

  const tripData = agent.getState() as AgentState

  return {
    agentId: agentName,
    tripData,
    initialPrompt: !dbAgent.initialPromptUsed ? dbAgent.prompt : undefined, // Only pass prompt if not used yet
  }
}

export async function clientLoader({ params, serverLoader }: Route.ClientLoaderArgs) {
  const serverData = await serverLoader()
  return {
    ...serverData
  }
}


export default function Plan({ loaderData }: Route.ComponentProps): React.ReactElement {
  const [tripData, setTripData] = useState<AgentState>(loaderData.tripData)
  const [linkCopied, setLinkCopied] = useState(false)
  const costs = useMemo(() => {
    const hotelsTotal = tripData?.hotels?.reduce((total, hotel) => total + (hotel?.totalPrice ?? 0), 0) ?? 0
    const activitiesTotal = tripData?.activities?.reduce((total, activity) => total + (activity?.price ?? 0), 0) ?? 0
    const mealsTotal = tripData?.estimatedMealsCost ?? 0
    const flightCost = tripData?.flightGroups?.reduce((total, flight) => total + (flight?.totalPrice ?? 0), 0) || 0
    const total = hotelsTotal + activitiesTotal + mealsTotal + flightCost

    return {
      hotelsTotal,
      activitiesTotal,
      mealsTotal,
      flightCost,
      total
    }
  }, [tripData])

  useAgent({
    agent: "PlannerAgent",
    name: loaderData.agentId,
    onStateUpdate: (state: AgentState) => { // subscribe to state updates
      console.log("state change", { state })
      setTripData(state)
    }
  })

  const shareAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await fetch("/api/trpc/trips.shareAgentTrip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        const error = await response.json() as { error?: { message?: string } };
        throw new Error(error.error?.message || "Failed to share trip");
      }

      const result = await response.json() as { result: { data: { tripId: string } } };
      return result.result.data;
    },
    onSuccess: (data) => {
      const tripUrl = `${window.location.origin}/trip/${data.tripId}`;
      navigator.clipboard.writeText(tripUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleShare = () => {
    shareAgentMutation.mutate(loaderData.agentId);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            {/* <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
                disabled={shareAgentMutation.isPending}
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Share className="w-4 h-4 mr-2" />
                )}
                {linkCopied ? "Copied!" : "Share"}
              </Button>
              <Button size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Save Trip
              </Button>
            </div> */}
          </div>
        </div>
      </header>
      <div className="flex-1 flex">
        <div className="w-1/3 min-w-[400px] max-w-[500px] h-[calc(100vh-73px)] sticky top-[73px]">
          <ChatSidebar agentId={loaderData.agentId} initialPrompt={loaderData.initialPrompt} />
        </div>

        <div className="flex-1">
          <div className="px-6 py-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {/* Trip Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">{tripData?.destination}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {tripData?.dates && <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {tripData?.dates}
                  </div>}
                  {tripData?.duration && <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {tripData?.duration}
                  </div>}
                  {costs.total > 0 && <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Total: ${costs.total.toLocaleString() ?? '0'}
                  </div>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Flights */}
                  {tripData?.flightGroups && tripData?.flightGroups.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center gap-2">
                        <Plane className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">Flights</h2>
                        <Badge variant="secondary">${costs.flightCost.toLocaleString()}</Badge>
                      </div>

                      <div className="space-y-8">
                        {tripData?.flightGroups?.map((flightGroup, groupIndex) => (
                          <div key={groupIndex} className="relative">
                            {/* Flight Group Header */}
                            <div className="mb-4">
                              <h3 className="font-semibold text-lg mb-1">{flightGroup?.description}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Total: ${flightGroup?.totalPrice}</span>
                                {flightGroup?.layoverTime && <span>Layover: {flightGroup.layoverTime}</span>}
                              </div>
                            </div>

                            {/* Individual Flights */}
                            <div className="space-y-4">
                              {flightGroup?.flights?.map((flight, flightIndex) => (
                                <div key={flightIndex} className="relative">
                                  {/* Connection line for multiple flights */}
                                  {flightGroup?.flights && flightGroup.flights.length > 1 && flightIndex < flightGroup.flights.length - 1 && (
                                    <div className="absolute left-6 top-full w-0.5 h-4 bg-gradient-to-b from-primary to-primary/20 z-10"></div>
                                  )}

                                  <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                          <Plane className={`w-5 h-5 text-primary ${groupIndex === 1 ? "rotate-180" : ""}`} />
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-lg">{flight?.airline}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {flightGroup?.flights && flightGroup.flights.length > 1
                                              ? `Segment ${flightIndex + 1}`
                                              : groupIndex === 0
                                                ? "Outbound Flight"
                                                : "Return Flight"}{" "}
                                            {"• " + capitalize(flight?.class?.replace("_", " ") ?? "")}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">${flight?.price}</p>
                                        <p className="text-xs text-muted-foreground">per person</p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                      <div className="text-center">
                                        <p className="text-2xl font-bold">{flight?.fromAirportCode}</p>
                                        <p className="text-sm text-muted-foreground">{flight?.fromCity}</p>
                                        <p className="text-lg font-semibold mt-1">{flight?.departureTime && new Date(flight.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                        <p className="text-xs text-muted-foreground">{flight?.date}</p>
                                      </div>

                                      <div className="text-center relative">
                                        <div className="flex items-center justify-center mb-2">
                                          <div className="w-full h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
                                          <Plane
                                            className={`w-10 h-10 text-primary mx-2 ${groupIndex === 1 ? "-rotate-90" : "rotate-90"}`}
                                          />
                                          <div className="w-full h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
                                        </div>
                                        <p className="text-sm font-medium text-primary">{flight?.duration}</p>
                                        <p className="text-xs text-muted-foreground">{flightGroup?.flights && flightGroup.flights.length === 1 ? "Non-stop" : "Stopover"}</p>
                                      </div>

                                      <div className="text-center">
                                        <p className="text-2xl font-bold">{flight?.toAirportCode}</p>
                                        <p className="text-sm text-muted-foreground">{flight?.toCity}</p>
                                        <p className="text-lg font-semibold mt-1">{flight?.arrivalTime && new Date(flight.arrivalTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {flight?.arrivalDate || flight?.date}
                                          {flight?.arrivalTime?.includes("+1") && <span className="text-primary ml-1">+1</span>}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary/10">
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>✈️ {flight?.aircraft}</span>
                                        {flight?.carryOn && flight?.carryOn > 0 ? <span>🎒 {flight.carryOn} Carry-on{flight.carryOn > 1 ? "s" : ""} included</span> : null}
                                        {flight?.checkedBags && flight?.checkedBags > 0 ? <span>👜 {flight.checkedBags} Checked bag{flight.checkedBags > 1 ? "s" : ""} included</span> : null}
                                        {flight?.mealIncluded && <span>🍽️ Meal included</span>}
                                      </div>
                                      {flight?.seat && <Badge variant="outline" className="text-xs">
                                        {flight.seat}
                                      </Badge>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Layover Information */}
                            {flightGroup?.layoverTime && flightGroup?.flights && flightGroup.flights.length > 1 && (
                              <div className="flex items-center justify-center py-2">
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-orange-500" />
                                  <span className="text-sm font-medium text-orange-500">
                                    Layover in {flightGroup.flights[0]?.to}: {flightGroup.layoverTime}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Flight Summary */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium">
                                Total Flight Time:{" "}
                                {Math.floor((tripData?.flightGroups?.reduce((total, group) => {
                                  const totalMinutes = group?.flights?.reduce((mins, flight) => {
                                    const duration = flight?.duration
                                    if (!duration) return mins
                                    const [hours, minutes] = duration.replace(/[hm]/g, "").split(" ").map(Number)
                                    return mins + hours * 60 + (minutes || 0)
                                  }, 0) || 0
                                  return total + totalMinutes
                                }, 0) || 0) / 60)}
                                h{" "}
                                {Math.round((tripData?.flightGroups?.reduce((total, group) => {
                                  const totalMinutes = group?.flights?.reduce((mins, flight) => {
                                    const duration = flight?.duration
                                    if (!duration) return mins
                                    const [hours, minutes] = duration.replace(/[hm]/g, "").split(" ").map(Number)
                                    return mins + hours * 60 + (minutes || 0)
                                  }, 0) || 0
                                  return total + totalMinutes
                                }, 0) || 0) % 60)}
                                m
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                  )}
                  {/* Hotels */}
                  {tripData?.hotels && tripData?.hotels.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center gap-2">
                        <Hotel className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">Accommodation</h2>
                        <Badge variant="secondary">${tripData?.hotels?.reduce((total, hotel) => total + (hotel?.totalPrice ?? 0), 0).toLocaleString() ?? '0'}</Badge>
                      </div>

                      <div className="space-y-4">
                        {tripData?.hotels?.map((hotel, index) => (
                          <div key={index} className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium">{hotel?.name}</h3>
                                <p className="text-sm text-muted-foreground">{hotel?.location}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs">{hotel?.rating}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${hotel?.pricePerNight}/night</p>
                                <p className="text-xs text-muted-foreground">{hotel?.nights} nights</p>
                                <p className="text-xs font-medium">${hotel?.totalPrice?.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2">
                              {hotel?.amenities?.filter((amenity): amenity is string => amenity != null).map((amenity: string, amenityIndex: number) => (
                                <Badge key={amenityIndex} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              )) || null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Restaurants */}
                  {tripData?.restaurants && tripData?.restaurants.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">Dining</h2>
                      </div>

                      <div className="space-y-4">
                        {tripData?.restaurants?.map((restaurant, index) => (
                          <div key={index} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                            <div>
                              <h3 className="font-medium">{restaurant?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {restaurant?.type} • {restaurant?.location}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{restaurant?.rating}</span>
                              </div>
                            </div>
                            <Badge variant="outline">{restaurant?.priceRange}</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Activities */}
                  {tripData?.activities && tripData?.activities.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">Activities</h2>
                      </div>

                      <div className="space-y-4">
                        {tripData?.activities?.map((activity, index) => (
                          <div key={index} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                            <div>
                              <h3 className="font-medium">{activity?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {activity?.type} • {activity?.location}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">Duration: {activity?.duration}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{activity?.price === 0 ? "Free" : `$${activity?.price}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Cost Breakdown */}
                  {costs.total > 0 && <CostBreakdown {...costs} />}

                  {/* Daily Itinerary */}
                  {tripData?.itinerary && tripData?.itinerary.length > 0 && (
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4">Daily Itinerary</h3>
                      <div className="space-y-4">
                        {tripData?.itinerary?.map((day, index) => (
                          <div key={index} className="border-l-2 border-primary/20 pl-4">
                            <h4 className="font-medium text-sm">Day {day?.day}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{day?.title}</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {day?.activities?.filter((activity): activity is string => activity != null).map((activity: string, actIndex: number) => (
                                <li key={actIndex}>• {activity}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}