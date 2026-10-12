import { getApi } from "@/lib/api";
import { siteUrl } from "@/lib/site";

export default function sitemap() {
  const base = siteUrl();
  const api = getApi();
  const staticPages = ["", "/getting-started"].map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: new Date(),
  }));
  const endpoints = api.endpoints.map((e) => ({
    url: `${base}/docs/${e.groupSlug}/${e.slug}`,
    lastModified: new Date(),
  }));
  return [...staticPages, ...endpoints];
}
