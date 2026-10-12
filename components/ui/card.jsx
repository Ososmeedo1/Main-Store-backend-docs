import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("mica-card min-w-0 p-6", className)} {...props} />;
}
