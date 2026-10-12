import { Youtube, Briefcase, LifeBuoy } from "lucide-react";
import { SITE } from "@/lib/site";

// Small ghost icon buttons with a visible tooltip on hover/keyboard focus.
// title + aria-label carry the accessible name. align="right" pins the
// tooltip to the button's right edge (for buttons at the viewport edge,
// so the centered tooltip can't cause horizontal overflow).
function MicaIconLink({ href, label, tip, children, align = "center" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="mica-icon-btn group relative"
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute -bottom-9 max-w-[220px] whitespace-normal text-center leading-snug rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-base)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${
          align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
        }`}
      >
        {tip ?? label}
      </span>
    </a>
  );
}

export function SocialButtons({ align = "center" }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <MicaIconLink href={SITE.youtube} label="Watch my YouTube channel" align={align}>
        <Youtube size={15} aria-hidden="true" />
      </MicaIconLink>
      <MicaIconLink href={SITE.portfolio} label="See my portfolio" align={align}>
        <Briefcase size={15} aria-hidden="true" />
      </MicaIconLink>
    </div>
  );
}

// Feedback / support link: questions, bug reports, improvement ideas.
// The hover card shows the same short tip style as the other navbar icons;
// the full description stays in the accessible name.
export function FeedbackButton({ align = "center" }) {
  return (
    <MicaIconLink
      href={SITE.feedback}
      label="Ask a question, report an issue, or suggest an improvement"
      tip="Feedback & support"
      align={align}
    >
      <LifeBuoy size={15} aria-hidden="true" />
    </MicaIconLink>
  );
}
