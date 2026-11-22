import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { IngestValidationError } from "./ingest/ingest";
import { NormalizationError } from "./ingest/normalize";

/** Every API error has the same envelope: { error: { code, message, details? } } */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
  static notFound(what: string) {
    return new ApiError(404, "not_found", `${what} not found`);
  }
  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "bad_request", message, details);
  }
}

type CachePolicy = "public" | "none";

export function json<T>(body: T, init: { status?: number; cache?: CachePolicy } = {}) {
  const headers: Record<string, string> = {};
  // Catalog data changes rarely: let the CDN serve it and refresh in the background.
  headers["Cache-Control"] =
    init.cache === "none" ? "no-store" : "public, s-maxage=60, stale-while-revalidate=600";
  return NextResponse.json(body, { status: init.status ?? 200, headers });
}

function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return json({ error: { code: err.code, message: err.message, details: err.details } }, { status: err.status, cache: "none" });
  }
  if (err instanceof ZodError) {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "Request validation failed",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 400, cache: "none" },
    );
  }
  if (err instanceof IngestValidationError) {
    return json({ error: { code: "invalid_payload", message: err.message, details: err.issues } }, { status: 422, cache: "none" });
  }
  if (err instanceof NormalizationError) {
    return json({ error: { code: "invalid_payload", message: err.message, details: [{ path: err.path, message: err.message }] } }, { status: 422, cache: "none" });
  }
  if (err instanceof SyntaxError) {
    return json({ error: { code: "invalid_json", message: "Request body is not valid JSON" } }, { status: 400, cache: "none" });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return json({ error: { code: "conflict", message: "Unique constraint violated" } }, { status: 409, cache: "none" });
  }
  console.error("[api] unhandled error", err);
  return json({ error: { code: "internal_error", message: "Something went wrong" } }, { status: 500, cache: "none" });
}

type RouteCtx<P> = { params: Promise<P> };

/**
 * Wraps a route handler so it only has to deal with the happy path.
 * Any thrown ApiError / ZodError / ingest error is mapped to a typed JSON response.
 */
export function route<P = Record<string, never>>(
  fn: (req: Request, ctx: RouteCtx<P>) => Promise<Response>,
) {
  return async (req: Request, ctx: RouteCtx<P>) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
