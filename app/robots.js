import { siteUrl } from "@/lib/site";

export default function robots() {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
