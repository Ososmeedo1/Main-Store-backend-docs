import Image from "next/image";
import { SITE } from "@/lib/site";

// Slim modern footer: hairline on top, one row — brand left, links right.
export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-5">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)]">
          <Image
            src="/logo.png"
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0 rounded-[var(--radius-xs)] border border-[var(--border)]"
          />
          <span className="truncate">
            {SITE.name} · Made by{" "}
            <a className="underline underline-offset-4" href={SITE.portfolio} target="_blank" rel="noopener noreferrer">
              {SITE.author}
            </a>
          </span>
        </span>
        <span className="ml-auto flex min-w-0 items-center gap-3">
          <a
            className="text-[13px] font-semibold text-[var(--text-secondary)] underline underline-offset-4"
            href={SITE.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube
          </a>
          <a
            className="text-[13px] font-semibold text-[var(--text-secondary)] underline underline-offset-4"
            href={SITE.portfolio}
            target="_blank"
            rel="noopener noreferrer"
          >
            Portfolio
          </a>
        </span>
      </div>
    </footer>
  );
}
