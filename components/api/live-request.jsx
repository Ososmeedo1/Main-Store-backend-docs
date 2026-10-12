"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { curlSnippet } from "@/lib/snippets";

// Live cURL preview: always matches the current form values (endpoint,
// baseUrl, query, headers, body passed in as props each render).
export function LiveRequest({ endpoint, baseUrl, query, headers, body }) {
  const [ok, setOk] = useState(false);
  const text = curlSnippet(endpoint, { baseUrl: baseUrl || "{{baseUrl}}", query, headers, body });
  return (
    <div className="min-w-0">
      <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 break-words py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Live request preview — updates as you type
        </p>
        <button
          type="button"
          className="mica-icon-btn shrink-0"
          aria-label="Copy current cURL to clipboard"
          title={ok ? "Copied" : "Copy cURL"}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            } catch {}
          }}
        >
          {ok ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
        </button>
      </div>
      <div
        className="scroll-well min-w-0"
        tabIndex="0"
        role="region"
        aria-label="Live cURL preview (scroll horizontally to see more)"
      >
        <pre className="max-w-full overflow-auto p-4 font-mono text-xs text-[var(--text-primary)]">{text}</pre>
      </div>
    </div>
  );
}
