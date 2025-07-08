import { Effect, Fiber, pipe } from "effect";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { InsightPanel } from "./components/insight-panel.ui";
import { LoadingSpinner } from "./components/loading-spinner.ui";
import { NoteEditor } from "./components/note-editor.ui";
import { NoteList } from "./components/note-list.ui";
import {
  type AiAnalyzerRequirements,
  AiAnalyzerService,
  AiAnalyzerServiceImpl,
} from "./services/ai-analyzer.service";
import {
  AiWorkerClientService,
  AiWorkerClientServiceImpl,
} from "./services/ai-worker-client.service";
import {
  CloudAiService,
  CloudAiServiceImpl,
  FallbackAiServiceImpl,
} from "./services/cloud-ai.service";
import {
  EmbeddingService,
  EmbeddingServiceImpl,
} from "./services/embedding.service";
import {
  NoteRepoService,
  NoteRepoServiceImpl,
} from "./services/note-repo.service";
import type { Note, NoteMetadata } from "./types";
import { toast } from "sonner";

export const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteMetadata, setNoteMetadata] = useState<
    Record<string, NoteMetadata>
  >({});
  const [isLoading, setIsLoading] = useState(false);

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
        toast.error("Failed to load notes. Please try again later.");
        console.error("Failed to load notes:", error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    loadNotes();
  }, []);

  const handleSaveNote = async (note: Note) => {
    setIsLoading(true);
    let program: Effect.Effect<
      NoteMetadata,
      Error,
      NoteRepoService | AiAnalyzerService | AiAnalyzerRequirements
    > | null = null;
    try {
      program = Effect.gen(function* () {
        const noteRepo = yield* NoteRepoService;
        const analyzer = yield* AiAnalyzerService;

        yield* noteRepo.saveNote(note);

        setNotes((prev) => {
          const existing = prev.find((n) => n.id === note.id);
          if (existing) {
            return prev.map((n) => (n.id === note.id ? note : n));
          }
          return [note, ...prev];
        });

        // Start AI analysis in background
        const analysisFiber = yield* Effect.fork(analyzer.analyze(note));
        const analysis = yield* pipe(
          analysisFiber,
          Fiber.join,
          Effect.map((result) => ({
            noteId: note.id,
            summary: result.summary,
            keywords: result.keywords,
            sentiment: result.sentiment,
            embedding: result.embedding,
            createdAt: Date.now(),
          })),
        );

        // Save analysis results
        yield* noteRepo.saveMetadata(analysis);

        return analysis;
      });

      const runnable = program.pipe(
        Effect.provideService(NoteRepoService, new NoteRepoServiceImpl()),
        Effect.provideService(AiAnalyzerService, new AiAnalyzerServiceImpl()),
        Effect.provideService(CloudAiService, new CloudAiServiceImpl()),
        Effect.provideService(EmbeddingService, new EmbeddingServiceImpl()),
        Effect.provideService(
          AiWorkerClientService,
          new AiWorkerClientServiceImpl(),
        ),
      );
      // const context = Context.empty().pipe(
      //   Context.add(NoteRepoService, new NoteRepoServiceImpl()),
      //   Context.add(AiAnalyzerService, new AiAnalyzerServiceImpl()),
      // );
      //
      // const runnable = Effect.provide(program, context);
      const analysis = await Effect.runPromise(runnable);

      setNoteMetadata((prev) => ({
        ...prev,
        [note.id]: analysis,
      }));
      toast.success("Note saved and analyzed successfully!");
    } catch (error) {
      console.error("Failed to  note:", error);
      // Call the local if init the ai failed
      if (program) {
        toast.error(
          "Failed to analyze note with Cloud AI. Retrying with local AI...",
        );
        console.log("Retry with local AI analysis...");
        const runnable = program.pipe(
          Effect.provideService(NoteRepoService, new NoteRepoServiceImpl()),
          Effect.provideService(AiAnalyzerService, new AiAnalyzerServiceImpl()),
          Effect.provideService(CloudAiService, new FallbackAiServiceImpl()),
          Effect.provideService(EmbeddingService, new EmbeddingServiceImpl()),
          Effect.provideService(
            AiWorkerClientService,
            new AiWorkerClientServiceImpl(),
          ),
        );
        const analysis = await Effect.runPromise(runnable);

        setNoteMetadata((prev) => ({
          ...prev,
          [note.id]: analysis,
        }));
        toast.success("Note saved and analyzed successfully by Local AI!");
      }
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      title: "New Note",
      content: "",
      createdAt: Date.now(),
    };
    setSelectedNote(newNote);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const program = Effect.gen(function* () {
        const noteRepo = yield* NoteRepoService;
        yield* noteRepo.deleteNote(noteId);
      });

      const runnable = program.pipe(
        Effect.provideService(NoteRepoService, new NoteRepoServiceImpl()),
      );

      await Effect.runPromise(runnable);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setNoteMetadata((prev) => {
        const { [noteId]: _, ...rest } = prev;
        return rest;
      });

      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      toast.success("Note deleted successfully!");
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note. Please try again later.");
    }
  };

  return (
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
              onDeleteNote={handleDeleteNote}
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
                key={selectedNote.id}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
