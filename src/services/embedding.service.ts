import { Context, Effect } from "effect";
import { stringUtils } from "../utils/string.lib";

export class EmbeddingService extends Context.Tag("EmbeddingService")<
  EmbeddingService,
  {
    generateEmbedding: (text: string) => Effect.Effect<number[], Error>;
    cosineSimilarity: (a: number[], b: number[]) => number;
  }
>() {}
type EmbeddingServiceType = Context.Tag.Service<EmbeddingService>;

export class EmbeddingServiceImpl implements EmbeddingServiceType {
  // Simple TF-IDF based embedding for demonstration
  // In production, you'd use a proper embedding model
  generateEmbedding = (text: string): Effect.Effect<number[], Error> =>
    Effect.sync(() => {
      try {
        const words = stringUtils.tokenize(text);
        const wordFreq = new Map<string, number>();

        // Count word frequencies
        words.forEach((word) => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });

        // Create a simple vector representation
        const commonWords = [
          "the",
          "and",
          "to",
          "of",
          "a",
          "in",
          "is",
          "it",
          "you",
          "that",
          "he",
          "was",
          "for",
          "on",
          "are",
          "as",
          "with",
          "his",
          "they",
          "i",
          "at",
          "be",
          "this",
          "have",
          "from",
          "or",
          "one",
          "had",
          "by",
          "word",
          "but",
          "not",
          "what",
          "all",
          "were",
          "we",
          "when",
          "your",
          "can",
          "said",
          "there",
          "each",
          "which",
          "she",
          "do",
          "how",
          "their",
          "if",
          "will",
          "up",
          "other",
          "about",
          "out",
          "many",
          "then",
          "them",
          "these",
          "so",
          "some",
          "her",
          "would",
          "make",
          "like",
          "into",
          "him",
          "has",
          "two",
          "more",
          "very",
          "after",
          "words",
          "first",
          "been",
          "who",
          "oil",
          "its",
          "now",
          "find",
          "long",
          "down",
          "way",
          "get",
          "may",
          "new",
          "sound",
          "take",
          "only",
          "little",
          "work",
          "know",
          "place",
          "year",
          "live",
          "me",
          "back",
          "give",
          "most",
          "very",
          "good",
          "sentence",
          "man",
          "think",
          "say",
          "great",
          "where",
          "help",
          "through",
          "much",
          "before",
          "line",
          "right",
          "too",
          "mean",
          "old",
          "any",
          "same",
          "tell",
          "boy",
          "follow",
          "came",
          "want",
          "show",
          "also",
          "around",
          "form",
          "three",
          "small",
          "set",
          "put",
          "end",
        ];

        // Create embedding vector
        const embedding = commonWords.map((word) => {
          const freq = wordFreq.get(word) || 0;
          return freq / words.length; // Normalize by text length
        });

        // Add some semantic features
        const semanticFeatures = [
          this.calculateSentimentScore(words),
          this.calculateComplexityScore(words),
          this.calculateLengthScore(text),
          this.calculateQuestionScore(text),
          this.calculateExclamationScore(text),
        ];

        return [...embedding, ...semanticFeatures];
      } catch (error) {
        throw new Error(`Failed to generate embedding: ${error}`);
      }
    });

  cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const norm = Math.sqrt(normA) * Math.sqrt(normB);
    return norm === 0 ? 0 : dotProduct / norm;
  };

  private calculateSentimentScore(words: string[]): number {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "wonderful",
      "fantastic",
      "love",
      "like",
      "happy",
      "joy",
      "excited",
      "pleased",
      "satisfied",
      "positive",
      "optimistic",
      "appreciate",
      "grateful",
      "thankful",
      "admire",
      "enjoy",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "hate",
      "dislike",
      "sad",
      "angry",
      "frustrated",
      "disappointed",
      "upset",
      "negative",
      "pessimistic",
      "annoyed",
      "irritated",
      "regret",
      "dissatisfied",
      "unhappy",
    ];

    let score = 0;
    words.forEach((word) => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    return score / words.length;
  }

  private calculateComplexityScore(words: string[]): number {
    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    return Math.min(avgWordLength / 10, 1); // Normalize to 0-1
  }

  private calculateLengthScore(text: string): number {
    return Math.min(text.length / 10000, 1); // Normalize to 0-1
  }

  private calculateQuestionScore(text: string): number {
    const questionMarks = (text.match(/\?/g) || []).length;
    return Math.min(questionMarks / 10, 1);
  }

  private calculateExclamationScore(text: string): number {
    const exclamationMarks = (text.match(/!/g) || []).length;
    return Math.min(exclamationMarks / 10, 1);
  }
}
