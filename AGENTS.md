<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Job Journey Web

## Project

Job Journey is a personal job search companion.

The frontend is responsible for the user interface, navigation, forms, dashboards, Kanban board, interview preparation screens and progression views.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

## Language rules

- The user interface must be written in French.
- All code must be written in English.
- Variables, functions, components, hooks, files and folders must use English names.
- Code comments must be written in English.
- User-facing labels, buttons, empty states, errors and form texts must be written in French.

## Architecture rules

Use a feature-based architecture.

Recommended structure:

```txt
src/
  app/
  components/
    ui/
    layout/
  features/
    auth/
    applications/
    interviews/
    progression/
    dashboard/
  hooks/
  lib/
  services/
  types/
```

## Component rules

- Keep React components small and focused.
- Avoid placing business logic directly inside UI components.
- Extract reusable logic into hooks.
- Use shadcn/ui components when possible.
- Use Tailwind CSS for styling.
- Keep the visual identity minimalist, calm and Notion-inspired.
- Use soft leaf green as the main accent color.

## Data fetching

- Use TanStack Query for server state.
- API calls must be centralized in `src/services`.
- Do not duplicate fetch logic inside components.

## UX rules

The product should feel like:

- a personal job search companion
- an interview preparation tool
- a learning journal
- a progression dashboard

It should not feel like:

- a CRM
- an ATS
- a sales dashboard

## Naming conventions

Examples:

```ts
ApplicationCard;
InterviewJourney;
PreparationChecklist;
ProgressionPage;
useApplications;
applicationService;
```

Avoid French names in code.

## Quality rules

- Use TypeScript types explicitly when useful.
- Avoid `any`.
- Keep components readable.
- Prefer clear code over clever code.
- Add comments only when they clarify non-obvious logic.
