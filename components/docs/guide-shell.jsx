import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";

const CRUMBS = { label: "Guides", items: [] };

function GuideShell({ title, intro, activeId, children, crumbs }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: (crumbs || []).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-auto">
            <Sidebar activeId={activeId} />
          </div>
        </aside>
        <article className="mica-card min-w-0 max-w-full p-6 sm:p-8">
          <nav aria-label="Breadcrumb" className="mb-3 min-w-0 text-xs font-semibold text-[var(--text-secondary)]">
            <Link href="/" className="text-[var(--primary)] underline underline-offset-4">Home</Link>
            {" / "}
            <span>{CRUMBS.label}</span>
            {" / "}
            <span aria-current="page" className="break-words">{title}</span>
          </nav>
          <h1 className="break-words text-3xl font-semibold text-[var(--text-primary)]">{title}</h1>
          <p className="mt-2 font-medium text-[var(--text-secondary)]">{intro}</p>
          <div className="mt-6 min-w-0 space-y-5 text-[15px] font-normal leading-relaxed text-[var(--text-primary)]">{children}</div>
        </article>
      </div>
    </main>
  );
}

export function Guide({ meta, children }) {
  return (
    <GuideShell title={meta.title} intro={meta.intro} activeId={meta.activeId} crumbs={meta.crumbs}>
      {children}
    </GuideShell>
  );
}

export function H({ children }) {
  return <h2 className="pt-2 text-xl font-semibold text-[var(--text-primary)]">{children}</h2>;
}

export function P({ children }) {
  return <p className="min-w-0 break-words">{children}</p>;
}

export function GuideCode({ children }) {
  return (
    <div
      className="scroll-well"
      tabIndex="0"
      role="region"
      aria-label="Code sample (scroll horizontally to see more)"
    >
      <pre className="min-w-0 overflow-auto p-4 font-mono text-[13px] font-semibold text-[var(--text-primary)]">
        <code>{children}</code>
      </pre>
    </div>
  );
}
