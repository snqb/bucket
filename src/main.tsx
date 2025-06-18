import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
// Supports weights 100-900
import "@fontsource-variable/noto-sans-mono";
import "./index.css";
import { JazzProvider } from "./JazzProvider";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <JazzProvider>
        <App />
      </JazzProvider>
    </React.StrictMode>,
  );
}

if ("serviceWorker" in navigator) {
  // && !/asd/.test(window.location)) {
  registerSW({ onNeedRefresh() {}, onOfflineReady() {} });
}
