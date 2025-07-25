import { Context, Effect } from "effect";
import type { Note } from "../types";
import AiWorker from "../workers/ai.worker?worker";

interface WorkerAnalysisResult {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
}

export class AiWorkerClientService extends Context.Tag("AiWorkerClientService")<
  AiWorkerClientService,
  {
    analyzeNote: (note: Note) => Effect.Effect<WorkerAnalysisResult, Error>;
    generateSummary: (content: string) => Effect.Effect<string, Error>;
    extractKeywords: (content: string) => Effect.Effect<string[], Error>;
    analyzeSentiment: (
      content: string,
    ) => Effect.Effect<"positive" | "neutral" | "negative", Error>;
    terminate: () => Effect.Effect<void, never>;
  }
>() {}

type AiWorkerClientServiceType = Context.Tag.Service<AiWorkerClientService>;

export class AiWorkerClientServiceImpl implements AiWorkerClientServiceType {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();

  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = new AiWorker();
      this.worker.onmessage = (event) => {
        const { messageId, result, error } = event.data;
        const pending = this.pendingRequests.get(messageId);

        if (pending) {
          this.pendingRequests.delete(messageId);
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(result);
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error("Worker error:", error);
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests) {
          pending.reject(new Error("Worker error"));
          this.pendingRequests.delete(id);
        }
      };
    }

    return this.worker;
  }

  private postMessage<T>(message: any): Promise<T> {
    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: We need to use async/await for worker communication
    return new Promise(async (resolve, reject) => {
      const worker = await this.getWorker();
      const messageId = ++this.messageId;

      this.pendingRequests.set(messageId, { resolve, reject });

      worker.postMessage({
        messageId,
        ...message,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error("Worker timeout"));
        }
      }, 30000);
    });
  }

  analyzeNote = (note: Note): Effect.Effect<WorkerAnalysisResult, Error> =>
    Effect.tryPromise({
      try: () =>
        this.postMessage<WorkerAnalysisResult>({
          task: "analyze",
          noteId: note.id,
          content: note.content,
          title: note.title,
        }),
      catch: (error) => new Error(`Worker analysis failed: ${error}`),
    });

  generateSummary = (content: string): Effect.Effect<string, Error> =>
    Effect.tryPromise({
      try: () =>
        this.postMessage<string>({
          task: "summarize",
          content,
        }),
      catch: (error) => new Error(`Summary generation failed: ${error}`),
    });

  extractKeywords = (content: string): Effect.Effect<string[], Error> =>
    Effect.tryPromise({
      try: () =>
        this.postMessage<string[]>({
          task: "keywords",
          content,
        }),
      catch: (error) => new Error(`Keyword extraction failed: ${error}`),
    });

  analyzeSentiment = (
    content: string,
  ): Effect.Effect<"positive" | "neutral" | "negative", Error> =>
    Effect.tryPromise({
      try: () =>
        this.postMessage<"positive" | "neutral" | "negative">({
          task: "sentiment",
          content,
        }),
      catch: (error) => new Error(`Sentiment analysis failed: ${error}`),
    });

  terminate = (): Effect.Effect<void, never> =>
    Effect.sync(() => {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      this.pendingRequests.clear();
    });
}
