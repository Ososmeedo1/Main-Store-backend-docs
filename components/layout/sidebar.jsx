"use client";

import { useState } from "react";
import Link from "next/link";
import { getGroups, getEndpoints } from "@/lib/api";
import { MethodBadge } from "@/components/docs/method-badge";

// One flat grouped list (max 2 levels: group → endpoint), filterable, with a
// clear active state. No nested menus.
const GUIDES = [
  ["/", "Overview"],
  ["/getting-started", "Getting started"],
];

export function Sidebar({ activeId }) {
  const [filter, setFilter] = useState("");
  const groups = getGroups();
  const endpoints = getEndpoints();
  const q = filter.trim().toLowerCase();
  const matches = (e) =>
    !q || `${e.name} ${e.method} ${e.path}`.toLowerCase().includes(q);
  return (
    <nav aria-label="API endpoints" className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <label htmlFor="sidebar-filter" className="mb-1 block text-sm font-semibold text-[var(--text-secondary)]">Filter endpoints</label>
        <input
          id="sidebar-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Type to filter…"
          className="mica-input"
        />
      </div>
      <div className="min-w-0 border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">Guides</p>
        <ul className="min-w-0 space-y-1 text-sm font-semibold">
          {GUIDES.map(([href, label]) => {
            const active = activeId === href;
            return (
              <li key={href} className="min-w-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`mica-navlink px-3 py-2 text-[var(--text-secondary)] ${active ? "mica-navlink-active" : ""}`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {groups.map((g) => {
        const visible = endpoints.filter((e) => e.groupSlug === g.slug).filter(matches);
        return (
          <details key={g.slug} className="group min-w-0 border-t border-[var(--border)] pt-4" open>
            <summary className="cursor-pointer list-none rounded-[var(--radius-xs)] text-sm font-semibold text-[var(--text-secondary)]">
              {g.name} · {g.count}
            </summary>
            {visible.length === 0 ? (
              <p className="mt-2 text-[13px] font-semibold text-[var(--text-tertiary)]">
                No endpoints match. Try a different word.
              </p>
            ) : (
              <ul className="mt-2 min-w-0 space-y-1">
                {visible.map((e) => {
                  const active = activeId === `/docs/${e.id}`;
                  return (
                    <li key={e.id} className="min-w-0">
                      <Link
                        href={`/docs/${e.groupSlug}/${e.slug}`}
                        aria-current={active ? "page" : undefined}
                        className={`mica-navlink min-w-0 px-2 py-1.5 text-[13px] font-semibold text-[var(--text-secondary)] ${active ? "mica-navlink-active" : ""}`}
                      >
                        <MethodBadge method={e.method} size="sm" />
                        <span className="min-w-0 flex-1 truncate">{e.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </details>
        );
      })}
    </nav>
  );
}
