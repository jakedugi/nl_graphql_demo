// API Constants - Single Source of Truth for all API-related configuration
export const API_CONSTANTS = {
  // Shared Groq Model Configuration
  MODEL_NAME: "openai/gpt-oss-20b",

  // NLQ Configuration - parameters for natural language query processing
  // Low temperature (0.1) for deterministic, consistent NL-to-GraphQL conversion
  NLQ_CONFIG: {
    temperature: 0.1,
  } as const,

  // Model Factory - creates model instances with consistent configuration
  // Uses NLQ_CONFIG temperature by default for query processing
  createGroqModel: (apiKey: string) => ({
    apiKey,
    model: API_CONSTANTS.MODEL_NAME,
    temperature: API_CONSTANTS.NLQ_CONFIG.temperature,
  }),

  // Chat Configuration - general conversational AI
  // Higher temperature (1.0) for creative, varied chat responses
  CHAT_CONFIG: {
    temperature: 1,
    max_completion_tokens: 8192,
    top_p: 1,
    stream: true,
    reasoning_effort: "medium" as const,
  } as const,
} as const;

// HTTP Constants - Single Source of Truth for HTTP headers and status codes
export const HTTP_CONSTANTS = {
  // Content Types
  CONTENT_TYPE: {
    JSON: "application/json",
    TEXT_PLAIN: "text/plain; charset=utf-8",
  } as const,

  // Cache Control
  CACHE_CONTROL: {
    NO_CACHE: "no-cache",
  } as const,

  // Connection
  CONNECTION: {
    KEEP_ALIVE: "keep-alive",
  } as const,
} as const;

// Default Values - Single Source of Truth for commonly used defaults
export const DEFAULTS = {
  LANGFUSE_HOST: "https://cloud.langfuse.com",
  ENCODING: "utf-8" as const,
} as const;

