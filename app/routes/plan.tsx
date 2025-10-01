import React, { useState } from "react"
import type { Route } from "./+types/plan"
import { Button } from "@/components/ui/button"
import { Plane, Share, Heart, Check } from "lucide-react"
import type { DeepPartial } from "ai"
import type { TripData } from "@/types"
import { ChatSidebar } from "@/components/chat-sidebar"
import { Trip } from "@/components/trip"
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
          <Trip tripData={tripData} />
        </div>
      </div>
    </div>
  )
}