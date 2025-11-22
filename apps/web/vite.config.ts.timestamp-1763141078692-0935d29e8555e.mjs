// vite.config.ts
import * as path from "path";
import { defineConfig } from "file:///Users/sn/Projects/bucket/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///Users/sn/Projects/bucket/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/Users/sn/Projects/bucket/apps/web";
var PWA = VitePWA({
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
    "bg.svg"
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
        purpose: "any"
      },
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  }
});
var vite_config_default = defineConfig({
  css: {
    postcss: "./postcss.config.js"
  },
  plugins: [PWA],
  define: {
    global: "globalThis"
  },
  optimizeDeps: {},
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    target: "safari11"
  },
  server: {
    port: 4999
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc24vUHJvamVjdHMvYnVja2V0L2FwcHMvd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc24vUHJvamVjdHMvYnVja2V0L2FwcHMvd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zbi9Qcm9qZWN0cy9idWNrZXQvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcblxuY29uc3QgUFdBID0gVml0ZVBXQSh7XG4gIHN0cmF0ZWdpZXM6IFwiaW5qZWN0TWFuaWZlc3RcIixcbiAgc3JjRGlyOiBcInNyY1wiLFxuICBmaWxlbmFtZTogXCJzdy50c1wiLFxuXG4gIGluY2x1ZGVBc3NldHM6IFtcbiAgICBcImZhdmljb24tMTk2LnBuZ1wiLFxuICAgIFwicm9ib3RzLnR4dFwiLFxuXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0yMDQ4LTI3MzIuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xNjY4LTIzODguanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xNTM2LTIwNDguanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xNjY4LTIyMjQuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xNjIwLTIxNjAuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xMjkwLTI3OTYuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xMTc5LTI1NTYuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xMjg0LTI3NzguanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xMTcwLTI1MzIuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xMTI1LTI0MzYuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay0xMjQyLTI2ODguanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay04MjgtMTc5Mi5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTEyNDItMjIwOC5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTc1MC0xMzM0LmpwZ1wiLFxuICAgIFwiYXBwbGUtc3BsYXNoLWRhcmstNjQwLTExMzYuanBnXCIsXG4gICAgXCJhcHBsZS1pY29uLTE4MC5wbmdcIixcbiAgICBcIndhdmUzLnBuZ1wiLFxuICAgIFwiYmcuc3ZnXCIsXG4gIF0sXG4gIG1hbmlmZXN0OiB7XG4gICAgbmFtZTogXCJCdWNrZXRcIixcbiAgICBzaG9ydF9uYW1lOiBcIkJ1Y2tldFwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIndvcmRzIHdvcmRzXCIsXG4gICAgdGhlbWVfY29sb3I6IFwiIzAwMDAwMFwiLFxuICAgIGJhY2tncm91bmRfY29sb3I6IFwiIzAwMDAwMFwiLFxuICAgIGljb25zOiBbXG4gICAgICB7XG4gICAgICAgIHNyYzogXCJwd2EtMTkyeDE5Mi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcImFueVwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc3JjOiBcInB3YS0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogXCJwd2EtNTEyeDUxMi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcImFueVwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc3JjOiBcInB3YS01MTJ4NTEyLnBuZ1wiLFxuICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBjc3M6IHtcbiAgICBwb3N0Y3NzOiBcIi4vcG9zdGNzcy5jb25maWcuanNcIixcbiAgfSxcbiAgcGx1Z2luczogW1BXQV0sXG4gIGRlZmluZToge1xuICAgIGdsb2JhbDogXCJnbG9iYWxUaGlzXCIsXG4gIH0sXG4gIG9wdGltaXplRGVwczoge30sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6IFwic2FmYXJpMTFcIixcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNDk5OSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXG4gICAgc2V0dXBGaWxlczogW1wiLi9zcmMvdGVzdC9zZXR1cC50c1wiXSxcbiAgICBnbG9iYWxzOiB0cnVlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsWUFBWSxVQUFVO0FBQ3RCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFNLE1BQU0sUUFBUTtBQUFBLEVBQ2xCLFlBQVk7QUFBQSxFQUNaLFFBQVE7QUFBQSxFQUNSLFVBQVU7QUFBQSxFQUVWLGVBQWU7QUFBQSxJQUNiO0FBQUEsSUFDQTtBQUFBLElBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFVBQVU7QUFBQSxJQUNSLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQSxJQUNiLGtCQUFrQjtBQUFBLElBQ2xCLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQztBQUVELElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLEtBQUs7QUFBQSxJQUNILFNBQVM7QUFBQSxFQUNYO0FBQUEsRUFDQSxTQUFTLENBQUMsR0FBRztBQUFBLEVBQ2IsUUFBUTtBQUFBLElBQ04sUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLGNBQWMsQ0FBQztBQUFBLEVBQ2YsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBVSxhQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVM7QUFBQSxFQUNYO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
