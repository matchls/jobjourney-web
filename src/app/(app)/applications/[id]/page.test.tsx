import { Suspense } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
