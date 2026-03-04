import { render } from "preact";
import { App } from "./app";
import { boot } from "./store";
import { registerSW } from "virtual:pwa-register";
import "@fontsource-variable/noto-sans-mono";
import "./index.css";

boot();
render(<App />, document.getElementById("app")!);

if ("serviceWorker" in navigator) {
  registerSW({ onNeedRefresh() {}, onOfflineReady() {} });
}
