import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: "autoUpdate",

    includeAssets: [
      "favicon.svg",
      "favicon.ico",
      "robots.txt",
      "apple-touch-icon.png",
    ],
    manifest: {
      name: "Bucket",
      short_name: "Bucket",
      description: "Bucket it!",
      theme_color: "#ffffff",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
  })],
});
