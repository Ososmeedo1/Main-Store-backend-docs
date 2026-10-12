// Plain-language glossary for first-time visitors. Jargon is explained on
// first use via a dotted-underline term with a native tooltip.
const TERMS = {
  endpoint: "An endpoint is one specific URL of the API that does one job, e.g. POST /users/login signs a user in.",
  token:
    "A token is a secret string the API gives you after login. You send it with each request so the API knows it is you.",
  header:
    "A header is a small extra piece of information sent along with a request, e.g. the token header proves who you are.",
  payload:
    "A payload (body) is the data you send with a request, e.g. the email and password when you log in.",
  "query param":
    "A query param is an option added to the end of a URL after a question mark, e.g. ?page=1 asks for page 1.",
  "status code":
    "A status code is a number the API sends back to say what happened: 200 means success, 400+ means something went wrong.",
  environment:
    "An environment (server) is the copy of the API you talk to. Here there is one: Production, the live store.",
};

export function Term({ name, children }) {
  const key = String(name || "").toLowerCase();
  const def = TERMS[key];
  if (!def) return <>{children || name}</>;
  return (
    <dfn className="term not-italic" title={def}>
      {children || name}
    </dfn>
  );
}
