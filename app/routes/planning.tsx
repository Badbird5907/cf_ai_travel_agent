import type { Route } from "./+types/home";
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plane, Hotel, UtensilsCrossed, MapPin, Calendar, CheckCircle, Loader2, Sparkles } from "lucide-react"
import { useSearchParams } from "react-router";

interface PlanningStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: "pending" | "active" | "completed"
  duration: number
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Planning" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {}
}

export default function Home() {
  const [searchParams] = useSearchParams()
  const prompt = searchParams.get("prompt") || "Plan a trip"

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const steps: PlanningStep[] = [
    {
      id: "analyzing",
      title: "Analyzing your request",
      description: "Understanding your travel preferences and requirements",
      icon: <Sparkles className="w-5 h-5" />,
      status: "pending",
      duration: 2000,
    },
    {
      id: "flights",
      title: "Searching for flights",
      description: "Finding the best flight options and deals",
      icon: <Plane className="w-5 h-5" />,
      status: "pending",
      duration: 3000,
    },
    {
      id: "hotels",
      title: "Finding accommodations",
      description: "Locating perfect hotels and stays for your trip",
      icon: <Hotel className="w-5 h-5" />,
      status: "pending",
      duration: 2500,
    },
    {
      id: "restaurants",
      title: "Discovering restaurants",
      description: "Curating dining experiences and local cuisine",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      status: "pending",
      duration: 2000,
    },
    {
      id: "activities",
      title: "Planning activities",
      description: "Selecting attractions and experiences",
      icon: <MapPin className="w-5 h-5" />,
      status: "pending",
      duration: 2500,
    },
    {
      id: "itinerary",
      title: "Creating your itinerary",
      description: "Organizing everything into a perfect schedule",
      icon: <Calendar className="w-5 h-5" />,
      status: "pending",
      duration: 1500,
    },
  ]

  const [planningSteps, setPlanningSteps] = useState(steps)

  useEffect(() => {
    const totalDuration = 0
    let currentProgress = 0

    const processSteps = async () => {
      for (let i = 0; i < planningSteps.length; i++) {
        // Set current step as active
        setPlanningSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            status: index < i ? "completed" : index === i ? "active" : "pending",
          })),
        )

        setCurrentStep(i)

        // Animate progress for current step
        const stepDuration = planningSteps[i].duration
        const progressIncrement = 100 / planningSteps.length / (stepDuration / 50)

        for (let j = 0; j < stepDuration / 50; j++) {
          await new Promise((resolve) => setTimeout(resolve, 50))
          currentProgress += progressIncrement
          setProgress(Math.min(currentProgress, (i + 1) * (100 / planningSteps.length)))
        }

        // Mark step as completed
        setPlanningSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            status: index <= i ? "completed" : "pending",
          })),
        )
      }

      setProgress(100)
      setIsComplete(true)

      // Navigate to results after a brief delay
      setTimeout(() => {
        window.location.href = `/results?prompt=${encodeURIComponent(prompt)}`
      }, 1500)
    }

    processSteps()
  }, [])

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">TravelAI</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Planning Your Perfect Trip</h1>
            <p className="text-xl text-muted-foreground mb-6 text-pretty">"{prompt}"</p>
            <div className="max-w-md mx-auto">
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-6">
            {planningSteps.map((step, index) => (
              <Card
                key={step.id}
                className={`p-6 transition-all duration-500 ${
                  step.status === "active"
                    ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/10"
                    : step.status === "completed"
                      ? "bg-card/50 border-border/50"
                      : "bg-card/30 border-border/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.status === "completed"
                        ? "bg-primary text-primary-foreground"
                        : step.status === "active"
                          ? "bg-primary/20 text-primary animate-pulse"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.status === "active" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-1 transition-colors ${
                        step.status === "active" ? "text-primary" : ""
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Step Status */}
                  <div className="text-right">
                    {step.status === "completed" && <span className="text-xs text-primary font-medium">Completed</span>}
                    {step.status === "active" && (
                      <span className="text-xs text-primary font-medium animate-pulse">In Progress...</span>
                    )}
                    {step.status === "pending" && <span className="text-xs text-muted-foreground">Pending</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Completion Message */}
          {isComplete && (
            <Card className="p-8 text-center mt-8 bg-primary/5 border-primary/30">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Trip Planning Complete!</h2>
              <p className="text-muted-foreground mb-4">
                Your personalized itinerary is ready. Redirecting to results...
              </p>
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
