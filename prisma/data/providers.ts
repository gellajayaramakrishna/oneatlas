import type { RawProvider } from "../../src/server/ingest/schemas";

// `perf` is the provider's typical performance profile. Individual offerings
// may override it; otherwise ingestion derives per-offering numbers from it.
export const providers: RawProvider[] = [
  { slug: "openai-api", name: "OpenAI API", kind: "first-party", website: "https://platform.openai.com", description: "OpenAI's own platform for GPT, o-series, embedding, image and speech models.", perf: { tps: 95, latencyMs: 520, uptime: 99.7 } },
  { slug: "anthropic-api", name: "Anthropic API", kind: "first-party", website: "https://console.anthropic.com", description: "First-party access to Claude models with prompt caching and batch processing.", perf: { tps: 70, latencyMs: 650, uptime: 99.6 } },
  { slug: "google-vertex", name: "Google Vertex AI", kind: "hyperscaler", website: "https://cloud.google.com/vertex-ai", description: "Google Cloud's ML platform serving Gemini, Gemma and partner models such as Claude.", perf: { tps: 120, latencyMs: 480, uptime: 99.8 } },
  { slug: "aws-bedrock", name: "AWS Bedrock", kind: "hyperscaler", website: "https://aws.amazon.com/bedrock", description: "Managed AWS service for foundation models from Amazon, Anthropic, Meta, Mistral, OpenAI and more. Lists prices per 1K tokens.", perf: { tps: 75, latencyMs: 700, uptime: 99.9 } },
  { slug: "azure-foundry", name: "Azure AI Foundry", kind: "hyperscaler", website: "https://ai.azure.com", description: "Microsoft's model catalog with OpenAI, Phi, xAI, Mistral and open models under enterprise SLAs.", perf: { tps: 85, latencyMs: 600, uptime: 99.9 } },
  { slug: "together", name: "Together AI", kind: "inference-cloud", website: "https://www.together.ai", description: "Inference and fine-tuning cloud for open-source models.", perf: { tps: 110, latencyMs: 420, uptime: 99.5 } },
  { slug: "fireworks", name: "Fireworks AI", kind: "inference-cloud", website: "https://fireworks.ai", description: "Low-latency serving for open models, tuned for compound AI systems.", perf: { tps: 130, latencyMs: 380, uptime: 99.5 } },
  { slug: "groq", name: "Groq", kind: "inference-cloud", website: "https://groq.com", description: "LPU-based inference with very high output speed for open models.", perf: { tps: 480, latencyMs: 220, uptime: 99.3 } },
  { slug: "cerebras", name: "Cerebras", kind: "inference-cloud", website: "https://www.cerebras.ai", description: "Wafer-scale inference hardware delivering some of the highest tokens-per-second available.", perf: { tps: 1500, latencyMs: 250, uptime: 99.1 } },
  { slug: "deepinfra", name: "DeepInfra", kind: "inference-cloud", website: "https://deepinfra.com", description: "Cost-focused serverless inference for popular open-weight models.", perf: { tps: 60, latencyMs: 550, uptime: 99.2 } },
  { slug: "mistral-platform", name: "Mistral La Plateforme", kind: "first-party", website: "https://console.mistral.ai", description: "Mistral's own API for its commercial and open models.", perf: { tps: 100, latencyMs: 400, uptime: 99.5 } },
  { slug: "deepseek-platform", name: "DeepSeek Platform", kind: "first-party", website: "https://platform.deepseek.com", description: "DeepSeek's first-party API with aggressive pricing and context caching.", perf: { tps: 30, latencyMs: 1200, uptime: 98.6 } },
  { slug: "xai-api", name: "xAI API", kind: "first-party", website: "https://console.x.ai", description: "First-party API for Grok models.", perf: { tps: 75, latencyMs: 600, uptime: 99.4 } },
  { slug: "cohere-platform", name: "Cohere Platform", kind: "first-party", website: "https://dashboard.cohere.com", description: "Cohere's API for Command, Embed and Rerank models.", perf: { tps: 80, latencyMs: 450, uptime: 99.6 } },
];
