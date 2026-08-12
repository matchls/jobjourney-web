import { fieldLabel } from "@/lib/agent-import";
import { ApiError } from "@/lib/api";

// Frontend side of the POST /applications/parse-offer contract.
//
// Everything the AI extraction is allowed to touch is described here — the
// field whitelist, the merge strategy and the user-facing error wording — so
// the dialog stays a thin UI layer and each rule can be tested in isolation.

// Fields an offer text can legitimately describe. This list is a whitelist,
// not documentation: merging iterates over it instead of over the API
// response, so a field outside of it (status, appliedAt, resumeText,
// coverLetterText, referralNote) can never be written by an extraction, even
// if a future backend version starts returning it.
export const OFFER_PREFILL_FIELDS = [
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
] as const;

export type OfferPrefillField = (typeof OFFER_PREFILL_FIELDS)[number];

export type ExtractedJobOfferFields = Partial<
  Record<OfferPrefillField, string>
>;

// Extraction metadata is kept out of the application payload on purpose: it
// describes the extraction, not the application. It is typed here so issue #24
// can display it without redefining the contract.
export type JobOfferExtractionResult = {
  fields?: ExtractedJobOfferFields | null;
  confidenceByField?: Partial<Record<OfferPrefillField, number>> | null;
  uncertainFields?: OfferPrefillField[] | null;
  warnings?: string[] | null;
};

// Backend limit for offerText (MAX_LONG_TEXT). Checked client-side too so an
// obviously oversized paste never leaves the browser.
export const MAX_OFFER_TEXT_LENGTH = 20000;

export const EMPTY_OFFER_TEXT_MESSAGE =
  "Collez le texte de l'offre avant de lancer l'analyse.";

export const OFFER_TEXT_TOO_LONG_MESSAGE =
  "L'offre est trop longue. Réduisez le texte collé, puis réessayez.";

const GENERIC_ERROR_MESSAGE =
  "L'analyse a échoué. Vous pouvez continuer manuellement.";

// Wording is mapped from the stable error codes of the endpoint only. The
// server message is never reused: it could carry provider-side details that
// have no meaning for the user.
const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  validation_error:
    "L'offre envoyée n'est pas valide. Vérifiez le texte collé, puis réessayez.",
  invalid_json:
    "L'offre envoyée n'est pas valide. Vérifiez le texte collé, puis réessayez.",
  payload_too_large: OFFER_TEXT_TOO_LONG_MESSAGE,
  rate_limited: "Trop de demandes d'analyse. Réessayez dans quelques minutes.",
  extraction_rate_limited:
    "Trop de demandes d'analyse. Réessayez dans quelques minutes.",
  extraction_not_configured:
    "Le service IA n'est pas disponible. Vous pouvez continuer manuellement.",
  extraction_timeout:
    "L'analyse a pris trop de temps. Réessayez ou continuez manuellement.",
  extraction_unavailable:
    "Le service IA est temporairement indisponible. Vous pouvez continuer manuellement.",
  extraction_invalid_response: GENERIC_ERROR_MESSAGE,
  extraction_unexpected_error: GENERIC_ERROR_MESSAGE,
};

// Fallbacks for the case where the response body carries no code (proxy
// error page, gateway timeout...), so the status still drives the wording.
const ERROR_MESSAGE_BY_STATUS: Record<number, string> = {
  413: OFFER_TEXT_TOO_LONG_MESSAGE,
  429: "Trop de demandes d'analyse. Réessayez dans quelques minutes.",
};

export function parseOfferErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && ERROR_MESSAGE_BY_CODE[error.code]) {
      return ERROR_MESSAGE_BY_CODE[error.code];
    }
    return ERROR_MESSAGE_BY_STATUS[error.status] ?? GENERIC_ERROR_MESSAGE;
  }
  // Network failure, offline browser, aborted request.
  return GENERIC_ERROR_MESSAGE;
}

// The form sends its own "Lien offre" value as context for the extraction.
// That input is free text, so an unfinished URL would make the whole request
// fail validation for a reason unrelated to the offer text: anything that
// isn't a safe http(s) URL is dropped instead of being sent.
export function sanitizeOfferUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
  if (url.username !== "" || url.password !== "") return undefined;

  return trimmed;
}

// --- Deterministic prefill from a pasted offer URL (issue #29) -------------

// Job boards whose domain is stable. The value is matched on a label
// boundary, never with a substring test: `evil-linkedin.com` and
// `linkedin.com.attaquant.net` must not resolve to LinkedIn.
const SOURCE_BY_DOMAIN: Record<string, string> = {
  "linkedin.com": "LinkedIn",
  "welcometothejungle.com": "Welcome to the Jungle",
};

// Job boards published under many country TLDs (indeed.fr, indeed.co.uk,
// fr.indeed.com...). Listing every extension would be an endless, always
// incomplete list, so the site name is matched instead — but only when what
// follows it really looks like a public suffix.
const SOURCE_BY_SITE_NAME: Record<string, string> = {
  indeed: "Indeed",
};

// A public suffix is one or two short alphabetic labels ("com", "co.uk").
// This is what stops `indeed.attaquant.net` from being read as Indeed: the
// label right after `indeed` has to be a plausible TLD, not a domain name.
const MAX_PUBLIC_SUFFIX_LABELS = 2;

function isPublicSuffixLabel(label: string): boolean {
  return /^[a-z]{2,3}$/.test(label);
}

// Source deduced from the offer domain, or undefined when the board is not in
// the tables above. Deduction only: nothing is guessed, nothing is fetched.
export function sourceFromOfferUrl(value: string): string | undefined {
  let hostname: string;
  try {
    // `URL` lowercases the host and punycodes IDNs, so the comparisons below
    // work on a normalised value.
    hostname = new URL(value).hostname;
  } catch {
    return undefined;
  }

  for (const [domain, source] of Object.entries(SOURCE_BY_DOMAIN)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) return source;
  }

  const labels = hostname.split(".");
  for (const [siteName, source] of Object.entries(SOURCE_BY_SITE_NAME)) {
    // Last occurrence: in `indeed.example.indeed.com` the meaningful one is
    // the registrable domain, not the subdomain an attacker controls.
    const index = labels.lastIndexOf(siteName);
    if (index === -1) continue;

    const suffix = labels.slice(index + 1);
    if (suffix.length === 0 || suffix.length > MAX_PUBLIC_SUFFIX_LABELS) {
      continue;
    }
    if (suffix.every(isPublicSuffixLabel)) return source;
  }

  return undefined;
}

export type OfferUrlDetection = {
  /** The pasted URL, validated and trimmed. */
  url: string;
  /** Known job board behind the domain, when there is one. */
  source?: string;
};

// Recognises a paste that is *only* an offer link. A link carries no company,
// no position and no description, so there is nothing for the extraction to
// read: handling it here saves a pointless AI call and gives an instant,
// reproducible result instead of a probabilistic one.
//
// An explicit `http://` or `https://` scheme is required on purpose: it is
// what a browser address bar and a "copy link" button produce, while a bare
// `linkedin.com` sitting in a sentence would be ambiguous. Any whitespace
// means the paste is a text — even a very short one — and belongs to the AI
// workflow.
export function detectOfferUrlOnly(text: string): OfferUrlDetection | null {
  const trimmed = text.trim();
  if (trimmed === "" || /\s/.test(trimmed)) return null;

  const url = sanitizeOfferUrl(trimmed);
  if (!url) return null;

  const source = sourceFromOfferUrl(url);
  return source ? { url, source } : { url };
}

// Fields a recognised URL can fill, ready for `mergeOfferPrefill`. Going
// through the same merge as the extraction is what guarantees a value typed by
// the user is never overwritten, here too.
export function offerUrlPrefillFields(
  detection: OfferUrlDetection,
): ExtractedJobOfferFields {
  return detection.source
    ? { offerUrl: detection.url, source: detection.source }
    : { offerUrl: detection.url };
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

export type OfferPrefillOutcome<T> = {
  /** New form values. The input object is never mutated. */
  values: T;
  /** Fields the extraction actually filled. */
  filledFields: OfferPrefillField[];
  /** Fields left untouched because the user had already typed something. */
  keptFields: OfferPrefillField[];
};

// V1 merge strategy: the extraction only fills fields that are currently
// empty. A value typed by the user always wins and is never silently
// replaced — the fields that were kept are reported back so the UI can say so
// instead of letting the user wonder what changed.
export function mergeOfferPrefill<T extends Record<string, unknown>>(
  current: T,
  extracted: ExtractedJobOfferFields | null | undefined,
): OfferPrefillOutcome<T> {
  const values = { ...current };
  const filledFields: OfferPrefillField[] = [];
  const keptFields: OfferPrefillField[] = [];

  if (!extracted) {
    return { values, filledFields, keptFields };
  }

  for (const field of OFFER_PREFILL_FIELDS) {
    const proposed = extracted[field];
    // "not extracted" and "extracted empty" are treated the same way: there
    // is nothing to write, so the current value stands.
    if (isBlank(proposed)) continue;

    if (isBlank(current[field])) {
      (values as Record<string, unknown>)[field] = (proposed as string).trim();
      filledFields.push(field);
    } else {
      keptFields.push(field);
    }
  }

  return { values, filledFields, keptFields };
}

// --- Extraction review metadata (issue #24) --------------------------------

// Fields the extraction flagged as worth checking, narrowed to the ones the
// form actually shows. A name outside the contract (older/newer backend, typo)
// is dropped rather than rendered: it could not be attached to any input.
// Filtering the whitelist rather than the payload also removes duplicates and
// keeps a stable order for free.
export function normalizeUncertainFields(value: unknown): OfferPrefillField[] {
  if (!Array.isArray(value)) return [];
  return OFFER_PREFILL_FIELDS.filter((field) => value.includes(field));
}

// Free-text notes from the extraction. Blanks and duplicates are removed so
// the panel never shows an empty bullet or the same sentence twice.
export function normalizeExtractionWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "");
  return [...new Set(cleaned)];
}

// Plain-text recap of what the extraction did. Kept next to the merge rule so
// the wording can never drift from the behaviour it describes, and so the
// result stays announceable in a live region (no colour-only signal).
export function buildPrefillSummary({
  filledFields,
  keptFields,
  uncertainFields = [],
  warnings = [],
}: Pick<OfferPrefillOutcome<never>, "filledFields" | "keptFields"> & {
  // Counts only: the details live in the badges and in the warnings panel.
  // Repeating them here is what makes both readable by a screen reader.
  uncertainFields?: OfferPrefillField[];
  warnings?: string[];
}): string {
  const parts: string[] = [];

  if (filledFields.length === 0) {
    parts.push(
      "Analyse terminée : aucun champ vide n'a pu être prérempli. Complétez le formulaire manuellement.",
    );
  } else {
    parts.push(
      `Analyse terminée : ${filledFields.length} champ${
        filledFields.length > 1 ? "s" : ""
      } prérempli${filledFields.length > 1 ? "s" : ""} (${filledFields
        .map(fieldLabel)
        .join(", ")}).`,
    );
  }

  if (keptFields.length > 0) {
    parts.push(
      `Vos saisies ont été conservées pour : ${keptFields
        .map(fieldLabel)
        .join(", ")}.`,
    );
  }

  if (uncertainFields.length > 0) {
    parts.push(
      `${uncertainFields.length} champ${
        uncertainFields.length > 1 ? "s sont signalés" : " est signalé"
      } « À vérifier » : ${uncertainFields.map(fieldLabel).join(", ")}.`,
    );
  }

  if (warnings.length > 0) {
    parts.push(
      `${warnings.length} point${
        warnings.length > 1 ? "s signalés" : " signalé"
      } par l'analyse, au-dessus du formulaire.`,
    );
  }

  parts.push("Vérifiez et corrigez les champs avant de créer la candidature.");

  return parts.join(" ");
}

// Recap of the URL-only path. It says three things the AI recap cannot: the
// link *was* understood (so "aucun champ prérempli" never shows up for a
// perfectly valid paste), whether the board could be named, and what the user
// can do next to fill the rest.
export function buildUrlPrefillSummary({
  filledFields,
  keptFields,
  sourceDetected,
}: Pick<OfferPrefillOutcome<never>, "filledFields" | "keptFields"> & {
  sourceDetected: boolean;
}): string {
  const parts: string[] = [];

  if (filledFields.length === 0) {
    parts.push("Lien de l'offre reconnu : il n'y avait rien de nouveau à préremplir.");
  } else {
    parts.push(
      `Lien de l'offre reconnu : ${filledFields.length} champ${
        filledFields.length > 1 ? "s" : ""
      } prérempli${filledFields.length > 1 ? "s" : ""} (${filledFields
        .map(fieldLabel)
        .join(", ")}).`,
    );
  }

  if (keptFields.length > 0) {
    parts.push(
      `Vos saisies ont été conservées pour : ${keptFields
        .map(fieldLabel)
        .join(", ")}.`,
    );
  }

  if (!sourceDetected) {
    parts.push("La source n'a pas pu être déduite de ce domaine.");
  }

  parts.push(
    "Collez le texte complet de l'annonce pour préremplir les autres champs.",
  );

  return parts.join(" ");
}
