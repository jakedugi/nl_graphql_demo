import { NextRequest } from "next/server";
import { Groq } from "groq-sdk";

export const runtime = "edge"; // optional, improves streaming

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: "openai/gpt-oss-20b",
    temperature: 1,
    max_completion_tokens: 8192,
    top_p: 1,
    stream: true,
    reasoning_effort: "medium",
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
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
