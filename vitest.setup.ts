import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only auto-cleans when Vitest globals are enabled; they are
// not, so each rendered tree is unmounted explicitly between tests.
afterEach(() => {
  cleanup();
});
