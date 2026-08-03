import type { Application } from "@/types";

const UNKNOWN_FIELD_LABEL = "Champ non identifié";

const FIELD_LABELS: Record<string, string> = {
  company: "Entreprise",
  position: "Poste",
  location: "Localisation",
  salary: "Rémunération",
  contractType: "Type de contrat",
  jobDescription: "Description du poste",
  source: "Source",
  offerUrl: "Lien de l'offre",
  contactName: "Nom du contact",
  contactRole: "Rôle du contact",
  contactEmail: "Email du contact",
  notes: "Notes",
  stack: "Compétences techniques",
  referralNote: "Note de recommandation",
};

function humanizeField(field: string): string {
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  if (spaced === "") return UNKNOWN_FIELD_LABEL;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function fieldLabel(field: string): string {
  if (typeof field !== "string" || field.trim() === "") {
    return UNKNOWN_FIELD_LABEL;
  }
  return FIELD_LABELS[field] ?? humanizeField(field);
}

export function isAgentImport(
  application: Pick<Application, "creationSource">,
): boolean {
  return application.creationSource === "AGENT_IMPORT";
}

export function needsImportReview(
  application: Pick<Application, "creationSource" | "importReviewStatus">,
): boolean {
  return (
    application.creationSource === "AGENT_IMPORT" &&
    application.importReviewStatus === "PENDING"
  );
}

export function getUncertainFields(
  application: Pick<Application, "uncertainFields">,
): string[] {
  const value = application.uncertainFields;
  if (!Array.isArray(value)) return [];
  return value.filter((field): field is string => typeof field === "string");
}
