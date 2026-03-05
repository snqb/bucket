import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "Bucket",
        short_name: "Bucket",
        description: "Track progress with bars, not checkboxes.",
        display: "standalone",
        start_url: "/",
        scope: "/",
        theme_color: "#000000",
        background_color: "#000000",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
  server: { port: 4999 },
  build: { target: "safari14" },
});
