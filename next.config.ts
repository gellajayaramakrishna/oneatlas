import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  // Prisma's query compiler is a .wasm file read from disk at runtime, so the
  // build's file tracer does not see it. Without this, serverless deployments
  // (Vercel) ship without the file and every query fails with ENOENT.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
