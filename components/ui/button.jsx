// High-contrast button: primary (solid fill, inverts on hover), secondary
// (2px outline), ghost, icon (44px). States: default / hover (150ms) /
// focus-visible ring (global) / active press / disabled (dashed + readable).
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "mica-btn-primary",
  secondary: "",
  ghost: "mica-btn-ghost",
  icon: "mica-btn-icon",
};

export function Button({ className, variant = "secondary", ...props }) {
  return (
    <button
      className={cn("mica-btn", VARIANTS[variant] ?? "", className)}
      {...props}
    />
  );
}
