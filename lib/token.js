// Token helpers. The API expects the token header value prefixed with the
// account key "osama" glued directly in front of the token (no space).
// Users paste the raw token; the site adds the prefix when sending.
export const TOKEN_PREFIX = "osama";

export function wireToken(raw) {
  const t = String(raw || "").trim();
  if (!t) return "";
  return t.startsWith(TOKEN_PREFIX) ? t : TOKEN_PREFIX + t;
}

export function maskToken(raw) {
  const t = String(raw || "").trim();
  if (t.length <= 10) return "••••••";
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}

export function isJwtLike(s) {
  return typeof s === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s.trim());
}

function isIdLike(s) {
  return typeof s === "string" && /^[a-fA-F0-9]{24}$/.test(s.trim());
}

// Walk a response body and collect reusable values (max 6, depth-capped).
// Returns [{ kind: "token" | "id", label, value }]. No invention: only values
// actually present in the response.
export function findReusableValues(body, out = [], depth = 0) {
  if (out.length >= 6 || depth > 4 || body == null) return out;
  if (typeof body === "string") {
    if (isJwtLike(body)) out.push({ kind: "token", label: "Token from response", value: body });
    else if (isIdLike(body)) out.push({ kind: "id", label: "ID from response", value: body });
    return out;
  }
  if (Array.isArray(body)) {
    for (const v of body) findReusableValues(v, out, depth + 1);
    return out;
  }
  if (typeof body === "object") {
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string" && /token/i.test(k) && v.trim()) {
        out.push({ kind: "token", label: `Token (${k})`, value: v });
        if (out.length >= 6) return out;
        continue;
      }
      findReusableValues(v, out, depth + 1);
    }
  }
  return out;
}
