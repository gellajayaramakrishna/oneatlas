import { prisma } from "@/server/db";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

/** Liveness + DB connectivity check for uptime monitors. */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({ status: "ok", db: "up", latencyMs: Date.now() - started }, { cache: "none" });
  } catch {
    return json({ status: "degraded", db: "down" }, { status: 503, cache: "none" });
  }
}
