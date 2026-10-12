"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

const subscribe = () => () => {};
const ORDER = ["system", "light", "dark"];

// One small icon button that cycles System → Light → Dark. Mount-gated so SSR
// and hydration render identically (theme context is unresolved on server).
export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const value = mounted ? theme || "system" : "system";
  const next = ORDER[(ORDER.indexOf(value) + 1) % ORDER.length];
  const Icon = value === "light" ? Sun : value === "dark" ? Moon : Monitor;
  const label = `Theme: ${value}. Switch to ${next} mode`;
  return (
    <button
      type="button"
      className="mica-icon-btn"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}
