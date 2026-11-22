import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/server/db";
import { ApiError, json, route } from "@/server/http";
import { ingestCatalog } from "@/server/ingest/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !given || expected.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/**
 * POST /api/admin/ingest   (Authorization: Bearer $ADMIN_TOKEN)
 * Body: { labs?, providers?, models?, benchmarks?, scores? } in the raw feed format.
 * Validates, normalizes units and upserts in a single transaction. Idempotent.
 */
export const POST = route(async (req) => {
  if (!authorized(req)) throw new ApiError(401, "unauthorized", "Missing or invalid admin token");
  const body = await req.json();
  const summary = await ingestCatalog(prisma, body);
  return json({ data: summary }, { cache: "none" });
});
