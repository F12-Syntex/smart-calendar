import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIRequestBody {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
}

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: AIRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  const model = body.model || DEFAULT_MODEL;

  if (body.stream) {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Smart Planner",
        },
        body: JSON.stringify({
          model,
          messages: body.messages,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenRouter error: ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Smart Planner",
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `OpenRouter error: ${response.status}`, details: errorText },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
