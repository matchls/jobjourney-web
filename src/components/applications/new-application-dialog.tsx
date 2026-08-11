"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateApplication } from "@/hooks/use-create-application";
import type { CreateApplicationInput } from "@/hooks/use-create-application";
import { useCreateInterviewStep } from "@/hooks/use-create-interview-step";
import { useParseOffer } from "@/hooks/use-parse-offer";
import { useAuth } from "@/lib/auth";
import {
  getStepOccurrenceTitle,
  normalizeDefaultInterviewSteps,
} from "@/lib/interview-steps";
import {
  EMPTY_OFFER_TEXT_MESSAGE,
  MAX_OFFER_TEXT_LENGTH,
  OFFER_TEXT_TOO_LONG_MESSAGE,
  buildPrefillSummary,
  mergeOfferPrefill,
  parseOfferErrorMessage,
  sanitizeOfferUrl,
} from "@/lib/job-offer-prefill";
import { AlertCircle, Plus, Sparkles } from "lucide-react";
import { ApplicationStatus } from "@/types";

const inputClass =
  "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function NewApplicationDialog({
  defaultStatus,
  trigger,
}: {
  defaultStatus?: ApplicationStatus;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const emptyForm: CreateApplicationInput & { appliedAt: string } = {
    company: "",
    position: "",
    source: "",
    offerUrl: "",
    status: defaultStatus ?? "TARGETED",
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
  const [form, setForm] = useState(emptyForm);

  // AI import panel. The pasted offer lives here and nowhere else: it is never
  // written to localStorage/sessionStorage, never logged and never sent
  // anywhere but POST /applications/parse-offer.
  const [showImport, setShowImport] = useState(false);
  const [offerText, setOfferText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Synchronous in-flight lock. `isParsing` only flips on the next render, so
  // two clicks landing in the same tick would both pass a state-based guard.
  const parsingRef = useRef(false);
  // Generation of the current modal session. Closing the dialog bumps it, so
  // an extraction started before the close can be recognised as stale when it
  // finally answers — and dropped instead of repopulating a reset form.
  const sessionRef = useRef(0);
  const offerTextRef = useRef<HTMLTextAreaElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  // Latest committed form values, so a merge started before the user edited a
  // field still reads what is on screen when the extraction comes back.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  });

  const { user } = useAuth();
  const { mutateAsync: createApplication, isPending, error } =
    useCreateApplication();
  const { mutateAsync: createInterviewStep } = useCreateInterviewStep();
  const {
    mutateAsync: parseOffer,
    isPending: isParsing,
    reset: resetParseOfferState,
  } = useParseOffer();

  const resetImport = () => {
    // Ends the current extraction session: a request still in flight now
    // belongs to the past and must not touch the UI when it answers. The
    // mutation state is reset too, otherwise an orphan request would keep the
    // button stuck on "Analyse en cours..." for the next session.
    sessionRef.current += 1;
    parsingRef.current = false;
    resetParseOfferState();
    setShowImport(false);
    setOfferText("");
    setImportError(null);
    setImportNotice(null);
  };

  // Opening the panel focuses the textarea; the offer text is deliberately
  // kept when it is collapsed, so the user can come back to it.
  useEffect(() => {
    if (showImport) offerTextRef.current?.focus();
  }, [showImport]);

  const handleParseOffer = async () => {
    // Guard on top of the disabled button: a second click that slips through
    // (keyboard repeat, race on re-render) must not fire a second request.
    if (parsingRef.current || isParsing) return;

    setImportError(null);
    setImportNotice(null);

    const trimmed = offerText.trim();
    if (trimmed === "") {
      setImportError(EMPTY_OFFER_TEXT_MESSAGE);
      offerTextRef.current?.focus();
      return;
    }
    if (trimmed.length > MAX_OFFER_TEXT_LENGTH) {
      setImportError(OFFER_TEXT_TOO_LONG_MESSAGE);
      offerTextRef.current?.focus();
      return;
    }

    parsingRef.current = true;
    // Captured before the await: everything below only applies if the modal is
    // still on the same session when the answer comes back.
    const requestSession = sessionRef.current;

    try {
      const result = await parseOffer({
        offerText: trimmed,
        // Context already known by the form, when it is usable as-is.
        offerUrl: sanitizeOfferUrl(formRef.current.offerUrl),
        sourceHint: formRef.current.source?.trim() || undefined,
      });

      // The dialog was closed (or reset) while the extraction was running:
      // this answer belongs to a session that no longer exists. Dropping it
      // here also means no focus is moved after the modal is gone.
      if (requestSession !== sessionRef.current) return;

      // Extraction metadata (confidenceByField, uncertainFields, warnings) is
      // intentionally not read here: issue #24 owns its display. Only `fields`
      // is used, and only to fill fields the user left empty.
      const fields = result?.fields;
      const outcome = mergeOfferPrefill(formRef.current, fields);
      setForm((current) => mergeOfferPrefill(current, fields).values);

      setImportNotice(buildPrefillSummary(outcome));
      setShowImport(false);
      companyRef.current?.focus();
    } catch (parseError) {
      // A late failure from a closed session is silent too: there is nobody
      // left to warn, and the next session must open on a clean modal.
      if (requestSession !== sessionRef.current) return;

      // Neither the pasted text nor the already filled fields are cleared:
      // the user can retry or simply carry on manually.
      setImportError(parseOfferErrorMessage(parseError));
      offerTextRef.current?.focus();
    } finally {
      // A stale request must not unlock the session that replaced it.
      if (requestSession === sessionRef.current) parsingRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const application = await createApplication({
        company: form.company,
        position: form.position,
        source: form.source || undefined,
        offerUrl: form.offerUrl || undefined,
        status: form.status,
        appliedAt: form.appliedAt
          ? new Date(form.appliedAt).toISOString()
          : undefined,
        location: form.location || undefined,
        contractType: form.contractType || undefined,
        salary: form.salary || undefined,
        jobDescription: form.jobDescription || undefined,
        notes: form.notes || undefined,
        contactName: form.contactName || undefined,
        contactRole: form.contactRole || undefined,
        contactEmail: form.contactEmail || undefined,
        referralNote: form.referralNote || undefined,
      });

      // Applique le processus d'entretien par défaut configuré dans les
      // paramètres. Best-effort : si une étape échoue à se créer, la
      // candidature (déjà créée) reste valable, on ne bloque pas l'utilisateur.
      const defaultSteps = normalizeDefaultInterviewSteps(
        user?.defaultInterviewSteps,
      );
      await Promise.allSettled(
        defaultSteps.map((type, index) =>
          createInterviewStep({
            applicationId: application.id,
            title: getStepOccurrenceTitle(defaultSteps, index),
            type,
            order: index,
          }),
        ),
      );

      // Programmatically closing the dialog doesn't trigger Radix's
      // onOpenChange, so the form reset below (which normally runs on
      // close) has to happen here too — otherwise reopening the dialog
      // shows the previous submission's values instead of a blank form.
      setOpen(false);
      setForm({ ...emptyForm, status: defaultStatus ?? "TARGETED" });
      resetImport();
    } catch {
      // L'erreur de création de candidature est déjà exposée via `error`
      // (état de la mutation) — on n'y touche pas ici.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setForm({ ...emptyForm, status: defaultStatus ?? "TARGETED" });
          resetImport();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus size={16} className="mr-2" />
            Nouvelle candidature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle candidature</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            aria-expanded={showImport}
            aria-controls="ai-offer-import-panel"
            onClick={() => {
              setImportError(null);
              setShowImport((visible) => !visible);
            }}
          >
            <Sparkles size={16} className="mr-2" />
            {/* Disclosure pattern: the label stays stable so the action is
                always recognisable, aria-expanded carries the open state. */}
            Importer une offre avec l&apos;IA
          </Button>

          {showImport && (
            <div
              id="ai-offer-import-panel"
              className="space-y-2 rounded-md border border-border p-3"
            >
              <label
                htmlFor="offer-text"
                className="text-sm font-medium block"
              >
                Texte de l&apos;offre
              </label>
              <textarea
                id="offer-text"
                ref={offerTextRef}
                className={inputClass}
                rows={6}
                aria-describedby="offer-text-hint"
                placeholder="Collez ici le texte complet de l'annonce..."
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
              />
              <p id="offer-text-hint" className="text-xs text-muted-foreground">
                Ce texte est analysé par un service d&apos;IA pour préremplir le
                formulaire. Aucune candidature n&apos;est créée à cette étape :
                vous gardez la main sur tous les champs. Le lien et la source
                déjà saisis dans le formulaire sont transmis comme contexte.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleParseOffer}
                disabled={isParsing}
                aria-busy={isParsing}
              >
                {isParsing ? "Analyse en cours..." : "Traiter l'offre"}
              </Button>
            </div>
          )}

          {/* Loading and success are announced politely; the wording carries
              the meaning, colour is never the only signal. */}
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {isParsing ? "Analyse de l'offre en cours..." : (importNotice ?? "")}
          </p>
          {importError && (
            <p
              role="alert"
              className="text-xs text-destructive flex items-start gap-1.5"
            >
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {importError}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label htmlFor="application-company" className="text-sm font-medium">
              Entreprise *
            </label>
            <input
              id="application-company"
              ref={companyRef}
              className={inputClass}
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="application-position"
              className="text-sm font-medium"
            >
              Poste *
            </label>
            <input
              id="application-position"
              className={inputClass}
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="application-source" className="text-sm font-medium">
              Source <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="application-source"
              className={inputClass}
              placeholder="LinkedIn, Welcome to the Jungle..."
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="application-offer-url"
              className="text-sm font-medium"
            >
              Lien offre{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="application-offer-url"
              className={inputClass}
              type="url"
              value={form.offerUrl}
              onChange={(e) => setForm({ ...form, offerUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="application-applied-at"
              className="text-sm font-medium"
            >
              Date de candidature{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="application-applied-at"
              className={inputClass}
              type="date"
              value={form.appliedAt}
              onChange={(e) => setForm({ ...form, appliedAt: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="application-location"
                className="text-sm font-medium"
              >
                Localisation{" "}
                <span className="text-muted-foreground">(optionnel)</span>
              </label>
              <input
                id="application-location"
                className={inputClass}
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="application-salary"
                className="text-sm font-medium"
              >
                Rémunération{" "}
                <span className="text-muted-foreground">(optionnel)</span>
              </label>
              <input
                id="application-salary"
                className={inputClass}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="application-contract-type"
              className="text-sm font-medium"
            >
              Type de contrat{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="application-contract-type"
              className={inputClass}
              value={form.contractType}
              onChange={(e) =>
                setForm({ ...form, contractType: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="application-job-description"
              className="text-sm font-medium"
            >
              Description du poste{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <textarea
              id="application-job-description"
              className={inputClass}
              rows={3}
              value={form.jobDescription}
              onChange={(e) =>
                setForm({ ...form, jobDescription: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="application-contact-name"
                className="text-sm font-medium"
              >
                Nom du contact{" "}
                <span className="text-muted-foreground">(optionnel)</span>
              </label>
              <input
                id="application-contact-name"
                className={inputClass}
                value={form.contactName}
                onChange={(e) =>
                  setForm({ ...form, contactName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="application-contact-role"
                className="text-sm font-medium"
              >
                Rôle du contact{" "}
                <span className="text-muted-foreground">(optionnel)</span>
              </label>
              <input
                id="application-contact-role"
                className={inputClass}
                value={form.contactRole}
                onChange={(e) =>
                  setForm({ ...form, contactRole: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="application-contact-email"
              className="text-sm font-medium"
            >
              Email du contact{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="application-contact-email"
              className={inputClass}
              type="email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({ ...form, contactEmail: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="application-notes" className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <textarea
              id="application-notes"
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="application-referral-note"
              className="text-sm font-medium"
            >
              Note de recommandation{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <textarea
              id="application-referral-note"
              className={inputClass}
              rows={2}
              value={form.referralNote}
              onChange={(e) =>
                setForm({ ...form, referralNote: e.target.value })
              }
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer la candidature"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
