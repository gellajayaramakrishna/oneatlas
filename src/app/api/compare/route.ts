import { route, json } from "@/server/http";
import { compareModels } from "@/server/services/models";
import { compareQuery, parseQuery } from "@/server/validation";

/** GET /api/compare?models=gpt-5,claude-sonnet-4-5  (1-4 models, order preserved) */
export const GET = route(async (req) => {
  const { models } = parseQuery(compareQuery, new URL(req.url).searchParams);
  return json({ data: await compareModels(models) });
});
