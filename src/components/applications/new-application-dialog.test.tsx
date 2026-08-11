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

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function extractionResponse(fields: Record<string, unknown>) {
  return jsonResponse({
    fields,
    // Extraction metadata: available in the contract, owned by issue #24.
    confidenceByField: { company: 0.9 },
    uncertainFields: ["salary"],
    warnings: ["Salaire exprimé en fourchette"],
  });
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
      return jsonResponse({ id: "app-1" });
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
