import { route, json } from "@/server/http";
import { getCatalogStats } from "@/server/services/models";

export const GET = route(async () => json({ data: await getCatalogStats() }));
