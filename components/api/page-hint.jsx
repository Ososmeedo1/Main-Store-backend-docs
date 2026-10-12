"use client";

import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";

const subscribe = () => () => {};

// Dismissible first-visit hint. Shown once (localStorage), never again.
// Mount-gated so SSR and hydration render identically (null).
export function PageHint({ id, children }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!mounted) return null;
  const key = `mica-hint-${id}`;
  const legacyKey = `origami-hint-${id}`;
  let stored = false;
  try {
    // One-time move from the pre-rename key so dismissal persists.
    stored = localStorage.getItem(key) === "1" || localStorage.getItem(legacyKey) === "1";
    if (stored) {
      localStorage.setItem(key, "1");
      localStorage.removeItem(legacyKey);
    }
  } catch {}
  if (stored || dismissed) return null;
  function hide() {
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setDismissed(true);
  }
  return (
    <div className="mica-card flex min-w-0 items-start gap-3 border-[var(--primary-solid)] p-4">
      <p className="min-w-0 flex-1 break-words text-sm font-normal text-[var(--text-primary)]">{children}</p>
      <button
        type="button"
        className="mica-btn mica-btn-icon shrink-0"
        aria-label="Dismiss this hint"
        onClick={hide}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
