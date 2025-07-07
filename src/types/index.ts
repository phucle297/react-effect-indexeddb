export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface NoteMetadata {
  noteId: string;
  summary?: string;
  sentiment?: "positive" | "neutral" | "negative";
  keywords?: string[];
  embedding?: number[];
  lastAnalyzed?: number;
}

export interface AiAnalysisResult {
  noteId: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
  embedding: number[];
  lastAnalyzed: number;
}

export interface SimilarNote {
  note: Note;
  similarity: number;
  metadata?: NoteMetadata;
}

export interface WorkerMessage {
  task: "summarize" | "sentiment" | "keywords" | "embedding";
  noteId: string;
  content: string;
}

export interface WorkerResponse {
  noteId: string;
  task: string;
  result: any;
  error?: string;
}
