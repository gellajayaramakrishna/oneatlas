import { notFound } from "next/navigation";
import { ApiError } from "@/server/http";

/** Turn a service-layer 404 into Next's not-found page; rethrow anything else. */
export async function orNotFound<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}
