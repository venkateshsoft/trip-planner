import { ProviderError } from "@/server/providers/errors";

type AIClientOptions = {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  model?: string;
};

export type StructuredAIRequest = {
  name: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: string;
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

export class AIClient {
  private readonly fetchImpl: typeof fetch;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(options: AIClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.5";
  }

  async structured<T>(request: StructuredAIRequest): Promise<T> {
    if (!this.apiKey)
      throw new ProviderError(
        "OPENAI_API_KEY is not configured",
        "openai",
        503,
      );
    const response = await this.fetchImpl(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          store: false,
          instructions: request.instructions,
          input: request.input,
          text: {
            format: {
              type: "json_schema",
              name: request.name,
              strict: true,
              schema: request.schema,
            },
          },
        }),
      },
    );
    if (!response.ok)
      throw new ProviderError(
        `OpenAI returned HTTP ${response.status}`,
        "openai",
        502,
      );
    const payload = (await response.json()) as ResponsesPayload;
    const text =
      payload.output_text ??
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((content) => content.type === "output_text")?.text;
    if (!text)
      throw new ProviderError(
        "OpenAI returned no structured output",
        "openai",
        502,
      );
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ProviderError("OpenAI returned invalid JSON", "openai", 502);
    }
  }
}

