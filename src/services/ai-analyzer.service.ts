import { Context, Effect, Fiber } from "effect";
import type { AiAnalysisResult, Note } from "../types";
import { AiWorkerClientService } from "./ai-worker-client.service";
import { CloudAiService } from "./cloud-ai.service";
import { EmbeddingService } from "./embedding.service";

export class AiAnalyzerServiceImpl {
  analyze = (note: Note) =>
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

  analyzeBatch = (notes: Note[]) =>
    Effect.gen(function* () {
      // Analyze notes in parallel using fibers
      const fibers = notes.map((note) => Effect.fork(this.analyze(note)));
      const results = yield* Effect.all(
        fibers.map((fiber) => Fiber.await(fiber)),
      );
      return results;
    });
}

export class AiAnalyzerService extends Context.Tag("AiAnalyzerService")<
  AiAnalyzerService,
  {
    analyze: (note: Note) => Effect.Effect<AiAnalysisResult, Error>;
    analyzeBatch: (notes: Note[]) => Effect.Effect<AiAnalysisResult[], Error>;
  }
>() {}

export type AiAnalyzerServiceType = Context.Tag.Service<AiAnalyzerService>;
