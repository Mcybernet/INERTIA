import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0C",
          1: "#0E0E11",
          2: "#121216",
          3: "#17171C",
          4: "#1D1D24",
        },
        line: "#25252D",
        lineSoft: "#1A1A20",
        fg: "#ECECEF",
        muted: "#8A8A96",
        dim: "#5D5D68",
        gold: "#E0A64B",
        goldDim: "#8C6A31",
        up: "#4FA57A",
        down: "#C76A6A",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
      },
      letterSpacing: {
        label: "0.14em",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
