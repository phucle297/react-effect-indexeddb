import { Effect } from "effect";
import { Brain, FileText, Hash, Link } from "lucide-react";
import { useEffect, useState } from "react";
import { EmbeddingServiceImpl } from "@/services/embedding.service";
import type { Note, SimilarNote } from "@/types";

interface NoteMetadata {
  noteId: string;
  summary?: string;
  keywords?: string[];
  sentiment?: "positive" | "negative" | "neutral";
  embedding?: number[];
  lastAnalyzed?: number;
}

interface InsightPanelProps {
  note: Note;
  metadata?: NoteMetadata;
  notes: Note[];
  allMetadata: Record<string, NoteMetadata>;
  onNoteClick?: (note: Note) => void;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({
  note,
  metadata,
  notes,
  allMetadata,
  onNoteClick,
}) => {
  const [similarNotes, setSimilarNotes] = useState<SimilarNote[]>([]);
  const [isCalculatingSimilarity, setIsCalculatingSimilarity] = useState(false);

  // Calculate similar notes using Effect pattern
  useEffect(() => {
    if (!metadata?.embedding || !Array.isArray(metadata.embedding)) {
      setSimilarNotes([]);
      return;
    }

    setIsCalculatingSimilarity(true);

    const calculateSimilarities = Effect.gen(function* () {
      const embeddingService = new EmbeddingServiceImpl();
      const similarities: SimilarNote[] = [];

      for (const otherNote of notes) {
        if (otherNote.id === note.id) continue;

        const otherMetadata = allMetadata[otherNote.id];
        if (
          !otherMetadata?.embedding ||
          !Array.isArray(otherMetadata.embedding)
        ) {
          continue;
        }

        try {
          const similarity = embeddingService.cosineSimilarity(
            metadata?.embedding ?? [],
            otherMetadata.embedding,
          );

          if (similarity > 0.5 && !Number.isNaN(similarity)) {
            similarities.push({
              note: otherNote,
              similarity,
              metadata: otherMetadata,
            });
          }
        } catch (error) {
          console.warn(
            `Failed to calculate similarity for note ${otherNote.id}:`,
            error,
          );
        }
      }

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    });

    // Run the Effect
    Effect.runPromise(calculateSimilarities)
      .then((results) => {
        setSimilarNotes(results);
      })
      .catch((error) => {
        console.error("Failed to calculate similar notes:", error);
        setSimilarNotes([]);
      })
      .finally(() => {
        setIsCalculatingSimilarity(false);
      });
  }, [metadata?.embedding, notes, allMetadata, note.id]);

  const getSentimentColor = (sentiment?: string): string => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-green-50";
      case "negative":
        return "text-red-600 bg-red-50";
      case "neutral":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSentimentLabel = (sentiment?: string): string => {
    switch (sentiment) {
      case "positive":
        return "😊 Positive";
      case "negative":
        return "😞 Negative";
      case "neutral":
        return "😐 Neutral";
      default:
        return "😐 Neutral";
    }
  };

  const formatDate = (timestamp: number): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (_) {
      return "Invalid date";
    }
  };

  const getWordCount = (content: string): number => {
    if (!content || typeof content !== "string") return 0;
    const trimmed = content.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };

  const getLineCount = (content: string): number => {
    if (!content || typeof content !== "string") return 0;
    return content.split("\n").length;
  };

  const handleSimilarNoteClick = (similarNote: Note) => {
    if (onNoteClick) {
      onNoteClick(similarNote);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <Brain className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
        </div>

        {metadata ? (
          <div className="space-y-3">
            {metadata.lastAnalyzed && (
              <div className="text-sm text-gray-500">
                Last analyzed: {formatDate(metadata.lastAnalyzed)}
              </div>
            )}

            {/* Sentiment */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Sentiment
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(metadata.sentiment)}`}
              >
                {getSentimentLabel(metadata.sentiment)}
              </span>
            </div>

            {/* Summary */}
            {metadata.summary && (
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </span>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {metadata.summary}
                </p>
              </div>
            )}

            {/* Keywords */}
            {metadata.keywords && metadata.keywords.length > 0 && (
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Keywords
                </span>
                <div className="flex flex-wrap gap-1">
                  {metadata.keywords.map((keyword, index) => (
                    <span
                      key={`${keyword}-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: no need
                        index
                      }`}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">AI analysis in progress...</p>
          </div>
        )}
      </div>

      {/* Similar Notes */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <Link className="w-5 h-5 text-purple-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Similar Notes</h3>
        </div>

        {isCalculatingSimilarity ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">
              Calculating similarities...
            </p>
          </div>
        ) : similarNotes.length > 0 ? (
          <div className="space-y-3">
            {similarNotes.map((similar) => (
              <div
                role="none"
                key={similar.note.id}
                className={`border rounded-lg p-3 transition-colors ${
                  onNoteClick
                    ? "hover:bg-gray-50 cursor-pointer"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleSimilarNoteClick(similar.note)}
                tabIndex={onNoteClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onNoteClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleSimilarNoteClick(similar.note);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {similar.note.title || "Untitled Note"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(similar.similarity * 100)}% similarity
                    </p>
                  </div>
                  <div className="ml-2 flex items-center">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {similar.metadata?.keywords &&
                  similar.metadata.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {similar.metadata.keywords
                        .slice(0, 3)
                        .map((keyword, index) => (
                          <span
                            key={`${similar.note.id}-${keyword}-${index}`}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      {similar.metadata.keywords.length > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                          +{similar.metadata.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No similar notes found</p>
          </div>
        )}
      </div>

      {/* Note Stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Note Stats</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-gray-500">Characters</span>
            <p className="font-medium">
              {(note.content?.length || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="block text-gray-500">Words</span>
            <p className="font-medium">
              {getWordCount(note.content).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="block text-gray-500">Lines</span>
            <p className="font-medium">
              {getLineCount(note.content).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="block text-gray-500">Created</span>
            <p className="font-medium">{formatDate(note.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
