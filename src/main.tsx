import {
  ChakraProvider,
  ColorModeScript,
  defineStyle,
  extendTheme,
  type ThemeConfig,
} from "@chakra-ui/react";
import React from "react";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import { createRoot } from "react-dom/client";

// @ts-ignore
import { sliderAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys);

import "swiper/css";

const wavy = definePartsStyle({
  thumb: {
    animation: "swim 2s infinite",
  },
});

export const sliderTheme = defineMultiStyleConfig({
  variants: { wavy },
});

const theme: ThemeConfig = extendTheme({
  initialColorMode: "dark",
  styles: {
    global: (props: any) => ({
      body: {
        bg: "black",
        color: "white",
        "overscroll-behavior-y": "contain",
      },
      "@keyframes swim": {
        "0%": {
          transform: "translateY(0)",
        },
        "50%": {
          transform: "translateY(-10px)",
        },
        "100%": {
          transform: "translateY(0)",
        },
      },
    }),
  },
  fonts: {
    heading: `system-ui, sans-serif`,
    body: `system-ui, sans-serif`,
  },
  colors: {
    black: "#000007",
    white: "#f0f0f0",
  },
  components: {
    Slider: sliderTheme,
  },
});

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="dark" />

      <App />
    </ChakraProvider>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  // && !/asd/.test(window.location)) {
  registerSW({ onNeedRefresh() {}, onOfflineReady() {} });
}
