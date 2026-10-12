"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { getEnvironments } from "@/lib/api";

// Shared playground state: the single Production server + auth token.
// Persisted in localStorage only (never sent anywhere except as an API header).
// Hydration-safe: module memory loads on the client; the server snapshot is
// always blank, so SSR and hydration render identically. No effects needed.
const KEYS = { token: "mica-token" };
const LEGACY_KEYS = { token: "origami-token" };

let mem = { token: "" };
const listeners = new Set();
function emit() {
  for (const l of listeners) l();
}
function readStored() {
  const out = { token: "" };
  try {
    // Fall back to the pre-rename key once so saved tokens survive the move.
    out.token = localStorage.getItem(KEYS.token) || localStorage.getItem(LEGACY_KEYS.token) || "";
    if (out.token) {
      localStorage.setItem(KEYS.token, out.token);
      localStorage.removeItem(LEGACY_KEYS.token);
    }
  } catch {}
  return out;
}
try {
  mem = readStored();
} catch {}
if (typeof window !== "undefined") {
  window.addEventListener("storage", () => {
    mem = readStored();
    emit();
  });
}
function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return mem;
}
// Cached constant: getServerSnapshot must return the same reference every
// call, or React detects a changed snapshot on each render and loops forever.
const SERVER_SNAPSHOT = { token: "" };
function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}
function persist(patch) {
  mem = { ...mem, ...patch };
  try {
    for (const [k, v] of Object.entries(patch)) {
      if (v) localStorage.setItem(KEYS[k], v);
      else localStorage.removeItem(KEYS[k]);
    }
  } catch {}
  emit();
}

const ApiCtx = createContext(null);

// Pick the env the playground should hit: Production by name, else the
// first non-loopback http(s) URL, else envs[0] (local dev fallback).
function pickServerEnv(envs) {
  if (!envs?.length) return null;
  const named = envs.find((e) => /production/i.test(e?.name || ""));
  if (named?.variables?.url) return named;
  const pub = envs.find((e) => {
    try {
      const u = new URL(e?.variables?.url || "");
      const h = u.hostname.toLowerCase();
      return (
        (u.protocol === "http:" || u.protocol === "https:") &&
        h !== "localhost" &&
        !h.endsWith(".localhost") &&
        !h.endsWith(".local") &&
        h !== "127.0.0.1"
      );
    } catch {
      return false;
    }
  });
  return pub || envs[0];
}

export function ApiProvider({ children }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [authOpen, setAuthOpen] = useState(false);
  const envs = useMemo(() => getEnvironments(), []);

  const setToken = useCallback((v) => persist({ token: String(v || "").trim() }), []);
  const logout = useCallback(() => persist({ token: "" }), []);
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem("origami-server");
      localStorage.removeItem("origami-custom-url");
      localStorage.removeItem("origami-token");
      localStorage.removeItem("mica-hint-home");
      localStorage.removeItem("mica-hint-endpoint");
    } catch {}
    persist({ token: "" });
  }, []);

  // Prefer the public Production server. envs[0] is Dev (localhost),
  // which a deployed proxy can never reach (localhost = the server
  // itself, plus the proxy blocklist rejects loopback/private hosts).
  const serverName = useMemo(() => {
    const e = pickServerEnv(envs);
    return e?.name || envs[0]?.name || "Production";
  }, [envs]);
  const baseUrl = useMemo(() => {
    const e = pickServerEnv(envs);
    return (e?.variables?.url || "").replace(/\/$/, "");
  }, [envs]);

  const value = useMemo(
    () => ({
      envs,
      serverName,
      baseUrl,
      token: stored.token,
      setToken,
      authorized: Boolean(stored.token),
      logout,
      clearSaved,
      authOpen,
      setAuthOpen,
    }),
    [envs, serverName, baseUrl, stored.token, setToken, logout, clearSaved, authOpen]
  );
  return <ApiCtx.Provider value={value}>{children}</ApiCtx.Provider>;
}

export function useApi() {
  const v = useContext(ApiCtx);
  if (!v) throw new Error("useApi must be used inside ApiProvider");
  return v;
}
