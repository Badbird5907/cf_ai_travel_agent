import { cn } from "@/lib/utils";

interface ToggleProps {
  toggled: boolean;
  onClick: () => void;
  "aria-label": string;
  className?: string;
}

export function Toggle({ toggled, onClick, "aria-label": ariaLabel, className }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        toggled ? "bg-primary" : "bg-muted",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
          toggled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
