import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { blue: "#0066CC", red: "#FF0000", navy: "#002147" },
      },
    },
  },
  plugins: [],
};
export default config;
