import { cn } from "@/lib/utils";

export function Input({ className, invalid, ...props }) {
  return (
    <input
      className={cn("mica-input", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
