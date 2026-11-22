import { route, json } from "@/server/http";
import { listModels } from "@/server/services/models";
import { modelListQuery, parseQuery } from "@/server/validation";

/**
 * GET /api/models
 *   ?q=        free-text search (name, slug, lab, description)
 *   ?lab=openai,meta  ?provider=groq  ?type=REASONING  ?capability=tool-calling,vision
 *   ?modality=image  ?openWeights=true  ?maxPrice=1  ?minContext=128000
 *   ?sort=release|price|output-price|context|name|score  ?order=asc|desc
 *   ?page=1&pageSize=20
 */
export const GET = route(async (req) => {
  const query = parseQuery(modelListQuery, new URL(req.url).searchParams);
  return json(await listModels(query));
});
