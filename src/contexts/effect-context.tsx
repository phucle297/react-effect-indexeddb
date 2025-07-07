// import { Context, Effect } from "effect";
// import { createContext, type ReactNode, useContext } from "react";
// import {
//   AiAnalyzerService,
//   AiAnalyzerServiceLive,
// } from "../services/ai-analyzer.service";
// import {
//   AiWorkerClientService,
//   AiWorkerClientServiceLive,
// } from "../services/ai-worker-client.service";
// import {
//   CloudAiService,
//   CloudAiServiceLive,
// } from "../services/cloud-ai.service";
// import {
//   EmbeddingService,
//   EmbeddingServiceLive,
// } from "../services/embedding.service";
// import {
//   NoteRepoService,
//   // NoteRepoServiceLive,
// } from "../services/note-repo.service";
//
// // Create service context
//
// const ServiceContext = Context.empty().pipe(
//   Context.add(NoteRepoService, NoteRepoServiceLive),
//   Context.add(AiAnalyzerService, AiAnalyzerServiceLive),
//   Context.add(AiWorkerClientService, AiWorkerClientServiceLive),
//   Context.add(CloudAiService, CloudAiServiceLive),
//   Context.add(EmbeddingService, EmbeddingServiceLive),
// );
//
// // React context for Effect services
// const EffectContext = createContext<typeof ServiceContext | null>(null);
//
// export const EffectContextProvider = ({
//   children,
// }: {
//   children: ReactNode;
// }) => {
//   return (
//     <EffectContext.Provider value={ServiceContext}>
//       {children}
//     </EffectContext.Provider>
//   );
// };
//
// export const useEffectContext = () => {
//   const context = useContext(EffectContext);
//   if (!context) {
//     throw new Error(
//       "useEffectContext must be used within EffectContextProvider",
//     );
//   }
//   return context;
// };
//
// // Helper to run effects with context
// export const runWithContext = <T, E>(
//   effect: Effect.Effect<T, E>,
// ): Promise<T> => {
//   return Effect.runPromise(Effect.provide(effect, ServiceContext));
// };

import React, { createContext, useContext, ReactNode } from "react";
import { Effect, Context, Layer } from "effect";
import {
  NoteRepoService,
  NoteRepoServiceImpl,
} from "../services/note-repo.service";
// import {
//   AiAnalyzerService,
//   AiAnalyzerServiceImpl,
// } from "../services/ai-analyzer.service";
// import {
//   AiWorkerClientService,
//   AiWorkerClientServiceImpl,
// } from "../services/ai-worker-client.service";
// import {
//   CloudAiService,
//   CloudAiServiceImpl,
// } from "../services/cloud-ai.service";
// import {
//   EmbeddingService,
//   EmbeddingServiceImpl,
// } from "../services/embedding.service";

// Create service layers
const NoteRepoServiceLayer = Layer.succeed(
  NoteRepoService,
  new NoteRepoServiceImpl(),
);
// const AiWorkerClientServiceLayer = Layer.succeed(
//   AiWorkerClientService,
//   new AiWorkerClientServiceImpl(),
// );
// const CloudAiServiceLayer = Layer.succeed(
//   CloudAiService,
//   new CloudAiServiceImpl(),
// );
// const EmbeddingServiceLayer = Layer.succeed(
//   EmbeddingService,
//   new EmbeddingServiceImpl(),
// );
//
// // AI Analyzer depends on other services
// const AiAnalyzerServiceLayer = Layer.succeed(
//   AiAnalyzerService,
//   new AiAnalyzerServiceImpl(),
// );

// Combine all service layers
const AppLayer = Layer.mergeAll(
  NoteRepoServiceLayer,
  // AiWorkerClientServiceLayer,
  // CloudAiServiceLayer,
  // EmbeddingServiceLayer,
  // AiAnalyzerServiceLayer,
);

// React context for Effect services
const EffectContext = createContext<typeof AppLayer | null>(null);

export const EffectContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <EffectContext.Provider value={AppLayer}>{children}</EffectContext.Provider>
  );
};

export const useEffectContext = () => {
  const context = useContext(EffectContext);
  if (!context) {
    throw new Error(
      "useEffectContext must be used within EffectContextProvider",
    );
  }
  return context;
};

// Helper to run effects with context
export const runWithContext = <T, E>(
  effect: Effect.Effect<T, E>,
): Promise<T> => {
  return Effect.runPromise(Effect.provide(effect, AppLayer));
};
