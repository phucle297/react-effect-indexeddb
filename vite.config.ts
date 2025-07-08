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
  server: {
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
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
