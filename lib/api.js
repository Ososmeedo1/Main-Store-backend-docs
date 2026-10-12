// api.json is generated at build time by scripts/parse-bruno.js.
// Imported statically so all docs pages are SSG.
import apiData from "@/data/api.json";
import searchIndex from "@/data/search-index.json";

export function getApi() {
  return apiData;
}

export function getSearchIndex() {
  return searchIndex;
}

export function getGroups() {
  return apiData.groups || [];
}

export function getEndpoints() {
  return apiData.endpoints || [];
}

export function getEnvironments() {
  return apiData.environments || [];
}

export function getEndpoint(groupSlug, endpointSlug) {
  return (apiData.endpoints || []).find(
    (e) => e.groupSlug === groupSlug && e.slug === endpointSlug
  );
}

export function endpointUrl(ep) {
  return `/docs/${ep.groupSlug}/${ep.slug}`;
}

// Replace {{var}} placeholders with values from a map.
export function interpolate(template, vars) {
  return String(template || "").replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k) => {
    const v = vars?.[k];
    return v == null ? "" : String(v);
  });
}
