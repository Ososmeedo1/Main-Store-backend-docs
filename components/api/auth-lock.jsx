"use client";

import { Lock, LockOpen } from "lucide-react";
import { useApi } from "./api-context";

// Lock state for protected endpoints. Unlocked only when a token is saved —
// icon plus bold text, never color alone.
export function AuthLock({ required }) {
  const { authorized, setAuthOpen } = useApi();
  if (!required) return null;
  if (authorized) {
    return (
      <span className="mica-badge px-2.5 py-1 text-xs text-[var(--status-success)]">
        <LockOpen size={14} className="mr-1 shrink-0" aria-hidden="true" /> Unlocked — token saved
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setAuthOpen(true)}
      className="mica-badge px-2.5 py-1 text-xs text-[var(--status-warning)]"
      aria-label="This endpoint needs authorization. Authorize now"
    >
      <Lock size={14} className="mr-1 shrink-0" aria-hidden="true" /> Needs login — Authorize
    </button>
  );
}
