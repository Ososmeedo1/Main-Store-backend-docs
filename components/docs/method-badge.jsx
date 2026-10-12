import { cn } from "@/lib/utils";

const SIZES = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

// Flat mica-tag badge. The verb text carries meaning, so status never relies
// on color alone. Colors come from method tokens (AA in both themes).
export function MethodBadge({ method, size = "md", className }) {
  const m = String(method || "").toUpperCase();
  return (
    <span
      className={cn(
        "mica-badge inline-flex shrink-0 items-center",
        `method-${m.toLowerCase()}`,
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {m}
    </span>
  );
}
