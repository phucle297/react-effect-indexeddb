import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources";
import { Context, Effect } from "effect";
import { parseResponseJson } from "@/utils/parse-response-json.lib";
import type { Note } from "../types";

interface CloudAnalysisResult {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
}
export class CloudAiService extends Context.Tag("CloudAiService")<
  CloudAiService,
  {
    analyzeNote: (note: Note) => Effect.Effect<CloudAnalysisResult, Error>;
    generateSummary: (content: string) => Effect.Effect<string, Error>;
    extractKeywords: (content: string) => Effect.Effect<string[], Error>;
    analyzeSentiment: (
      content: string,
    ) => Effect.Effect<"positive" | "neutral" | "negative", Error>;
  }
>() {}

type CloudAiServiceType = Context.Tag.Service<CloudAiService>;

export class CloudAiServiceImpl implements CloudAiServiceType {
  private readonly apiKey = import.meta.env.VITE_API_KEY;
  private readonly anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: this.apiKey || "",
      dangerouslyAllowBrowser: true,
    });
    this.analyzeNote = this.analyzeNote.bind(this);
    this.generateSummary = this.generateSummary.bind(this);
    this.extractKeywords = this.extractKeywords.bind(this);
    this.analyzeSentiment = this.analyzeSentiment.bind(this);
  }
  private makeRequest = (
    messages: MessageParam[],
  ): Effect.Effect<Anthropic.Messages.Message, Error> =>
    Effect.tryPromise({
      try: async () => {
        const msg = await this.anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages,
        });

        if (!msg || !msg.content) {
          throw new Error("No response from Cloud AI");
        }
        return msg;
      },
      catch: (error) => new Error(`Cloud AI request failed: ${error}`),
    });

  analyzeNote = (note: Note): Effect.Effect<CloudAnalysisResult, Error> =>
    Effect.gen(this, function* () {
      if (!this.apiKey) {
        yield* Effect.fail(new Error("OpenAI API key not configured"));
      }

      const prompt = `Please analyze the following note and provide a JSON response with:
1. A concise summary (max 100 words)
2. Sentiment analysis (positive, neutral, or negative)
3. Key keywords/tags (max 5)

Note Title: ${note.title}
Note Content: ${note.content}

Please respond with valid JSON in this format:
{
  "summary": "...",
  "sentiment": "positive|neutral|negative",
  "keywords": ["keyword1", "keyword2", ...]
}`;

      const msg = yield* this.makeRequest([{ role: "user", content: prompt }]);
      let responseText = "";
      if (msg.content.length > 1) {
        responseText =
          (msg.content.at(-1) as unknown as { content: string })?.content || "";
      } else {
        responseText =
          (msg.content.at(-1) as unknown as { text: string })?.text || "";
      }

      try {
        const result = parseResponseJson<CloudAnalysisResult>(responseText);
        return {
          summary: result.summary || "No summary available",
          sentiment: result.sentiment || "neutral",
          keywords: result.keywords || [],
        };
      } catch (_) {
        // Fallback if JSON parsing fails
        return {
          summary: "Unable to generate summary",
          sentiment: "neutral" as const,
          keywords: [],
        };
      }
    });

  generateSummary = (content: string) =>
    Effect.gen(this, function* () {
      if (!this.apiKey) {
        yield* Effect.fail(new Error("OpenAI API key not configured"));
      }

      const prompt = `Please provide a concise summary of the following text (max 100 words):\n\n${content}`;

      const msg = yield* this.makeRequest([{ role: "user", content: prompt }]);

      let summary = "";

      if (msg.content.length > 1) {
        summary =
          (msg.content.at(-1) as unknown as { content: string })?.content || "";
      } else {
        summary =
          (msg.content.at(-1) as unknown as { text: string })?.text || "";
      }

      return summary;
    });

  extractKeywords = (content: string): Effect.Effect<string[], Error> =>
    Effect.gen(this, function* () {
      if (!this.apiKey) {
        yield* Effect.fail(new Error("OpenAI API key not configured"));
      }

      const prompt = `Extract 5 key keywords or tags from the following text. Respond with a JSON array of strings:\n\n${content}`;

      const response = yield* this.makeRequest([
        { role: "user", content: prompt },
      ]);

      let responseText = "";
      if (response.content.length > 1) {
        responseText =
          (response.content.at(-1) as unknown as { content: string })
            ?.content || "";
      } else {
        responseText =
          (response.content.at(-1) as unknown as { text: string })?.text || "";
      }

      try {
        const keywords = parseResponseJson(responseText);
        return Array.isArray(keywords) ? keywords : [];
      } catch {
        return [];
      }
    });

  analyzeSentiment = (
    content: string,
  ): Effect.Effect<"positive" | "neutral" | "negative", Error> =>
    Effect.gen(this, function* () {
      if (!this.apiKey) {
        yield* Effect.fail(new Error("OpenAI API key not configured"));
      }

      const prompt = `Analyze the sentiment of the following text. Respond with only one word: "positive", "neutral", or "negative":\n\n${content}`;

      const response = yield* this.makeRequest([
        { role: "user", content: prompt },
      ]);
      let sentiment = "";

      if (response.content.length > 1) {
        sentiment =
          (response.content.at(-1) as unknown as { content: string })
            ?.content || "";
      } else {
        sentiment =
          (response.content.at(-1) as unknown as { text: string })?.text || "";
      }

      if (
        ["positive", "neutral", "negative"].includes(
          sentiment.toLocaleLowerCase(),
        )
      ) {
        return sentiment as "positive" | "neutral" | "negative";
      }

      return "neutral";
    });
}

export class FallbackAiServiceImpl implements CloudAiServiceType {
  analyzeNote = (_note: Note): Effect.Effect<CloudAnalysisResult, Error> =>
    Effect.fail(new Error("Cloud AI service is not available"));

  generateSummary = (_content: string): Effect.Effect<string, Error> =>
    Effect.fail(new Error("Cloud AI service is not available"));

  extractKeywords = (_content: string): Effect.Effect<string[], Error> =>
    Effect.fail(new Error("Cloud AI service is not available"));

  analyzeSentiment = (
    _content: string,
  ): Effect.Effect<"positive" | "neutral" | "negative", Error> =>
    Effect.fail(new Error("Cloud AI service is not available"));
}
