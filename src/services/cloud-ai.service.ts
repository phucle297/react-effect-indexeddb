import { Context, Effect } from "effect";
import type { Note } from "../types";

interface CloudAnalysisResult {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
}

class CloudAiServiceImpl {
  private apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  private apiUrl = "https://api.openai.com/v1/chat/completions";

  private makeRequest = (messages: any[]): Effect.Effect<any, Error> =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages,
            max_tokens: 500,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      },
      catch: (error) => new Error(`Cloud AI request failed: ${error}`),
    });

  analyzeNote = (note: Note): Effect.Effect<CloudAnalysisResult, Error> =>
    Effect.gen(function* () {
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

      const responseText = yield* this.makeRequest([
        { role: "user", content: prompt },
      ]);

      try {
        const result = JSON.parse(responseText);
        return {
          summary: result.summary || "No summary available",
          sentiment: result.sentiment || "neutral",
          keywords: result.keywords || [],
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          summary: "Unable to generate summary",
          sentiment: "neutral" as const,
          keywords: [],
        };
      }
    });

  generateSummary = (content: string): Effect.Effect<string, Error> =>
    Effect.gen(function* () {
      if (!this.apiKey) {
        yield* Effect.fail(new Error("OpenAI API key not configured"));
      }

      const prompt = `Please provide a concise summary of the following text (max 100 words):\n\n${content}`;

      const summary = yield* this.makeRequest([
        { role: "user", content: prompt },
      ]);

      return summary;
    });

  extractKeywords = (content: string): Effect.Effect<string[], Error> =>
    Effect.gen(function* () {
      if (!this.apiKey) {
        yield* Effect.fail(new Error("OpenAI API key not configured"));
      }

      const prompt = `Extract 5 key keywords or tags from the following text. Respond with a JSON array of strings:\n\n${content}`;

      const response = yield* this.makeRequest([
        { role: "user", content: prompt },
      ]);

      try {
        const keywords = JSON.parse(response);
        return Array.isArray(keywords) ? keywords : [];
      } catch {
        return [];
      }
    });

  analyzeSentiment = (
    content: string,
  ): Effect.Effect<"positive" | "neutral" | "negative", Error> =>
    Effect.gen(function* () {
      if (!this.apiKey) {
        yield* Effect.fail(new Error("OpenAI API key not configured"));
      }

      const prompt = `Analyze the sentiment of the following text. Respond with only one word: "positive", "neutral", or "negative":\n\n${content}`;

      const response = yield* this.makeRequest([
        { role: "user", content: prompt },
      ]);

      const sentiment = response.trim().toLowerCase();
      if (["positive", "neutral", "negative"].includes(sentiment)) {
        return sentiment as "positive" | "neutral" | "negative";
      }

      return "neutral";
    });
}

export const CloudAiService =
  Context.GenericTag<CloudAiServiceImpl>("CloudAiService");
export const CloudAiServiceLive = CloudAiService.of(new CloudAiServiceImpl());
