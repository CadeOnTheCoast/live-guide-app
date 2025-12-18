import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [
      "./tests/setup.ts",       // your existing jest-dom setup
      "./tests/setupTests.ts",  // the new useFormState mock
    ],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});