-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('CHAT', 'REASONING', 'CODE', 'EMBEDDING', 'IMAGE_GENERATION', 'SPEECH', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "BenchmarkCategory" AS ENUM ('KNOWLEDGE', 'REASONING', 'CODING', 'MATH', 'MULTIMODAL', 'HUMAN_PREFERENCE');

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "headquarters" TEXT NOT NULL,
    "foundedYear" INTEGER NOT NULL,
    "brandColor" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ModelType" NOT NULL,
    "labId" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "maxOutputTokens" INTEGER,
    "parameterCount" TEXT,
    "openWeights" BOOLEAN NOT NULL DEFAULT false,
    "license" TEXT,
    "knowledgeCutoff" TEXT,
    "inputModalities" TEXT[],
    "outputModalities" TEXT[],
    "capabilities" TEXT[],
    "minInputPrice" DECIMAL(12,4),
    "minOutputPrice" DECIMAL(12,4),
    "providerCount" INTEGER NOT NULL DEFAULT 0,
    "atlasScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelOffering" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "inputPrice" DECIMAL(12,4) NOT NULL,
    "outputPrice" DECIMAL(12,4) NOT NULL,
    "cachedInputPrice" DECIMAL(12,4),
    "contextWindow" INTEGER NOT NULL,
    "throughputTps" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "uptimePct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "BenchmarkCategory" NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '%',
    "higherIsBetter" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkScore" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source" TEXT,

    CONSTRAINT "BenchmarkScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lab_slug_key" ON "Lab"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Model_slug_key" ON "Model"("slug");

-- CreateIndex
CREATE INDEX "Model_labId_idx" ON "Model"("labId");

-- CreateIndex
CREATE INDEX "Model_type_idx" ON "Model"("type");

-- CreateIndex
CREATE INDEX "Model_releaseDate_idx" ON "Model"("releaseDate");

-- CreateIndex
CREATE INDEX "Model_contextWindow_idx" ON "Model"("contextWindow");

-- CreateIndex
CREATE INDEX "Model_minInputPrice_idx" ON "Model"("minInputPrice");

-- CreateIndex
CREATE INDEX "Model_atlasScore_idx" ON "Model"("atlasScore");

-- CreateIndex
CREATE INDEX "ModelOffering_providerId_idx" ON "ModelOffering"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelOffering_modelId_providerId_key" ON "ModelOffering"("modelId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_slug_key" ON "Benchmark"("slug");

-- CreateIndex
CREATE INDEX "BenchmarkScore_benchmarkId_score_idx" ON "BenchmarkScore"("benchmarkId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkScore_modelId_benchmarkId_key" ON "BenchmarkScore"("modelId", "benchmarkId");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelOffering" ADD CONSTRAINT "ModelOffering_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelOffering" ADD CONSTRAINT "ModelOffering_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkScore" ADD CONSTRAINT "BenchmarkScore_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkScore" ADD CONSTRAINT "BenchmarkScore_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;
