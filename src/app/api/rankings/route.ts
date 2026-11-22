import { ApiError, route, json } from "@/server/http";
import { getRankings } from "@/server/services/rankings";
import { parseQuery, rankingsQuery } from "@/server/validation";

/** GET /api/rankings?benchmark=swe-bench-verified | ?category=CODING  [&type=REASONING&openWeights=true&limit=50] */
export const GET = route(async (req) => {
  const q = parseQuery(rankingsQuery, new URL(req.url).searchParams);
  if (q.benchmark && q.category) throw ApiError.badRequest("Use either benchmark or category, not both");
  return json({ data: await getRankings(q) });
});
