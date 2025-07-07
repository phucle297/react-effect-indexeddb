import { Effect, Fiber } from "effect";

export const fiberUtils = {
  // Run multiple effects in parallel and collect results
  runParallel: <T, E>(
    effects: Effect.Effect<T, E>[],
  ): Effect.Effect<T[], E> => {
    return Effect.gen(function* () {
      const fibers = effects.map((effect) => Effect.fork(effect));
      const results = yield* Effect.all(
        fibers.map((fiber) => Effect.fiberAwait(fiber)),
      );
      return results;
    });
  },

  // Run effects with timeout
  withTimeout: <T, E>(
    effect: Effect.Effect<T, E>,
    timeoutMs: number,
  ): Effect.Effect<T, E | Error> => {
    const timeout = Effect.delay(Effect.fail(new Error("Timeout")), timeoutMs);
    return Effect.race(effect, timeout);
  },

  // Retry with exponential backoff
  retryWithBackoff: <T, E>(
    effect: Effect.Effect<T, E>,
    maxRetries: number = 3,
  ): Effect.Effect<T, E> => {
    return Effect.retry(effect, {
      times: maxRetries,
      schedule: Effect.Schedule.exponential(1000), // Start with 1 second
    });
  },

  // Cancel all running fibers
  cancelAll: (fibers: Fiber.Fiber<any, any>[]): Effect.Effect<void, never> => {
    return Effect.gen(function* () {
      yield* Effect.all(fibers.map((fiber) => Effect.fiberInterrupt(fiber)));
    });
  },
};
