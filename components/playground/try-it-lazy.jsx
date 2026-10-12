"use client";

import dynamic from "next/dynamic";

// Client-only boundary for the playground: `ssr: false` is only allowed in
// Client Components. The playground reads localStorage, so it must never SSR
// (avoids hydration mismatches and keeps static HTML lean). The placeholder
// reserves space to avoid layout shift.
const TryIt = dynamic(() => import("./try-it"), {
  ssr: false,
  loading: () => (
    <div className="mica-card min-h-40 p-5" aria-label="Loading playground" aria-busy="true">
      <p className="break-words text-sm font-semibold text-[var(--text-secondary)]">Loading playground…</p>
    </div>
  ),
});

export default TryIt;
