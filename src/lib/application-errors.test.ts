import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import {
  DUPLICATE_APPLICATION_MESSAGE,
  createApplicationErrorMessage,
  isDuplicateApplicationError,
} from "@/lib/application-errors";

const duplicateError = () =>
  new ApiError("Erreur API", 409, "application_duplicate");

describe("isDuplicateApplicationError", () => {
  it("recognizes a 409 carrying the application_duplicate code", () => {
    expect(isDuplicateApplicationError(duplicateError())).toBe(true);
  });

  it("rejects the right code under a different status", () => {
    expect(
      isDuplicateApplicationError(
        new ApiError("Erreur API", 400, "application_duplicate"),
      ),
    ).toBe(false);
  });

  it("rejects another 409 code, so idempotency_conflict keeps its own wording", () => {
    expect(
      isDuplicateApplicationError(
        new ApiError("Conflit", 409, "idempotency_conflict"),
      ),
    ).toBe(false);
  });

  it("rejects a 409 with no code at all", () => {
    expect(isDuplicateApplicationError(new ApiError("Conflit", 409))).toBe(
      false,
    );
  });

  it("rejects an error that is not an ApiError, even if it looks like one", () => {
    const lookalike = Object.assign(new Error("Erreur API"), {
      status: 409,
      code: "application_duplicate",
    });
    expect(isDuplicateApplicationError(lookalike)).toBe(false);
  });

  it("rejects non-error values", () => {
    expect(isDuplicateApplicationError(null)).toBe(false);
    expect(isDuplicateApplicationError(undefined)).toBe(false);
    expect(isDuplicateApplicationError("409")).toBe(false);
  });
});

describe("createApplicationErrorMessage", () => {
  it("returns the dedicated wording for a duplicate", () => {
    expect(createApplicationErrorMessage(duplicateError())).toBe(
      DUPLICATE_APPLICATION_MESSAGE,
    );
  });

  it("never reuses the server message on a duplicate", () => {
    const noisy = new ApiError(
      "P2002 unique constraint failed",
      409,
      "application_duplicate",
    );
    expect(createApplicationErrorMessage(noisy)).toBe(
      DUPLICATE_APPLICATION_MESSAGE,
    );
  });

  it("passes every other ApiError through unchanged", () => {
    expect(
      createApplicationErrorMessage(
        new ApiError("company : Requis", 400, "validation_error"),
      ),
    ).toBe("company : Requis");
    expect(
      createApplicationErrorMessage(new ApiError("Erreur API", 500)),
    ).toBe("Erreur API");
  });

  it("passes a plain Error through unchanged (network failure, offline)", () => {
    expect(createApplicationErrorMessage(new Error("Failed to fetch"))).toBe(
      "Failed to fetch",
    );
  });
});
