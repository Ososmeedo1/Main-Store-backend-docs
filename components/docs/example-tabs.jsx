"use client";

import { useState } from "react";

// Simple language switcher: cURL first (default), then JavaScript, then
// Axios. One tablist, arrow-key friendly via native buttons.
const TABS = [
  ["curl", "cURL"],
  ["fetch", "JavaScript"],
  ["axios", "Axios"],
];

export function ExampleTabs({ snippets }) {
  const [tab, setTab] = useState("curl");
  const current = snippets[tab];
  return (
    <div className="min-w-0">
      <div role="tablist" aria-label="Request example language" className="flex min-w-0 flex-wrap gap-2">
        {TABS.map(([id, label]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`mica-btn min-h-[44px] px-4 text-sm ${active ? "mica-btn-primary" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="mt-3 min-w-0">
        {current}
      </div>
    </div>
  );
}
