import { afterEach, describe, expect, it } from "vitest";
import { formatLocalDateForInput } from "@/lib/format-date";

// Node recomputes local time from process.env.TZ on the fly, so these tests can
// place themselves in a timezone where the local day and the UTC day disagree.
// Without that they would be vacuous on a UTC machine — which is exactly what
// the CI runner is.
const originalTz = process.env.TZ;

function restoreTimeZone() {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
}

afterEach(restoreTimeZone);

describe("formatLocalDateForInput", () => {
  it("formats the value input[type=date] expects", () => {
    // Built from local components, so this holds in every timezone.
    expect(formatLocalDateForInput(new Date(2026, 4, 17, 10, 30))).toBe(
      "2026-05-17",
    );
  });

  it("pads a single-digit month and day to two digits", () => {
    expect(formatLocalDateForInput(new Date(2026, 0, 5, 8, 0))).toBe(
      "2026-01-05",
    );
  });

  it("keeps the local day when UTC has already moved to the next one", () => {
    process.env.TZ = "Pacific/Kiritimati"; // UTC+14
    const nightOfTheSixteenth = new Date("2026-01-15T12:00:00.000Z");

    // Locally it is already the 16th; in UTC it is still the 15th.
    expect(formatLocalDateForInput(nightOfTheSixteenth)).toBe("2026-01-16");
    expect(nightOfTheSixteenth.toISOString().slice(0, 10)).toBe("2026-01-15");
  });

  it("keeps the local day when UTC has already moved to the previous one", () => {
    process.env.TZ = "Pacific/Midway"; // UTC-11
    const morningOfTheFourteenth = new Date("2026-01-15T02:00:00.000Z");

    // Locally it is still the 14th; in UTC it is already the 15th.
    expect(formatLocalDateForInput(morningOfTheFourteenth)).toBe("2026-01-14");
    expect(morningOfTheFourteenth.toISOString().slice(0, 10)).toBe(
      "2026-01-15",
    );
  });
});
