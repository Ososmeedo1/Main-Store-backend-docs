"use client";

import { useEffect, useState } from "react";
import { KeyRound, LogOut, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/components/api/api-context";
import { maskToken } from "@/lib/token";
import { Term } from "@/components/docs/term";

// The one modal in the app. Authorize once: paste a token (or log in first),
// every protected request uses it. Token is masked, stored locally only.
export function AuthorizeButton() {
  const { authorized, setAuthOpen } = useApi();
  return (
    <button
      type="button"
      onClick={() => setAuthOpen(true)}
      className={`mica-btn min-h-9 px-3 py-1.5 text-[13px] ${authorized ? "" : "mica-btn-primary"}`}
      aria-label={authorized ? "Authorized. Manage authorization" : "Authorize. Log in to use protected endpoints"}
    >
      <KeyRound size={14} aria-hidden="true" />
      <span className="hidden md:inline">{authorized ? "Authorized" : "Authorize"}</span>
    </button>
  );
}

export function AuthorizeDialog() {
  const { authOpen, setAuthOpen, token, setToken, logout, clearSaved, authorized } = useApi();
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (!authOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setAuthOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen, setAuthOpen]);
  if (!authOpen) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Authorize">
      <div className="absolute inset-0 bg-black/40" onClick={() => setAuthOpen(false)} />
      <div className="absolute inset-x-0 top-[15vh] mx-auto w-[min(440px,92%)] min-w-0 border-2 border-[var(--border)] bg-[var(--surface-elevated)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-base)]">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 flex-1 break-words text-lg font-semibold text-[var(--text-primary)]">Authorize once</h2>
          <button type="button" className="mica-icon-btn shrink-0" aria-label="Close authorization dialog" onClick={() => setAuthOpen(false)}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 break-words text-sm font-normal text-[var(--text-secondary)]">
          Paste the <Term name="token">token</Term> from{" "}
          <Link href="/docs/users/login" onClick={() => setAuthOpen(false)} className="text-[var(--primary)] underline">
            POST /users/login
          </Link>
          . The site adds the required key automatically. Stored in your browser only.
        </p>
        {authorized ? (
          <div className="mt-3 min-w-0 space-y-3">
            <p className="min-w-0 break-all font-mono text-sm text-[var(--text-primary)]">
              Active token: <strong>{maskToken(token)}</strong>
            </p>
            <div className="flex min-w-0 flex-wrap gap-2">
              <button type="button" onClick={() => { logout(); }} className="mica-btn px-4 text-sm">
                <LogOut size={16} aria-hidden="true" /> Log out
              </button>
            </div>
          </div>
        ) : (
          <form
            className="mt-3 min-w-0 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                setToken(draft);
                setDraft("");
                setAuthOpen(false);
              }
            }}
          >
            <label htmlFor="auth-token" className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
              Token (raw value, without prefix)
            </label>
            <input
              id="auth-token"
              autoFocus
              className="mica-input font-mono text-xs"
              placeholder="Paste token here"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" disabled={!draft.trim()} className="mica-btn mica-btn-primary w-full disabled:cursor-not-allowed">
              Save token
            </button>
          </form>
        )}
        <div className="mt-3 min-w-0 border-t border-[var(--border)] pt-3">
          <button type="button" onClick={() => { clearSaved(); setDraft(""); }} className="mica-btn px-4 text-sm">
            <Trash2 size={16} aria-hidden="true" /> Clear saved data
          </button>
          <p className="mt-1 break-words text-xs font-normal text-[var(--text-secondary)]">
            Forgets your token and preferences on this browser.
          </p>
        </div>
      </div>
    </div>
  );
}
