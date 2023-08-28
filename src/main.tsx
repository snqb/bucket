import App from "./App";
import {
	ChakraProvider,
	ColorModeScript,
	type ThemeConfig,
	defineStyle,
	extendTheme,
} from "@chakra-ui/react";
import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

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
		global: () => ({
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
		heading: "system-ui, sans-serif",
		body: "system-ui, sans-serif",
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
