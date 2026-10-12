"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

// Copies the current page URL (the shareable endpoint link) in one click.
export function CopyLinkButton() {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="mica-icon-btn"
      aria-label="Copy shareable link to this endpoint"
      title={ok ? "Copied" : "Copy link"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {}
      }}
    >
      {ok ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
    </button>
  );
}
