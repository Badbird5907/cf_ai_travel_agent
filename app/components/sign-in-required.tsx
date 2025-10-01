import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router";

interface SignInRequiredProps {
  message?: string;
  title?: string;
}

export function SignInRequired({
  message = "Please sign in to view this content",
  title = "Sign in required",
}: SignInRequiredProps) {
  return (
    <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center">
      <Card className="p-8 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button asChild>
          <Link to="/auth/signin">Sign In</Link>
        </Button>
      </Card>
    </div>
  );
}

