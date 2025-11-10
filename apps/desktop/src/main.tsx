import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@fontsource-variable/noto-sans-mono";
import { TinyBaseProvider } from "@bucket/ui";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TinyBaseProvider>
      <App />
    </TinyBaseProvider>
  </React.StrictMode>
);
