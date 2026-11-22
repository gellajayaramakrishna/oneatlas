import { route, json } from "@/server/http";
import { listBenchmarks } from "@/server/services/rankings";

export const GET = route(async () => json({ data: await listBenchmarks() }));
