"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Copy, KeyRound, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { CopyButton } from "@/components/docs/copy-button";
import { Term } from "@/components/docs/term";
import { LiveRequest } from "@/components/api/live-request";
import { useApi } from "@/components/api/api-context";
import { statusMeaning, errorFix } from "@/lib/friendly";
import { wireToken, findReusableValues } from "@/lib/token";

// Guided playground on shared state: server + token come from the header
// (authorize once, used everywhere). Prefilled values, one big Send button,
// plain-language results, friendly fixes. Ctrl+Enter sends.
export default function TryIt({ endpoint }) {
  const {
    baseUrl, token, authorized, setAuthOpen, setToken,
  } = useApi();
  const [query, setQuery] = useState(() =>
    Object.fromEntries((endpoint.queryParams || []).map((q) => [q.name, q.value || ""]))
  );
  const [headers, setHeaders] = useState(() =>
    (endpoint.headers || [])
      .filter((h) => h.name.toLowerCase() !== "token")
      .map((h) => ({ name: h.name, value: h.value || "" }))
  );
  const [body, setBody] = useState(endpoint.bodyRaw || "");
  const [bodyInvalid, setBodyInvalid] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedChip, setCopiedChip] = useState("");

  const needsToken = (endpoint.headers || []).some((h) => h.name.toLowerCase() === "token");
  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(endpoint.method);

  const finalHeaders = useMemo(() => {
    const list = headers.map((h) => ({ ...h }));
    if (needsToken) list.unshift({ name: "token", value: wireToken(token) });
    return list;
  }, [headers, needsToken, token]);

  function validBody() {
    if (!hasBody || !body.trim()) {
      setBodyInvalid(false);
      return true;
    }
    try {
      JSON.parse(body);
      setBodyInvalid(false);
      return true;
    } catch {
      setBodyInvalid(true);
      return false;
    }
  }

  async function send() {
    if (loading) return;
    // Validate before sending, in plain words.
    if (needsToken && !authorized) {
      setError("You need to log in first — this endpoint needs a token.");
      setResult(null);
      return;
    }
    if (!validBody()) {
      setError("That JSON has a mistake in it. Press Format JSON or fix the highlighted part.");
      setResult(null);
      return;
    }
    if (!baseUrl) {
      setError("The server address is missing. Reload the page and try again.");
      setResult(null);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const t0 = performance.now();
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: endpoint.method,
          baseUrl,
          path: endpoint.path,
          query,
          headers: finalHeaders.filter((h) => h.name && h.value !== ""),
          body: hasBody ? body : undefined,
        }),
      });
      const payload = await res.json();
      const ms = Math.round(performance.now() - t0);
      if (!res.ok && payload?.error && !payload?.status) {
        setError(payload.error);
      } else {
        setResult({ ...payload, elapsedMs: payload.elapsedMs ?? ms });
      }
    } catch {
      setError("Could not reach the server (network error).");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQuery(Object.fromEntries((endpoint.queryParams || []).map((q) => [q.name, q.value || ""])));
    setHeaders(
      (endpoint.headers || [])
        .filter((h) => h.name.toLowerCase() !== "token")
        .map((h) => ({ name: h.name, value: h.value || "" }))
    );
    setBody(endpoint.bodyRaw || "");
    setBodyInvalid(false);
    setResult(null);
    setError("");
  }

  function formatJson() {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
      setBodyInvalid(false);
    } catch {
      setBodyInvalid(true);
    }
  }

  async function copyChip(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedChip(label);
      setTimeout(() => setCopiedChip(""), 1500);
    } catch {}
  }

  const label = "text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]";
  const showAuthNudge =
    (needsToken && !authorized) ||
    (result && (result.status === 401 || result.status === 403));
  const reusable = result ? findReusableValues(result.body) : [];

  return (
    <div
      className="mica-card min-w-0 space-y-4 p-5"
      aria-label={`Try ${endpoint.name}`}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          send();
        }
      }}
    >
      <p className="break-words text-sm font-normal text-[var(--text-secondary)]">
        Values are already filled in. Just press <strong>Send request</strong>
        {needsToken && !authorized ? (
          <> — but first <strong>authorize</strong>, this one needs a login.</>
        ) : (
          <>.</>
        )}
      </p>

      {needsToken && (
        authorized ? (
          <p className="flex min-w-0 flex-wrap items-center gap-2 break-words text-sm font-semibold text-[var(--status-success)]">
            <KeyRound size={16} aria-hidden="true" />
            Using your saved token.
            <button type="button" onClick={() => setAuthOpen(true)} className="mica-btn min-h-[44px] px-3 py-1 text-xs">
              Change token
            </button>
          </p>
        ) : (
          <div className="min-w-0 border-2 border-[var(--status-warning)] bg-[var(--surface-content)] p-4">
            <p className="break-words text-sm font-semibold text-[var(--text-primary)]">
              This <Term name="endpoint">endpoint</Term> needs a{" "}
              <Term name="token">token</Term>. Log in once and every protected
              request uses it.
            </p>
            <button type="button" onClick={() => setAuthOpen(true)} className="mica-btn mica-btn-primary mt-2 px-4 text-sm">
              <KeyRound size={16} aria-hidden="true" /> Authorize now
            </button>
          </div>
        )
      )}

      {(endpoint.queryParams || []).length > 0 && (
        <fieldset className="min-w-0">
          <legend className={label}>Options in the URL (query params)</legend>
          <div className="mt-1 min-w-0 space-y-2">
            {Object.keys(query).map((k) => (
              <label key={k} className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <code className="w-28 shrink-0 truncate font-mono text-xs text-[var(--text-secondary)]">{k}</code>
                <input
                  className="mica-input min-w-0 flex-1 font-mono text-xs"
                  value={query[k]}
                  onChange={(e) => setQuery({ ...query, [k]: e.target.value })}
                  aria-label={`Option ${k}`}
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {hasBody && (
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label className={`${label} min-w-0 flex-1`} htmlFor={`body-${endpoint.id}`}>
              Data to send (JSON body) <span className="font-normal normal-case">— edit freely</span>
            </label>
            <button type="button" onClick={formatJson} className="mica-btn min-h-[44px] shrink-0 px-3 py-1 text-xs">
              Format JSON
            </button>
          </div>
          <textarea
            id={`body-${endpoint.id}`}
            className="mica-input mt-1 min-h-32 font-mono text-xs"
            value={body}
            onChange={(e) => { setBody(e.target.value); setBodyInvalid(false); }}
            aria-invalid={bodyInvalid}
            spellCheck={false}
          />
          {bodyInvalid && (
            <p className="mt-1 break-words text-sm font-semibold text-[var(--status-danger)]">
              This JSON is not valid yet. Press Format JSON to fix spacing, or check commas and quotes.
            </p>
          )}
        </div>
      )}

      <details className="min-w-0 border-2 border-[var(--border)] p-3">
        <summary className="cursor-pointer list-none rounded-[var(--radius-xs)] text-sm font-semibold text-[var(--text-primary)]">
          Advanced: extra headers
        </summary>
        <div className="mt-2 min-w-0 space-y-2">
          {headers.length === 0 && (
            <p className="break-words text-sm font-normal text-[var(--text-secondary)]">
              No extra headers for this endpoint. Beginners can skip this.
            </p>
          )}
          {headers.map((h, i) => (
            <label key={i} className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <code className="w-28 shrink-0 truncate font-mono text-xs text-[var(--text-secondary)]">{h.name}</code>
              <input
                className="mica-input min-w-0 flex-1 font-mono text-xs"
                value={h.value}
                onChange={(e) =>
                  setHeaders(headers.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
                aria-label={`Header ${h.name}`}
              />
            </label>
          ))}
        </div>
      </details>

      <LiveRequest endpoint={endpoint} baseUrl={baseUrl} query={query} headers={finalHeaders} body={hasBody ? body : ""} />

      <div className="flex min-w-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={send}
          disabled={loading}
          aria-busy={loading}
          className="mica-btn mica-btn-primary min-w-0 flex-1 px-5 text-base disabled:cursor-not-allowed sm:flex-none sm:px-8"
        >
          {loading && <Loader2 size={16} className="mica-spinner" aria-hidden="true" />}
          {loading ? "Sending…" : "Send request"}
        </button>
        <button type="button" onClick={reset} disabled={loading} className="mica-btn px-4 text-sm disabled:cursor-not-allowed">
          Reset
        </button>
      </div>

      <div aria-live="polite" aria-busy={loading} className="min-h-16 min-w-0">
        {error && (
          <div className="min-w-0 border-2 border-[var(--status-danger)] bg-[var(--surface-content)] p-4" role="alert">
            <p className="flex min-w-0 items-start gap-2 break-words text-sm font-semibold text-[var(--status-danger)]">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
            <p className="mt-1 break-words text-sm font-normal text-[var(--text-primary)]">{errorFix(error)}</p>
            {showAuthNudge && (
              <button type="button" onClick={() => setAuthOpen(true)} className="mica-btn mica-btn-primary mt-2 px-4 text-sm">
                <KeyRound size={16} aria-hidden="true" /> Authorize now
              </button>
            )}
          </div>
        )}
        {!error && !result && !loading && (
          <p className="break-words text-sm font-normal text-[var(--text-secondary)]">
            No response yet — press <strong>Send request</strong> and the answer appears here.
          </p>
        )}
        {loading && (
          <p className="flex min-h-16 min-w-0 items-center gap-2 break-words text-sm font-semibold text-[var(--text-secondary)]">
            <Loader2 size={16} className="mica-spinner" aria-hidden="true" />
            Sending your request…
          </p>
        )}
        {result && (
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`mica-badge inline-flex items-center px-2.5 py-1 ${result.status < 300 ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"}`}>
                {result.status < 300 ? (
                  <CheckCircle2 size={14} className="mr-1 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle size={14} className="mr-1 shrink-0" aria-hidden="true" />
                )}
                {result.status} {result.statusText}
              </span>
              <span className="break-words text-[var(--text-tertiary)]">{result.elapsedMs} ms · {result.size} bytes</span>
              <span className="ml-auto shrink-0">
                <CopyButton text={typeof result.body === "string" ? result.body : JSON.stringify(result.body, null, 2)} label="Copy response" />
              </span>
            </div>
            <p className="break-words text-sm font-semibold text-[var(--text-primary)]">{statusMeaning(result.status)}</p>
            {showAuthNudge && (
              <button type="button" onClick={() => setAuthOpen(true)} className="mica-btn mica-btn-primary px-4 text-sm">
                <KeyRound size={16} aria-hidden="true" /> Authorize now
              </button>
            )}
            {reusable.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="break-words text-xs font-semibold text-[var(--text-tertiary)]">Reuse from this answer:</span>
                {reusable.map((r, i) => (
                  <button
                    key={`${r.kind}-${i}`}
                    type="button"
                    className="mica-btn min-h-[44px] px-3 py-1 text-xs"
                    aria-label={r.kind === "token" ? "Save this token for all requests" : "Copy this ID"}
                    onClick={async () => {
                      if (r.kind === "token") {
                        setToken(r.value);
                        setCopiedChip(`token-${i}`);
                      } else {
                        await copyText(r.value);
                        setCopiedChip(`id-${i}`);
                      }
                      setTimeout(() => setCopiedChip(""), 1500);
                    }}
                  >
                    {copiedChip === `token-${i}` || copiedChip === `id-${i}` ? (
                      <><Check size={14} aria-hidden="true" /> Saved</>
                    ) : r.kind === "token" ? (
                      <><KeyRound size={14} aria-hidden="true" /> Use this token</>
                    ) : (
                      <><Copy size={14} aria-hidden="true" /> Copy ID</>
                    )}
                  </button>
                ))}
              </div>
            )}
            <details className="min-w-0 border-2 border-[var(--border)]">
              <summary className="cursor-pointer list-none rounded-[var(--radius-xs)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
                Response headers ({Object.keys(result.headers || {}).length})
              </summary>
              <div
                className="scroll-well min-w-0 border-0 border-t"
                tabIndex="0"
                role="region"
                aria-label="Response headers (scroll horizontally to see more)"
              >
                <pre className="max-w-full overflow-auto p-3 font-mono text-xs text-[var(--text-primary)]">
                  {Object.entries(result.headers || {}).map(([k, v]) => `${k}: ${v}`).join("\n") || "No headers recorded."}
                </pre>
              </div>
            </details>
            <div
              className="scroll-well min-w-0"
              tabIndex="0"
              role="region"
              aria-label="Response body (scroll horizontally to see more)"
            >
              <pre className="max-w-full overflow-auto p-4 font-mono text-xs text-[var(--text-primary)]">
                {typeof result.body === "string" ? result.body : JSON.stringify(result.body, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {}
}
