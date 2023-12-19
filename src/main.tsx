import {
  ChakraProvider,
  ColorModeScript,
  extendTheme,
  type ThemeConfig,
} from "@chakra-ui/react";
import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";

// @ts-ignore
import { sliderAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys);

import "swiper/css";

const theme: ThemeConfig = extendTheme({
  initialColorMode: "dark",
  styles: {
    global: () => ({
      body: {
        bg: "black",
        color: "white",
        "overscroll-behavior-y": "contain",
      },
    }),
  },
  fonts: {
    heading: "monospace, sans-serif",
    body: "monospace, sans-serif",
  },
  colors: {
    black: "#000007",
    white: "#f0f0f0",
  },
});

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode="dark" />

        <App />
      </ChakraProvider>
    </React.StrictMode>,
  );
}

if ("serviceWorker" in navigator) {
  // && !/asd/.test(window.location)) {
  registerSW({ onNeedRefresh() {}, onOfflineReady() {} });
}
