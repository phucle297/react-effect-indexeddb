import { Context, Effect } from "effect";
import { type IDBPDatabase, openDB } from "idb";
import type { Note, NoteMetadata } from "../types";

const DB_NAME = "ai-note-analyzer";
const DB_VERSION = 1;

interface NoteDatabase {
  notes: Note;
  metadata: NoteMetadata;
}

export class NoteRepoServiceImpl {
  private db: IDBPDatabase<NoteDatabase> | null = null;

  private getDb = async (): Promise<IDBPDatabase<NoteDatabase>> => {
    if (!this.db) {
      this.db = await openDB<NoteDatabase>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Notes store
          if (!db.objectStoreNames.contains("notes")) {
            const notesStore = db.createObjectStore("notes", { keyPath: "id" });
            notesStore.createIndex("createdAt", "createdAt");
          }

          // Metadata store
          if (!db.objectStoreNames.contains("metadata")) {
            const metadataStore = db.createObjectStore("metadata", {
              keyPath: "noteId",
            });
            metadataStore.createIndex("lastAnalyzed", "lastAnalyzed");
          }
        },
      });
    }
    return this.db;
  };

  saveNote = (note: Note) =>
    Effect.tryPromise({
      try: async () => {
        console.log("🚀 src/services/note-repo.service.ts:39 -> note: ", note);

        const db = await this.getDb();
        console.log("🚀 src/services/note-repo.service.ts:44 -> db: ", db);
        await db.put("notes", note);
        return note;
      },
      catch: (error) => new Error(`Failed to save note: ${error}`),
    });

  getNote = (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const db = await this.getDb();
        const note = await db.get("notes", id);
        return note || null;
      },
      catch: (error) => new Error(`Failed to get note: ${error}`),
    });

  getAllNotes = () =>
    Effect.tryPromise({
      try: async () => {
        const db = await this.getDb();
        const notes = await db.getAll("notes");
        return notes.sort((a, b) => b.createdAt - a.createdAt);
      },
      catch: (error) => new Error(`Failed to get notes: ${error}`),
    });

  deleteNote = (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const db = await this.getDb();
        const tx = db.transaction(["notes", "metadata"], "readwrite");
        const notesStore = tx.objectStore("notes");
        const metadataStore = tx.objectStore("metadata");
        // get note to delete metadata
        const note = await notesStore.get(id);
        if (!note) throw new Error(`Note with id ${id} not found`);
        await notesStore.delete(id);
        await metadataStore.delete(id);
        await tx.done;
      },
      catch: (error) => new Error(`Failed to delete note: ${error}`),
    });

  saveMetadata = (metadata: NoteMetadata) =>
    Effect.tryPromise({
      try: async () => {
        const db = await this.getDb();
        await db.put("metadata", metadata);
        return metadata;
      },
      catch: (error) => new Error(`Failed to save metadata: ${error}`),
    });

  getMetadata = (noteId: string) =>
    Effect.tryPromise({
      try: async () => {
        const db = await this.getDb();
        const metadata = await db.get("metadata", noteId);
        return metadata || null;
      },
      catch: (error) => new Error(`Failed to get metadata: ${error}`),
    });

  getAllMetadata = () =>
    Effect.tryPromise({
      try: async () => {
        const db = await this.getDb();
        return await db.getAll("metadata");
      },
      catch: (error) => new Error(`Failed to get metadata: ${error}`),
    });

  deleteMetadata = (noteId: string) =>
    Effect.tryPromise({
      try: async () => {
        const db = await this.getDb();
        await db.delete("metadata", noteId);
      },
      catch: (error) => new Error(`Failed to delete metadata: ${error}`),
    });
}

export class NoteRepoService extends Context.Tag("NoteRepoService")<
  NoteRepoService,
  {
    getAllNotes: () => Effect.Effect<Note[], Error>;
    getNote: (id: string) => Effect.Effect<Note | null, Error>;
    saveNote: (note: Note) => Effect.Effect<Note, Error>;
    deleteNote: (id: string) => Effect.Effect<void, Error>;
    saveMetadata: (
      metadata: NoteMetadata,
    ) => Effect.Effect<NoteMetadata, Error>;
    getMetadata: (noteId: string) => Effect.Effect<NoteMetadata | null, Error>;
    getAllMetadata: () => Effect.Effect<NoteMetadata[], Error>;
    deleteMetadata: (noteId: string) => Effect.Effect<void, Error>;
  }
>() {}
