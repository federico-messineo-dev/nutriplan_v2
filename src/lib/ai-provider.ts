/**
 * lib/ai-provider.ts
 * Provider-agnostic AI interface with OpenRouter support.
 * Uses free models via OpenRouter (meta-llama/llama-3.1-8b-instruct:free).
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AITool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface AIGenerateParams {
  model?: string;
  system: string;
  messages: AIMessage[];
  tools?: AITool[];
  maxTokens?: number;
}

export interface AIToolUse {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
}

export interface AIResponse {
  content: (AIToolUse | { type: "text"; text: string })[];
}

/**
 * Generate a response from the AI provider.
 * Supports OpenRouter (OpenAI-compatible API).
 */
export async function generate(params: AIGenerateParams): Promise<AIResponse> {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;

  if (!provider || !apiKey) {
    throw new Error(
      "AI provider not configured. Set AI_PROVIDER and AI_API_KEY in .env.local. " +
      "Supported providers: 'openrouter'."
    );
  }

  if (provider === "openrouter") {
    return generateOpenRouter(params, apiKey);
  }

  throw new Error(
    `AI provider '${provider}' not supported. Use 'openrouter'.`
  );
}

async function generateOpenRouter(
  params: AIGenerateParams,
  apiKey: string,
): Promise<AIResponse> {
  const model = params.model || process.env.AI_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: params.system },
      ...params.messages,
    ],
    max_tokens: params.maxTokens || 2048,
    temperature: 0.3,
  };

  if (params.tools && params.tools.length > 0) {
    body.tools = params.tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));
    body.tool_choice = "auto";
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://nutriplan.app",
      "X-Title": "NutriPlan Pro",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error("No choices returned from OpenRouter.");
  }

  // Handle tool calls
  const message = choice.message;
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolUses: AIToolUse[] = message.tool_calls.map((tc: { function: { name: string; arguments: string } }) => ({
      type: "tool_use" as const,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments),
    }));
    return { content: toolUses };
  }

  // Text response
  return {
    content: [{ type: "text", text: message.content || "" }],
  };
}
