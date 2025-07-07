import { useState, useEffect } from "react";
import { Note } from "../types";
import { Save, FileText } from "lucide-react";

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  isLoading: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  isLoading,
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setHasChanges(false);
  }, [note]);

  useEffect(() => {
    setHasChanges(title !== note.title || content !== note.content);
  }, [title, content, note]);

  const handleSave = () => {
    if (hasChanges) {
      onSave({
        ...note,
        title,
        content,
        createdAt: note.createdAt || Date.now(),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-lg font-medium text-gray-900 border-none outline-none bg-transparent"
              placeholder="Note title..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-96 resize-none border-none outline-none text-gray-700 leading-relaxed"
          placeholder="Start writing your note..."
        />
      </div>

      <div className="p-4 border-t bg-gray-50 text-sm text-gray-500">
        {hasChanges && (
          <span className="text-orange-600">• Unsaved changes</span>
        )}
        <span className="ml-2">
          Created: {new Date(note.createdAt).toLocaleDateString()}
        </span>
        <span className="ml-4">Press Ctrl+S to save</span>
      </div>
    </div>
  );
};
