import { z } from "zod";
import { DEFAULTS } from "./constants";

const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().default(DEFAULTS.LANGFUSE_HOST),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

export function getEnv(): EnvConfig {
  if (envConfig) return envConfig;

  try {
    envConfig = envSchema.parse(process.env);
    return envConfig;
  } catch (error) {
    console.error("Invalid environment configuration:", error);
    throw new Error("Invalid environment configuration. Check your .env.local file.");
  }
}

// Re-export for convenience
export const env = getEnv();
