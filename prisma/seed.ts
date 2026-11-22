import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { ingestCatalog, IngestValidationError } from "../src/server/ingest/ingest";
import { benchmarks, generateScores } from "./data/benchmarks";
import { labs } from "./data/labs";
import { models } from "./data/models";
import { providers } from "./data/providers";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const summary = await ingestCatalog(prisma, {
      labs,
      providers,
      models,
      benchmarks,
      scores: generateScores(models),
    });
    console.log("Seed complete:", summary);
  } catch (err) {
    if (err instanceof IngestValidationError) {
      console.error(err.message);
      for (const i of err.issues) console.error(`  - ${i.path}: ${i.message}`);
    } else {
      console.error(err);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
