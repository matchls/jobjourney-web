import { ApiError } from "@/lib/api";

// User-facing wording for a refused application creation (issue #34).
//
// The API refuses a duplicate on POST /applications with HTTP 409 and
// { "error": { "code": "application_duplicate" } } — see jobjourney-api#21.
// Both the manual form and the AI prefill go through that same endpoint, so
// mapping the error once here covers both flows.

export const DUPLICATE_APPLICATION_MESSAGE =
  "Cette candidature existe déjà. Vérifie tes candidatures avant d’en créer une nouvelle.";

// Deliberately narrow: the status AND the code must both match. The code
// alone isn't enough (a future endpoint could reuse the wording under a
// different status), and the status alone is far too broad — 409 is also
// what the agent import returns for `idempotency_conflict`, which is a
// completely different situation and must keep its own message.
export function isDuplicateApplicationError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    error.code === "application_duplicate"
  );
}

// Returns `error.message` untouched for everything that isn't a duplicate,
// so every other failure keeps exactly the wording it had before #34 — this
// function only ever *adds* a case, it never re-maps existing ones.
export function createApplicationErrorMessage(error: Error): string {
  return isDuplicateApplicationError(error)
    ? DUPLICATE_APPLICATION_MESSAGE
    : error.message;
}
