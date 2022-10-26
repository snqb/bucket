import {
  ChakraProvider,
  ColorModeScript,
  extendTheme,
  type ThemeConfig,
} from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerSW } from "virtual:pwa-register";

import { mode } from "@chakra-ui/theme-tools";

const theme: ThemeConfig = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: false,
  styles: {
    global: (props: any) => ({
      body: {
        bg: mode("#ffffff", "#000000")(props),
      },
    }),
  },
  black: "#090a0b",
  fonts: {
    heading: `system-ui, 'Lato', sans-serif`,
    body: `system-ui, 'Lato', sans-serif`,
  },
  colors: {
    body: "#000000",
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
  pink: {
    "50": "#faf6f8",
    "100": "#ecdde5",
    "200": "#dec1d1",
    "300": "#ca9db5",
    "400": "#bd84a2",
    "500": "#ab648a",
    "600": "#9f4d79",
    "700": "#903164",
    "800": "#7e144d",
    "900": "#5d0f39",
  },
  orange: {
    "50": "#fcfaf9",
    "100": "#f2ece7",
    "200": "#e3d6cc",
    "300": "#ceb8a5",
    "400": "#bb9c82",
    "500": "#ab8463",
    "600": "#9a6c44",
    "700": "#875021",
    "800": "#6f3d11",
    "900": "#5b320e",
  },
  yellow: {
    "50": "#fefefd",
    "100": "#faf9f5",
    "200": "#f0ede2",
    "300": "#e4dfcd",
    "400": "#d3ccae",
    "500": "#b5a875",
    "600": "#97853f",
    "700": "#7c6713",
    "800": "#5d4d0f",
    "900": "#4d3f0c",
  },
  green: {
    "50": "#f9fcfa",
    "100": "#e0eee6",
    "200": "#bfdccc",
    "300": "#9ac9b0",
    "400": "#74b491",
    "500": "#4c9e72",
    "600": "#208750",
    "700": "#10693a",
    "800": "#0e562f",
    "900": "#0b4727",
  },
  teal: {
    "50": "#f7fafa",
    "100": "#dbebeb",
    "200": "#bcdbda",
    "300": "#97c7c5",
    "400": "#67adaa",
    "500": "#3d9693",
    "600": "#137c78",
    "700": "#0f605d",
    "800": "#0d504e",
    "900": "#0a4240",
  },
  cyan: {
    "50": "#f7fafb",
    "100": "#dfeced",
    "200": "#d0e3e6",
    "300": "#c0d9dd",
    "400": "#90bcc3",
    "500": "#79afb7",
    "600": "#5f9fa9",
    "700": "#358692",
    "800": "#146f7d",
    "900": "#0f5661",
  },
  blue: {
    "50": "#f3f6f9",
    "100": "#d4dfe8",
    "200": "#b6c8d7",
    "300": "#95afc5",
    "400": "#7597b5",
    "500": "#5a83a6",
    "600": "#3e6e97",
    "700": "#1b5484",
    "800": "#114470",
    "900": "#0e385b",
  },
  purple: {
    "50": "#f7f6fa",
    "100": "#e1dcec",
    "200": "#cbc3df",
    "300": "#ac9fcb",
    "400": "#9686be",
    "500": "#7b66ac",
    "600": "#6851a1",
    "700": "#573c96",
    "800": "#482b8c",
    "900": "#341480",
  },
  primary: {
    "50": "#faf6f9",
    "100": "#ecdce7",
    "200": "#dbbdd2",
    "300": "#c798b8",
    "400": "#bc83aa",
    "500": "#ac6696",
    "600": "#9e4c85",
    "700": "#8e2f70",
    "800": "#831961",
    "900": "#610f47",
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="dark" />

      <App />
    </ChakraProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  // && !/localhost/.test(window.location)) {
  registerSW({ onNeedRefresh() {}, onOfflineReady() {} });
}
