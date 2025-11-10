import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Tauri expects a relative base path
  base: "./",

  // Tauri uses a different port
  server: {
    port: 5174,
    strictPort: true,
  },

  // Build config for Tauri
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          tinybase: ["tinybase"],
          ui: ["framer-motion", "lucide-react"],
        },
      },
    },
  },

  // Environment variables
  envPrefix: ["VITE_", "TAURI_"],

  clearScreen: false,
});
