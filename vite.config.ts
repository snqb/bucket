/// <reference types="vitest" />
import * as path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import million from "million/compiler";

const PWA = VitePWA({
  strategies: "injectManifest",
  srcDir: "src",
  filename: "sw.ts",

  includeAssets: [
    "favicon-196.png",
    "robots.txt",

    "apple-splash-dark-2048-2732.jpg",
    "apple-splash-dark-1668-2388.jpg",
    "apple-splash-dark-1536-2048.jpg",
    "apple-splash-dark-1668-2224.jpg",
    "apple-splash-dark-1620-2160.jpg",
    "apple-splash-dark-1290-2796.jpg",
    "apple-splash-dark-1179-2556.jpg",
    "apple-splash-dark-1284-2778.jpg",
    "apple-splash-dark-1170-2532.jpg",
    "apple-splash-dark-1125-2436.jpg",
    "apple-splash-dark-1242-2688.jpg",
    "apple-splash-dark-828-1792.jpg",
    "apple-splash-dark-1242-2208.jpg",
    "apple-splash-dark-750-1334.jpg",
    "apple-splash-dark-640-1136.jpg",
    "apple-icon-180.png",
    "wave3.png",
    "bg.svg",
  ],
  manifest: {
    name: "Bucket",
    short_name: "Bucket",
    description: "words words",
    theme_color: "#000000",
    background_color: "#000000",
    icons: [
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
});

export default defineConfig({
  css: {
    postcss: "./postcss.config.js",
  },
  plugins: [
    PWA,
    million.vite({
      auto: {
        threshold: 0.05,
        skip: ["useBadHook", /badVariable/g],
      },
    }),
  ],
  define: {
    global: "globalThis",
  },
  optimizeDeps: {},
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "safari11",
  },
  server: {
    port: 4000,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
