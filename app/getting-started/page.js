import Link from "next/link";
import { Guide, H, P, GuideCode } from "@/components/docs/guide-shell";
import { Term } from "@/components/docs/term";
import { siteUrl } from "@/lib/site";

export const metadata = {
  title: "Getting started",
  description: "Three steps to your first request: pick an environment, get a token, try an endpoint.",
  alternates: { canonical: "/getting-started" },
};

export default function Page() {
  return (
    <Guide
      meta={{
        title: "Getting started",
        intro: "Three small steps. You will make a real request in under two minutes.",
        activeId: "/getting-started",
        crumbs: [
          { name: "Home", url: siteUrl() + "/" },
          { name: "Getting started", url: siteUrl() + "/getting-started" },
        ],
      }}
    >
      <H>Step 1 — Use the Base URL</H>
      <P>
        Every request in these docs runs against one{" "}
        <Term name="environment">Base URL</Term>:
      </P>
      <GuideCode>{`Base URL: http://ecommerce-backend-orpin-five.vercel.app`}</GuideCode>
      <H>Step 2 — Get a <Term name="token">token</Term></H>
      <P>
        A <Term name="token">token</Term> is a secret string that proves who you are.
        Open <Link href="/docs/users/login" className="text-[var(--primary)] underline">POST /users/login</Link>,
        press <strong>Send request</strong>, and copy the <code>data</code> value from
        the answer. Paste it into the token box — it stays in your browser only.
      </P>
      <H>Step 3 — Make your first request</H>
      <P>
        Open <Link href="/docs/users/get-user-profile" className="text-[var(--primary)] underline">GET /users/profile</Link> and
        press <strong>Send request</strong>. A <Term name="status code">200 status</Term> means
        success — you will see your own profile data.
      </P>
      <P>
        Tip: web addresses in these docs use <code>{"{{url}}"}</code> and{" "}
        <code>{"{{token}}"}</code> as placeholders. The playground fills them in for
        you from the Base URL above.
      </P>
    </Guide>
  );
}
