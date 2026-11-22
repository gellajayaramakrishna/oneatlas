import type { Modality } from "../../src/lib/constants";
import type { RawModel } from "../../src/server/ingest/schemas";

// Raw catalog. Deliberately written the way real feeds look: context windows as
// "128k"/"1M" strings or numbers, and prices in mixed units (Bedrock and Azure
// publish per-1K-token prices). The ingestion layer normalizes all of it.
//
// Prices are approximate list prices for demo purposes. `tier` drives the
// synthetic benchmark generator (see scores.ts), it is not stored.

const T: Modality[] = ["text"];
const TI: Modality[] = ["text", "image"];
const TIF: Modality[] = ["text", "image", "file"];
const TIAV: Modality[] = ["text", "image", "audio", "video"];

export const models: RawModel[] = [
  // ───────────────────────── OpenAI
  {
    slug: "gpt-5-1", name: "GPT-5.1", lab: "openai", type: "REASONING", released: "2025-11-12", context: "400k", maxOutput: "128k",
    cutoff: "Sep 2024", input: TIF, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search", "batch"],
    description: "Refresh of GPT-5 with adaptive reasoning that spends less time on easy prompts and more on hard ones. OpenAI's flagship for coding and agentic tasks.",
    tier: { q: 0.95, code: 0.04, math: 0.04 },
    offerings: [
      { provider: "openai-api", in: 1.25, out: 10, cached: 0.125 },
      { provider: "azure-foundry", in: 0.00125, out: 0.01, unit: "per_1k" },
    ],
  },
  {
    slug: "gpt-5", name: "GPT-5", lab: "openai", type: "REASONING", released: "2025-08-07", context: "400k", maxOutput: "128k",
    cutoff: "Sep 2024", input: TIF, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search", "batch"],
    description: "Unified reasoning model with configurable reasoning effort. Strong across coding, math, and multimodal understanding.",
    tier: { q: 0.93, code: 0.03, math: 0.05 },
    offerings: [
      { provider: "openai-api", in: 1.25, out: 10, cached: 0.125 },
      { provider: "azure-foundry", in: 0.00125, out: 0.01, unit: "per_1k" },
    ],
  },
  {
    slug: "gpt-5-mini", name: "GPT-5 mini", lab: "openai", type: "REASONING", released: "2025-08-07", context: "400k", maxOutput: "128k",
    cutoff: "May 2024", input: TIF, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "batch"],
    description: "Faster, cheaper GPT-5 variant for well-defined tasks. Keeps most of the reasoning quality at a fraction of the price.",
    tier: { q: 0.84, math: 0.06 },
    offerings: [
      { provider: "openai-api", in: 0.25, out: 2, cached: 0.025 },
      { provider: "azure-foundry", in: 0.00025, out: 0.002, unit: "per_1k" },
    ],
  },
  {
    slug: "gpt-5-nano", name: "GPT-5 nano", lab: "openai", type: "REASONING", released: "2025-08-07", context: "400k", maxOutput: "128k",
    cutoff: "May 2024", input: TIF, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "batch"],
    description: "Smallest GPT-5 model, built for classification, extraction and high-volume, latency-sensitive workloads.",
    tier: { q: 0.7, math: 0.05 },
    offerings: [{ provider: "openai-api", in: 0.05, out: 0.4, cached: 0.005 }],
  },
  {
    slug: "gpt-4-1", name: "GPT-4.1", lab: "openai", type: "CHAT", released: "2025-04-14", context: 1047576, maxOutput: "32k",
    cutoff: "Jun 2024", input: TIF, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "streaming", "prompt-caching", "fine-tuning", "batch"],
    description: "Non-reasoning model with a 1M-token context window and strong instruction following. Good default for long-document work.",
    tier: { q: 0.76, code: 0.02 },
    offerings: [
      { provider: "openai-api", in: 2, out: 8, cached: 0.5 },
      { provider: "azure-foundry", in: 0.002, out: 0.008, unit: "per_1k" },
    ],
  },
  {
    slug: "gpt-4-1-mini", name: "GPT-4.1 mini", lab: "openai", type: "CHAT", released: "2025-04-14", context: 1047576, maxOutput: "32k",
    cutoff: "Jun 2024", input: TIF, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "streaming", "prompt-caching", "fine-tuning", "batch"],
    description: "Smaller GPT-4.1 with the same 1M context. Low latency and a strong price-to-quality ratio.",
    tier: { q: 0.66 },
    offerings: [{ provider: "openai-api", in: 0.4, out: 1.6, cached: 0.1 }],
  },
  {
    slug: "gpt-4o", name: "GPT-4o", lab: "openai", type: "MULTIMODAL", released: "2024-05-13", context: "128k", maxOutput: "16k",
    cutoff: "Oct 2023", input: ["text", "image", "audio"], output: ["text", "audio"],
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "streaming", "prompt-caching", "fine-tuning", "batch"],
    description: "Omni model that natively handles text, vision and audio. Still widely deployed for real-time voice and vision apps.",
    tier: { q: 0.6 },
    offerings: [
      { provider: "openai-api", in: 2.5, out: 10, cached: 1.25 },
      { provider: "azure-foundry", in: 0.0025, out: 0.01, unit: "per_1k" },
    ],
  },
  {
    slug: "o3", name: "o3", lab: "openai", type: "REASONING", released: "2025-04-16", context: "200k", maxOutput: "100k",
    cutoff: "Jun 2024", input: TIF, output: T,
    caps: ["tool-calling", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "batch"],
    description: "Deliberate reasoning model that can think with images and use tools inside its chain of thought.",
    tier: { q: 0.86, math: 0.05, reason: 0.03 },
    offerings: [
      { provider: "openai-api", in: 2, out: 8, cached: 0.5 },
      { provider: "azure-foundry", in: 0.002, out: 0.008, unit: "per_1k" },
    ],
  },
  {
    slug: "o4-mini", name: "o4-mini", lab: "openai", type: "REASONING", released: "2025-04-16", context: "200k", maxOutput: "100k",
    cutoff: "Jun 2024", input: TIF, output: T,
    caps: ["tool-calling", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "batch"],
    description: "Compact reasoning model optimized for math, coding and visual tasks at low cost.",
    tier: { q: 0.8, math: 0.08 },
    offerings: [{ provider: "openai-api", in: 1.1, out: 4.4, cached: 0.275 }],
  },
  {
    slug: "gpt-oss-120b", name: "gpt-oss-120b", lab: "openai", type: "REASONING", released: "2025-08-05", context: "131k", maxOutput: "131k",
    params: "117B (5.1B active)", open: true, license: "Apache 2.0", cutoff: "Jun 2024", input: T, output: T,
    caps: ["tool-calling", "structured-output", "reasoning", "streaming"],
    description: "OpenAI's open-weight MoE reasoning model. Runs on a single 80GB GPU and is served by most inference clouds.",
    tier: { q: 0.8, math: 0.06 },
    offerings: [
      { provider: "together", in: 0.15, out: 0.6 },
      { provider: "fireworks", in: 0.15, out: 0.6 },
      { provider: "groq", in: 0.15, out: 0.75 },
      { provider: "cerebras", in: 0.25, out: 0.69 },
      { provider: "deepinfra", in: 0.09, out: 0.45 },
      { provider: "aws-bedrock", in: 0.00015, out: 0.0006, unit: "per_1k" },
      { provider: "azure-foundry", in: 0.00015, out: 0.0006, unit: "per_1k" },
    ],
  },
  {
    slug: "gpt-oss-20b", name: "gpt-oss-20b", lab: "openai", type: "REASONING", released: "2025-08-05", context: "131k", maxOutput: "131k",
    params: "21B (3.6B active)", open: true, license: "Apache 2.0", cutoff: "Jun 2024", input: T, output: T,
    caps: ["tool-calling", "structured-output", "reasoning", "streaming"],
    description: "Small open-weight reasoning model that fits on 16GB devices. Popular for local and edge deployments.",
    tier: { q: 0.68, math: 0.06 },
    offerings: [
      { provider: "together", in: 0.05, out: 0.2 },
      { provider: "fireworks", in: 0.07, out: 0.3 },
      { provider: "groq", in: 0.075, out: 0.3 },
      { provider: "deepinfra", in: 0.03, out: 0.14 },
    ],
  },
  {
    slug: "text-embedding-3-large", name: "text-embedding-3-large", lab: "openai", type: "EMBEDDING", released: "2024-01-25", context: 8191,
    input: T, output: ["embedding"], caps: ["batch"],
    description: "3072-dimension embedding model for search, clustering and RAG. Supports shortening dimensions.",
    offerings: [
      { provider: "openai-api", in: 0.13, out: 0 },
      { provider: "azure-foundry", in: 0.00013, out: 0, unit: "per_1k" },
    ],
  },
  {
    slug: "gpt-image-1", name: "GPT Image 1", lab: "openai", type: "IMAGE_GENERATION", released: "2025-04-23", context: "32k",
    input: TI, output: ["image"], caps: [],
    description: "Natively multimodal image generation and editing model with strong text rendering and instruction following.",
    offerings: [{ provider: "openai-api", in: 5, out: 40, cached: 1.25 }],
  },
  {
    slug: "gpt-4o-transcribe", name: "GPT-4o Transcribe", lab: "openai", type: "SPEECH", released: "2025-03-20", context: "16k", maxOutput: "2k",
    input: ["audio", "text"], output: T, caps: ["streaming"],
    description: "Speech-to-text model with lower word error rates than Whisper across many languages.",
    offerings: [{ provider: "openai-api", in: 2.5, out: 10 }],
  },

  // ───────────────────────── Anthropic
  {
    slug: "claude-opus-4-5", name: "Claude Opus 4.5", lab: "anthropic", type: "REASONING", released: "2025-11-24", context: "200k", maxOutput: "64k",
    cutoff: "Mar 2025", input: TIF, output: T,
    caps: ["tool-calling", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search", "batch"],
    description: "Anthropic's most capable model, aimed at complex software engineering, long-running agents and computer use.",
    tier: { q: 0.96, code: 0.08 },
    offerings: [
      { provider: "anthropic-api", in: 5, out: 25, cached: 0.5 },
      { provider: "aws-bedrock", in: 0.005, out: 0.025, unit: "per_1k" },
      { provider: "google-vertex", in: 5, out: 25 },
      { provider: "azure-foundry", in: 0.005, out: 0.025, unit: "per_1k" },
    ],
  },
  {
    slug: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", lab: "anthropic", type: "REASONING", released: "2025-09-29", context: "200k", maxOutput: "64k",
    cutoff: "Jan 2025", input: TIF, output: T,
    caps: ["tool-calling", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search", "batch"],
    description: "Balanced frontier model with strong coding and agentic performance. Extended thinking optional.",
    tier: { q: 0.92, code: 0.08 },
    offerings: [
      { provider: "anthropic-api", in: 3, out: 15, cached: 0.3 },
      { provider: "aws-bedrock", in: 0.003, out: 0.015, unit: "per_1k" },
      { provider: "google-vertex", in: 3, out: 15 },
    ],
  },
  {
    slug: "claude-haiku-4-5", name: "Claude Haiku 4.5", lab: "anthropic", type: "CHAT", released: "2025-10-15", context: "200k", maxOutput: "64k",
    cutoff: "Feb 2025", input: TIF, output: T,
    caps: ["tool-calling", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "batch"],
    description: "Fast, low-cost model with near-frontier coding ability. Suited to sub-agents and real-time apps.",
    tier: { q: 0.82, code: 0.07 },
    offerings: [
      { provider: "anthropic-api", in: 1, out: 5, cached: 0.1 },
      { provider: "aws-bedrock", in: 0.001, out: 0.005, unit: "per_1k" },
      { provider: "google-vertex", in: 1, out: 5 },
    ],
  },
  {
    slug: "claude-opus-4-1", name: "Claude Opus 4.1", lab: "anthropic", type: "REASONING", released: "2025-08-05", context: "200k", maxOutput: "32k",
    cutoff: "Mar 2025", input: TIF, output: T,
    caps: ["tool-calling", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "batch"],
    description: "Previous-generation Opus focused on agentic coding and deep multi-step reasoning.",
    tier: { q: 0.88, code: 0.07 },
    offerings: [
      { provider: "anthropic-api", in: 15, out: 75, cached: 1.5 },
      { provider: "aws-bedrock", in: 0.015, out: 0.075, unit: "per_1k" },
      { provider: "google-vertex", in: 15, out: 75 },
    ],
  },

  // ───────────────────────── Google
  {
    slug: "gemini-3-pro", name: "Gemini 3 Pro", lab: "google", type: "REASONING", released: "2025-11-18", context: "1M", maxOutput: "64k",
    cutoff: "Jan 2025", input: [...TIAV, "file"], output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search", "batch"],
    description: "Google's most capable multimodal reasoning model, leading on many reasoning and multimodal leaderboards at launch.",
    tier: { q: 0.97, reason: 0.04, vision: 0.05 },
    offerings: [{ provider: "google-vertex", in: 2, out: 12, cached: 0.2 }],
  },
  {
    slug: "gemini-2-5-pro", name: "Gemini 2.5 Pro", lab: "google", type: "REASONING", released: "2025-06-17", context: "1M", maxOutput: "64k",
    cutoff: "Jan 2025", input: [...TIAV, "file"], output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search", "batch"],
    description: "Thinking model with a 1M-token window, strong on long-context, video understanding and code.",
    tier: { q: 0.88, vision: 0.04 },
    offerings: [{ provider: "google-vertex", in: 1.25, out: 10, cached: 0.31 }],
  },
  {
    slug: "gemini-2-5-flash", name: "Gemini 2.5 Flash", lab: "google", type: "REASONING", released: "2025-06-17", context: "1M", maxOutput: "64k",
    cutoff: "Jan 2025", input: TIAV, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search", "batch"],
    description: "Hybrid reasoning workhorse with a thinking budget control. Strong value for high-throughput apps.",
    tier: { q: 0.78, vision: 0.03 },
    offerings: [{ provider: "google-vertex", in: 0.3, out: 2.5, cached: 0.075 }],
  },
  {
    slug: "gemini-2-5-flash-lite", name: "Gemini 2.5 Flash-Lite", lab: "google", type: "CHAT", released: "2025-07-22", context: "1M", maxOutput: "64k",
    cutoff: "Jan 2025", input: TIAV, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "vision", "streaming", "prompt-caching", "batch"],
    description: "Google's fastest and cheapest 2.5 model for classification, translation and routing at scale.",
    tier: { q: 0.62 },
    offerings: [{ provider: "google-vertex", in: 0.1, out: 0.4, cached: 0.025 }],
  },
  {
    slug: "gemma-3-27b", name: "Gemma 3 27B", lab: "google", type: "MULTIMODAL", released: "2025-03-12", context: "128k", maxOutput: "8k",
    params: "27B", open: true, license: "Gemma Terms of Use", cutoff: "Aug 2024", input: TI, output: T,
    caps: ["tool-calling", "json-mode", "vision", "streaming", "fine-tuning"],
    description: "Open-weight vision-language model that runs on a single GPU, with support for 140+ languages.",
    tier: { q: 0.5 },
    offerings: [
      { provider: "deepinfra", in: 0.09, out: 0.17 },
      { provider: "together", in: 0.2, out: 0.2 },
      { provider: "google-vertex", in: 0.2, out: 0.2 },
    ],
  },
  {
    slug: "gemini-embedding-001", name: "Gemini Embedding", lab: "google", type: "EMBEDDING", released: "2025-07-14", context: 2048,
    input: T, output: ["embedding"], caps: ["batch"],
    description: "Multilingual embedding model topping the MTEB leaderboard at launch, with flexible output dimensions.",
    offerings: [{ provider: "google-vertex", in: 0.15, out: 0 }],
  },

  // ───────────────────────── Meta
  {
    slug: "llama-4-maverick", name: "Llama 4 Maverick", lab: "meta", type: "MULTIMODAL", released: "2025-04-05", context: "1M", maxOutput: "16k",
    params: "400B (17B active)", open: true, license: "Llama 4 Community License", cutoff: "Aug 2024", input: TI, output: T,
    caps: ["tool-calling", "json-mode", "vision", "streaming", "fine-tuning"],
    description: "Natively multimodal MoE with 128 experts. Meta's strongest open model for general assistant use.",
    tier: { q: 0.62 },
    offerings: [
      { provider: "together", in: 0.27, out: 0.85, context: "1M" },
      { provider: "fireworks", in: 0.22, out: 0.88, context: "1M" },
      { provider: "groq", in: 0.2, out: 0.6, context: "128k" },
      { provider: "deepinfra", in: 0.15, out: 0.6, context: "1M" },
      { provider: "aws-bedrock", in: 0.00024, out: 0.00097, unit: "per_1k", context: "1M" },
    ],
  },
  {
    slug: "llama-4-scout", name: "Llama 4 Scout", lab: "meta", type: "MULTIMODAL", released: "2025-04-05", context: "10M", maxOutput: "16k",
    params: "109B (17B active)", open: true, license: "Llama 4 Community License", cutoff: "Aug 2024", input: TI, output: T,
    caps: ["tool-calling", "json-mode", "vision", "streaming", "fine-tuning"],
    description: "Efficient multimodal MoE with an industry-leading 10M-token native context. Providers typically serve a shorter window.",
    tier: { q: 0.52 },
    offerings: [
      { provider: "together", in: 0.18, out: 0.59, context: "328k" },
      { provider: "groq", in: 0.11, out: 0.34, context: "128k" },
      { provider: "deepinfra", in: 0.08, out: 0.3, context: "328k" },
      { provider: "cerebras", in: 0.65, out: 0.85, context: "32k" },
    ],
  },
  {
    slug: "llama-3-3-70b", name: "Llama 3.3 70B", lab: "meta", type: "CHAT", released: "2024-12-06", context: "128k", maxOutput: "8k",
    params: "70B", open: true, license: "Llama 3.3 Community License", cutoff: "Dec 2023", input: T, output: T,
    caps: ["tool-calling", "json-mode", "streaming", "fine-tuning"],
    description: "Dense 70B text model matching Llama 3.1 405B on many tasks. A staple of open-source deployments.",
    tier: { q: 0.48 },
    offerings: [
      { provider: "groq", in: 0.59, out: 0.79 },
      { provider: "together", in: 0.88, out: 0.88 },
      { provider: "fireworks", in: 0.9, out: 0.9 },
      { provider: "deepinfra", in: 0.23, out: 0.4 },
      { provider: "cerebras", in: 0.85, out: 1.2 },
      { provider: "aws-bedrock", in: 0.00072, out: 0.00072, unit: "per_1k" },
    ],
  },
  {
    slug: "llama-3-1-8b", name: "Llama 3.1 8B", lab: "meta", type: "CHAT", released: "2024-07-23", context: "128k", maxOutput: "8k",
    params: "8B", open: true, license: "Llama 3.1 Community License", cutoff: "Dec 2023", input: T, output: T,
    caps: ["tool-calling", "json-mode", "streaming", "fine-tuning"],
    description: "Small, fast model for simple chat, extraction and fine-tuning experiments. Extremely cheap to serve.",
    tier: { q: 0.25 },
    offerings: [
      { provider: "groq", in: 0.05, out: 0.08 },
      { provider: "together", in: 0.18, out: 0.18 },
      { provider: "deepinfra", in: 0.03, out: 0.05 },
      { provider: "cerebras", in: 0.1, out: 0.1, tps: 2200 },
    ],
  },

  // ───────────────────────── Mistral
  {
    slug: "mistral-medium-3", name: "Mistral Medium 3", lab: "mistral", type: "MULTIMODAL", released: "2025-05-07", context: "128k", maxOutput: "32k",
    input: TI, output: T, caps: ["tool-calling", "json-mode", "structured-output", "vision", "streaming", "fine-tuning", "batch"],
    description: "Frontier-class multimodal model at roughly 8x lower cost than comparable models. Built for enterprise deployment.",
    tier: { q: 0.64 },
    offerings: [
      { provider: "mistral-platform", in: 0.4, out: 2 },
      { provider: "aws-bedrock", in: 0.0004, out: 0.002, unit: "per_1k" },
      { provider: "azure-foundry", in: 0.0004, out: 0.002, unit: "per_1k" },
    ],
  },
  {
    slug: "mistral-large-2411", name: "Mistral Large 2.1", lab: "mistral", type: "CHAT", released: "2024-11-18", context: "128k", maxOutput: "32k",
    params: "123B", open: true, license: "Mistral Research License", input: T, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "streaming", "fine-tuning"],
    description: "Dense 123B flagship text model with strong multilingual, code and function-calling performance.",
    tier: { q: 0.55 },
    offerings: [
      { provider: "mistral-platform", in: 2, out: 6 },
      { provider: "aws-bedrock", in: 0.002, out: 0.006, unit: "per_1k" },
      { provider: "google-vertex", in: 2, out: 6 },
    ],
  },
  {
    slug: "codestral-2501", name: "Codestral 25.01", lab: "mistral", type: "CODE", released: "2025-01-13", context: "256k", maxOutput: "32k",
    params: "22B", input: T, output: T, caps: ["streaming", "json-mode"],
    description: "Code model specialised in fill-in-the-middle completion across 80+ languages. Popular in IDE assistants.",
    tier: { q: 0.42, code: 0.1 },
    offerings: [
      { provider: "mistral-platform", in: 0.3, out: 0.9 },
      { provider: "google-vertex", in: 0.3, out: 0.9 },
    ],
  },
  {
    slug: "mistral-small-3-1", name: "Mistral Small 3.1", lab: "mistral", type: "MULTIMODAL", released: "2025-03-17", context: "128k", maxOutput: "32k",
    params: "24B", open: true, license: "Apache 2.0", input: TI, output: T,
    caps: ["tool-calling", "json-mode", "vision", "streaming", "fine-tuning"],
    description: "Open 24B model with vision, fast enough for real-time use and small enough for a single RTX 4090.",
    tier: { q: 0.44 },
    offerings: [
      { provider: "mistral-platform", in: 0.1, out: 0.3 },
      { provider: "deepinfra", in: 0.05, out: 0.1 },
    ],
  },
  {
    slug: "magistral-medium", name: "Magistral Medium", lab: "mistral", type: "REASONING", released: "2025-06-10", context: "40k", maxOutput: "40k",
    input: T, output: T, caps: ["reasoning", "streaming", "json-mode"],
    description: "Mistral's first reasoning model with transparent, multilingual chains of thought.",
    tier: { q: 0.66, math: 0.06 },
    offerings: [{ provider: "mistral-platform", in: 2, out: 5 }],
  },

  // ───────────────────────── DeepSeek
  {
    slug: "deepseek-v3-2-exp", name: "DeepSeek V3.2-Exp", lab: "deepseek", type: "REASONING", released: "2025-09-29", context: "128k", maxOutput: "64k",
    params: "671B (37B active)", open: true, license: "MIT", input: T, output: T,
    caps: ["tool-calling", "json-mode", "reasoning", "streaming", "prompt-caching"],
    description: "Experimental V3 update introducing DeepSeek Sparse Attention, cutting long-context cost roughly in half.",
    tier: { q: 0.83, math: 0.04 },
    offerings: [
      { provider: "deepseek-platform", in: 0.28, out: 0.42, cached: 0.028 },
      { provider: "deepinfra", in: 0.27, out: 0.4 },
    ],
  },
  {
    slug: "deepseek-v3-1", name: "DeepSeek V3.1", lab: "deepseek", type: "REASONING", released: "2025-08-21", context: "128k", maxOutput: "64k",
    params: "671B (37B active)", open: true, license: "MIT", input: T, output: T,
    caps: ["tool-calling", "json-mode", "reasoning", "streaming", "prompt-caching"],
    description: "Hybrid model that switches between thinking and non-thinking modes, with much stronger agent and tool use.",
    tier: { q: 0.81, math: 0.04 },
    offerings: [
      { provider: "deepseek-platform", in: 0.56, out: 1.68, cached: 0.07 },
      { provider: "together", in: 0.6, out: 1.7 },
      { provider: "fireworks", in: 0.56, out: 1.68 },
      { provider: "deepinfra", in: 0.27, out: 1 },
      { provider: "aws-bedrock", in: 0.00058, out: 0.00168, unit: "per_1k" },
    ],
  },
  {
    slug: "deepseek-r1-0528", name: "DeepSeek R1 (0528)", lab: "deepseek", type: "REASONING", released: "2025-05-28", context: "128k", maxOutput: "64k",
    params: "671B (37B active)", open: true, license: "MIT", input: T, output: T,
    caps: ["reasoning", "streaming", "json-mode", "tool-calling"],
    description: "Updated R1 reasoning model trained with large-scale RL. Close to frontier closed models on math and code.",
    tier: { q: 0.79, math: 0.07 },
    offerings: [
      { provider: "deepseek-platform", in: 0.55, out: 2.19, cached: 0.14 },
      { provider: "together", in: 3, out: 7 },
      { provider: "fireworks", in: 3, out: 8 },
      { provider: "deepinfra", in: 0.5, out: 2.15 },
      { provider: "azure-foundry", in: 0.00135, out: 0.0054, unit: "per_1k" },
    ],
  },

  // ───────────────────────── Qwen
  {
    slug: "qwen3-235b-a22b", name: "Qwen3 235B A22B", lab: "qwen", type: "REASONING", released: "2025-04-29", context: "128k", maxOutput: "32k",
    params: "235B (22B active)", open: true, license: "Apache 2.0", input: T, output: T,
    caps: ["tool-calling", "json-mode", "reasoning", "streaming", "fine-tuning"],
    description: "Flagship open MoE with hybrid thinking modes and support for 119 languages.",
    tier: { q: 0.75, math: 0.05 },
    offerings: [
      { provider: "together", in: 0.2, out: 0.6 },
      { provider: "fireworks", in: 0.22, out: 0.88 },
      { provider: "deepinfra", in: 0.13, out: 0.6 },
      { provider: "cerebras", in: 0.6, out: 1.2 },
    ],
  },
  {
    slug: "qwen3-coder-480b", name: "Qwen3 Coder 480B", lab: "qwen", type: "CODE", released: "2025-07-22", context: "256k", maxOutput: "64k",
    params: "480B (35B active)", open: true, license: "Apache 2.0", input: T, output: T,
    caps: ["tool-calling", "json-mode", "streaming"],
    description: "Agentic coding model trained for repository-scale tasks and long tool-use loops.",
    tier: { q: 0.72, code: 0.12 },
    offerings: [
      { provider: "together", in: 2, out: 2 },
      { provider: "fireworks", in: 0.45, out: 1.8 },
      { provider: "deepinfra", in: 0.4, out: 1.6 },
      { provider: "cerebras", in: 2, out: 2 },
    ],
  },
  {
    slug: "qwen3-32b", name: "Qwen3 32B", lab: "qwen", type: "REASONING", released: "2025-04-29", context: "128k", maxOutput: "32k",
    params: "32B", open: true, license: "Apache 2.0", input: T, output: T,
    caps: ["tool-calling", "json-mode", "reasoning", "streaming", "fine-tuning"],
    description: "Dense 32B model with switchable thinking. Strong reasoning for its size and easy to self-host.",
    tier: { q: 0.6, math: 0.06 },
    offerings: [
      { provider: "groq", in: 0.29, out: 0.59 },
      { provider: "deepinfra", in: 0.1, out: 0.3 },
      { provider: "cerebras", in: 0.4, out: 0.8 },
    ],
  },
  {
    slug: "qwen2-5-vl-72b", name: "Qwen2.5-VL 72B", lab: "qwen", type: "MULTIMODAL", released: "2025-01-28", context: "128k", maxOutput: "8k",
    params: "72B", open: true, license: "Qwen License", input: ["text", "image", "video"], output: T,
    caps: ["vision", "json-mode", "streaming", "fine-tuning"],
    description: "Vision-language model strong at document parsing, charts, and long video understanding.",
    tier: { q: 0.5, vision: 0.05 },
    offerings: [
      { provider: "together", in: 1.95, out: 8 },
      { provider: "deepinfra", in: 0.7, out: 0.7 },
    ],
  },

  // ───────────────────────── xAI
  {
    slug: "grok-4", name: "Grok 4", lab: "xai", type: "REASONING", released: "2025-07-09", context: "256k", maxOutput: "64k",
    cutoff: "Nov 2024", input: TI, output: T,
    caps: ["tool-calling", "structured-output", "vision", "reasoning", "streaming", "prompt-caching", "web-search"],
    description: "xAI's flagship reasoning model, trained with large-scale RL and native tool use.",
    tier: { q: 0.9, reason: 0.05, math: 0.04 },
    offerings: [
      { provider: "xai-api", in: 3, out: 15, cached: 0.75 },
      { provider: "azure-foundry", in: 0.003, out: 0.015, unit: "per_1k" },
    ],
  },
  {
    slug: "grok-code-fast-1", name: "Grok Code Fast 1", lab: "xai", type: "CODE", released: "2025-08-28", context: "256k", maxOutput: "10k",
    input: T, output: T, caps: ["tool-calling", "structured-output", "reasoning", "streaming", "prompt-caching"],
    description: "Speedy, economical reasoning model built for agentic coding loops in IDEs.",
    tier: { q: 0.7, code: 0.08 },
    offerings: [{ provider: "xai-api", in: 0.2, out: 1.5, cached: 0.02, tps: 190 }],
  },
  {
    slug: "grok-3-mini", name: "Grok 3 mini", lab: "xai", type: "REASONING", released: "2025-04-09", context: "131k", maxOutput: "32k",
    cutoff: "Nov 2024", input: T, output: T,
    caps: ["tool-calling", "structured-output", "reasoning", "streaming"],
    description: "Lightweight thinking model for logic-heavy tasks that do not need deep domain knowledge.",
    tier: { q: 0.66, math: 0.07 },
    offerings: [{ provider: "xai-api", in: 0.3, out: 0.5, cached: 0.075 }],
  },

  // ───────────────────────── Cohere
  {
    slug: "command-a", name: "Command A", lab: "cohere", type: "CHAT", released: "2025-03-13", context: "256k", maxOutput: "8k",
    params: "111B", open: true, license: "CC-BY-NC 4.0", input: T, output: T,
    caps: ["tool-calling", "json-mode", "structured-output", "streaming", "fine-tuning"],
    description: "Enterprise model tuned for RAG, tool use and multilingual business tasks. Runs on two GPUs.",
    tier: { q: 0.52 },
    offerings: [{ provider: "cohere-platform", in: 2.5, out: 10 }],
  },
  {
    slug: "command-r-plus-08-2024", name: "Command R+ (08-2024)", lab: "cohere", type: "CHAT", released: "2024-08-30", context: "128k", maxOutput: "4k",
    params: "104B", open: true, license: "CC-BY-NC 4.0", input: T, output: T,
    caps: ["tool-calling", "json-mode", "streaming"],
    description: "Earlier enterprise RAG model with grounded citations and multi-step tool use.",
    tier: { q: 0.35 },
    offerings: [
      { provider: "cohere-platform", in: 2.5, out: 10 },
      { provider: "aws-bedrock", in: 0.0025, out: 0.01, unit: "per_1k" },
    ],
  },
  {
    slug: "embed-v4", name: "Embed v4", lab: "cohere", type: "EMBEDDING", released: "2025-04-15", context: "128k",
    input: TI, output: ["embedding"], caps: ["batch"],
    description: "Multimodal embedding model for text and images with a long 128K context, built for enterprise search.",
    offerings: [
      { provider: "cohere-platform", in: 0.12, out: 0 },
      { provider: "aws-bedrock", in: 0.00012, out: 0, unit: "per_1k" },
    ],
  },

  // ───────────────────────── Microsoft
  {
    slug: "phi-4", name: "Phi-4", lab: "microsoft", type: "CHAT", released: "2024-12-12", context: "16k", maxOutput: "16k",
    params: "14B", open: true, license: "MIT", input: T, output: T, caps: ["json-mode", "streaming", "fine-tuning"],
    description: "14B small language model trained heavily on synthetic data. Strong at math and reasoning for its size.",
    tier: { q: 0.4, math: 0.04 },
    offerings: [
      { provider: "azure-foundry", in: 0.000125, out: 0.0005, unit: "per_1k" },
      { provider: "deepinfra", in: 0.07, out: 0.14 },
    ],
  },
  {
    slug: "phi-4-reasoning", name: "Phi-4 Reasoning", lab: "microsoft", type: "REASONING", released: "2025-04-30", context: "32k", maxOutput: "32k",
    params: "14B", open: true, license: "MIT", input: T, output: T, caps: ["reasoning", "streaming"],
    description: "Phi-4 fine-tuned on reasoning traces. Rivals much larger models on math olympiad problems.",
    tier: { q: 0.55, math: 0.08 },
    offerings: [{ provider: "azure-foundry", in: 0.000125, out: 0.0005, unit: "per_1k" }],
  },

  // ───────────────────────── Amazon
  {
    slug: "nova-pro", name: "Amazon Nova Pro", lab: "amazon", type: "MULTIMODAL", released: "2024-12-03", context: "300k", maxOutput: "10k",
    input: ["text", "image", "video"], output: T, caps: ["tool-calling", "json-mode", "vision", "streaming", "fine-tuning", "batch", "prompt-caching"],
    description: "Capable multimodal model balancing accuracy, speed and cost, with video understanding.",
    tier: { q: 0.45 },
    offerings: [{ provider: "aws-bedrock", in: 0.0008, out: 0.0032, unit: "per_1k" }],
  },
  {
    slug: "nova-lite", name: "Amazon Nova Lite", lab: "amazon", type: "MULTIMODAL", released: "2024-12-03", context: "300k", maxOutput: "10k",
    input: ["text", "image", "video"], output: T, caps: ["tool-calling", "json-mode", "vision", "streaming", "fine-tuning", "batch"],
    description: "Very low-cost multimodal model for fast processing of images, video and text.",
    tier: { q: 0.32 },
    offerings: [{ provider: "aws-bedrock", in: 0.00006, out: 0.00024, unit: "per_1k" }],
  },
  {
    slug: "nova-micro", name: "Amazon Nova Micro", lab: "amazon", type: "CHAT", released: "2024-12-03", context: "128k", maxOutput: "10k",
    input: T, output: T, caps: ["tool-calling", "json-mode", "streaming", "fine-tuning", "batch"],
    description: "Text-only model with the lowest latency and price in the Nova family.",
    tier: { q: 0.22 },
    offerings: [{ provider: "aws-bedrock", in: 0.000035, out: 0.00014, unit: "per_1k" }],
  },

  // ───────────────────────── Moonshot
  {
    slug: "kimi-k2", name: "Kimi K2", lab: "moonshot", type: "CHAT", released: "2025-07-11", context: "128k", maxOutput: "16k",
    params: "1T (32B active)", open: true, license: "Modified MIT", input: T, output: T,
    caps: ["tool-calling", "json-mode", "streaming"],
    description: "Trillion-parameter MoE tuned for agentic tool use and coding without a separate thinking mode.",
    tier: { q: 0.74, code: 0.06 },
    offerings: [
      { provider: "together", in: 1, out: 3 },
      { provider: "groq", in: 1, out: 3 },
      { provider: "fireworks", in: 0.6, out: 2.5 },
      { provider: "deepinfra", in: 0.5, out: 2 },
    ],
  },
];
