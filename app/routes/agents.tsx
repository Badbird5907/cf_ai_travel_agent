import type { Route } from "./+types/agents";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ArrowRight, Home } from "lucide-react";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Link } from "react-router";
import { SignInRequired } from "@/components/sign-in-required";


export default function Agents() {
  const [page, setPage] = useState(0);
  const limit = 10;
  const trpc = useTRPC();
  const { data: session } = useSession();

  const { data, isLoading, error } = useQuery({
    ...trpc.trips.getAgents.queryOptions({
      limit,
      offset: page * limit,
    }),
    enabled: !!session,
  });

  if (!session) {
    return <SignInRequired message="Please sign in to view your agents" />;
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">TravelAI</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Travel Agents</h1>
            <p className="text-muted-foreground">
              View all your AI-powered travel planning sessions
            </p>
          </div>

          {/* Agents List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <p className="text-destructive">Error loading agents</p>
            </Card>
          ) : !data?.agents || data.agents.length === 0 ? (
            <Card className="p-12 text-center">
              <h2 className="text-2xl font-semibold mb-4">No agents yet</h2>
              <p className="text-muted-foreground mb-6">
                Start planning your first trip to create an agent
              </p>
              <Button asChild>
                <Link to="/">
                  <Plane className="w-4 h-4 mr-2" />
                  Plan a Trip
                </Link>
              </Button>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {data.agents.map((agent) => (
                  <Card
                    key={agent.id}
                    className="p-6 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      window.location.href = `/plan/${agent.id}`;
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant={
                              agent.status === "active"
                                ? "default"
                                : agent.status === "completed"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {agent.status}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {new Date(agent.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <p className="text-base text-foreground line-clamp-2">
                          {agent.prompt}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8">
                <p className="text-sm text-muted-foreground">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.totalCount)} of{" "}
                  {data.totalCount} agents
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

