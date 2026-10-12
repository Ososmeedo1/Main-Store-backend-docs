"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { MethodBadge } from "@/components/docs/method-badge";

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="mica-icon-btn"
        onClick={() => setOpen(true)}
        aria-label="Search docs (Ctrl+K)"
        title="Search docs (Ctrl+K)"
      >
        <Search size={15} aria-hidden="true" />
      </button>
      {open && <Palette onClose={() => setOpen(false)} />}
    </>
  );
}

function Palette({ onClose }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((all) => {
        const query = q.trim().toLowerCase();
        if (!query) return setItems(all.slice(0, 8));
        setItems(
          all
            .filter((e) =>
              `${e.name} ${e.method} ${e.path} ${e.group} ${e.description}`
                .toLowerCase()
                .includes(query)
            )
            .slice(0, 12)
        );
      })
      .catch(() => setItems([]));
  }, [q]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Search documentation">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-[12vh] mx-auto w-[min(560px,92%)] min-w-0 border-2 border-[var(--border)] bg-[var(--surface-elevated)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-base)]">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            // Enter opens the top result immediately (Dev: type "order", hit Enter).
            if (e.key === "Enter" && items.length > 0) {
              router.push(`/docs/${items[0].id}`);
              onClose();
            }
          }}
          placeholder="Search endpoints… (e.g. login, cart, orders)"
          className="mica-input"
          aria-label="Search endpoints. Press Enter to open the top result."
        />
        <ul className="mt-2 max-h-[50vh] min-w-0 overflow-auto">
          {items.map((e) => (
            <li key={e.id} className="min-w-0">
              <a
                href={`/docs/${e.id}`}
                className="mica-navlink min-w-0 px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                <MethodBadge method={e.method} size="sm" />
                <span className="min-w-0 flex-1 truncate">{e.name}</span>
                <span className="ml-2 hidden max-w-[40%] shrink-0 truncate font-mono text-xs font-semibold text-[var(--text-tertiary)] sm:block">
                  {e.method} {e.path}
                </span>
              </a>
            </li>
          ))}
          {items.length === 0 && (
            <li className="break-words px-3 py-6 text-center text-sm font-normal text-[var(--text-secondary)]">
              No matches. Try “login”, “cart” or “orders”.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
