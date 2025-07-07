import { Note, NoteMetadata } from "../types";
import { Trash2, FileText, Hash, Heart, Meh, Frown } from "lucide-react";

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  noteMetadata: Record<string, NoteMetadata>;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNote,
  onSelectNote,
  onDeleteNote,
  noteMetadata,
}) => {
  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return <Heart className="w-4 h-4 text-green-500" />;
      case "negative":
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-gray-400" />;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Notes ({notes.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notes yet. Create your first note!</p>
          </div>
        ) : (
          notes.map((note) => {
            const metadata = noteMetadata[note.id];
            const isSelected = selectedNote?.id === note.id;

            return (
              <div
                key={note.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? "bg-blue-50 border-r-4 border-blue-500" : ""
                }`}
                onClick={() => onSelectNote(note)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {note.title}
                      </h3>
                      {metadata && (
                        <div className="ml-2 flex items-center">
                          {getSentimentIcon(metadata.sentiment)}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {truncateText(note.content, 100)}
                    </p>

                    {metadata?.keywords && metadata.keywords.length > 0 && (
                      <div className="flex items-center mb-2">
                        <Hash className="w-3 h-3 text-gray-400 mr-1" />
                        <div className="flex flex-wrap gap-1">
                          {metadata.keywords
                            .slice(0, 3)
                            .map((keyword, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {keyword}
                              </span>
                            ))}
                          {metadata.keywords.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{metadata.keywords.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
