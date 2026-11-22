import { route, json } from "@/server/http";
import { getFacets } from "@/server/services/models";

/** GET /api/filters -> filter options with counts (labs, providers, types, capabilities, modalities) */
export const GET = route(async () => json({ data: await getFacets() }));
