"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Small ghost icon button. Success shows a check icon, never color alone.
export function CopyButton({ text, label = "Copy" }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="mica-icon-btn"
      aria-label={`${label} to clipboard`}
      title={ok ? "Copied" : label}
      aria-live="polite"
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
  );
}
