import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.vitest.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    css: true,
    server: {
      deps: {
        inline: ["recharts"],
      },
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
});
