import { route, json } from "@/server/http";
import { getModel, getSimilarModels } from "@/server/services/models";
import { slugParam } from "@/server/validation";

/** GET /api/models/:slug  -> full model detail incl. provider pricing, benchmarks with ranks, similar models */
export const GET = route<{ slug: string }>(async (_req, { params }) => {
  const { slug } = slugParam.parse(await params);
  const model = await getModel(slug);
  const similar = await getSimilarModels(model);
  return json({ data: { ...model, similar } });
});
