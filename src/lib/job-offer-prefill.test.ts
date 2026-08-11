import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import {
  MAX_OFFER_TEXT_LENGTH,
  OFFER_PREFILL_FIELDS,
  buildPrefillSummary,
  mergeOfferPrefill,
  normalizeExtractionWarnings,
  normalizeUncertainFields,
  parseOfferErrorMessage,
  sanitizeOfferUrl,
} from "@/lib/job-offer-prefill";

const emptyForm = {
  company: "",
  position: "",
  source: "",
  offerUrl: "",
  status: "TARGETED",
  appliedAt: "",
  location: "",
  contractType: "",
  salary: "",
  jobDescription: "",
  notes: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  referralNote: "",
};

describe("mergeOfferPrefill", () => {
  it("fills every empty field of the contract", () => {
    const extracted = Object.fromEntries(
      OFFER_PREFILL_FIELDS.map((field) => [field, `valeur ${field}`]),
    );

    const { values, filledFields, keptFields } = mergeOfferPrefill(
      emptyForm,
      extracted,
    );

    for (const field of OFFER_PREFILL_FIELDS) {
      expect(values[field]).toBe(`valeur ${field}`);
    }
    expect(filledFields).toEqual([...OFFER_PREFILL_FIELDS]);
    expect(keptFields).toEqual([]);
  });

  it("never overwrites a value already typed by the user", () => {
    const current = { ...emptyForm, company: "ACME", position: "Dev" };

    const { values, filledFields, keptFields } = mergeOfferPrefill(current, {
      company: "Autre entreprise",
      position: "Autre poste",
      location: "Lyon",
    });

    expect(values.company).toBe("ACME");
    expect(values.position).toBe("Dev");
    expect(values.location).toBe("Lyon");
    expect(filledFields).toEqual(["location"]);
    expect(keptFields).toEqual(["company", "position"]);
  });

  it("leaves untouched the fields a partial result doesn't mention", () => {
    const current = { ...emptyForm, salary: "45k" };

    const { values } = mergeOfferPrefill(current, { company: "ACME" });

    expect(values.company).toBe("ACME");
    expect(values.salary).toBe("45k");
    expect(values.position).toBe("");
    expect(values.jobDescription).toBe("");
  });

  it("ignores fields owned by the user even if the API returns them", () => {
    const { values } = mergeOfferPrefill(emptyForm, {
      company: "ACME",
      // Not part of the extraction contract: an extractor filling these would
      // be inventing a fact about the user, not about the offer.
      status: "APPLIED",
      appliedAt: "2026-01-01T00:00:00.000Z",
      resumeText: "CV",
      coverLetterText: "Lettre",
      referralNote: "Recommandé par X",
    } as Record<string, string>);

    expect(values.company).toBe("ACME");
    expect(values.status).toBe("TARGETED");
    expect(values.appliedAt).toBe("");
    expect(values.referralNote).toBe("");
    expect(values).not.toHaveProperty("resumeText");
    expect(values).not.toHaveProperty("coverLetterText");
  });

  it("treats a blank extracted value as no value at all", () => {
    const current = { ...emptyForm, company: "ACME" };

    const { values, filledFields, keptFields } = mergeOfferPrefill(current, {
      company: "   ",
      position: "",
      location: "  Paris  ",
    });

    expect(values.company).toBe("ACME");
    expect(values.position).toBe("");
    expect(values.location).toBe("Paris");
    expect(filledFields).toEqual(["location"]);
    expect(keptFields).toEqual([]);
  });

  it("returns a new object and never mutates the current values", () => {
    const current = { ...emptyForm };

    const { values } = mergeOfferPrefill(current, { company: "ACME" });

    expect(values).not.toBe(current);
    expect(current.company).toBe("");
  });

  it("handles a missing or empty result without throwing", () => {
    expect(mergeOfferPrefill(emptyForm, undefined).filledFields).toEqual([]);
    expect(mergeOfferPrefill(emptyForm, null).filledFields).toEqual([]);
    expect(mergeOfferPrefill(emptyForm, {}).values).toEqual(emptyForm);
  });
});

describe("buildPrefillSummary", () => {
  it("lists what was filled and what was kept", () => {
    const summary = buildPrefillSummary({
      filledFields: ["company", "location"],
      keptFields: ["position"],
    });

    expect(summary).toContain("2 champs préremplis");
    expect(summary).toContain("Entreprise");
    expect(summary).toContain("Localisation");
    expect(summary).toContain("Vos saisies ont été conservées");
    expect(summary).toContain("Poste");
  });

  it("stays explicit when nothing could be filled", () => {
    const summary = buildPrefillSummary({ filledFields: [], keptFields: [] });

    expect(summary).toContain("aucun champ vide n'a pu être prérempli");
    expect(summary).not.toContain("conservées");
  });

  it("announces the fields to check and the warnings count", () => {
    const summary = buildPrefillSummary({
      filledFields: ["company"],
      keptFields: [],
      uncertainFields: ["salary", "contractType"],
      warnings: ["Salaire exprimé en fourchette"],
    });

    expect(summary).toContain("2 champs sont signalés « À vérifier »");
    expect(summary).toContain("Rémunération");
    expect(summary).toContain("Type de contrat");
    expect(summary).toContain("1 point signalé par l'analyse");
  });

  it("says nothing about review when the extraction is confident", () => {
    const summary = buildPrefillSummary({
      filledFields: ["company"],
      keptFields: [],
      uncertainFields: [],
      warnings: [],
    });

    expect(summary).not.toContain("À vérifier");
    expect(summary).not.toContain("signalé");
  });
});

describe("normalizeUncertainFields", () => {
  it("keeps the flagged fields the form can actually show", () => {
    expect(
      normalizeUncertainFields(["salary", "contractType", "company"]),
    ).toEqual(["company", "contractType", "salary"]);
  });

  it("drops names that match no displayed field instead of breaking", () => {
    expect(
      normalizeUncertainFields([
        "salary",
        "unknownField",
        "status",
        "resumeText",
        42,
        null,
      ]),
    ).toEqual(["salary"]);
  });

  it("handles a missing or malformed value", () => {
    expect(normalizeUncertainFields(undefined)).toEqual([]);
    expect(normalizeUncertainFields(null)).toEqual([]);
    expect(normalizeUncertainFields("salary")).toEqual([]);
    expect(normalizeUncertainFields([])).toEqual([]);
  });

  it("never reports the same field twice", () => {
    expect(normalizeUncertainFields(["salary", "salary"])).toEqual(["salary"]);
  });
});

describe("normalizeExtractionWarnings", () => {
  it("keeps usable sentences, trimmed and deduplicated", () => {
    expect(
      normalizeExtractionWarnings([
        "  Salaire exprimé en fourchette  ",
        "",
        "   ",
        "Salaire exprimé en fourchette",
        "Contrat déduit du contexte",
        7,
      ]),
    ).toEqual(["Salaire exprimé en fourchette", "Contrat déduit du contexte"]);
  });

  it("handles a missing or malformed value", () => {
    expect(normalizeExtractionWarnings(undefined)).toEqual([]);
    expect(normalizeExtractionWarnings(null)).toEqual([]);
    expect(normalizeExtractionWarnings("un warning")).toEqual([]);
  });
});

describe("parseOfferErrorMessage", () => {
  const cases: [string, number, RegExp][] = [
    ["validation_error", 400, /n'est pas valide/],
    ["payload_too_large", 413, /trop longue/],
    ["rate_limited", 429, /Trop de demandes/],
    ["extraction_rate_limited", 429, /Trop de demandes/],
    ["extraction_not_configured", 503, /n'est pas disponible/],
    ["extraction_timeout", 504, /trop de temps/],
    ["extraction_unavailable", 502, /temporairement indisponible/],
    ["extraction_invalid_response", 502, /L'analyse a échoué/],
  ];

  it.each(cases)("maps %s to a plain user message", (code, status, expected) => {
    expect(parseOfferErrorMessage(new ApiError("raw", status, code))).toMatch(
      expected,
    );
  });

  it("falls back on the status when the body carries no code", () => {
    expect(parseOfferErrorMessage(new ApiError("raw", 429))).toMatch(
      /Trop de demandes/,
    );
    expect(parseOfferErrorMessage(new ApiError("raw", 500))).toMatch(
      /L'analyse a échoué/,
    );
  });

  it("handles an unexpected network failure", () => {
    expect(parseOfferErrorMessage(new TypeError("Failed to fetch"))).toMatch(
      /L'analyse a échoué/,
    );
  });

  it("never leaks the raw server message to the user", () => {
    const leaky = new ApiError(
      "Groq API error: model llama-x rate limit, key sk-live-123",
      502,
      "extraction_unavailable",
    );

    const message = parseOfferErrorMessage(leaky);

    expect(message).not.toMatch(/groq/i);
    expect(message).not.toMatch(/sk-/i);
    expect(message).not.toContain("llama");
  });
});

describe("sanitizeOfferUrl", () => {
  it("keeps a plain http(s) url", () => {
    expect(sanitizeOfferUrl("https://jobs.example.com/1")).toBe(
      "https://jobs.example.com/1",
    );
    expect(sanitizeOfferUrl("  http://example.com  ")).toBe(
      "http://example.com",
    );
  });

  it("drops anything the endpoint would reject", () => {
    expect(sanitizeOfferUrl("")).toBeUndefined();
    expect(sanitizeOfferUrl(undefined)).toBeUndefined();
    expect(sanitizeOfferUrl("linkedin")).toBeUndefined();
    expect(sanitizeOfferUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeOfferUrl("https://user:pass@example.com")).toBeUndefined();
  });
});

describe("contract constants", () => {
  it("stays aligned with the backend limit", () => {
    expect(MAX_OFFER_TEXT_LENGTH).toBe(20000);
  });

  it("exposes exactly the twelve extractable fields", () => {
    expect([...OFFER_PREFILL_FIELDS]).toEqual([
      "company",
      "position",
      "source",
      "offerUrl",
      "location",
      "contractType",
      "salary",
      "jobDescription",
      "notes",
      "contactName",
      "contactRole",
      "contactEmail",
    ]);
  });
});
