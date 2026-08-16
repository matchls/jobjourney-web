import { Suspense } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import ApplicationDetailPage from "./page";
import type { Application } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const useApplicationMock = vi.fn();
vi.mock("@/hooks/use-application", () => ({
  useApplication: (id: string) => useApplicationMock(id),
}));

vi.mock("@/hooks/use-delete-application", () => ({
  useDeleteApplication: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Ces deux sections ont leurs propres requêtes et ne sont pas le sujet du test.
vi.mock("@/components/application/interview-steps", () => ({
  InterviewSteps: () => null,
}));
vi.mock("@/components/application/preparation-tasks", () => ({
  PreparationTasks: () => null,
}));

function buildApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    company: "ACME",
    position: "Développeur React",
    source: null,
    offerUrl: null,
    status: "TARGETED",
    appliedAt: null,
    statusChangedAt: null,
    notes: null,
    resumeText: null,
    coverLetterText: null,
    location: null,
    salary: null,
    jobDescription: null,
    contactName: null,
    contactRole: null,
    contactEmail: null,
    referralNote: null,
    contractType: null,
    userId: "user-1",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    interviewSteps: [],
    preparationTasks: [],
    ...overrides,
  };
}

async function renderPage(overrides: Partial<Application> = {}) {
  useApplicationMock.mockReturnValue({
    data: buildApplication(overrides),
    isLoading: false,
    isError: false,
  });

  // `use(params)` suspend au premier rendu : le render doit être awaité dans
  // un `act` pour que la promesse se résolve avant les assertions.
  await act(async () => {
    render(
      <Suspense fallback={<p>Chargement...</p>}>
        <ApplicationDetailPage params={Promise.resolve({ id: "app-1" })} />
      </Suspense>,
    );
  });

  await screen.findByRole("heading", { name: "Développeur React" });
}

const informationsSection = () =>
  screen.queryByRole("heading", { name: "Informations" });

// --- Minimal layout simulation --------------------------------------------
//
// jsdom computes no layout: `scrollHeight` and `clientHeight` are both 0 on
// every element, so `scrollHeight > clientHeight` would always be false and
// the collapsible block would never show its toggle. Both getters are stubbed
// with a small but faithful model — text wrapped at a fixed width, clamped by
// the inline `max-height` — so the component is exercised on the very
// comparison it runs in a browser.
const CHARS_PER_LINE = 40;
const LINE_HEIGHT = 20;
const ROOT_FONT_SIZE = 16;

function naturalHeight(element: HTMLElement): number {
  const text = element.textContent ?? "";
  if (text === "") return 0;
  const lines = text
    .split("\n")
    .reduce(
      (total, line) => total + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)),
      0,
    );
  return lines * LINE_HEIGHT;
}

function maxHeightPx(element: HTMLElement): number | null {
  const raw = element.style.maxHeight;
  if (raw.endsWith("rem")) return Number.parseFloat(raw) * ROOT_FONT_SIZE;
  if (raw.endsWith("px")) return Number.parseFloat(raw);
  return null;
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return naturalHeight(this);
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      const max = maxHeightPx(this);
      const natural = naturalHeight(this);
      return max === null ? natural : Math.min(natural, max);
    },
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
  Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
});

// Comfortably past the 12rem (192px) clamp under the model above.
const LONG_DESCRIPTION = Array.from(
  { length: 30 },
  (_, index) => `Ligne ${index + 1} de la description du poste.`,
).join("\n");

const SHORT_DESCRIPTION = "Développement d'une application React.";

const toggle = () =>
  screen.queryByRole("button", { name: /^(Voir plus|Réduire)$/ });

const description = (text: string) =>
  screen.getByText((_, element) => {
    if (!element) return false;
    return element.tagName === "P" && element.textContent === text;
  });

beforeEach(() => {
  useApplicationMock.mockReset();
});

describe("Fiche candidature — type de contrat", () => {
  it("affiche le type de contrat quand il est renseigné", async () => {
    await renderPage({ contractType: "CDI", location: "Paris" });

    expect(screen.getByText("Type de contrat")).toBeInTheDocument();
    expect(screen.getByText("CDI")).toBeInTheDocument();
  });

  it("n'affiche aucun libellé quand il est absent", async () => {
    await renderPage({ location: "Paris" });

    expect(screen.queryByText("Type de contrat")).not.toBeInTheDocument();
  });

  it("affiche la section même si le type de contrat est la seule information", async () => {
    await renderPage({ contractType: "Freelance" });

    expect(informationsSection()).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
  });
});

describe("Fiche candidature — notes", () => {
  it("affiche les notes quand elles sont renseignées", async () => {
    await renderPage({ notes: "Recontacter en septembre." });

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Recontacter en septembre.")).toBeInTheDocument();
  });

  it("conserve les retours à la ligne des notes multilignes", async () => {
    const multiline = "Premier point\nDeuxième point\n\nTroisième point";
    await renderPage({ notes: multiline });

    const notes = screen.getByText((_, element) => {
      if (!element) return false;
      return element.tagName === "P" && element.textContent === multiline;
    });

    expect(notes).toHaveClass("whitespace-pre-line");
  });

  it("n'affiche aucun bloc quand les notes sont absentes", async () => {
    await renderPage({ location: "Paris" });

    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("affiche la section même si les notes sont la seule information", async () => {
    await renderPage({ notes: "Candidature spontanée." });

    expect(informationsSection()).toBeInTheDocument();
    expect(screen.getByText("Candidature spontanée.")).toBeInTheDocument();
  });
});

describe("Fiche candidature — description repliable", () => {
  it("affiche une description courte sans aucun contrôle", async () => {
    await renderPage({ jobDescription: SHORT_DESCRIPTION });

    expect(screen.getByText("Description du poste")).toBeInTheDocument();
    expect(description(SHORT_DESCRIPTION)).toBeInTheDocument();
    // Rien n'est masqué : proposer « Voir plus » n'aurait rien à montrer.
    expect(toggle()).not.toBeInTheDocument();
  });

  it("replie une description longue et propose « Voir plus »", async () => {
    await renderPage({ jobDescription: LONG_DESCRIPTION });

    const button = toggle();
    expect(button).toHaveTextContent("Voir plus");
    expect(button).toHaveAttribute("aria-expanded", "false");

    const paragraph = description(LONG_DESCRIPTION);
    expect(paragraph).toHaveStyle({ maxHeight: "12rem" });
    expect(paragraph).toHaveClass("overflow-hidden");
    // Le bouton pilote bien le paragraphe qu'il masque.
    expect(button).toHaveAttribute("aria-controls", paragraph.id);
  });

  it("garde l'intégralité du texte et ses retours à la ligne", async () => {
    await renderPage({ jobDescription: LONG_DESCRIPTION });

    const paragraph = description(LONG_DESCRIPTION);
    // Le texte n'est pas tronqué, seul son affichage est borné.
    expect(paragraph.textContent).toBe(LONG_DESCRIPTION);
    expect(paragraph).toHaveClass("whitespace-pre-line");
  });

  it("n'imbrique aucune zone scrollable", async () => {
    await renderPage({ jobDescription: LONG_DESCRIPTION });

    const paragraph = description(LONG_DESCRIPTION);
    expect(paragraph).not.toHaveClass("overflow-auto");
    expect(paragraph).not.toHaveClass("overflow-y-auto");
    expect(paragraph).not.toHaveClass("overflow-scroll");
  });

  it("déplie tout le texte au clic et bascule sur « Réduire »", async () => {
    const user = userEvent.setup();
    await renderPage({ jobDescription: LONG_DESCRIPTION });

    await user.click(toggle()!);

    const button = toggle();
    expect(button).toHaveTextContent("Réduire");
    expect(button).toHaveAttribute("aria-expanded", "true");

    const paragraph = description(LONG_DESCRIPTION);
    expect(paragraph).not.toHaveClass("overflow-hidden");
    expect(paragraph.style.maxHeight).toBe("");
  });

  it("revient à l'état replié au second clic", async () => {
    const user = userEvent.setup();
    await renderPage({ jobDescription: LONG_DESCRIPTION });

    await user.click(toggle()!);
    await user.click(toggle()!);

    const button = toggle();
    expect(button).toHaveTextContent("Voir plus");
    expect(button).toHaveAttribute("aria-expanded", "false");

    const paragraph = description(LONG_DESCRIPTION);
    expect(paragraph).toHaveStyle({ maxHeight: "12rem" });
    expect(paragraph).toHaveClass("overflow-hidden");
  });

  it("reste actionnable au clavier", async () => {
    const user = userEvent.setup();
    await renderPage({ jobDescription: LONG_DESCRIPTION });

    // Un vrai <button> : focusable à la tabulation, activable à Entrée.
    toggle()!.focus();
    expect(toggle()).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(toggle()).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("n'affiche aucun contrôle quand la description est absente", async () => {
    await renderPage({ location: "Paris" });

    expect(screen.queryByText("Description du poste")).not.toBeInTheDocument();
    expect(toggle()).not.toBeInTheDocument();
  });
});

describe("Fiche candidature — non-régression", () => {
  it("garde la section masquée quand aucune information n'est renseignée", async () => {
    await renderPage();

    expect(informationsSection()).not.toBeInTheDocument();
    expect(screen.queryByText("Type de contrat")).not.toBeInTheDocument();
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("affiche toujours les champs existants de la fiche", async () => {
    await renderPage({
      location: "Paris",
      salary: "45-55k€",
      jobDescription: "Développement d'une application React.",
      contactEmail: "camille@example.com",
      contractType: "CDI",
      notes: "À relancer.",
    });

    expect(screen.getByText("Localisation")).toBeInTheDocument();
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("Rémunération")).toBeInTheDocument();
    expect(screen.getByText("45-55k€")).toBeInTheDocument();
    expect(screen.getByText("Description du poste")).toBeInTheDocument();
    expect(screen.getByText("camille@example.com")).toBeInTheDocument();
    expect(screen.getByText("CDI")).toBeInTheDocument();
    expect(screen.getByText("À relancer.")).toBeInTheDocument();
  });

  it("garde les autres informations visibles sous une description longue", async () => {
    await renderPage({
      location: "Paris",
      contractType: "CDI",
      salary: "45-55k€",
      offerUrl: "https://jobs.example.com/42",
      jobDescription: LONG_DESCRIPTION,
      contactEmail: "camille@example.com",
      notes: "À relancer.",
    });

    // Replier la description ne doit rien retirer du reste de la fiche.
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("CDI")).toBeInTheDocument();
    expect(screen.getByText("45-55k€")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /jobs\.example\.com\/42/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("camille@example.com")).toBeInTheDocument();
    expect(screen.getByText("À relancer.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dates clés" }),
    ).toBeInTheDocument();
  });
});
