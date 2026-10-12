import { createHighlighter } from "shiki";
import { CopyButton } from "./copy-button";

// Server-side highlighting so no highlighter ships to the client.
// github-light / github-dark-dimmed keep every syntax
// color at AAA-friendly contrast. Long lines scroll inside the well: the
// wrapper is keyboard-focusable (tabindex 0 + focus ring) and labelled.
let highlighterPromise = null;
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark-dimmed"],
      langs: ["bash", "javascript", "json", "http"],
    });
  }
  return highlighterPromise;
}

export async function CodeBlock({ code, lang = "json", title }) {
  const hl = await getHighlighter();
  const text = String(code || "");
  const light = hl.codeToHtml(text, { lang, theme: "github-light" });
  const dark = hl.codeToHtml(text, { lang, theme: "github-dark-dimmed" });
  const label = title ? `Code example: ${title}` : "Code example";
  return (
    <div className="min-w-0">
      <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">
        {title && (
          <p className="min-w-0 flex-1 break-words py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            {title}
          </p>
        )}
        <span className="ml-auto shrink-0">
          <CopyButton text={text} label={title ? `Copy ${title}` : "Copy code"} />
        </span>
      </div>
      <div
        className="scroll-well"
        tabIndex="0"
        role="region"
        aria-label={`${label} (scroll horizontally to see more)`}
      >
        <div
          className="block dark:hidden [&>pre]:!bg-transparent [&>pre]:!border-0"
          dangerouslySetInnerHTML={{ __html: light }}
        />
        <div
          className="hidden dark:block [&>pre]:!bg-transparent [&>pre]:!border-0"
          dangerouslySetInnerHTML={{ __html: dark }}
        />
      </div>
    </div>
  );
}
