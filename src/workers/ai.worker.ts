import { stringUtils } from "../utils/string-utils";

interface WorkerMessage {
  messageId: number;
  task: string;
  content?: string;
  title?: string;
  noteId?: string;
}

interface WorkerResponse {
  messageId: number;
  result?: any;
  error?: string;
}

// Simple local AI implementations
class LocalAI {
  static summarize(content: string): string {
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    if (sentences.length <= 2) return content;

    // Simple extractive summarization - take first and last sentence
    const firstSentence = sentences[0].trim();
    const lastSentence = sentences[sentences.length - 1].trim();

    return `${firstSentence}. ${lastSentence}.`;
  }

  static analyzeSentiment(
    content: string,
  ): "positive" | "neutral" | "negative" {
    const words = stringUtils.tokenize(content.toLowerCase());

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
      "pleased",
      "satisfied",
      "excited",
      "thrilled",
      "delighted",
      "awesome",
      "brilliant",
      "perfect",
      "beautiful",
      "success",
      "win",
      "achieve",
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
      "worried",
      "concerned",
      "problem",
      "issue",
      "fail",
      "wrong",
      "error",
      "mistake",
      "difficult",
      "hard",
      "struggle",
      "pain",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const threshold = Math.max(1, words.length * 0.05); // 5% threshold

    if (positiveCount > negativeCount && positiveCount >= threshold) {
      return "positive";
    } else if (negativeCount > positiveCount && negativeCount >= threshold) {
      return "negative";
    }

    return "neutral";
  }

  static extractKeywords(content: string): string[] {
    const words = stringUtils.tokenize(content.toLowerCase());

    // Remove common stop words
    const stopWords = new Set([
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
    ]);

    const filteredWords = words.filter(
      (word) =>
        !stopWords.has(word) && word.length > 2 && /^[a-zA-Z]+$/.test(word),
    );

    // Count word frequencies
    const wordFreq = new Map<string, number>();
    filteredWords.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Get top keywords
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return sortedWords;
  }

  static analyzeNote(content: string, title: string) {
    const fullText = `${title} ${content}`;

    return {
      summary: this.summarize(content),
      sentiment: this.analyzeSentiment(fullText),
      keywords: this.extractKeywords(fullText),
    };
  }
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { messageId, task, content, title, noteId } = event.data;

  try {
    let result: any;

    switch (task) {
      case "analyze":
        result = LocalAI.analyzeNote(content || "", title || "");
        break;
      case "summarize":
        result = LocalAI.summarize(content || "");
        break;
      case "sentiment":
        result = LocalAI.analyzeSentiment(content || "");
        break;
      case "keywords":
        result = LocalAI.extractKeywords(content || "");
        break;
      default:
        throw new Error(`Unknown task: ${task}`);
    }

    const response: WorkerResponse = {
      messageId,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      messageId,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    self.postMessage(response);
  }
};

// Signal that worker is ready
self.postMessage({ ready: true });
