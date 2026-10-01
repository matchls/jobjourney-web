import { useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/app-header";
import ApplicationsPage from "@/app/(app)/applications/page";
import type { Application } from "@/types";

// The router is faked at the URL level: push and replace move the current URL
// in a tiny external store, which feeds useSearchParams back into the tree. A
// search therefore goes through the same round trip as in the browser — type,
// navigate, re-render — instead of asserting on a spy, which would prove
// nothing about the results actually shown.
const urlStore = {
  url: "/applications",
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    urlStore.listeners.add(listener);
    return () => {
      urlStore.listeners.delete(listener);
    };
  },
  getSnapshot() {
    return urlStore.url;
  },
  go(url: string) {
    urlStore.url = url;
    urlStore.listeners.forEach((listener) => listener());
  },
};

function useUrl() {
  return useSyncExternalStore(
    urlStore.subscribe,
    urlStore.getSnapshot,
    urlStore.getSnapshot,
  );
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string) => urlStore.go(url),
    replace: (url: string) => urlStore.go(url),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(useUrl().split("?")[1] ?? ""),
  usePathname: () => useUrl().split("?")[0],
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { name: "Ada Lovelace", email: "ada@example.test" },
    isLoading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

const useApplicationsMock = vi.fn();
vi.mock("@/hooks/use-applications", () => ({
  useApplications: () => useApplicationsMock(),
}));

vi.mock("@/hooks/use-delete-application", () => ({
  useDeleteApplication: () => ({ mutate: vi.fn(), error: null }),
}));

function buildApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    company: "ACME",
    position: "Developpeur React",
    source: null,
    offerUrl: null,
    status: "APPLIED",
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
    userId: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    interviewSteps: [],
    preparationTasks: [],
    ...overrides,
  };
}

const APPLICATIONS = [
  buildApplication({
    id: "a1",
    company: "Alpha Corp",
    position: "Developpeur React",
    location: "Paris",
    source: "LinkedIn",
  }),
  buildApplication({
    id: "a2",
    company: "Beta Labs",
    position: "Developpeur Node",
    location: "Lyon",
    source: "Site carriere",
    status: "TARGETED",
  }),
  buildApplication({
    id: "a3",
    company: "Delta Studio",
    position: "Developpeur frontend",
    location: "Paris",
    source: "Indeed",
    status: "REJECTED",
  }),
];

// Mirrors the real layout: a header sitting above the tabs, plus the tab that
// is currently open. Leaving and coming back therefore unmounts the list,
// exactly as the sidebar does.
function Workspace() {
  const pathname = useUrl().split("?")[0];

  return (
    <>
      <AppHeader />
      <nav>
        <button type="button" onClick={() => urlStore.go("/kanban")}>
          Aller au Kanban
        </button>
        <button type="button" onClick={() => urlStore.go("/applications")}>
          Revenir aux candidatures
        </button>
      </nav>
      {pathname === "/applications" ? (
        <ApplicationsPage />
      ) : (
        <p>Onglet Kanban</p>
      )}
    </>
  );
}

// The "Nouvelle candidature" dialog carried by the list has its own mutations:
// it needs a provider even though it plays no part in these tests.
function renderWorkspace(initialUrl = "/applications") {
  urlStore.url = initialUrl;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Workspace />
    </QueryClientProvider>,
  );
}

function globalSearchField() {
  return screen.getByLabelText("Rechercher une candidature");
}

function listSearchField() {
  return screen.getByPlaceholderText(/Rechercher une entreprise, un poste/);
}

// Reads the result list the way the user sees it, so an assertion fails when a
// search returns too much as well as when it returns too little.
function listedCompanies() {
  return APPLICATIONS.map((app) => app.company).filter((company) =>
    screen.queryByText(company),
  );
}

const ALL_COMPANIES = ["Alpha Corp", "Beta Labs", "Delta Studio"];

beforeEach(() => {
  urlStore.url = "/applications";
  urlStore.listeners.clear();
  useApplicationsMock.mockReturnValue({
    data: APPLICATIONS,
    isLoading: false,
    isError: false,
    error: null,
  });
});

describe("AppHeader — barre de recherche globale", () => {
  // Root cause of #51: the field was an uncontrolled input, outside any form
  // and without any handler. Typing in it changed strictly nothing.
  it("applique le terme saisi à la liste des candidatures", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Alpha{Enter}");

    expect(listedCompanies()).toEqual(["Alpha Corp"]);
    expect(listSearchField()).toHaveValue("Alpha");
  });

  it("cherche aussi sur le poste, la localisation et la source", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Paris{Enter}");

    expect(listedCompanies()).toEqual(["Alpha Corp", "Delta Studio"]);
  });

  it("affiche l'état vide quand aucune candidature ne correspond", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "entreprise inconnue{Enter}");

    expect(listedCompanies()).toEqual([]);
    expect(
      screen.getByText("Aucune candidature ne correspond à ces filtres"),
    ).toBeInTheDocument();
  });

  it("prend en compte une nouvelle recherche sans quitter la liste", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Alpha{Enter}");
    expect(listedCompanies()).toEqual(["Alpha Corp"]);

    // Same route, only the query string changes: the list is not remounted, so
    // the new term has to be picked up by the component already running.
    await userEvent.clear(globalSearchField());
    await userEvent.type(globalSearchField(), "Beta{Enter}");

    expect(listedCompanies()).toEqual(["Beta Labs"]);
  });

  it("laisse affiner les critères directement dans la liste", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Paris{Enter}");
    await userEvent.clear(listSearchField());
    await userEvent.type(listSearchField(), "Delta");

    expect(listedCompanies()).toEqual(["Delta Studio"]);
  });

  it("vide la barre globale quand les filtres sont réinitialisés", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Alpha{Enter}");
    await userEvent.click(
      screen.getByRole("button", { name: "Réinitialiser" }),
    );

    expect(listedCompanies()).toEqual(ALL_COMPANIES);
    expect(globalSearchField()).toHaveValue("");
    expect(listSearchField()).toHaveValue("");
  });

  it("ne conserve pas la recherche après un aller-retour vers un autre onglet", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Alpha{Enter}");
    await userEvent.click(
      screen.getByRole("button", { name: "Aller au Kanban" }),
    );
    expect(screen.getByText("Onglet Kanban")).toBeInTheDocument();
    expect(globalSearchField()).toHaveValue("");

    await userEvent.click(
      screen.getByRole("button", { name: "Revenir aux candidatures" }),
    );

    expect(listedCompanies()).toEqual(ALL_COMPANIES);
    expect(listSearchField()).toHaveValue("");
  });

  it("applique une recherche déjà présente dans l'URL au premier rendu", () => {
    renderWorkspace("/applications?q=Beta");

    expect(listedCompanies()).toEqual(["Beta Labs"]);
    expect(globalSearchField()).toHaveValue("Beta");
    expect(listSearchField()).toHaveValue("Beta");
  });

  it("revient à la liste complète quand la barre globale est soumise vide", async () => {
    renderWorkspace("/applications?q=Beta");

    await userEvent.clear(globalSearchField());
    await userEvent.type(globalSearchField(), "{Enter}");

    expect(listedCompanies()).toEqual(ALL_COMPANIES);
  });

  it("ignore les espaces autour du terme saisi", async () => {
    renderWorkspace();

    await userEvent.type(globalSearchField(), "   Beta   {Enter}");

    expect(listedCompanies()).toEqual(["Beta Labs"]);
  });

  it("reste utilisable pendant le chargement de la liste", async () => {
    useApplicationsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Alpha{Enter}");

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
    expect(globalSearchField()).toHaveValue("Alpha");
  });

  it("affiche l'erreur de chargement plutôt qu'un faux résultat vide", async () => {
    useApplicationsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("API indisponible"),
    });
    renderWorkspace();

    await userEvent.type(globalSearchField(), "Alpha{Enter}");

    expect(
      screen.getByText("Impossible de charger les candidatures"),
    ).toBeInTheDocument();
    expect(screen.getByText("API indisponible")).toBeInTheDocument();
    expect(
      screen.queryByText("Aucune candidature ne correspond à ces filtres"),
    ).not.toBeInTheDocument();
  });
});
