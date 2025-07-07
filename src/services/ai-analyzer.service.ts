import { Context, Effect, Fiber } from "effect";
import type { AiAnalysisResult, Note } from "../types";
import { AiWorkerClientService } from "./ai-worker-client.service";
import { CloudAiService } from "./cloud-ai.service";
import { EmbeddingService } from "./embedding.service";

type Requirements = AiWorkerClientService | CloudAiService | EmbeddingService;
export class AiAnalyzerServiceImpl {
  constructor() {
    this.analyze = this.analyze.bind(this);
    this.analyzeBatch = this.analyzeBatch.bind(this);
  }

  analyze = (
    note: Note,
  ): Effect.Effect<AiAnalysisResult, Error, Requirements> =>
    Effect.gen(function* () {
      const workerClient = yield* AiWorkerClientService;
      const cloudAi = yield* CloudAiService;
      const embedding = yield* EmbeddingService;

      // Try local analysis first, fallback to cloud
      const analysisResult = yield* Effect.orElse(
        workerClient.analyzeNote(note),
        () => cloudAi.analyzeNote(note),
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
  ): Effect.Effect<AiAnalysisResult[], Error, Requirements> => {
    const analyze = this.analyze; // Capture the bound method

    return Effect.gen(function* () {
      // Fork all analysis operations to get fibers
      const fibers = yield* Effect.all(
        notes.map((note) => Effect.fork(analyze(note))),
      );

      // Await all fibers to complete
      const results = yield* Effect.all(
        fibers.map((fiber) => Fiber.join(fiber)),
      );

      return results;
    });
  };
}

export class AiAnalyzerService extends Context.Tag("AiAnalyzerService")<
  AiAnalyzerService,
  {
    analyze: (
      note: Note,
    ) => Effect.Effect<AiAnalysisResult, Error, Requirements>;
    analyzeBatch: (
      notes: Note[],
    ) => Effect.Effect<AiAnalysisResult[], Error, Requirements>;
  }
>() {}

export type AiAnalyzerServiceType = Context.Tag.Service<AiAnalyzerService>;
