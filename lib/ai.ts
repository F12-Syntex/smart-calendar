export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AskAIOptions {
  model?: string;
  stream?: boolean;
}

export async function askAI(
  messages: ChatMessage[],
  options: AskAIOptions = {},
): Promise<AIResponse> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: options.model,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI request failed");
  }

  return response.json();
}

export async function askAIStream(
  messages: ChatMessage[],
  options: AskAIOptions = {},
): Promise<ReadableStream<Uint8Array> | null> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: options.model,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI stream request failed");
  }

  return response.body;
}
