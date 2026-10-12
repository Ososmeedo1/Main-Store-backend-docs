import { cn } from "@/lib/utils";

export function Badge({ className, ...props }) {
  return <span className={cn("mica-badge px-2.5 py-1 text-xs", className)} {...props} />;
}
