import { Context, Effect, Fiber } from "effect";
import type { AiAnalysisResult, Note } from "../types";
import { AiWorkerClientService } from "./ai-worker-client.service";
import { CloudAiService } from "./cloud-ai.service";
import { EmbeddingService } from "./embedding.service";

export type AiAnalyzerRequirements =
  | AiWorkerClientService
  | CloudAiService
  | EmbeddingService;

export class AiAnalyzerService extends Context.Tag("AiAnalyzerService")<
  AiAnalyzerService,
  {
    analyze: (
      note: Note,
    ) => Effect.Effect<AiAnalysisResult, Error, AiAnalyzerRequirements>;
    analyzeBatch: (
      notes: Note[],
    ) => Effect.Effect<AiAnalysisResult[], Error, AiAnalyzerRequirements>;
  }
>() {}

type AiAnalyzerServiceType = Context.Tag.Service<AiAnalyzerService>;

export class AiAnalyzerServiceImpl implements AiAnalyzerServiceType {
  constructor() {
    this.analyze = this.analyze.bind(this);
    this.analyzeBatch = this.analyzeBatch.bind(this);
  }

  analyze = (
    note: Note,
  ): Effect.Effect<AiAnalysisResult, Error, AiAnalyzerRequirements> =>
    Effect.gen(function* () {
      const workerClient = yield* AiWorkerClientService;
      const cloudAi = yield* CloudAiService;
      const embedding = yield* EmbeddingService;

      // Try cloud first, then fallback to worker
      const analysisResult = yield* Effect.orElse(
        cloudAi.analyzeNote(note),
        () => workerClient.analyzeNote(note),
      );

      // Generate embedding
      const embeddingVector = yield* embedding.generateEmbedding(note.content);

      return {
        noteId: note.id,
        summary: analysisResult.summary,
        sentiment: analysisResult.sentiment,
        keywords: analysisResult.keywords,
        embedding: embeddingVector,
        lastAnalyzed: Date.now(),
      };
    });

  analyzeBatch = (
    notes: Note[],
  ): Effect.Effect<AiAnalysisResult[], Error, AiAnalyzerRequirements> =>
    Effect.gen(this, function* () {
      // Fork all analysis operations to get fibers
      const fibers = yield* Effect.all(
        notes.map((note) => Effect.fork(this.analyze(note))),
      );

      const results = yield* Effect.all(
        fibers.map((fiber) => Fiber.join(fiber)),
      );

      return results;
    });
}
