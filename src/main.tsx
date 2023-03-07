import {
  ChakraProvider,
  ColorModeScript,
  extendTheme,
  type ThemeConfig,
} from "@chakra-ui/react";
import React from "react";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import { createRoot } from "react-dom/client";

const theme: ThemeConfig = extendTheme({
  initialColorMode: "dark",
  styles: {
    global: (props: any) => ({
      body: {
        bg: "black",
        color: "white",
      },
    }),
  },
  fonts: {
    heading: `system-ui, sans-serif`,
    body: `system-ui, sans-serif`,
  },
  colors: {
    black: '#000007',
    white: '#f0f0f0'
  },
  gray: {
    "50": "#f9fafa",
    "100": "#f1f1f2",
    "200": "#e7e7e8",
    "300": "#d3d4d5",
    "400": "#abadaf",
    "500": "#7d7f83",
    "600": "#52555a",
    "700": "#33373d",
    "800": "#1d2025",
    "900": "#171a1d",
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
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  // && !/asd/.test(window.location)) {
  registerSW({ onNeedRefresh() {}, onOfflineReady() {} });
}
