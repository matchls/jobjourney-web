import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import {
  MAX_OFFER_TEXT_LENGTH,
  OFFER_PREFILL_FIELDS,
  buildPrefillSummary,
  buildUrlPrefillSummary,
  detectOfferUrlOnly,
  mergeOfferPrefill,
  normalizeExtractionWarnings,
  normalizeUncertainFields,
  offerUrlPrefillFields,
  isOfferLengthError,
  parseOfferErrorMessage,
  sanitizeOfferUrl,
  sourceFromOfferUrl,
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

// --- Server-side length refusals (issue #28) --------------------------------
//
// The local MAX_OFFER_TEXT_LENGTH guard can sit above the API's real limit
// without anything warning us. When that happens the API refuses the offer,
// and the user must still read "too long" rather than a vague "invalid offer".

const validationError = (fieldErrors: Record<string, string[]>) =>
  new ApiError("offerText : ...", 400, "validation_error", fieldErrors);

describe("isOfferLengthError", () => {
  it("recognizes the route's own body limit", () => {
    expect(isOfferLengthError(new ApiError("raw", 413, "payload_too_large"))).toBe(
      true,
    );
  });

  it("recognizes a 413 that carries no code", () => {
    expect(isOfferLengthError(new ApiError("raw", 413))).toBe(true);
  });

  it("recognizes the code even under another status", () => {
    expect(isOfferLengthError(new ApiError("raw", 400, "payload_too_large"))).toBe(
      true,
    );
  });

  it("recognizes a validation_error naming offerText", () => {
    expect(
      isOfferLengthError(validationError({ offerText: ["Too big"] })),
    ).toBe(true);
  });

  it("does not depend on the validator's wording", () => {
    // Zod 3, Zod 4 and a translated backend phrase all read the same to us,
    // because detection looks at the field name, never at the sentence.
    for (const wording of [
      "String must contain at most 20000 character(s)",
      "Too big: expected string to have <=10000 characters",
      "Le texte est trop long",
      "",
    ]) {
      expect(
        isOfferLengthError(validationError({ offerText: [wording] })),
      ).toBe(true);
    }
  });

  it("ignores a validation_error about another field", () => {
    expect(
      isOfferLengthError(validationError({ offerUrl: ["Invalid url"] })),
    ).toBe(false);
    expect(
      isOfferLengthError(validationError({ sourceHint: ["Too big"] })),
    ).toBe(false);
  });

  it("ignores a validation_error with no usable field details", () => {
    expect(isOfferLengthError(validationError({}))).toBe(false);
    expect(isOfferLengthError(validationError({ offerText: [] }))).toBe(false);
    expect(
      isOfferLengthError(new ApiError("raw", 400, "validation_error")),
    ).toBe(false);
  });

  it("ignores every other failure", () => {
    expect(isOfferLengthError(new ApiError("raw", 429, "rate_limited"))).toBe(
      false,
    );
    expect(
      isOfferLengthError(new ApiError("raw", 502, "extraction_unavailable")),
    ).toBe(false);
    expect(isOfferLengthError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isOfferLengthError(null)).toBe(false);
  });
});

describe("parseOfferErrorMessage — server-side length refusals", () => {
  it("says the offer is too long when the API refuses its length", () => {
    expect(
      parseOfferErrorMessage(validationError({ offerText: ["Too big"] })),
    ).toMatch(/trop longue/);
  });

  it("keeps the generic wording for a validation_error on another field", () => {
    expect(
      parseOfferErrorMessage(validationError({ offerUrl: ["Invalid url"] })),
    ).toMatch(/n'est pas valide/);
  });

  it("still says too long when the API is stricter than the local guard", () => {
    // The local guard never fired (the text was under 20 000), yet the server
    // refused it — the wording follows the server, which is the whole point.
    const belowLocalGuard = "a".repeat(MAX_OFFER_TEXT_LENGTH - 1);
    expect(belowLocalGuard.length).toBeLessThan(MAX_OFFER_TEXT_LENGTH);

    expect(
      parseOfferErrorMessage(
        validationError({
          offerText: ["Too big: expected string to have <=10000 characters"],
        }),
      ),
    ).toMatch(/trop longue/);
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

describe("sourceFromOfferUrl", () => {
  it("names the known boards from their canonical domain", () => {
    expect(sourceFromOfferUrl("https://linkedin.com/jobs/view/1")).toBe(
      "LinkedIn",
    );
    expect(
      sourceFromOfferUrl("https://welcometothejungle.com/fr/companies/x/jobs/y"),
    ).toBe("Welcome to the Jungle");
    expect(sourceFromOfferUrl("https://indeed.com/viewjob?jk=1")).toBe("Indeed");
  });

  it("accepts subdomains of a known board", () => {
    expect(sourceFromOfferUrl("https://www.linkedin.com/jobs/view/1")).toBe(
      "LinkedIn",
    );
    expect(sourceFromOfferUrl("https://fr.linkedin.com/jobs/view/1")).toBe(
      "LinkedIn",
    );
    expect(
      sourceFromOfferUrl("https://www.welcometothejungle.com/fr/jobs/x"),
    ).toBe("Welcome to the Jungle");
    expect(sourceFromOfferUrl("https://fr.indeed.com/viewjob?jk=1")).toBe(
      "Indeed",
    );
  });

  it("follows Indeed across its country extensions", () => {
    expect(sourceFromOfferUrl("https://indeed.fr/viewjob?jk=1")).toBe("Indeed");
    expect(sourceFromOfferUrl("https://www.indeed.co.uk/viewjob")).toBe(
      "Indeed",
    );
    expect(sourceFromOfferUrl("https://indeed.com.mx/viewjob")).toBe("Indeed");
  });

  it("is case-insensitive on the host, like the DNS is", () => {
    expect(sourceFromOfferUrl("https://WWW.LinkedIn.COM/jobs/view/1")).toBe(
      "LinkedIn",
    );
  });

  it("refuses a lookalike domain that only contains the board name", () => {
    // The whole point of matching on label boundaries: none of these is the
    // real job board, and none of them may borrow its name.
    expect(sourceFromOfferUrl("https://evil-linkedin.com/jobs")).toBeUndefined();
    expect(sourceFromOfferUrl("https://linkedin.com.evil.net/jobs")).toBeUndefined();
    expect(sourceFromOfferUrl("https://mylinkedin.com/jobs")).toBeUndefined();
    expect(sourceFromOfferUrl("https://linkedincorp.com/jobs")).toBeUndefined();
    expect(
      sourceFromOfferUrl("https://notwelcometothejungle.com/jobs"),
    ).toBeUndefined();
    expect(sourceFromOfferUrl("https://evil-indeed.com/viewjob")).toBeUndefined();
    expect(sourceFromOfferUrl("https://indeedjobs.com/viewjob")).toBeUndefined();
    // `evil` is no plausible public suffix, so this is not an Indeed domain.
    expect(sourceFromOfferUrl("https://indeed.evil.com/viewjob")).toBeUndefined();
    expect(sourceFromOfferUrl("https://indeed.com.evil.net/viewjob")).toBeUndefined();
  });

  it("leaves an unknown board unnamed rather than guessing", () => {
    expect(sourceFromOfferUrl("https://jobs.example.com/42")).toBeUndefined();
    expect(sourceFromOfferUrl("https://careers.acme.fr/offre/1")).toBeUndefined();
    expect(sourceFromOfferUrl("pas-une-url")).toBeUndefined();
  });
});

describe("detectOfferUrlOnly", () => {
  it("recognises a lone offer link and its board", () => {
    expect(
      detectOfferUrlOnly("https://www.linkedin.com/jobs/view/4451103812/"),
    ).toEqual({
      url: "https://www.linkedin.com/jobs/view/4451103812/",
      source: "LinkedIn",
    });
  });

  it("ignores the whitespace around a pasted link", () => {
    expect(detectOfferUrlOnly("\n  https://indeed.fr/viewjob?jk=1  \n")).toEqual(
      { url: "https://indeed.fr/viewjob?jk=1", source: "Indeed" },
    );
  });

  it("returns the url alone for an unknown domain", () => {
    expect(detectOfferUrlOnly("https://jobs.example.com/42")).toEqual({
      url: "https://jobs.example.com/42",
    });
  });

  it("accepts an explicit http:// scheme just like https://", () => {
    // Both schemes are safe to store and to open, so an offer link served
    // over plain http is recognised exactly the same way.
    expect(detectOfferUrlOnly("http://linkedin.com/jobs/view/1")).toEqual({
      url: "http://linkedin.com/jobs/view/1",
      source: "LinkedIn",
    });
    expect(detectOfferUrlOnly("http://www.linkedin.com/jobs/view/1")).toEqual({
      url: "http://www.linkedin.com/jobs/view/1",
      source: "LinkedIn",
    });
    expect(detectOfferUrlOnly("http://jobs.example.com/42")).toEqual({
      url: "http://jobs.example.com/42",
    });
  });

  it("does not claim a paste that contains anything besides the link", () => {
    expect(
      detectOfferUrlOnly("Voir l'offre https://www.linkedin.com/jobs/view/1"),
    ).toBeNull();
    expect(
      detectOfferUrlOnly("https://www.linkedin.com/jobs/view/1 CDI Paris"),
    ).toBeNull();
    expect(
      detectOfferUrlOnly(
        "Développeur React\nhttps://www.linkedin.com/jobs/view/1",
      ),
    ).toBeNull();
  });

  it("does not claim anything that is not a safe http(s) url", () => {
    expect(detectOfferUrlOnly("")).toBeNull();
    expect(detectOfferUrlOnly("   ")).toBeNull();
    // An explicit http:// or https:// scheme is required: a bare domain is
    // too ambiguous to act on.
    expect(detectOfferUrlOnly("www.linkedin.com/jobs/view/1")).toBeNull();
    expect(detectOfferUrlOnly("linkedin.com/jobs/view/1")).toBeNull();
    expect(detectOfferUrlOnly("javascript:alert(1)")).toBeNull();
    expect(detectOfferUrlOnly("ftp://example.com/offre")).toBeNull();
    expect(
      detectOfferUrlOnly("https://user:pass@www.linkedin.com/jobs/view/1"),
    ).toBeNull();
  });
});

describe("offerUrlPrefillFields", () => {
  it("proposes the url and the source when the board is known", () => {
    expect(
      offerUrlPrefillFields({ url: "https://x.test/1", source: "LinkedIn" }),
    ).toEqual({ offerUrl: "https://x.test/1", source: "LinkedIn" });
  });

  it("proposes the url alone otherwise, never an empty source", () => {
    expect(offerUrlPrefillFields({ url: "https://x.test/1" })).toEqual({
      offerUrl: "https://x.test/1",
    });
  });

  it("goes through the merge without ever overwriting a manual value", () => {
    const current = { ...emptyForm, source: "Cooptation" };
    const fields = offerUrlPrefillFields({
      url: "https://www.linkedin.com/jobs/view/1",
      source: "LinkedIn",
    });

    const { values, filledFields, keptFields } = mergeOfferPrefill(
      current,
      fields,
    );

    expect(values.source).toBe("Cooptation");
    expect(values.offerUrl).toBe("https://www.linkedin.com/jobs/view/1");
    expect(filledFields).toEqual(["offerUrl"]);
    expect(keptFields).toEqual(["source"]);
  });
});

describe("buildUrlPrefillSummary", () => {
  it("never says nothing was prefilled when the link was understood", () => {
    const summary = buildUrlPrefillSummary({
      filledFields: ["source", "offerUrl"],
      keptFields: [],
      sourceDetected: true,
    });

    expect(summary).toContain("Lien de l'offre reconnu");
    expect(summary).toContain("2 champs préremplis");
    expect(summary).toContain("Source");
    expect(summary).toContain("Lien de l'offre");
    expect(summary).not.toContain("aucun champ");
  });

  it("says the source could not be deduced from an unknown domain", () => {
    const summary = buildUrlPrefillSummary({
      filledFields: ["offerUrl"],
      keptFields: [],
      sourceDetected: false,
    });

    expect(summary).toContain("1 champ prérempli");
    expect(summary).toContain("La source n'a pas pu être déduite");
  });

  it("reports the values it kept instead of overwriting", () => {
    const summary = buildUrlPrefillSummary({
      filledFields: [],
      keptFields: ["offerUrl", "source"],
      sourceDetected: true,
    });

    expect(summary).toContain("rien de nouveau à préremplir");
    expect(summary).toContain("Vos saisies ont été conservées");
    expect(summary).not.toContain("La source n'a pas pu être déduite");
  });

  it("always points to the way of filling the remaining fields", () => {
    const summary = buildUrlPrefillSummary({
      filledFields: ["offerUrl"],
      keptFields: [],
      sourceDetected: true,
    });

    expect(summary).toContain("Collez le texte complet de l'annonce");
  });
});

describe("contract constants", () => {
  // Freezes the local guard, not a contract: nothing keeps this in sync with
  // the API's MAX_LONG_TEXT, which is why a server-side length refusal is
  // handled on its own (see isOfferLengthError). Changing this value is a
  // deliberate UX call, not a coordination with the backend.
  it("keeps the local round-trip guard at its documented value", () => {
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
