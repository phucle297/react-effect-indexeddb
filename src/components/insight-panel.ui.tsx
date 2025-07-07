import React from "react";
import { Note, NoteMetadata, SimilarNote } from "../types";
import { Brain, Hash, Heart, FileText, Link } from "lucide-react";
import { EmbeddingService } from "../services/embedding.service";

interface InsightPanelProps {
  note: Note;
  metadata?: NoteMetadata;
  notes: Note[];
  allMetadata: Record<string, NoteMetadata>;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({
  note,
  metadata,
  notes,
  allMetadata,
}) => {
  const getSimilarNotes = (): SimilarNote[] => {
    if (!metadata?.embedding) return [];

    const similarities: SimilarNote[] = [];

    for (const otherNote of notes) {
      if (otherNote.id === note.id) continue;

      const otherMetadata = allMetadata[otherNote.id];
      if (!otherMetadata?.embedding) continue;

      const similarity = EmbeddingService.cosineSimilarity(
        metadata.embedding,
        otherMetadata.embedding,
      );

      if (similarity > 0.5) {
        similarities.push({
          note: otherNote,
          similarity,
          metadata: otherMetadata,
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-green-50";
      case "negative":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSentimentLabel = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "😊 Positive";
      case "negative":
        return "😞 Negative";
      default:
        return "😐 Neutral";
    }
  };

  const similarNotes = getSimilarNotes();

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
            <div className="text-sm text-gray-500">
              Last analyzed:{" "}
              {new Date(metadata.lastAnalyzed || 0).toLocaleString()}
            </div>

            {/* Sentiment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentiment
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(metadata.sentiment)}`}
              >
                {getSentimentLabel(metadata.sentiment)}
              </span>
            </div>

            {/* Summary */}
            {metadata.summary && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {metadata.summary}
                </p>
              </div>
            )}

            {/* Keywords */}
            {metadata.keywords && metadata.keywords.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Keywords
                </label>
                <div className="flex flex-wrap gap-1">
                  {metadata.keywords.map((keyword, index) => (
                    <span
                      key={index}
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
      {similarNotes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-3">
            <Link className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Similar Notes</h3>
          </div>

          <div className="space-y-3">
            {similarNotes.map((similar) => (
              <div
                key={similar.note.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {similar.note.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(similar.similarity * 100)}% similarity
                    </p>
                  </div>
                  <div className="ml-2 flex items-center">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {similar.metadata?.keywords && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {similar.metadata.keywords
                      .slice(0, 3)
                      .map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {keyword}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note Stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Note Stats</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-gray-500">Characters</label>
            <p className="font-medium">
              {note.content.length.toLocaleString()}
            </p>
          </div>
          <div>
            <label className="block text-gray-500">Words</label>
            <p className="font-medium">
              {note.content.trim()
                ? note.content.trim().split(/\s+/).length
                : 0}
            </p>
          </div>
          <div>
            <label className="block text-gray-500">Lines</label>
            <p className="font-medium">{note.content.split("\n").length}</p>
          </div>
          <div>
            <label className="block text-gray-500">Created</label>
            <p className="font-medium">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
