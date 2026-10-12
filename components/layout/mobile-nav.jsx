"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0 lg:hidden">
      <button
        type="button"
        className="mica-icon-btn"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Site navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-3 top-3 max-h-[85vh] w-[min(300px,86vw)] overflow-auto border-2 border-[var(--border)] bg-[var(--surface-elevated)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-base)]">
            <button
              type="button"
              className="mica-btn mb-3 px-4 text-sm"
              onClick={() => setOpen(false)}
            >
              Close navigation
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}
