import { render } from "preact";
import { App } from "./App";
import { boot } from "./store";
import { t } from "./i18n";
import { registerSW } from "virtual:pwa-register";
import "@fontsource-variable/noto-sans-mono";
import "./index.css";

boot();
render(<App />, document.getElementById("app")!);

if ("serviceWorker" in navigator) {
  registerSW({
    onNeedRefresh() {
      const el = document.createElement("div");
      el.className =
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm shadow-lg safe-bottom";
      el.innerHTML = `
        <span class="text-gray-300">${t("update")}</span>
        <button class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium" onclick="location.reload()">${t("refresh")}</button>
        <button class="text-gray-500 hover:text-white" onclick="this.parentElement.remove()">✕</button>
      `;
      document.body.appendChild(el);
    },
    onOfflineReady() {
      console.log("🪣 Ready to work offline");
    },
  });
}
