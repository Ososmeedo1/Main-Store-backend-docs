// Bruno collection parser — build-time only (Node, no deps).
// Reads .bru files + environments, emits data/api.json + data/search-index.json.
// Source of truth: the Bruno export. Nothing is invented; missing pieces stay empty.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
// Single source of truth: the up-to-date Bruno collection under ./API_Docs/.
// The collection root is ./API_Docs/Ecommerce (holds bruno.json); ./API_Docs
// itself is kept as fallback. No other locations are consulted.
const CANDIDATE_COLLECTIONS = [
  path.join(ROOT, "API_Docs", "Ecommerce"),
  path.join(ROOT, "API_Docs"),
];
const CANDIDATE_DOCS = [
  path.join(ROOT, "API_Docs", "Ecommerce-documentation.html"),
  path.join(ROOT, "docs.html"),
];
const OUT_API = path.join(ROOT, "data", "api.json");
const OUT_SEARCH = path.join(ROOT, "data", "search-index.json");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

function findDir(cands) {
  // Prefer the candidate that is an actual collection root (holds bruno.json);
  // fall back to the first existing directory.
  let fallback = null;
  for (const c of cands) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
        if (fs.existsSync(path.join(c, "bruno.json"))) return c;
        if (!fallback) fallback = c;
      }
    } catch {}
  }
  return fallback;
}

function slugify(s) {
  return String(s || "endpoint")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "endpoint";
}

function walkBru(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.toLowerCase() === "assets") continue;
      walkBru(p, out);
    } else if (e.name.endsWith(".bru")) {
      out.push(p);
    }
  }
  return out;
}

// Extract top-level blocks: `name { ... }` / `name:sub { ... }`
// Handles nested braces + triple-quoted (''') opaque strings.
function extractBlocks(text) {
  const blocks = [];
  const headerRe = /^([A-Za-z0-9_-]+)(?::([A-Za-z0-9_-]+))?\s*\{\s*$/;
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(headerRe) ||
      lines[i].replace(/\{[^}]*\}/g, "").match(headerRe);
    // also support inline `headers { token: ... }` single-line? not present; skip
    if (m) {
      const name = m[1];
      const sub = m[2] || null;
      let depth = 1;
      let inTrip = false;
      const buf = [];
      i++;
      for (; i < lines.length; i++) {
        let line = lines[i];
        // toggle triple-quote state counting occurrences on this line
        const trips = (line.match(/'''/g) || []).length;
        buf.push(line);
        if (trips % 2 === 1) inTrip = !inTrip;
        if (!inTrip) {
          for (const ch of line) {
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
          }
        }
        if (depth === 0) {
          buf.pop(); // drop closing brace line (or its remainder)
          break;
        }
      }
      blocks.push({ name, sub, body: buf.join("\n") });
    } else {
      i++;
    }
  }
  return blocks;
}

function parseKVLines(body) {
  const out = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line === "}") continue;
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) out.push({ name: m[1].trim(), value: m[2].trim() });
  }
  return out;
}

function getFirst(blocks, name, sub) {
  return blocks.find((b) => b.name === name && (sub === undefined || b.sub === sub));
}

function parsePlainDescription(b) {
  // Fallback for `description: single-line text` (no triple quotes).
  // Captures the first line plus wrapped continuation lines; stops at a
  // blank line or the next key (e.g. request:/response: blocks).
  const lines = String(b || "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^[ \t]*description:[ \t]*(.*)$/);
    if (!m) continue;
    const first = (m[1] || "").trim();
    if (!first || first.startsWith("'")) continue; // triple-quoted handled elsewhere
    const parts = [first];
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (!l.trim()) break;
      if (/^\s*[A-Za-z][A-Za-z0-9_.-]*\s*:/.test(l)) break;
      parts.push(l.trim());
    }
    return parts.join(" ").trim();
  }
  return "";
}

function parseExample(blocks) {
  const ex = getFirst(blocks, "example");
  if (!ex) return {};
  const b = ex.body;
  const nameM = b.match(/name:\s*(.+)/);
  // description '''...'''
  const descM = b.match(/description:\s*'''(.*?)'''/s);
  let description = (descM && descM[1].trim()) || "";
  if (!description) description = parsePlainDescription(b);
  const statusM = b.match(/status:\s*\{\s*code:\s*(\d+)\s*text:\s*(.+?)\s*\}/s);
  const respBodyM = b.match(/body:\s*\{\s*type:\s*(\w+)\s*content:\s*'''(.*?)'''/s);
  const respHeadersM = b.match(/response:\s*\{\s*headers:\s*\{(.*?)\}\s*status:/s);
  let respHeaders = [];
  if (respHeadersM) respHeaders = parseKVLines(respHeadersM[1]);
  return {
    exampleName: (nameM && nameM[1].trim()) || "",
    description,
    status: statusM ? Number(statusM[1]) : null,
    statusText: statusM ? statusM[2].trim() : "",
    responseType: (respBodyM && respBodyM[1].trim()) || "json",
    responseBodyRaw: (respBodyM && respBodyM[2].trim()) || "",
    responseHeaders: respHeaders,
  };
}

// Parse `body:multipart-form` / `body:form-urlencoded` blocks into fields.
// Skips Bruno-disabled (~name) entries, handles ''' multiline values, and
// turns @file(local Windows path) into a file field (path stripped to its
// basename — absolute local paths must never reach the public docs).
function parseFormFields(blockBody) {
  const fields = [];
  const lines = String(blockBody || "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    i++;
    if (!line || line.startsWith("#") || line === "}") continue;
    if (line.startsWith("~")) continue; // disabled in Bruno
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const name = m[1].trim();
    let value = (m[2] || "").trim();
    if (!name) continue;
    // triple-quoted multiline value (e.g. specs: ''' {...} ''')
    if (value.startsWith("'''")) {
      value = value.slice(3);
      if (value.includes("'''")) {
        value = value.split("'''")[0];
      } else {
        const buf = [value];
        while (i < lines.length) {
          const l = lines[i];
          i++;
          if (l.includes("'''")) {
            buf.push(l.split("'''")[0]);
            break;
          }
          buf.push(l);
        }
        value = buf.join("\n");
      }
      value = value.trim();
      fields.push({ name, type: "string", example: value.slice(0, 120), sample: `${name}: ${value}` });
      continue;
    }
    const fileM = value.match(/@file\(\s*([^)]+?)\s*\)/);
    const ctM = value.match(/@contentType\(\s*([^)]+?)\s*\)/);
    if (fileM) {
      const base = String(fileM[1]).trim().split(/[\\/]/).pop() || "your-file";
      const ct = ctM ? ctM[1].trim() : "";
      fields.push({
        name,
        type: ct ? `file (${ct})` : "file",
        example: base,
        sample: `${name}: @file(${base})`,
      });
      continue;
    }
    let type = "string";
    if (/^-?\d+(\.\d+)?$/.test(value)) type = "number";
    else if (/^(true|false)$/i.test(value)) type = "boolean";
    fields.push({ name, type, example: value.slice(0, 120), sample: `${name}: ${value}` });
  }
  return fields;
}

function inferSchema(obj, prefix = "") {
  const rows = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const t = Array.isArray(v) ? "array" : v === null ? "null" : typeof v;
      let example = v;
      if (typeof v === "object") example = JSON.stringify(v).slice(0, 120);
      rows.push({ name: prefix ? `${prefix}.${k}` : k, type: t, example: String(example ?? "") });
      if (v && typeof v === "object" && !Array.isArray(v)) {
        rows.push(...inferSchema(v, prefix ? `${prefix}.${k}` : k).slice(0, 0)); // keep flat top-level only
      }
    }
  }
  return rows;
}

function parseRequestFile(file, collectionRoot) {
  const text = fs.readFileSync(file, "utf8");
  const blocks = extractBlocks(text);
  const meta = getFirst(blocks, "meta");
  const metaKVs = meta ? parseKVLines(meta.body) : [];
  const metaMap = Object.fromEntries(metaKVs.map((kv) => [kv.name, kv.value]));
  if (!metaMap.type || metaMap.type !== "http") return null; // folder.bru / env
  const name = metaMap.name || path.basename(file, ".bru");

  let method = null;
  let urlRaw = "";
  let bodyMode = "none";
  for (const m of HTTP_METHODS) {
    const blk = getFirst(blocks, m);
    if (blk) {
      method = m.toUpperCase();
      const kvs = parseKVLines(blk.body);
      const um = Object.fromEntries(kvs.map((kv) => [kv.name, kv.value]));
      urlRaw = um.url || "";
      bodyMode = um.body || "none";
      break;
    }
  }
  if (!method) return null;

  const headersBlk = getFirst(blocks, "headers");
  const headers = headersBlk ? parseKVLines(headersBlk.body) : [];
  const qBlk = blocks.find((b) => b.name === "params" && b.sub === "query");
  const queryParams = qBlk ? parseKVLines(qBlk.body) : [];

  let bodyRaw = "";
  let bodyType = bodyMode;
  let bodySchema = [];
  const bodyJsonBlk = blocks.find((b) => b.name === "body" && b.sub === "json");
  if (bodyJsonBlk) {
    bodyRaw = bodyJsonBlk.body.trim();
    bodyType = "json";
  }
  // form bodies (file uploads + urlencoded): fields become the docs' body
  // table + sample; the playground can't Send files so it shows guidance.
  const bodyFormBlk = blocks.find(
    (b) => b.name === "body" && (b.sub === "multipart-form" || b.sub === "form-urlencoded")
  );
  if (bodyFormBlk) {
    const formFields = parseFormFields(bodyFormBlk.body);
    if (formFields.length) {
      bodyType = bodyMode && bodyMode !== "none" ? bodyMode : "multipartForm";
      bodyRaw = formFields.map((f) => f.sample).join("\n");
      bodySchema = formFields.map(({ name, type, example }) => ({ name, type, example }));
    }
  }

  const docsBlk = getFirst(blocks, "docs");
  const ex = parseExample(blocks);
  const description = (ex.description || "").trim() || (docsBlk ? docsBlk.body.trim() : "");

  // Split path + querystring from urlRaw (strip {{url}} / {{baseUrl}} vars)
  let withoutVar = urlRaw.replace(/\{\{\s*(url|baseUrl)\s*\}\}/g, "").trim();
  let pathPart = withoutVar.split("?")[0] || "/";
  if (!pathPart.startsWith("/")) pathPart = "/" + pathPart;
  const qs = withoutVar.includes("?") ? withoutVar.split("?").slice(1).join("?") : "";
  const qsParams = [];
  if (qs) {
    for (const pair of qs.split("&")) {
      if (!pair) continue;
      const [k, ...rest] = pair.split("=");
      qsParams.push({ name: decodeURIComponent(k), value: decodeURIComponent(rest.join("=") || ""), required: false });
    }
  }
  // merge explicit params:query (authoritative names)
  for (const qp of queryParams) {
    if (!qsParams.find((q) => q.name === qp.name)) {
      qsParams.push({ name: qp.name, value: qp.value || "", required: false });
    }
  }

  // Path params: :id segments
  const pathParams = [...pathPart.matchAll(/:([A-Za-z0-9_]+)/g)].map((m) => ({
    name: m[1], value: "", required: true,
  }));

  let bodyPretty = bodyRaw;
  if (bodyType === "json" && bodyRaw) {
    try {
      const obj = JSON.parse(bodyRaw);
      bodyPretty = JSON.stringify(obj, null, 2);
      bodySchema = inferSchema(obj);
    } catch {
      bodyPretty = bodyRaw;
    }
  }

  let responseJson = null;
  if (ex.responseBodyRaw) {
    try {
      responseJson = JSON.parse(ex.responseBodyRaw);
    } catch {
      responseJson = null;
    }
  }

  const rel = path.relative(collectionRoot, path.dirname(file));
  const groupName = rel.split(path.sep)[0] || "General";
  const requiresAuth = headers.some((h) => h.name.toLowerCase() === "token");

  return {
    file: path.relative(collectionRoot, file),
    group: groupName,
    name,
    method,
    urlRaw,
    path: pathPart,
    queryParams: qsParams,
    pathParams,
    headers: headers.map((h) => ({ name: h.name, value: h.value, required: h.name.toLowerCase() === "token" })),
    bodyType,
    bodyRaw: bodyPretty,
    bodySchema,
    auth: { required: requiresAuth, type: requiresAuth ? "apiKey" : "none", in: "header", name: "token" },
    description,
    docsNote: docsBlk ? docsBlk.body.trim().slice(0, 500) : "",
    exampleName: ex.exampleName || "",
    response: {
      status: ex.status || null,
      statusText: ex.statusText || "",
      headers: ex.responseHeaders || [],
      bodyRaw: (ex.responseBodyRaw || "").trim(),
      bodyJson: responseJson,
      type: ex.responseType || "json",
    },
    seq: Number(metaMap.seq || 0),
  };
}

// Environments: every *.bru under <collection>/environments is real and
// surfaced in the server picker, snippets, and proxy allowlist.
// Verified 2026-10-10: this collection ships only Dev + Production, so there
// is no exclusion list and no legacy rename shim.
function parseEnvironments(collectionRoot) {
  const envDir = path.join(collectionRoot, "environments");
  const envs = [];
  if (!fs.existsSync(envDir)) return envs;
  for (const f of fs.readdirSync(envDir)) {
    if (!f.endsWith(".bru")) continue;
    const name = path.basename(f, ".bru");
    const text = fs.readFileSync(path.join(envDir, f), "utf8");
    const blocks = extractBlocks(text);
    const vars = getFirst(blocks, "vars");
    const kvs = vars ? parseKVLines(vars.body) : [];
    const map = Object.fromEntries(kvs.map((kv) => [kv.name, kv.value]));
    envs.push({ name, variables: map });
  }
  return envs;
}

function readCollectionName(collectionRoot) {
  try {
    const raw = fs.readFileSync(path.join(collectionRoot, "bruno.json"), "utf8");
    const name = JSON.parse(raw).name;
    if (name && String(name).trim()) return String(name).trim();
  } catch {}
  return path.basename(collectionRoot);
}

// Single swap point: Bruno .bru files -> normalized doc model consumed by
// the UI (data/api.json). To swap the source later, replace only this
// function and keep the returned endpoint shape stable.
function adaptBrunoToDocModel(file, collectionRoot) {
  return parseRequestFile(file, collectionRoot);
}

function main() {
  const collectionRoot = findDir(CANDIDATE_COLLECTIONS);
  if (!collectionRoot) {
    console.error("Bruno collection not found. Looked for:", CANDIDATE_COLLECTIONS.join(", "));
    process.exit(1);
  }
  console.log("Collection root:", collectionRoot);
  const collectionName = readCollectionName(collectionRoot);
  console.log(`Collection name (bruno.json): ${collectionName}`);

  const files = walkBru(collectionRoot).filter((f) => !f.includes(`${path.sep}environments${path.sep}`));
  const endpoints = [];
  for (const f of files) {
    try {
      const ep = adaptBrunoToDocModel(f, collectionRoot);
      if (ep) endpoints.push(ep);
    } catch (e) {
      console.warn("Failed to parse", f, e.message);
    }
  }

  // stable order: group alpha, then seq, then name
  endpoints.sort((a, b) =>
    a.group.localeCompare(b.group) || (a.seq - b.seq) || a.name.localeCompare(b.name)
  );

  // ids + slugs (unique)
  const seen = new Set();
  for (const ep of endpoints) {
    ep.groupSlug = slugify(ep.group);
    let s = slugify(ep.name);
    let u = s, n = 2;
    while (seen.has(`${ep.groupSlug}/${u}`)) u = `${s}-${n++}`;
    seen.add(`${ep.groupSlug}/${u}`);
    ep.slug = u;
    ep.id = `${ep.groupSlug}/${u}`;
  }

  const groups = [];
  for (const ep of endpoints) {
    let g = groups.find((x) => x.slug === ep.groupSlug);
    if (!g) {
      g = { name: ep.group, slug: ep.groupSlug, count: 0, endpoints: [] };
      groups.push(g);
    }
    g.count++;
    g.endpoints.push(ep.id);
  }
  groups.sort((a, b) => a.name.localeCompare(b.name));

  // prev/next in global order
  endpoints.forEach((ep, i) => {
    ep.prev = i > 0 ? { id: endpoints[i - 1].id, name: endpoints[i - 1].name } : null;
    ep.next = i < endpoints.length - 1 ? { id: endpoints[i + 1].id, name: endpoints[i + 1].name } : null;
  });

  const environments = parseEnvironments(collectionRoot);
  const baseUrls = [...new Set(environments.map((e) => e.variables.url).filter(Boolean))];

  // Optional: note docs.html presence (same data, descriptions already from .bru examples)
  const docsFile = CANDIDATE_DOCS.find((d) => { try { return fs.existsSync(d); } catch { return false; } });

  const data = {
    generatedAt: new Date().toISOString(),
    collection: collectionName,
    collectionRoot: path.basename(collectionRoot),
    docsHtml: docsFile ? path.basename(docsFile) : null,
    environments,
    baseUrls,
    groups,
    endpoints,
  };

  fs.mkdirSync(path.dirname(OUT_API), { recursive: true });
  fs.writeFileSync(OUT_API, JSON.stringify(data, null, 2));
  const searchIndex = endpoints.map((e) => ({
    id: e.id, group: e.group, groupSlug: e.groupSlug, slug: e.slug,
    name: e.name, method: e.method, path: e.path,
    description: (e.description || "").slice(0, 300),
  }));
  fs.writeFileSync(OUT_SEARCH, JSON.stringify(searchIndex, null, 2));

  console.log(`Parsed ${endpoints.length} endpoints in ${groups.length} groups.`);
  for (const g of groups) console.log(` - ${g.name} (${g.count})`);
  console.log("Environments:", environments.map((e) => `${e.name} -> ${e.variables.url || "(no url)"}`).join(" | "));
  console.log("Wrote", OUT_API);
}

main();
