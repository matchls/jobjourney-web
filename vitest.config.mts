import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest doesn't read the `paths` mapping from tsconfig.json, so the "@/"
// alias used everywhere in src/ has to be declared here too.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
