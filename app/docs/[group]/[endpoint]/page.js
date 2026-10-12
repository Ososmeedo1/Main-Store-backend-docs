import Link from "next/link";
import TryIt from "@/components/playground/try-it-lazy";
import { Sidebar } from "@/components/layout/sidebar";
import { MethodBadge } from "@/components/docs/method-badge";
import { CodeBlock } from "@/components/docs/code-block";
import { ExampleTabs } from "@/components/docs/example-tabs";
import { Term } from "@/components/docs/term";
import { AuthLock } from "@/components/api/auth-lock";
import { CopyLinkButton } from "@/components/api/copy-link-button";
import { PageHint } from "@/components/api/page-hint";
import { getApi, getEndpoint, endpointUrl } from "@/lib/api";
import { curlSnippet, fetchSnippet, axiosSnippet } from "@/lib/snippets";
import { SITE, siteUrl } from "@/lib/site";

// Fixed teaching order on every page:
// What it does → Request → Try it (+ Response) → Code examples → Details → Next step.
export async function generateStaticParams() {
  return getApi().endpoints.map((e) => ({ group: e.groupSlug, endpoint: e.slug }));
}

export async function generateMetadata({ params }) {
  const { group, endpoint } = await params;
  const ep = getEndpoint(group, endpoint);
  if (!ep) return { title: "Not found" };
  const title = `${ep.method} ${ep.path} — ${ep.name}`;
  const description = (ep.description || `${ep.method} ${ep.path} (${ep.group}).`).slice(0, 160);
  const url = `/docs/${ep.groupSlug}/${ep.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function firstSentence(text) {
  const t = String(text || "").split("\n").map((s) => s.trim()).filter(Boolean).join(" ");
  const m = t.match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1] : t.slice(0, 160);
}

function Table({ caption, note, rows, columns }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="min-w-0">
      <div
        className="scroll-well min-w-0"
        tabIndex="0"
        role="region"
        aria-label={`${caption} (scroll horizontally to see more)`}
      >
        <table className="stack-table w-full border-collapse text-left text-sm">
          <caption className="px-3 pb-2 pt-2 text-left text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            {caption}
          </caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="border-b border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="align-top">
                {columns.map((c) => {
                  const v = String(r[c.toLowerCase()] ?? r[c] ?? "");
                  const isReq = c.toLowerCase() === "required" && v === "required";
                  return (
                    <td key={c} data-label={c} className="border-b border-[var(--border)]/60 px-3 py-2 font-normal text-[var(--text-primary)] last:border-b-0">
                      {isReq ? (
                        <span className="mica-badge px-2 py-0.5 text-[11px] text-[var(--status-danger)]">
                          required
                        </span>
                      ) : (
                        <code className="break-all font-mono text-[13px]">{v}</code>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1 break-words text-[13px] font-normal text-[var(--text-secondary)]">{note}</p>}
    </div>
  );
}

export default async function EndpointPage({ params }) {
  const { group, endpoint } = await params;
  const ep = getEndpoint(group, endpoint);
  if (!ep) {
    return (
      <main className="mx-auto w-full max-w-3xl min-w-0 px-4 py-16">
        <h1 className="break-words text-2xl font-semibold text-[var(--text-primary)]">Endpoint not found</h1>
        <p className="mt-2"><Link href="/" className="font-semibold underline">Back home</Link></p>
      </main>
    );
  }
  const api = getApi();
  const headers = (ep.headers || []).map((h) => ({ name: h.name, value: h.value }));
  const query = Object.fromEntries((ep.queryParams || []).map((q) => [q.name, q.value || ""]));
  const body = ep.bodyRaw || "";
  const snippetProps = { baseUrl: "{{baseUrl}}", query, headers, body };
  const snippets = {
    curl: <CodeBlock title="cURL" lang="bash" code={curlSnippet(ep, snippetProps)} />,
    fetch: <CodeBlock title="JavaScript (fetch)" lang="javascript" code={fetchSnippet(ep, snippetProps)} />,
    axios: <CodeBlock title="Axios" lang="javascript" code={axiosSnippet(ep, snippetProps)} />,
  };
  const url = `${siteUrl()}/docs/${ep.groupSlug}/${ep.slug}`;
  const paras = (ep.description || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const summary = firstSentence(ep.description) || `${ep.name} (${ep.method} ${ep.path}).`;
  const rest = paras.length > 1 ? paras.slice(1).join("\n") : "";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: `${ep.method} ${ep.path} — ${ep.name}`,
      description: summary.slice(0, 200),
      author: { "@type": "Person", name: SITE.author },
      about: ep.group,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() + "/" },
        { "@type": "ListItem", position: 2, name: ep.group, item: siteUrl() + `/docs/${ep.groupSlug}/${ep.slug}` },
        { "@type": "ListItem", position: 3, name: ep.name, item: url },
      ],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-auto">
            <Sidebar activeId={`/docs/${ep.id}`} />
          </div>
        </aside>

        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-3 min-w-0 text-xs font-semibold text-[var(--text-secondary)]">
            <Link href="/" className="font-semibold underline underline-offset-4">Home</Link>
            {" / "}
            <span>{ep.group}</span>
            {" / "}
            <span aria-current="page" className="break-words">{ep.name}</span>
          </nav>

          <PageHint id="endpoint">
            New here? Press <strong>Send request</strong> below and read the
            answer. This hint shows once.
          </PageHint>

          {/* One calm column, always in teaching order:
              What → Request → Try it (+ Response) → Examples → Details → Next.
              Roomy and simple on purpose: no squeezed side-by-side panels. */}
          <article aria-labelledby="ep-title" className="mt-4 min-w-0 max-w-3xl space-y-4">
            <div className="mica-card min-w-0 p-6">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <MethodBadge method={ep.method} />
                  <AuthLock required={ep.auth.required} />
                  <span className="ml-auto shrink-0"><CopyLinkButton /></span>
                </div>
                <h1 id="ep-title" className="mt-3 break-words text-3xl font-semibold text-[var(--text-primary)]">{ep.name}</h1>
                <p className="mt-2 break-words text-lg font-semibold leading-relaxed text-[var(--text-primary)]">{summary}</p>
              </div>

              <section id="request" className="mica-card min-w-0 space-y-2 p-6" aria-label="Request">
                <h2 className="break-words text-xl font-semibold text-[var(--text-primary)]">Request</h2>
                <p className="min-w-0 break-all font-mono text-sm font-semibold text-[var(--primary)]">
                  <span className="mr-2">{ep.method}</span>
                  {ep.path}
                </p>
                <p className="break-words text-sm font-normal text-[var(--text-secondary)]">
                  This is the <Term name="endpoint">endpoint</Term> address. Requests
                  run against the Production server.
                </p>
              </section>

            {/* B — Try it (+ Response inside) */}
            <section id="try" aria-label="Try it">
              <h2 className="mb-2 break-words text-xl font-semibold text-[var(--text-primary)]">Try it</h2>
              <TryIt endpoint={ep} />
            </section>

            {/* C — Code examples */}
            <section id="examples" className="mica-card min-w-0 space-y-4 p-6" aria-label="Code examples">
              <h2 className="break-words text-xl font-semibold text-[var(--text-primary)]">Code examples</h2>
              <ExampleTabs snippets={snippets} />
              {body && <CodeBlock title="Body JSON" lang="json" code={body} />}
            </section>

            {/* D — Details */}
            <section id="details" className="mica-card min-w-0 space-y-4 p-6" aria-label="Details">
              <h2 className="break-words text-xl font-semibold text-[var(--text-primary)]">Details — all fields</h2>
              <Table
                caption="Headers"
                rows={(ep.headers || []).map((h) => ({ name: h.name, value: h.value, required: h.required ? "required" : "optional" }))}
                columns={["Name", "Value", "Required"]}
              />
              <Table
                caption="Query params"
                rows={(ep.queryParams || []).map((q) => ({ name: q.name, value: q.value || "—", required: "optional" }))}
                columns={["Name", "Value", "Required"]}
              />
              <Table
                caption="Path params"
                rows={(ep.pathParams || []).map((p) => ({ name: p.name, value: p.value || "—", required: "required" }))}
                columns={["Name", "Value", "Required"]}
              />
              <Table
                caption="Body fields (types and examples from Bruno)"
                note="The Bruno export does not mark body fields required or optional, so every field below is an example value — the API names any missing required field in its error."
                rows={(ep.bodySchema || []).map((f) => ({ name: f.name, type: f.type, example: f.example.slice(0, 80) }))}
                columns={["Name", "Type", "Example"]}
              />
              {rest && (
                <div className="min-w-0 break-words text-[15px] font-normal leading-relaxed text-[var(--text-primary)]">
                  <h3 className="text-base font-semibold">More about this endpoint</h3>
                  <p className="mt-1 whitespace-pre-line">{rest}</p>
                </div>
              )}
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-[var(--text-primary)]">Possible answers</h3>
                <ul className="mt-1 min-w-0 list-disc space-y-1 pl-5 text-sm font-normal text-[var(--text-primary)]">
                  <li className="break-words"><strong>2xx</strong> — it worked{ep.response?.status ? ` (this one usually returns ${ep.response.status})` : ""}.</li>
                  <li className="break-words"><strong>400/422</strong> — a field is missing or invalid.</li>
                  {ep.auth.required && <li className="break-words"><strong>401/403</strong> — log in first (use Authorize).</li>}
                  <li className="break-words"><strong>404</strong> — the id or name was not found.</li>
                </ul>
              </div>
              {ep.response?.bodyRaw && (
                <div className="min-w-0">
                  <h3 className="break-words text-base font-semibold text-[var(--text-primary)]">Saved example answer</h3>
                  <div className="mt-2 min-w-0"><CodeBlock lang="json" code={ep.response.bodyRaw} /></div>
                </div>
              )}
            </section>

            {/* E — Next step */}
            <nav className="mica-card min-w-0 p-4" aria-label="Next step">
              {ep.next ? (
                <Link href={endpointUrl({ groupSlug: ep.next.id.split("/")[0], slug: ep.next.id.split("/")[1] })} className="block min-w-0 rounded-[var(--radius-xs)]">
                  <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">Next step in this topic</span>
                  <span className="block truncate font-semibold text-[var(--primary)]">{ep.next.name} →</span>
                </Link>
              ) : (
                <p className="break-words text-sm font-normal text-[var(--text-secondary)]">That was the last endpoint. <Link href="/docs" className="font-semibold underline">Browse all topics</Link>.</p>
              )}
              {ep.prev && (
                <Link href={endpointUrl({ groupSlug: ep.prev.id.split("/")[0], slug: ep.prev.id.split("/")[1] })} className="mt-2 block min-w-0 truncate text-sm font-normal text-[var(--text-secondary)]">
                  ← Back to <span className="underline">{ep.prev.name}</span>
                </Link>
              )}
            </nav>
          </article>

          <a
            href="#try"
            className="mica-btn mica-btn-primary fixed bottom-4 right-4 z-40 border-[var(--text-inverse)] lg:hidden"
          >
            Try it ↓
          </a>
        </div>
      </div>
    </main>
  );
}
