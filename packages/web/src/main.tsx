import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// PWA: update prompt + offline ready
if ("serviceWorker" in navigator) {
  registerSW({
    onNeedRefresh() {
      const el = document.createElement("div");
      el.className =
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm shadow-lg";
      el.style.paddingBottom = "max(0.625rem, env(safe-area-inset-bottom))";
      el.innerHTML = `
        <span style="color:#a3a3a3">Update available</span>
        <button style="padding:6px 12px;background:#3b82f6;color:#fff;font-size:12px;border-radius:6px;border:none;cursor:pointer;font-weight:500" onclick="location.reload()">Refresh</button>
        <button style="color:#737373;background:none;border:none;cursor:pointer;font-size:14px" onclick="this.parentElement.remove()">✕</button>
      `;
      document.body.appendChild(el);
    },
    onOfflineReady() {
      console.log("🪣 Ready to work offline");
    },
  });
}
