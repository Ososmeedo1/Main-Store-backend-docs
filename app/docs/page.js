import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { MethodBadge } from "@/components/docs/method-badge";
import { getApi } from "@/lib/api";

export const metadata = {
  title: "All endpoints",
  description: "Full list of Main Store API endpoints grouped by topic.",
  alternates: { canonical: "/docs" },
};

export default function DocsIndex() {
  const api = getApi();
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 px-4">
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-auto"><Sidebar activeId="/docs" /></div>
        </aside>
        <article className="min-w-0">
          <h1 className="mica-card min-w-0 break-words p-6 text-3xl font-semibold text-[var(--text-primary)]">All endpoints</h1>
          {api.groups.map((g) => (
            <section key={g.slug} className="mt-4 min-w-0" aria-label={g.name}>
              <h2 className="mb-2 break-words text-lg font-semibold text-[var(--text-primary)]">{g.name} ({g.count})</h2>
              <div className="grid min-w-0 gap-2">
                {api.endpoints.filter((e) => e.groupSlug === g.slug).map((e) => (
                  <Link key={e.id} href={`/docs/${e.groupSlug}/${e.slug}`} className="mica-card flex min-w-0 items-center gap-3 p-3">
                    <MethodBadge method={e.method} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-semibold text-[var(--text-primary)]">{e.name}</span>
                    <code className="hidden max-w-[40%] truncate font-mono text-xs text-[var(--text-secondary)] md:block">{e.path}</code>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
