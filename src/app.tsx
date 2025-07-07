import { Effect } from "effect";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { InsightPanel } from "./components/insight-panel.ui";
import { LoadingSpinner } from "./components/loading-spinner.ui";
import { NoteEditor } from "./components/note-editor.ui";
import { NoteList } from "./components/note-list.ui";
import { AiAnalyzerService } from "./services/ai-analyzer.service";
import {
  NoteRepoService,
  NoteRepoServiceImpl,
} from "./services/note-repo.service";
import type { Note, NoteMetadata } from "./types";

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteMetadata, setNoteMetadata] = useState<
    Record<string, NoteMetadata>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const program = Effect.gen(function* () {
          const noteRepo = yield* NoteRepoService;
          const loadedNotes = yield* noteRepo.getAllNotes();
          const loadedMetadata = yield* noteRepo.getAllMetadata();

          return { notes: loadedNotes, metadata: loadedMetadata };
        });

        const runnable = Effect.provideService(
          program,
          NoteRepoService,
          new NoteRepoServiceImpl(),
        );

        const result = await Effect.runPromise(runnable);
        setNotes(result.notes);
        setNoteMetadata(
          result.metadata.reduce(
            (acc, meta) => {
              acc[meta.noteId] = meta;
              return acc;
            },
            {} as Record<string, NoteMetadata>,
          ),
        );
      } catch (error) {
        console.error("Failed to load notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  const handleSaveNote = async (note: Note) => {
    setIsLoading(true);
    try {
      const program = Effect.gen(function* () {
        const noteRepo = yield* NoteRepoService;
        const analyzer = yield* AiAnalyzerService;

        // Save note
        yield* noteRepo.saveNote(note);

        // Update local state
        setNotes((prev) => {
          const existing = prev.find((n) => n.id === note.id);
          if (existing) {
            return prev.map((n) => (n.id === note.id ? note : n));
          }
          return [...prev, note];
        });

        // Start AI analysis in background
        const analysisFiber = yield* Effect.fork(analyzer.analyze(note));
        const analysis = yield* Effect.fiberAwait(analysisFiber);

        // Save analysis results
        yield* noteRepo.saveMetadata(analysis);

        return analysis;
      });

      const runnable = program.pipe(
        Effect.provideService(NoteRepoService, new NoteRepoServiceImpl()),
        Effect.provideService(AiAnalyzerService, new AiAnalyzerServiceImpl()),
      );
      const analysis = await Effect.runPromise(program);
      setNoteMetadata((prev) => ({
        ...prev,
        [note.id]: analysis,
      }));
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "New Note",
      content: "",
      createdAt: Date.now(),
    };
    console.log("🚀 src/app.tsx:110 -> newNote: ", newNote);
    setSelectedNote(newNote);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  // const handleDeleteNote = async (noteId: string) => {
  //   try {
  //     const program = Effect.gen(function* () {
  //       const noteRepo = yield* NoteRepoService;
  //       yield* noteRepo.deleteNote(noteId);
  //       yield* noteRepo.deleteMetadata(noteId);
  //     });
  //
  //     await Effect.runPromise(program);
  //     setNotes((prev) => prev.filter((n) => n.id !== noteId));
  //     setNoteMetadata((prev) => {
  //       const { [noteId]: _, ...rest } = prev;
  //       return rest;
  //     });
  //
  //     if (selectedNote?.id === noteId) {
  //       setSelectedNote(null);
  //     }
  //   } catch (error) {
  //     console.error("Failed to delete note:", error);
  //   }
  // };

  return (
    // <EffectContextProvider>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🧠 AI Note Analyzer
            </h1>
            <button
              type="button"
              onClick={handleCreateNote}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Note
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Note List */}
          <div className="lg:col-span-1">
            <NoteList
              notes={notes}
              selectedNote={selectedNote}
              onSelectNote={handleSelectNote}
              // onDeleteNote={handleDeleteNote}
              onDeleteNote={() => {}}
              noteMetadata={noteMetadata}
            />
          </div>

          {/* Note Editor */}
          <div className="lg:col-span-1">
            {selectedNote ? (
              <NoteEditor
                note={selectedNote}
                onSave={handleSaveNote}
                isLoading={isLoading}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">
                  Select a note to edit or create a new one
                </p>
              </div>
            )}
          </div>

          {/* Insight Panel */}
          <div className="lg:col-span-1">
            {selectedNote && (
              <InsightPanel
                note={selectedNote}
                metadata={noteMetadata[selectedNote.id]}
                notes={notes}
                allMetadata={noteMetadata}
              />
            )}
          </div>
        </div>
      </main>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
