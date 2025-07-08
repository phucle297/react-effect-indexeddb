# 🧠 AI-Powered Note Analyzer

A frontend app built with **React**, **Effect TS**, **IndexedDB**, **Web Workers**, and **AI** (cloud or local). It allows users to write, save, and analyze notes offline with features like:

- ✨ Smart summarization
- 🔍 Keyword extraction
- 💬 Sentiment analysis
- 🧩 Semantic similarity between notes
- 💾 Offline persistence with IndexedDB
- 🧵 Background task concurrency via `Effect.Fiber`

---

## 🧰 Tech Stack

| Layer      | Technology                           | Purpose                                                 |
| ---------- | ------------------------------------ | ------------------------------------------------------- |
| UI         | React                                | UI rendering                                            |
| Effects    | [Effect TS](https://effect.website/) | Async logic, fiber concurrency, context, error handling |
| Background | Web Workers                          | Heavy AI tasks, non-blocking UI                         |
| Storage    | IndexedDB                            | Persistent local storage                                |
| AI         | OpenAI API / Local Models (WASM)     | Summarization, keywords, similarity                     |

---

## 🗂️ File Structure

> ✅ All filenames follow **kebab-case**.
> ✅ All components end in `.ui.tsx`.
> ✅ All services end in `.service.ts`.

```
src/
├── server/                 # Express backend
│   └── index.ts
├── components/
│ ├── note-editor.ui.tsx
│ ├── note-list.ui.tsx
│ ├── insight-panel.ui.tsx
│ └── loading-spinner.ui.tsx
│
├── services/
│ ├── note-repo.service.ts # IndexedDB wrapper
│ ├── ai-analyzer.service.ts # Fiber + Worker + fallback logic
│ ├── ai-worker-client.service.ts # Comlink-style bridge to worker
│ ├── cloud-ai.service.ts # OpenAI / Gemini wrapper via Effect
│ └── embedding.service.ts # Cosine similarity + vector math
│
├── workers/
│ └── ai.worker.ts # Text analysis in Web Worker
│
├── utils/
│ └── string-utils.ts # Tokenizer, normalization, etc.
│
├── app.tsx # Entry point
└── index.tsx # ReactDOM bootstrap
```

---

## 🚀 Features

### ✍️ Note Writing & Storage

- Rich text or markdown note editor
- Stored via **IndexedDB** using `Effect`

### 🧠 Background AI Analysis

- Sentiment
- Summary (via LLM or local)
- Tags / Keywords
- Embedding generation

### 🔄 Concurrency & Control

- All AI tasks run in **parallel** using `Effect.Fiber`
- Can **cancel** or **restart** if user edits note
- Retry on failure with `Effect.retry`

### 🌐 Online + Offline AI

- 🔌 Cloud fallback via OpenAI or other LLM API
- 🧠 Local inference using **WASM models** (optional)
- Automatically fallbacks if offline or API fails

---

## 🛠️ Development

### 📦 Install dependencies

```bash
pnpm install
```

## ▶️ Run the dev server

```bash
pnpm dev
```

### 📦 Build for production

```bash
pnpm build
```

## 🧪 Technologies Used in Detail

| Feature              | Tool / Lib                                                          |
| -------------------- | ------------------------------------------------------------------- |
| State management     | React Hooks + Effect TS                                             |
| Side effects         | `Effect.tryPromise`, `Effect.gen`, `Effect.fiber`, `Effect.Context` |
| Storage              | `idb` wrapper via custom service                                    |
| Worker Communication | `Comlink` or `postMessage` + Effect                                 |
| AI (Cloud)           | OpenAI / Gemini via `fetch`                                         |
| AI (Local)           | `transformers.js`, `onnxruntime-web`, or `llama.cpp`                |
| Vector math          | Custom cosine similarity utils                                      |

## 📦 IndexedDB Schema

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface NoteMetadata {
  noteId: string;
  summary?: string;
  sentiment?: "positive" | "neutral" | "negative";
  keywords?: string[];
  embedding?: number[];
}
```

## ⚙️ AI Worker Design

```typescript
self.onmessage = async (e) => {
  const { task, noteId, content } = e.data;

  if (task === "summarize") {
    const summary = await localModel.summarize(content);
    self.postMessage({ noteId, summary });
  }
};
```

## 🔐 API Integration (Optional)

```
VITE_API_KEY=sk-...
```

## 🧭 Future Ideas

- ✨ Add embeddings search (semantic links between notes)
- 🔁 Sync with cloud when online (Effect.Schedule)
- 📅 Schedule recurring background tasks
- 🧠 Plug in local LLM like llama.cpp via WASM
