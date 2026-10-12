// Request snippet generators (cURL / fetch / axios). Pure functions, run on server.
function quote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

export function fullPath(ep, query) {
  const qs = new URLSearchParams();
  for (const q of ep.queryParams || []) {
    const v = query?.[q.name] ?? q.value ?? "";
    if (v !== "") qs.set(q.name, v);
  }
  const s = qs.toString();
  return `${ep.path}${s ? `?${s}` : ""}`;
}

export function curlSnippet(ep, { baseUrl, query, headers, body }) {
  const url = `${baseUrl}${fullPath(ep, query)}`;
  const lines = [`curl -X ${ep.method} ${quote(url)}`];
  for (const h of headers || []) {
    if (!h.value) continue;
    lines.push(`  -H ${quote(`${h.name}: ${h.value}`)}`);
  }
  if (body && ["POST", "PUT", "PATCH", "DELETE"].includes(ep.method)) {
    lines.push(`  -H 'Content-Type: application/json'`);
    lines.push(`  -d ${quote(body)}`);
  }
  return lines.join(" \\\n");
}

export function fetchSnippet(ep, { baseUrl, query, headers, body }) {
  const url = `${baseUrl}${fullPath(ep, query)}`;
  const hObj = {};
  for (const h of headers || []) if (h.value) hObj[h.name] = h.value;
  if (body) hObj["Content-Type"] = "application/json";
  const opts = [`method: ${JSON.stringify(ep.method)}`];
  if (Object.keys(hObj).length) opts.push(`headers: ${JSON.stringify(hObj, null, 2)}`);
  if (body) opts.push(`body: JSON.stringify(${body}, null, 2)`);
  return `const res = await fetch(${JSON.stringify(url)}, {\n  ${opts.join(",\n  ")}\n});\nconst data = await res.json();`;
}

export function axiosSnippet(ep, { baseUrl, query, headers, body }) {
  const url = `${baseUrl}${fullPath(ep, query)}`;
  const hObj = {};
  for (const h of headers || []) if (h.value) hObj[h.name] = h.value;
  const hasBody = Boolean(body) && ["POST", "PUT", "PATCH", "DELETE"].includes(ep.method);
  return `import axios from "axios";\n\nconst { data } = await axios(${JSON.stringify(url)}, {\n  method: ${JSON.stringify(ep.method)},\n  headers: ${JSON.stringify(hObj, null, 2)},\n${hasBody ? `  data: ${body},\n` : ""}});`;
}
