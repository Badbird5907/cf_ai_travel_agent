import type { Route } from "./+types/signin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";
import { Plane, Github } from "lucide-react";

export function loader({ context }: Route.LoaderArgs) {
  return {};
}

export default function SignIn({ loaderData }: Route.ComponentProps) {
  const handleGitHubSignIn = async () => {
    await signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">TravelAI</span>
        </a>
      </div>

      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription className="text-base">
            Sign in to your account to continue planning your perfect trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGitHubSignIn}
            variant="outline"
            size="lg"
            className="w-full text-base py-6 hover:bg-accent hover:border-primary/50 transition-all duration-300"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
