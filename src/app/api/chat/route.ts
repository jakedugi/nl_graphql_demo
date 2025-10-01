import { NextRequest } from "next/server";
import { Groq } from "groq-sdk";
import { env } from "../../../config/env";
import { API_CONSTANTS, HTTP_CONSTANTS } from "../../../config/constants";

export const runtime = "edge"; // optional, improves streaming

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const groq = new Groq({
    apiKey: env.GROQ_API_KEY,
  });

  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: API_CONSTANTS.MODEL_NAME,
    ...API_CONSTANTS.CHAT_CONFIG,
    stop: null,
  });

  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chatCompletion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": HTTP_CONSTANTS.CONTENT_TYPE.TEXT_PLAIN,
      "Cache-Control": HTTP_CONSTANTS.CACHE_CONTROL.NO_CACHE,
      "Connection": HTTP_CONSTANTS.CONNECTION.KEEP_ALIVE,
    },
  });
}
