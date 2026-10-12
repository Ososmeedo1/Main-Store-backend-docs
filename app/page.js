import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Term } from "@/components/docs/term";
import { PageHint } from "@/components/api/page-hint";
import { getApi } from "@/lib/api";
import { SITE, siteUrl } from "@/lib/site";

export const metadata = {
  title: `${SITE.name} — ${SITE.collection} REST API`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    n: "1",
    title: "Register an account",
    text: "Create your account with an email and password. It takes seconds.",
    href: "/docs/users/register",
    cta: "Register now",
  },
  {
    n: "2",
    title: "Log in and get a token",
    text: "Log in, then press Use this token. It proves who you are.",
    href: "/docs/users/login",
    cta: "Log in now",
  },
  {
    n: "3",
    title: "Add the token, explore everything",
    text: "Your token works on every endpoint. Start with your profile.",
    href: "/docs/users/get-user-profile",
    cta: "Try your first request",
  },
];

export default function Home() {
  const api = getApi();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: siteUrl(),
      description: SITE.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: `${SITE.collection} API documentation`,
      description: SITE.description,
      author: { "@type": "Person", name: SITE.author },
    },
  ];
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-auto">
            <Sidebar activeId="/" />
          </div>
        </aside>
        <article className="min-w-0">
          <section className="mica-card min-w-0 overflow-hidden p-6 sm:p-8" aria-label="Introduction">
            <div className="flex min-w-0 items-start gap-4">
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                priority
                className="size-11 shrink-0 rounded-[var(--radius-xs)] border border-[var(--border)]"
              />
              <div className="min-w-0">
                <p className="inline-flex min-w-0 items-center rounded-full border border-[var(--border)] bg-[var(--surface-inset)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                  {api.endpoints.length} endpoints · {api.groups.length} topics
                </p>
                <h1 className="mt-2 max-w-[60ch] break-words text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl">
                  Learn the Main Store API in minutes.
                </h1>
                <p className="mt-3 max-w-[70ch] font-normal text-[var(--text-secondary)]">
                  This guide explains every <Term name="endpoint">endpoint</Term> in plain
                  words and lets you try each one safely. Start below — no setup needed.
                </p>
                <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                  <Link href="#start" className="mica-btn mica-btn-primary px-4 py-2 text-sm">
                    Start in 3 steps <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                  <Link href="#endpoints" className="mica-btn px-4 py-2 text-sm">
                    Browse endpoints
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 min-w-0">
            <PageHint id="home">
              Welcome! Pick <strong>step 1</strong> below — you will make a real
              request within 3 clicks. This hint shows once.
            </PageHint>
          </div>

          <section id="start" className="mt-8 min-w-0 scroll-mt-20" aria-label="Start here">
            <h2 className="mb-1 break-words text-xl font-semibold text-[var(--text-primary)]">Start here — 3 steps</h2>
            <p className="mb-3 break-words text-sm font-normal text-[var(--text-secondary)]">
              Follow them in order. Each step unlocks the next.
            </p>
            <ol className="grid min-w-0 list-none gap-4 p-0 sm:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="mica-card flex min-w-0 flex-col p-5">
                  <p className="flex size-7 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-sm font-semibold text-[var(--primary)]" aria-hidden="true">
                    {s.n}
                  </p>
                  <h3 className="mt-3 break-words text-[15px] font-semibold text-[var(--text-primary)]">{s.title}</h3>
                  <p className="mt-1 flex-1 break-words text-sm font-normal text-[var(--text-secondary)]">{s.text}</p>
                  <Link href={s.href} className="mt-4 inline-flex min-h-[44px] min-w-0 items-center gap-1.5 text-sm font-semibold text-[var(--primary)] underline underline-offset-4">
                    {s.cta} <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <hr className="my-8 border-t border-[var(--border)]" />

          <section id="endpoints" className="min-w-0 scroll-mt-20" aria-label="Endpoint groups">
            <h2 className="mb-1 break-words text-xl font-semibold text-[var(--text-primary)]">Browse by topic ({api.groups.length})</h2>
            <p className="mb-3 break-words text-sm font-normal text-[var(--text-secondary)]">
              Pick a topic to open its first endpoint, then move with the next-step links.
            </p>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {api.groups.map((g) => (
                <Link key={g.slug} href={`/docs/${g.slug}/${slugOfFirst(api, g.slug)}`} className="mica-card group min-w-0 p-5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[var(--text-primary)]">{g.name}</span>
                    <span className="shrink-0 rounded-full bg-[var(--surface-inset)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">{g.count}</span>
                    <ArrowRight size={14} className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                  <span className="mt-2 block truncate text-sm font-normal text-[var(--text-secondary)]">
                    {firstNames(api, g.slug).join(" · ")}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

function slugOfFirst(api, groupSlug) {
  return (api.endpoints.find((e) => e.groupSlug === groupSlug) || {}).slug || "";
}
function firstNames(api, groupSlug) {
  return api.endpoints.filter((e) => e.groupSlug === groupSlug).slice(0, 3).map((e) => e.name);
}
