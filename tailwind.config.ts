import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["'Noto Sans Mono Variable'", "monospace"],
    },
  },
} satisfies Config;
