import { route, json } from "@/server/http";
import { listLabs } from "@/server/services/directory";

export const GET = route(async () => json({ data: await listLabs() }));
