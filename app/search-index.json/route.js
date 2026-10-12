import { getSearchIndex } from "@/lib/api";

// Served at /search-index.json for the client Command palette.
export async function GET() {
  return Response.json(getSearchIndex(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
