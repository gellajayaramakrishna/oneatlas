import { route, json } from "@/server/http";
import { globalSearch } from "@/server/services/search";
import { parseQuery, searchQuery } from "@/server/validation";

/** GET /api/search?q=llama  -> grouped results for the command palette */
export const GET = route(async (req) => {
  const { q, limit } = parseQuery(searchQuery, new URL(req.url).searchParams);
  return json({ data: await globalSearch(q, limit) });
});
