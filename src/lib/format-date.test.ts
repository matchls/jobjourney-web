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

  it("keeps the local day when UTC is still on the previous day", () => {
    process.env.TZ = "Pacific/Kiritimati"; // UTC+14, local clock ahead of UTC
    const earlyMorningOfTheSixteenth = new Date("2026-01-15T12:00:00.000Z");

    // Local time is 02:00 on the 16th; UTC has not left the 15th yet.
    expect(formatLocalDateForInput(earlyMorningOfTheSixteenth)).toBe(
      "2026-01-16",
    );
    expect(earlyMorningOfTheSixteenth.toISOString().slice(0, 10)).toBe(
      "2026-01-15",
    );
  });

  it("keeps the local day when UTC has already moved to the next day", () => {
    process.env.TZ = "Pacific/Midway"; // UTC-11, local clock behind UTC
    const afternoonOfTheFourteenth = new Date("2026-01-15T02:00:00.000Z");

    // Local time is 15:00 on the 14th; UTC has already moved to the 15th.
    expect(formatLocalDateForInput(afternoonOfTheFourteenth)).toBe(
      "2026-01-14",
    );
    expect(afternoonOfTheFourteenth.toISOString().slice(0, 10)).toBe(
      "2026-01-15",
    );
  });
});
