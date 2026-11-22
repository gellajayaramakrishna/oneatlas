import { route, json } from "@/server/http";
import { listProviders } from "@/server/services/directory";

export const GET = route(async () => json({ data: await listProviders() }));
