import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewApplicationDialog } from "@/components/applications/new-application-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const API_URL = "http://localhost:4000";
const PARSE_OFFER_URL = `${API_URL}/applications/parse-offer`;
const APPLICATIONS_URL = `${API_URL}/applications`;

const OFFER_TEXT = "Nous recherchons un développeur React à Paris. CDI.";

type FetchCall = [string, RequestInit | undefined];

// The whole API is faked at the fetch level: no request ever leaves the test,
// and the assertions can check the exact URL, method and body of each call.
let fetchMock: ReturnType<typeof vi.fn>;
let parseOfferHandler: () => Promise<Response>;
let createApplicationHandler: () => Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

type ExtractionMeta = {
  uncertainFields?: unknown;
  warnings?: unknown;
  confidenceByField?: unknown;
};

function extractionResponse(
  fields: Record<string, unknown>,
  meta: ExtractionMeta = {},
) {
  return jsonResponse({
    fields,
    confidenceByField: meta.confidenceByField ?? { company: 0.9 },
    uncertainFields: meta.uncertainFields ?? ["salary"],
    warnings: meta.warnings ?? ["Salaire exprimé en fourchette"],
  });
}

const WARNINGS_PANEL = /Points signalés par l'analyse/;

// A flagged field carries "À vérifier" inside its own label, so the marker is
// part of the accessible name announced with the field.
function expectFlagged(label: RegExp) {
  expect(field(label)).toHaveAccessibleName(/À vérifier/);
}

function expectNotFlagged(label: RegExp) {
  expect(field(label)).not.toHaveAccessibleName(/À vérifier/);
}

function callsTo(path: string, method = "POST"): FetchCall[] {
  return (fetchMock.mock.calls as FetchCall[]).filter(
    ([url, init]) => url === path && (init?.method ?? "GET") === method,
  );
}

function bodyOf(call: FetchCall): Record<string, unknown> {
  return JSON.parse(String(call[1]?.body));
}

beforeEach(() => {
  parseOfferHandler = async () => extractionResponse({});
  createApplicationHandler = async () => jsonResponse({ id: "app-1" });

  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === PARSE_OFFER_URL) return parseOfferHandler();
    if (url === `${API_URL}/auth/me`) {
      return jsonResponse({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        avatarUrl: null,
        defaultInterviewSteps: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    }
    if (url === APPLICATIONS_URL && init?.method === "POST") {
      return createApplicationHandler();
    }
    return jsonResponse({ id: "step-1" });
  });

  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <NewApplicationDialog />
      </QueryClientProvider>,
    ),
  };
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Nouvelle candidature/ }));
  return screen.findByRole("dialog");
}

async function openImportPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: /Importer une offre avec l'IA/ }),
  );
  return screen.getByLabelText(/Texte de l'offre/);
}

const importButton = () =>
  screen.getByRole("button", { name: /Importer une offre avec l'IA/ });
const processButton = () =>
  screen.getByRole("button", { name: /Traiter l'offre/ });
const submitButton = () =>
  screen.getByRole("button", { name: /Créer la candidature/ });
const field = (label: RegExp | string) =>
  screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement;

describe("NewApplicationDialog — manual flow", () => {
  it("still creates an application without ever touching the AI import", async () => {
    const { user } = renderDialog();
    await openDialog(user);

    await user.type(field("Entreprise *"), "ACME");
    await user.type(field("Poste *"), "Développeur React");
    await user.type(field(/^Localisation/), "Paris");
    await user.click(submitButton());

    await waitFor(() => expect(callsTo(APPLICATIONS_URL)).toHaveLength(1));

    expect(bodyOf(callsTo(APPLICATIONS_URL)[0])).toMatchObject({
      company: "ACME",
      position: "Développeur React",
      location: "Paris",
      status: "TARGETED",
    });
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
  });

  it("shows the AI import as a secondary action, collapsed by default", async () => {
    const { user } = renderDialog();
    await openDialog(user);

    expect(importButton()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText(/Texte de l'offre/)).not.toBeInTheDocument();

    const textarea = await openImportPanel(user);

    expect(importButton()).toHaveAttribute("aria-expanded", "true");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveFocus();
    expect(screen.getByText(/analysé par un service d'IA/)).toBeInTheDocument();
  });

  it("keeps the pasted offer and the typed fields when the panel is collapsed", async () => {
    const { user } = renderDialog();
    await openDialog(user);

    await user.type(field("Entreprise *"), "ACME");
    const textarea = await openImportPanel(user);
    await user.type(textarea, OFFER_TEXT);

    await user.click(importButton());
    expect(screen.queryByLabelText(/Texte de l'offre/)).not.toBeInTheDocument();
    expect(field("Entreprise *")).toHaveValue("ACME");

    await user.click(importButton());
    expect(screen.getByLabelText(/Texte de l'offre/)).toHaveValue(OFFER_TEXT);
  });
});

describe("NewApplicationDialog — offer extraction", () => {
  it("rejects an empty offer before any network call", async () => {
    const { user } = renderDialog();
    await openDialog(user);
    const textarea = await openImportPanel(user);

    await user.type(textarea, "   ");
    await user.click(processButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Collez le texte de l'offre/,
    );
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
    expect(textarea).toHaveFocus();
  });

  it("announces the loading state and disables the button while parsing", async () => {
    let release!: (value: Response) => void;
    parseOfferHandler = () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    const button = screen.getByRole("button", { name: /Analyse en cours/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      /Analyse de l'offre en cours/,
    );

    release(extractionResponse({ company: "ACME" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/Analyse terminée/),
    );
  });

  it("never fires a second request while one is in flight", async () => {
    let release!: (value: Response) => void;
    parseOfferHandler = () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);

    const button = processButton();
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1));

    release(extractionResponse({ company: "ACME" }));
    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1);
  });

  it("calls POST /applications/parse-offer with the offer and its context", async () => {
    const { user } = renderDialog();
    await openDialog(user);

    await user.type(field(/^Lien offre/), "https://jobs.example.com/42");
    await user.type(field(/^Source/), "LinkedIn");
    await user.type(await openImportPanel(user), `  ${OFFER_TEXT}  `);
    await user.click(processButton());

    await waitFor(() => expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1));

    const [url, init] = callsTo(PARSE_OFFER_URL)[0];
    expect(url).toBe(PARSE_OFFER_URL);
    expect(init?.credentials).toBe("include");
    expect(bodyOf(callsTo(PARSE_OFFER_URL)[0])).toEqual({
      offerText: OFFER_TEXT,
      offerUrl: "https://jobs.example.com/42",
      sourceHint: "LinkedIn",
    });
  });

  it("drops an unusable offer url instead of failing the whole extraction", async () => {
    const { user } = renderDialog();
    await openDialog(user);

    await user.type(field(/^Lien offre/), "pas-une-url");
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1));
    expect(bodyOf(callsTo(PARSE_OFFER_URL)[0])).toEqual({
      offerText: OFFER_TEXT,
    });
  });

  it("prefills every mapped field from a complete result", async () => {
    parseOfferHandler = async () =>
      extractionResponse({
        company: "ACME",
        position: "Développeur React",
        source: "Welcome to the Jungle",
        offerUrl: "https://jobs.example.com/42",
        location: "Paris",
        contractType: "CDI",
        salary: "45-55k€",
        jobDescription: "Développement d'une application React.",
        notes: "Télétravail 2 jours",
        contactName: "Camille Martin",
        contactRole: "Talent Manager",
        contactEmail: "camille@example.com",
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));

    expect(field("Poste *")).toHaveValue("Développeur React");
    expect(field(/^Source/)).toHaveValue("Welcome to the Jungle");
    expect(field(/^Lien offre/)).toHaveValue("https://jobs.example.com/42");
    expect(field(/^Localisation/)).toHaveValue("Paris");
    expect(field(/^Type de contrat/)).toHaveValue("CDI");
    expect(field(/^Rémunération/)).toHaveValue("45-55k€");
    expect(field(/^Description du poste/)).toHaveValue(
      "Développement d'une application React.",
    );
    expect(field(/^Notes/)).toHaveValue("Télétravail 2 jours");
    expect(field(/^Nom du contact/)).toHaveValue("Camille Martin");
    expect(field(/^Rôle du contact/)).toHaveValue("Talent Manager");
    expect(field(/^Email du contact/)).toHaveValue("camille@example.com");

    // Back on the standard form, focus on its first field.
    expect(screen.queryByLabelText(/Texte de l'offre/)).not.toBeInTheDocument();
    expect(field("Entreprise *")).toHaveFocus();
  });

  it("leaves the other fields untouched on a partial result", async () => {
    parseOfferHandler = async () =>
      extractionResponse({ company: "ACME", location: "Paris" });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(field(/^Rémunération/), "50k");
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));

    expect(field(/^Localisation/)).toHaveValue("Paris");
    expect(field(/^Rémunération/)).toHaveValue("50k");
    expect(field("Poste *")).toHaveValue("");
    expect(field(/^Description du poste/)).toHaveValue("");
  });

  it("keeps a value typed by the user and says so", async () => {
    parseOfferHandler = async () =>
      extractionResponse({ company: "Entreprise IA", position: "Poste IA" });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(field("Entreprise *"), "ACME");
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/Analyse terminée/),
    );

    expect(field("Entreprise *")).toHaveValue("ACME");
    expect(field("Poste *")).toHaveValue("Poste IA");
    expect(screen.getByRole("status")).toHaveTextContent(
      /Vos saisies ont été conservées pour : Entreprise/,
    );
  });

  it("never prefills the fields owned by the user", async () => {
    parseOfferHandler = async () =>
      extractionResponse({
        company: "ACME",
        position: "Développeur",
        status: "APPLIED",
        appliedAt: "2026-02-01T00:00:00.000Z",
        resumeText: "CV généré",
        coverLetterText: "Lettre générée",
        referralNote: "Recommandé par X",
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));

    expect(field(/^Date de candidature/)).toHaveValue("");
    expect(field(/^Note de recommandation/)).toHaveValue("");

    await user.click(submitButton());
    await waitFor(() => expect(callsTo(APPLICATIONS_URL)).toHaveLength(1));

    const payload = bodyOf(callsTo(APPLICATIONS_URL)[0]);
    expect(payload.status).toBe("TARGETED");
    expect(payload.appliedAt).toBeUndefined();
    expect(payload.referralNote).toBeUndefined();
    expect(payload.resumeText).toBeUndefined();
    expect(payload.coverLetterText).toBeUndefined();
  });

  it("keeps the pasted text and the filled fields when the API fails", async () => {
    parseOfferHandler = async () =>
      jsonResponse(
        { error: { code: "extraction_unavailable" } },
        502,
      );

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(field("Entreprise *"), "ACME");
    const textarea = await openImportPanel(user);
    await user.type(textarea, OFFER_TEXT);
    await user.click(processButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/temporairement indisponible/);
    expect(alert).toHaveTextContent(/continuer manuellement/);

    expect(screen.getByLabelText(/Texte de l'offre/)).toHaveValue(OFFER_TEXT);
    expect(field("Entreprise *")).toHaveValue("ACME");
    expect(screen.getByLabelText(/Texte de l'offre/)).toHaveFocus();

    // The manual path stays available right away.
    await user.type(field("Poste *"), "Développeur");
    await user.click(submitButton());
    await waitFor(() => expect(callsTo(APPLICATIONS_URL)).toHaveLength(1));
  });

  it("creates nothing while processing the offer", async () => {
    parseOfferHandler = async () =>
      extractionResponse({ company: "ACME", position: "Développeur" });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));

    expect(callsTo(APPLICATIONS_URL)).toHaveLength(0);
    expect(
      (fetchMock.mock.calls as FetchCall[]).filter(
        ([, init]) => (init?.method ?? "GET") !== "GET",
      ),
    ).toHaveLength(1);
  });

  it("creates the application with the values corrected by the user", async () => {
    parseOfferHandler = async () =>
      extractionResponse({
        company: "ACME",
        position: "Développeur",
        location: "Paris",
        salary: "45k",
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));

    await user.clear(field(/^Rémunération/));
    await user.type(field(/^Rémunération/), "52k");
    await user.clear(field("Poste *"));
    await user.type(field("Poste *"), "Développeuse React");
    await user.click(submitButton());

    await waitFor(() => expect(callsTo(APPLICATIONS_URL)).toHaveLength(1));

    const payload = bodyOf(callsTo(APPLICATIONS_URL)[0]);
    expect(payload).toMatchObject({
      company: "ACME",
      position: "Développeuse React",
      location: "Paris",
      salary: "52k",
    });
    // Extraction metadata describes the extraction, not the application.
    expect(payload).not.toHaveProperty("confidenceByField");
    expect(payload).not.toHaveProperty("uncertainFields");
    expect(payload).not.toHaveProperty("warnings");
    expect(payload).not.toHaveProperty("offerText");
    expect(JSON.stringify(payload)).not.toContain(OFFER_TEXT);
  });
});

describe("NewApplicationDialog — extraction outliving the modal", () => {
  // Starts an extraction that stays pending, then closes the dialog. Returns
  // the deferred resolver so each test decides how that late answer lands.
  async function startExtractionThenCloseDialog() {
    let release!: (value: Response) => void;
    parseOfferHandler = () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(field("Entreprise *"), "ACME");
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1));

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    return { user, release };
  }

  async function expectCleanReopenedDialog(
    user: ReturnType<typeof userEvent.setup>,
  ) {
    await openDialog(user);

    expect(field("Entreprise *")).toHaveValue("");
    expect(field("Poste *")).toHaveValue("");
    expect(field(/^Localisation/)).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");

    // No review metadata survives from the previous session.
    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();
    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();

    // The import panel reopens empty and immediately usable.
    expect(importButton()).toHaveAttribute("aria-expanded", "false");
    const textarea = await openImportPanel(user);
    expect(textarea).toHaveValue("");
    expect(processButton()).toBeEnabled();
  }

  it("ignores a result that arrives after the dialog was closed", async () => {
    const { user, release } = await startExtractionThenCloseDialog();

    await act(async () => {
      release(
        extractionResponse({
          company: "Entreprise IA",
          position: "Poste IA",
          location: "Lyon",
        }),
      );
    });

    await expectCleanReopenedDialog(user);
  });

  it("ignores a failure that arrives after the dialog was closed", async () => {
    const { user, release } = await startExtractionThenCloseDialog();

    await act(async () => {
      release(jsonResponse({ error: { code: "extraction_unavailable" } }, 502));
    });

    await expectCleanReopenedDialog(user);
  });

  it("still applies a result when the dialog stays open", async () => {
    let release!: (value: Response) => void;
    parseOfferHandler = () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await act(async () => {
      release(extractionResponse({ company: "ACME", location: "Paris" }));
    });

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));
    expect(field(/^Localisation/)).toHaveValue("Paris");
    expect(screen.getByRole("status")).toHaveTextContent(/Analyse terminée/);
  });
});

describe("NewApplicationDialog — reviewing the extracted fields", () => {
  // Runs a complete extraction and returns once the form has been prefilled.
  async function runExtraction(
    fields: Record<string, unknown>,
    meta: ExtractionMeta = {},
  ) {
    parseOfferHandler = async () => extractionResponse(fields, meta);

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/Analyse terminée/),
    );

    return { user };
  }

  it("marks only the fields listed in uncertainFields", async () => {
    await runExtraction(
      { company: "ACME", position: "Développeur", salary: "45-55k€" },
      { uncertainFields: ["salary"] },
    );

    expectFlagged(/^Rémunération/);
    expectNotFlagged(/^Entreprise/);
    expectNotFlagged(/^Poste/);
    expect(screen.getAllByText("À vérifier")).toHaveLength(1);
  });

  it("marks several fields at once", async () => {
    await runExtraction(
      { company: "ACME", contractType: "CDI", salary: "45k" },
      { uncertainFields: ["company", "contractType", "salary"] },
    );

    expectFlagged(/^Entreprise/);
    expectFlagged(/^Type de contrat/);
    expectFlagged(/^Rémunération/);
    expectNotFlagged(/^Poste/);
  });

  it("marks nothing when the extraction is confident", async () => {
    await runExtraction(
      { company: "ACME", position: "Développeur" },
      { uncertainFields: [], warnings: [] },
    );

    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();
    expect(field(/^Entreprise/)).toHaveValue("ACME");
  });

  it("ignores a flagged name that matches no displayed field", async () => {
    await runExtraction(
      { company: "ACME" },
      { uncertainFields: ["status", "resumeText", "unknownField", "company"] },
    );

    expectFlagged(/^Entreprise/);
    expect(screen.getAllByText("À vérifier")).toHaveLength(1);
    expect(field(/^Date de candidature/)).toHaveValue("");
  });

  it("groups the warnings in a non-blocking panel", async () => {
    await runExtraction(
      { company: "ACME" },
      {
        warnings: [
          "Salaire exprimé en fourchette",
          "Entreprise possiblement un cabinet de recrutement",
        ],
      },
    );

    expect(screen.getByText(WARNINGS_PANEL)).toBeInTheDocument();
    expect(
      screen.getByText("Salaire exprimé en fourchette"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Entreprise possiblement un cabinet de recrutement"),
    ).toBeInTheDocument();
    // Informative, not a system error.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows no panel when there is no warning", async () => {
    await runExtraction({ company: "ACME" }, { warnings: [] });

    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();
  });

  it("clears only the edited field's marker, without calling the API again", async () => {
    const { user } = await runExtraction(
      { company: "ACME", contractType: "CDI", salary: "45k" },
      { uncertainFields: ["company", "contractType", "salary"] },
    );

    await user.type(field(/^Rémunération/), " brut");

    expectNotFlagged(/^Rémunération/);
    expect(field(/^Rémunération/)).toHaveValue("45k brut");
    // The other flagged fields are untouched.
    expectFlagged(/^Entreprise/);
    expectFlagged(/^Type de contrat/);
    // Reviewing is a local decision: no second extraction is triggered.
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1);
  });

  it("keeps the marker on a field the extraction filled but nobody touched", async () => {
    const { user } = await runExtraction(
      { company: "ACME", salary: "45k" },
      { uncertainFields: ["company", "salary"] },
    );

    await user.type(field(/^Poste/), "Développeur");

    expectFlagged(/^Entreprise/);
    expectFlagged(/^Rémunération/);
  });

  it("creates the application while a field is still flagged", async () => {
    const { user } = await runExtraction(
      { company: "ACME", position: "Développeur", salary: "45k" },
      { uncertainFields: ["salary"] },
    );

    expectFlagged(/^Rémunération/);
    expect(submitButton()).toBeEnabled();

    await user.click(submitButton());
    await waitFor(() => expect(callsTo(APPLICATIONS_URL)).toHaveLength(1));

    const payload = bodyOf(callsTo(APPLICATIONS_URL)[0]);
    expect(payload).toMatchObject({ company: "ACME", salary: "45k" });
    expect(payload).not.toHaveProperty("uncertainFields");
    expect(payload).not.toHaveProperty("warnings");
    expect(payload).not.toHaveProperty("confidenceByField");
  });

  it("replaces the previous review metadata on a second extraction", async () => {
    const { user } = await runExtraction(
      { company: "ACME" },
      { uncertainFields: ["company"], warnings: ["Premier avertissement"] },
    );

    expectFlagged(/^Entreprise/);

    parseOfferHandler = async () =>
      extractionResponse(
        { position: "Développeur" },
        { uncertainFields: ["position"], warnings: [] },
      );

    await user.click(importButton());
    await user.click(processButton());

    await waitFor(() => expect(field(/^Poste/)).toHaveValue("Développeur"));

    expectFlagged(/^Poste/);
    expectNotFlagged(/^Entreprise/);
    expect(screen.queryByText("Premier avertissement")).not.toBeInTheDocument();
  });

  it("drops every marker and warning when the dialog is closed and reopened", async () => {
    const { user } = await runExtraction(
      { company: "ACME", salary: "45k" },
      { uncertainFields: ["company", "salary"] },
    );

    expectFlagged(/^Entreprise/);
    expect(screen.getByText(WARNINGS_PANEL)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await openDialog(user);

    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();
    expect(field(/^Entreprise/)).toHaveValue("");
  });

  it("shows no ghost marker when a late result lands after the dialog closed", async () => {
    let release!: (value: Response) => void;
    parseOfferHandler = () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());
    await waitFor(() => expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1));

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await act(async () => {
      release(
        extractionResponse(
          { company: "Entreprise IA" },
          {
            uncertainFields: ["company", "salary"],
            warnings: ["Avertissement fantôme"],
          },
        ),
      );
    });

    await openDialog(user);

    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();
    expect(screen.queryByText("Avertissement fantôme")).not.toBeInTheDocument();
    expect(field(/^Entreprise/)).toHaveValue("");
  });

  it("shows no marker at all on the purely manual flow", async () => {
    const { user } = renderDialog();
    await openDialog(user);

    await user.type(field("Entreprise *"), "ACME");
    await user.type(field("Poste *"), "Développeur");

    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();

    await user.click(submitButton());
    await waitFor(() => expect(callsTo(APPLICATIONS_URL)).toHaveLength(1));
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
  });
});

describe("NewApplicationDialog — pasting only the offer link", () => {
  const LINKEDIN_URL = "https://www.linkedin.com/jobs/view/4451103812/";

  // Pastes `text` in the import panel and clicks "Traiter l'offre".
  async function importPastedText(text: string) {
    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), text);
    await user.click(processButton());
    return { user };
  }

  it("fills the link and its source without calling the extraction", async () => {
    await importPastedText(LINKEDIN_URL);

    await waitFor(() => expect(field(/^Lien offre/)).toHaveValue(LINKEDIN_URL));

    expect(field(/^Source/)).toHaveValue("LinkedIn");
    // The whole point: a link carries nothing an AI could read, so no request
    // is made at all.
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);

    // Back on the standard form, ready for the fields only a human can give.
    expect(screen.queryByLabelText(/Texte de l'offre/)).not.toBeInTheDocument();
    expect(field("Entreprise *")).toHaveFocus();

    // Nothing was interpreted, so nothing is flagged as uncertain.
    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("never tells the user nothing could be prefilled", async () => {
    await importPastedText(LINKEDIN_URL);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /Lien de l'offre reconnu/,
      ),
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/2 champs préremplis/);
    expect(status).not.toHaveTextContent(/aucun champ/);
    expect(status).toHaveTextContent(/Collez le texte complet de l'annonce/);
  });

  it("maps Welcome to the Jungle from its own domain", async () => {
    await importPastedText(
      "https://www.welcometothejungle.com/fr/companies/acme/jobs/dev-react",
    );

    await waitFor(() =>
      expect(field(/^Source/)).toHaveValue("Welcome to the Jungle"),
    );
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
  });

  it("maps Indeed across its country extensions", async () => {
    await importPastedText("https://fr.indeed.com/viewjob?jk=abc123");

    await waitFor(() => expect(field(/^Source/)).toHaveValue("Indeed"));
    expect(field(/^Lien offre/)).toHaveValue(
      "https://fr.indeed.com/viewjob?jk=abc123",
    );
  });

  it("fills the link only for an unknown domain, and says so", async () => {
    await importPastedText("https://careers.acme.example/offre/42");

    await waitFor(() =>
      expect(field(/^Lien offre/)).toHaveValue(
        "https://careers.acme.example/offre/42",
      ),
    );

    expect(field(/^Source/)).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(
      /La source n'a pas pu être déduite/,
    );
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
  });

  it("refuses a lookalike domain instead of naming the wrong board", async () => {
    await importPastedText("https://evil-linkedin.com/jobs/view/1");

    await waitFor(() =>
      expect(field(/^Lien offre/)).toHaveValue(
        "https://evil-linkedin.com/jobs/view/1",
      ),
    );

    expect(field(/^Source/)).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(
      /La source n'a pas pu être déduite/,
    );
  });

  it("keeps the link and the source the user typed", async () => {
    const { user } = renderDialog();
    await openDialog(user);

    await user.type(field(/^Lien offre/), "https://jobs.example.com/42");
    await user.type(field(/^Source/), "Cooptation");
    await user.type(await openImportPanel(user), LINKEDIN_URL);
    await user.click(processButton());

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /Lien de l'offre reconnu/,
      ),
    );

    expect(field(/^Lien offre/)).toHaveValue("https://jobs.example.com/42");
    expect(field(/^Source/)).toHaveValue("Cooptation");
    expect(screen.getByRole("status")).toHaveTextContent(
      /Vos saisies ont été conservées pour : Source, Lien de l'offre/,
    );
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
  });

  it("creates the application from the deduced values", async () => {
    const { user } = await importPastedText(LINKEDIN_URL);

    await waitFor(() => expect(field(/^Source/)).toHaveValue("LinkedIn"));

    await user.type(field("Entreprise *"), "ACME");
    await user.type(field("Poste *"), "Développeur React");
    await user.click(submitButton());

    await waitFor(() => expect(callsTo(APPLICATIONS_URL)).toHaveLength(1));

    expect(bodyOf(callsTo(APPLICATIONS_URL)[0])).toMatchObject({
      company: "ACME",
      position: "Développeur React",
      source: "LinkedIn",
      offerUrl: LINKEDIN_URL,
    });
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
  });

  it("still runs the AI workflow when the link comes with some text", async () => {
    parseOfferHandler = async () =>
      extractionResponse({ company: "ACME", position: "Développeur" });

    await importPastedText(`Développeur React chez ACME. ${LINKEDIN_URL}`);

    await waitFor(() => expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1));
    expect(bodyOf(callsTo(PARSE_OFFER_URL)[0])).toMatchObject({
      offerText: `Développeur React chez ACME. ${LINKEDIN_URL}`,
    });
    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));
  });

  it("leaves the full-text AI workflow untouched", async () => {
    parseOfferHandler = async () =>
      extractionResponse({ company: "ACME", location: "Paris" });

    await importPastedText(OFFER_TEXT);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/Analyse terminée/),
    );
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1);
    expect(field("Entreprise *")).toHaveValue("ACME");
    expect(field(/^Localisation/)).toHaveValue("Paris");
  });

  it("still refuses an empty paste before doing anything", async () => {
    await importPastedText("   ");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Collez le texte de l'offre/,
    );
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("clears the markers left by a previous extraction", async () => {
    parseOfferHandler = async () =>
      extractionResponse(
        { salary: "45k" },
        { uncertainFields: ["salary"], warnings: ["Salaire en fourchette"] },
      );

    const { user } = await importPastedText(OFFER_TEXT);
    await waitFor(() => expect(field(/^Rémunération/)).toHaveValue("45k"));
    expectFlagged(/^Rémunération/);

    // The panel deliberately keeps the previous paste, so the offer text has
    // to be replaced by the bare link for the second run.
    await user.click(importButton());
    const textarea = screen.getByLabelText(/Texte de l'offre/);
    await user.clear(textarea);
    await user.type(textarea, LINKEDIN_URL);
    await user.click(processButton());

    await waitFor(() => expect(field(/^Source/)).toHaveValue("LinkedIn"));

    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
    expect(screen.queryByText(WARNINGS_PANEL)).not.toBeInTheDocument();
    expect(screen.queryByText("Salaire en fourchette")).not.toBeInTheDocument();
    expect(callsTo(PARSE_OFFER_URL)).toHaveLength(1);
  });

  it("keeps no residual state when the dialog is closed and reopened", async () => {
    const { user } = await importPastedText(LINKEDIN_URL);

    await waitFor(() => expect(field(/^Source/)).toHaveValue("LinkedIn"));

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await openDialog(user);

    expect(field(/^Lien offre/)).toHaveValue("");
    expect(field(/^Source/)).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const textarea = await openImportPanel(user);
    expect(textarea).toHaveValue("");
    expect(processButton()).toBeEnabled();
  });
});

describe("NewApplicationDialog — frontend privacy", () => {
  it("keeps the offer text in memory only and talks to no provider", async () => {
    parseOfferHandler = async () => extractionResponse({ company: "ACME" });

    const { user } = renderDialog();
    await openDialog(user);
    await user.type(await openImportPanel(user), OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));

    // Every request goes to our own API, never to an AI provider.
    for (const [url] of fetchMock.mock.calls as FetchCall[]) {
      expect(url.startsWith(API_URL)).toBe(true);
      expect(url).not.toMatch(/groq/i);
    }

    // No provider secret can reach the browser: nothing AI-related is exposed
    // through the public env, and no storage keeps the pasted offer.
    const publicEnv = JSON.stringify(
      Object.fromEntries(
        Object.entries(process.env).filter(([key]) =>
          key.startsWith("NEXT_PUBLIC_"),
        ),
      ),
    );
    expect(publicEnv).not.toMatch(/groq|api[_-]?key|sk-/i);

    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});

// --- Duplicate application (issue #34) --------------------------------------
//
// The API refuses a duplicate on POST /applications with 409 +
// { error: { code: "application_duplicate" } } (jobjourney-api#21). Only that
// exact pair gets the dedicated wording; every other failure keeps the
// message it already showed.

const DUPLICATE_MESSAGE =
  "Cette candidature existe déjà. Vérifie tes candidatures avant d’en créer une nouvelle.";

const duplicateResponse = () =>
  jsonResponse({ error: { code: "application_duplicate" } }, 409);

async function fillMinimalForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field("Entreprise *"), "ACME");
  await user.type(field("Poste *"), "Développeur React");
}

describe("NewApplicationDialog — duplicate application", () => {
  it("shows the dedicated message on a 409 application_duplicate", async () => {
    createApplicationHandler = async () => duplicateResponse();

    const { user } = renderDialog();
    await openDialog(user);
    await fillMinimalForm(user);
    await user.click(submitButton());

    expect(await screen.findByText(DUPLICATE_MESSAGE)).toBeInTheDocument();
  });

  it("keeps the dialog open and every typed field untouched", async () => {
    createApplicationHandler = async () => duplicateResponse();

    const { user } = renderDialog();
    await openDialog(user);

    await user.type(field("Entreprise *"), "ACME");
    await user.type(field("Poste *"), "Développeur React");
    await user.type(field(/^Localisation/), "Paris");
    await user.type(field(/^Rémunération/), "45k€");
    await user.type(field(/^Notes/), "Contact via Marie");
    await user.click(submitButton());

    await screen.findByText(DUPLICATE_MESSAGE);

    // The dialog must not close on this error...
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // ...and nothing the user typed may be lost, so they can correct and retry.
    expect(field("Entreprise *")).toHaveValue("ACME");
    expect(field("Poste *")).toHaveValue("Développeur React");
    expect(field(/^Localisation/)).toHaveValue("Paris");
    expect(field(/^Rémunération/)).toHaveValue("45k€");
    expect(field(/^Notes/)).toHaveValue("Contact via Marie");
  });

  it("lets the user edit and resubmit, and closes once the retry succeeds", async () => {
    createApplicationHandler = async () => duplicateResponse();

    const { user } = renderDialog();
    await openDialog(user);
    await fillMinimalForm(user);
    await user.click(submitButton());
    await screen.findByText(DUPLICATE_MESSAGE);

    // A corrected application is no longer a duplicate.
    createApplicationHandler = async () => jsonResponse({ id: "app-2" });
    await user.clear(field("Poste *"));
    await user.type(field("Poste *"), "Développeur Vue");
    await user.click(submitButton());

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(callsTo(APPLICATIONS_URL)).toHaveLength(2);
    expect(bodyOf(callsTo(APPLICATIONS_URL)[1])).toMatchObject({
      position: "Développeur Vue",
    });
  });

  it("keeps the existing wording for a non-duplicate error", async () => {
    createApplicationHandler = async () =>
      jsonResponse({ message: "Entreprise requise" }, 400);

    const { user } = renderDialog();
    await openDialog(user);
    await fillMinimalForm(user);
    await user.click(submitButton());

    expect(await screen.findByText("Entreprise requise")).toBeInTheDocument();
    expect(screen.queryByText(DUPLICATE_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps the existing wording for another 409 code", async () => {
    createApplicationHandler = async () =>
      jsonResponse({ error: { code: "idempotency_conflict" } }, 409);

    const { user } = renderDialog();
    await openDialog(user);
    await fillMinimalForm(user);
    await user.click(submitButton());

    // Falls back to the generic message the API client already produced —
    // the duplicate wording is reserved for the duplicate code alone.
    expect(await screen.findByText("Erreur API")).toBeInTheDocument();
    expect(screen.queryByText(DUPLICATE_MESSAGE)).not.toBeInTheDocument();
  });

  it("still closes and resets the form on a successful creation", async () => {
    const { user } = renderDialog();
    await openDialog(user);
    await fillMinimalForm(user);
    await user.click(submitButton());

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(DUPLICATE_MESSAGE)).not.toBeInTheDocument();

    // Reopening shows a blank form, not the previous submission.
    await openDialog(user);
    expect(field("Entreprise *")).toHaveValue("");
    expect(field("Poste *")).toHaveValue("");
  });

  it("applies to the AI-prefilled flow too, since both go through POST /applications", async () => {
    parseOfferHandler = async () =>
      extractionResponse({ company: "ACME", position: "Développeur React" });
    createApplicationHandler = async () => duplicateResponse();

    const { user } = renderDialog();
    await openDialog(user);
    const textarea = await openImportPanel(user);
    await user.type(textarea, OFFER_TEXT);
    await user.click(processButton());

    await waitFor(() => expect(field("Entreprise *")).toHaveValue("ACME"));
    await user.click(submitButton());

    expect(await screen.findByText(DUPLICATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(field("Entreprise *")).toHaveValue("ACME");
  });
});
