import { env } from "../config/env";

// Langfuse tracing (no-op if not configured)
let langfuse: any = null;

if (env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY) {
  try {
    // Dynamic import to avoid issues if not installed
    const Langfuse = require("langfuse").Langfuse;
    langfuse = new Langfuse({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_HOST,
    });
  } catch (error) {
    console.warn("Langfuse not available, tracing disabled");
  }
}

export interface TraceContext {
  traceId: string;
  spanId?: string;
}

export function createTrace(name: string, metadata?: Record<string, any>): TraceContext | null {
  if (!langfuse) return null;

  try {
    const trace = langfuse.trace({
      name,
      metadata,
    });
    return { traceId: trace.id };
  } catch (error) {
    console.warn("Failed to create trace:", error);
    return null;
  }
}

export function createSpan(
  traceId: string,
  name: string,
  metadata?: Record<string, any>
): string | null {
  if (!langfuse) return null;

  try {
    const span = langfuse.span({
      traceId,
      name,
      metadata,
    });
    return span.id;
  } catch (error) {
    console.warn("Failed to create span:", error);
    return null;
  }
}

export function endSpan(spanId: string, output?: any, error?: Error): void {
  if (!langfuse) return;

  try {
    const span = langfuse.span({ id: spanId });
    if (error) {
      span.end({ output: { error: error.message } });
    } else {
      span.end({ output });
    }
  } catch (error) {
    console.warn("Failed to end span:", error);
  }
}

export function endTrace(traceId: string, output?: any, error?: Error): void {
  if (!langfuse) return;

  try {
    const trace = langfuse.trace({ id: traceId });
    if (error) {
      trace.update({ output: { error: error.message } });
    } else {
      trace.update({ output });
    }
  } catch (error) {
    console.warn("Failed to end trace:", error);
  }
}

// Wrapper for API route tracing
export async function withTracing<T>(
  operationName: string,
  fn: (traceId?: string) => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const trace = createTrace(operationName, metadata);
  const traceId = trace?.traceId;

  try {
    const result = await fn(traceId);
    if (traceId) {
      endTrace(traceId, result);
    }
    return result;
  } catch (error) {
    if (traceId) {
      endTrace(traceId, undefined, error as Error);
    }
    throw error;
  }
}
