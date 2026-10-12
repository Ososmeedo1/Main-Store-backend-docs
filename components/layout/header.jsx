import Image from "next/image";
import { SITE } from "@/lib/site";
import { ThemeSelect } from "./theme-select";
import { SearchTrigger } from "@/components/search/search-trigger";
import { MobileNav } from "./mobile-nav";
import { SocialButtons, FeedbackButton } from "./social-buttons";
import { AuthorizeButton, AuthorizeDialog } from "@/components/auth/authorize-dialog";

// Simple single-row bar: logo · social/feedback icons · search/theme/authorize.
// The logo opens the YouTube channel; guides live in the sidebar.
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface-content)]">
      <div className="mx-auto flex h-14 w-full max-w-7xl min-w-0 items-center gap-1.5 px-3 sm:gap-2 sm:px-4">
        <MobileNav />
        <a
          href={SITE.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2 rounded-[var(--radius-xs)] py-1 pr-1"
          aria-label={`${SITE.name} — open YouTube channel`}
          title="Open YouTube channel"
        >
          <Image
            src="/logo.png"
            alt=""
            width={30}
            height={30}
            priority
            className="size-[30px] shrink-0 rounded-[var(--radius-xs)] border border-[var(--border)]"
          />
          <span className="hidden min-w-0 leading-tight min-[420px]:block">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{SITE.name}</span>
          </span>
        </a>
        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <SocialButtons />
          <FeedbackButton />
          <SearchTrigger />
          <ThemeSelect />
          <span className="mx-0.5 hidden h-5 w-px bg-[var(--border)] sm:block" aria-hidden="true" />
          <AuthorizeButton />
        </div>
      </div>
      <AuthorizeDialog />
    </header>
  );
}
