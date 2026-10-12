// Plain-language explanations of API results for beginners.
export function statusMeaning(status) {
  if (status == null) return "No status received.";
  if (status >= 200 && status < 300) {
    if (status === 201) return "201 means success — something new was created.";
    return "200 means success — your request worked.";
  }
  if (status === 400 || status === 422)
    return "This usually means a field is missing or invalid. Check the Parameters table above and try again.";
  if (status === 401)
    return "401 means the API did not recognize you. Log in again (POST /users/login) and paste the fresh token.";
  if (status === 403)
    return "403 means you are logged in but not allowed to do this. Check that you use the right account.";
  if (status === 404)
    return "404 means the thing you asked for was not found. Check the id or slug in the URL.";
  if (status >= 500) return "The server had a problem. Wait a moment and try again.";
  return `Status ${status} received. 200–299 means success; 400+ means something needs fixing.`;
}

export function errorFix(message) {
  const m = String(message || "").toLowerCase();
  if (m.includes("not allowed")) return "Fix: pick one of the listed environments, or type your own base URL.";
  if (m.includes("timed out")) return "Fix: check your connection and try again.";
  if (m.includes("too large")) return "Fix: ask for a smaller page (e.g. add ?limit=10).";
  if (m.includes("failed") || m.includes("network"))
    return "Fix: check your internet connection, then press Send request again.";
  return "Fix: read the message above, adjust the request, and try again.";
}
