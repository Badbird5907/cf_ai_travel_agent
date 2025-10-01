import type { Route } from "./+types/home";
import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plane, MapPin, Sparkles, ArrowRight, Github, List } from "lucide-react"
import { useTRPC } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {};
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [prompt, setPrompt] = useState("")
  const trpc = useTRPC()
  const mutation = useMutation(trpc.plan.beginPlanning.mutationOptions())
  const [isStarting, setIsStarting] = useState(false)
  const [showSignInDialog, setShowSignInDialog] = useState(false)
  const { data: session } = useSession()

  // Restore prompt from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('pending-prompt')
    if (savedPrompt) {
      setPrompt(savedPrompt)
      localStorage.removeItem('pending-prompt')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    // Check if user is signed in
    if (!session) {
      setShowSignInDialog(true)
      return
    }

    setIsStarting(true)
    mutation.mutate({ prompt }, {
      onSuccess: (data: any) => {
        window.location.href = `/plan/${data.agentId}`
      }
    })
  }

  const handleSignIn = async () => {
    // Save prompt to localStorage before redirecting
    localStorage.setItem('pending-prompt', prompt)
    await signIn.social({
      provider: "github",
      callbackURL: "/",
    })
  }

  const examplePrompts = [
    "Plan me a 5-day trip to Tokyo with cultural experiences",
    "Weekend getaway to San Francisco for food lovers",
    "Family vacation to Orlando with theme parks",
    "Romantic trip to Paris for our anniversary",
  ]

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
            <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              {session && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/agents">
                    <List className="w-4 h-4 mr-2" />
                    My Agents
                  </Link>
                </Button>
              )}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {session.user.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      signOut()
                    }}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" onClick={() => {
                  window.location.href = "/auth/signin"
                }}>
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm mb-6 animate-pulse-slow">
              <Sparkles className="w-4 h-4" />
              AI-Powered Travel Planning
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
              Plan your perfect trip with{" "}
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                AI precision
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 text-pretty max-w-2xl mx-auto">
              Describe your dream vacation and watch our AI agent craft a personalized itinerary with flights, hotels,
              restaurants, and activities—all in seconds.
            </p>
          </div>

          {/* Input Section */}
          <div className="mb-16">
            <Card className="p-8 max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border/50">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your ideal trip... (e.g., 'Plan me a 5-day trip to Tokyo')"
                    className="text-lg py-6 px-6 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    disabled={isStarting}
                  />
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg py-6 bg-primary hover:bg-primary/90 transition-all duration-300"
                  disabled={!prompt.trim() || isStarting}
                >
                  {isStarting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Starting your journey...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Plan My Trip
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Example Prompts */}
          <div className="mb-16">
            <h3 className="text-lg font-medium mb-6 text-muted-foreground">Try these examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="p-4 hover:cursor-pointer text-left bg-secondary/50 hover:bg-secondary/70 rounded-lg border border-border/50 hover:border-border transition-all duration-200 text-sm"
                  disabled={isStarting}
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float">
                <Plane className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Flight Search</h3>
              <p className="text-sm text-muted-foreground">Find the best flights with optimal timing and pricing</p>
            </div>

            <div className="text-center p-6">
              <div
                className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float"
                style={{ animationDelay: "2s" }}
              >
                <MapPin className="w-6 h-6 text-chart-2" />
              </div>
              <h3 className="font-semibold mb-2">Local Recommendations</h3>
              <p className="text-sm text-muted-foreground">Discover hidden gems and authentic local experiences</p>
            </div>

            <div className="text-center p-6">
              <div
                className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float"
                style={{ animationDelay: "4s" }}
              >
                <Sparkles className="w-6 h-6 text-chart-3" />
              </div>
              <h3 className="font-semibold mb-2">Personalized Itinerary</h3>
              <p className="text-sm text-muted-foreground">Tailored recommendations based on your preferences</p>
            </div>
          </div>
        </div>
      </main>

      {/* Sign In Dialog */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Sign in to your account to start planning your perfect trip
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              onClick={handleSignIn}
              variant="outline"
              size="lg"
              className="w-full text-base py-6 hover:bg-accent hover:border-primary/50 transition-all duration-300"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Your prompt will be saved and ready when you return
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
