// Shared vocabularies. Used by the ingestion validator (to reject unknown values),
// by API query validation, and by the UI (labels). One source of truth.

export const MODEL_TYPES = [
  "CHAT",
  "REASONING",
  "CODE",
  "EMBEDDING",
  "IMAGE_GENERATION",
  "SPEECH",
  "MULTIMODAL",
] as const;
export type ModelTypeValue = (typeof MODEL_TYPES)[number];

export const MODEL_TYPE_LABELS: Record<ModelTypeValue, string> = {
  CHAT: "Chat",
  REASONING: "Reasoning",
  CODE: "Code",
  EMBEDDING: "Embedding",
  IMAGE_GENERATION: "Image generation",
  SPEECH: "Speech",
  MULTIMODAL: "Multimodal",
};

export const MODALITIES = ["text", "image", "audio", "video", "file"] as const;
export type Modality = (typeof MODALITIES)[number];

export const CAPABILITIES = [
  "tool-calling",
  "json-mode",
  "structured-output",
  "vision",
  "reasoning",
  "streaming",
  "prompt-caching",
  "fine-tuning",
  "web-search",
  "batch",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  "tool-calling": "Tool calling",
  "json-mode": "JSON mode",
  "structured-output": "Structured output",
  vision: "Vision",
  reasoning: "Reasoning",
  streaming: "Streaming",
  "prompt-caching": "Prompt caching",
  "fine-tuning": "Fine-tuning",
  "web-search": "Web search",
  batch: "Batch API",
};

export const BENCHMARK_CATEGORIES = [
  "KNOWLEDGE",
  "REASONING",
  "CODING",
  "MATH",
  "MULTIMODAL",
  "HUMAN_PREFERENCE",
] as const;
export type BenchmarkCategoryValue = (typeof BENCHMARK_CATEGORIES)[number];

export const BENCHMARK_CATEGORY_LABELS: Record<BenchmarkCategoryValue, string> = {
  KNOWLEDGE: "Knowledge",
  REASONING: "Reasoning",
  CODING: "Coding",
  MATH: "Math",
  MULTIMODAL: "Multimodal",
  HUMAN_PREFERENCE: "Human preference",
};

export const MODEL_SORTS = ["release", "price", "output-price", "context", "name", "score"] as const;
export type ModelSort = (typeof MODEL_SORTS)[number];

export const MODEL_SORT_LABELS: Record<ModelSort, string> = {
  release: "Release date",
  price: "Input price",
  "output-price": "Output price",
  context: "Context window",
  name: "Name",
  score: "Atlas score",
};

export const MAX_COMPARE = 4;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
