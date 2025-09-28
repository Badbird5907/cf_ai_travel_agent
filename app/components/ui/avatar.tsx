import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  username?: string;
  size?: "sm" | "md" | "lg";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, username, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-6 w-6 text-xs",
      md: "h-8 w-8 text-sm",
      lg: "h-10 w-10 text-base",
    };

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {username ? getInitials(username) : "?"}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
