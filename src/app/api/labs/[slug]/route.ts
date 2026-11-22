import { route, json } from "@/server/http";
import { getLab } from "@/server/services/directory";
import { slugParam } from "@/server/validation";

export const GET = route<{ slug: string }>(async (_req, { params }) => {
  const { slug } = slugParam.parse(await params);
  return json({ data: await getLab(slug) });
});
