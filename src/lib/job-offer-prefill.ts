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

// Plain-text recap of what the extraction did. Kept next to the merge rule so
// the wording can never drift from the behaviour it describes, and so the
// result stays announceable in a live region (no colour-only signal).
export function buildPrefillSummary({
  filledFields,
  keptFields,
}: Pick<
  OfferPrefillOutcome<never>,
  "filledFields" | "keptFields"
>): string {
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

  parts.push("Vérifiez et corrigez les champs avant de créer la candidature.");

  return parts.join(" ");
}
