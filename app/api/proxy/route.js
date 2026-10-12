import { allowedBaseUrls } from "@/lib/site";

// Safe CORS proxy: POST { method, baseUrl, path, query, headers, body }.
// Guards: allowlisted base URLs, http(s) only, no private IPs, timeout,
// response size cap, hop-by-hop header stripping, tiny in-memory rate limit.
export const runtime = "nodejs";

const TIMEOUT_MS = 15000;
const MAX_BYTES = 1_000_000;

// naive per-IP bucket: 60 req/min
const buckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, reset: now + 60_000 };
  if (now > b.reset) {
    b.count = 0;
    b.reset = now + 60_000;
  }
  b.count++;
  buckets.set(ip, b);
  return b.count > 60;
}

function isBlockedHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^127\./.test(h) || h === "::1" || h === "[::1]") return true;
  if (h === "0.0.0.0" || h === "[::]") return true;
  if (/\.internal$|\.svc$|\.cluster\.local$/.test(h)) return true;
  // metadata endpoints
  if (h === "169.254.169.254" || h === "metadata.google.internal") return true;
  return false;
}

const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade", "host", "content-length",
]);

export async function POST(req) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Rate limited. Slow down." }, { status: 429 });
  }
  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  const { method, baseUrl, path, query, headers, body } = payload || {};
  const allowed = allowedBaseUrls();
  const cleanBase = String(baseUrl || "").replace(/\/$/, "");
  if (!allowed.includes(cleanBase)) {
    return Response.json(
      { error: `Base URL not allowed. Allowed: ${allowed.join(", ")}` },
      { status: 403 }
    );
  }
  let target;
  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query || {})) {
      if (v !== "" && v != null) qs.set(k, String(v));
    }
    const p = String(path || "/").startsWith("/") ? path : `/${path}`;
    target = new URL(`${cleanBase}${p}${qs.toString() ? `?${qs}` : ""}`);
  } catch {
    return Response.json({ error: "Invalid path/query." }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol)) {
    return Response.json({ error: "Only http(s) allowed." }, { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return Response.json({ error: "Blocked destination host." }, { status: 403 });
  }
  // DNS-level SSRF: re-resolve is out of scope for edge; hostname blocklist above applies.

  const outHeaders = {};
  for (const h of headers || []) {
    if (!h?.name) continue;
    const k = String(h.name).toLowerCase();
    if (HOP_BY_HOP.has(k) || k.startsWith("x-forwarded") || k.startsWith("cf-")) continue;
    outHeaders[h.name] = String(h.value ?? "");
  }
  // Bruno auto-sends `Content-Type: application/json` for JSON bodies, but the
  // playground form only forwards user-visible headers (usually just `token`).
  // Node fetch then defaults string bodies to `text/plain;charset=UTF-8`,
  // which the backend Joi validation rejects. Default to JSON like Bruno.
  const upperMethod = String(method || "GET").toUpperCase();
  const hasBody = body != null && String(body).length > 0 && !["GET", "HEAD"].includes(upperMethod);
  if (hasBody) {
    const hasContentType = Object.keys(outHeaders).some(
      (k) => k.toLowerCase() === "content-type"
    );
    if (!hasContentType) outHeaders["Content-Type"] = "application/json";
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const upstream = await fetch(target.toString(), {
      method: upperMethod,
      headers: outHeaders,
      body: hasBody ? String(body) : undefined,
      signal: ctrl.signal,
      redirect: "follow",
    });
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return Response.json({ error: "Upstream response too large." }, { status: 502 });
    }
    const text = Buffer.from(buf).toString("utf8");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    const safeHeaders = {};
    upstream.headers.forEach((v, k) => {
      if (!HOP_BY_HOP.has(k.toLowerCase())) safeHeaders[k] = v;
    });
    return Response.json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: safeHeaders,
      body: parsed,
      size: buf.byteLength,
      elapsedMs: Date.now() - t0,
    });
  } catch (e) {
    const msg = e?.name === "AbortError" ? "Upstream timed out." : "Upstream fetch failed.";
    return Response.json({ error: msg }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
