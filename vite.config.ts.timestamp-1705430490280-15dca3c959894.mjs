// vite.config.ts
import autoprefixer from "file:///home/sn/bucket/node_modules/.pnpm/autoprefixer@10.4.14_postcss@8.4.24/node_modules/autoprefixer/lib/autoprefixer.js";
import { defineConfig } from "file:///home/sn/bucket/node_modules/.pnpm/vite@4.3.9/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///home/sn/bucket/node_modules/.pnpm/vite-plugin-pwa@0.15.1_vite@4.3.9_workbox-build@6.6.0_workbox-window@6.6.0/node_modules/vite-plugin-pwa/dist/index.js";
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
    "line2.svg"
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
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  plugins: [PWA],
  build: {
    target: "safari11"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9zbi9idWNrZXRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3NuL2J1Y2tldC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9zbi9idWNrZXQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuXG5jb25zdCBQV0EgPSBWaXRlUFdBKHtcbiAgc3RyYXRlZ2llczogXCJpbmplY3RNYW5pZmVzdFwiLFxuICBzcmNEaXI6IFwic3JjXCIsXG4gIGZpbGVuYW1lOiBcInN3LnRzXCIsXG5cbiAgaW5jbHVkZUFzc2V0czogW1xuICAgIFwiZmF2aWNvbi0xOTYucG5nXCIsXG4gICAgXCJyb2JvdHMudHh0XCIsXG5cbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTIwNDgtMjczMi5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTE2NjgtMjM4OC5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTE1MzYtMjA0OC5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTE2NjgtMjIyNC5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTE2MjAtMjE2MC5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTEyOTAtMjc5Ni5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTExNzktMjU1Ni5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTEyODQtMjc3OC5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTExNzAtMjUzMi5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTExMjUtMjQzNi5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTEyNDItMjY4OC5qcGdcIixcbiAgICBcImFwcGxlLXNwbGFzaC1kYXJrLTgyOC0xNzkyLmpwZ1wiLFxuICAgIFwiYXBwbGUtc3BsYXNoLWRhcmstMTI0Mi0yMjA4LmpwZ1wiLFxuICAgIFwiYXBwbGUtc3BsYXNoLWRhcmstNzUwLTEzMzQuanBnXCIsXG4gICAgXCJhcHBsZS1zcGxhc2gtZGFyay02NDAtMTEzNi5qcGdcIixcbiAgICBcImFwcGxlLWljb24tMTgwLnBuZ1wiLFxuXG4gICAgXCJ3YXZlMy5wbmdcIixcbiAgICBcImxpbmUyLnN2Z1wiLFxuICBdLFxuICBtYW5pZmVzdDoge1xuICAgIG5hbWU6IFwiQnVja2V0XCIsXG4gICAgc2hvcnRfbmFtZTogXCJCdWNrZXRcIixcbiAgICBkZXNjcmlwdGlvbjogXCJ3b3JkcyB3b3Jkc1wiLFxuICAgIHRoZW1lX2NvbG9yOiBcIiMwMDAwMDBcIixcbiAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiMwMDAwMDBcIixcbiAgICBpY29uczogW1xuICAgICAge1xuICAgICAgICBzcmM6IFwicHdhLTE5MngxOTIucG5nXCIsXG4gICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgcHVycG9zZTogXCJhbnlcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogXCJwd2EtMTkyeDE5Mi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzcmM6IFwicHdhLTUxMng1MTIucG5nXCIsXG4gICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgcHVycG9zZTogXCJhbnlcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogXCJwd2EtNTEyeDUxMi5wbmdcIixcbiAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgY3NzOiB7XG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW2F1dG9wcmVmaXhlcigpXSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbUFdBXSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6IFwic2FmYXJpMTFcIixcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErTixPQUFPLGtCQUFrQjtBQUN4UCxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWU7QUFFeEIsSUFBTSxNQUFNLFFBQVE7QUFBQSxFQUNsQixZQUFZO0FBQUEsRUFDWixRQUFRO0FBQUEsRUFDUixVQUFVO0FBQUEsRUFFVixlQUFlO0FBQUEsSUFDYjtBQUFBLElBQ0E7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQSxVQUFVO0FBQUEsSUFDUixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixhQUFhO0FBQUEsSUFDYixhQUFhO0FBQUEsSUFDYixrQkFBa0I7QUFBQSxJQUNsQixPQUFPO0FBQUEsTUFDTDtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7QUFFRCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixLQUFLO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDUCxTQUFTLENBQUMsYUFBYSxDQUFDO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsR0FBRztBQUFBLEVBQ2IsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLEVBQ1Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
