import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Alias '@' to the 'src' directory
    },
  },

  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          effect: ["effect"],
          react: ["react", "react-dom"],
          utils: ["idb", "comlink", "uuid"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["effect", "idb", "comlink", "uuid"],
  },
});
