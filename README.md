# SYNTRAX

**ENGINEER THE IMPOSSIBLE.** A local mission workspace that turns written goals into structured, trackable work.

The four built-in agents run deterministic processing directly in the browser. No API key, internet connection, or generative model is required. Each operation uses the mission brief and saves its result with the mission.

## Requirements

- Node.js 22 LTS (tested locally with 22.18.0)
- npm 10 (tested locally with 10.9.3)

## Run locally

```sh
npm install
npm run dev
```

Create a mission, review its proposed four-step plan, then open **Mission Control** and run the next ready step. Mission data and edited results persist in this browser's `localStorage`.

## Build and checks

```sh
npm run test
npm run lint
npm run build
npm run preview
```

To verify the responsive layouts in Microsoft Edge, start `npm run dev` in one terminal, then run `npm run qa:responsive` in a second terminal. The check covers 320, 375, 430, 768, 1024, 1440 and 1920 px, checks horizontal overflow and mobile modal bounds, visits both Overview and Agent Network, and checks the browser console. It saves visual QA captures under the Codex `work/` folder.

For the full browser flow, keep the development server running and execute `npm run qa:flow`. It uses an isolated browser context to test required fields, plan approval, start/pause/resume, edit, dependency order, manual completion, persistence, JSON and Markdown downloads, search, deletion and console errors. Both browser QA commands use Microsoft Edge on Windows by default; set `SYNTRAX_BROWSER_EXECUTABLE` to use another Chromium-based executable. Set `SYNTRAX_URL` if the dev server uses another address.

The production site is static. UI navigation uses in-app state, so refreshing the page does not depend on server-side route rewrites.

## GitHub Pages

1. Push this project to a GitHub repository.
2. In repository **Settings → Pages**, select **GitHub Actions** as the source.
3. Push to `main` (or run the workflow manually). The workflow builds and deploys `dist/`.

Vite derives the repository base path from `GITHUB_REPOSITORY` in Actions. A custom domain/project site can adjust `vite.config.ts` if needed. No GitHub account has been linked or deployment performed from this workspace.

## Agents and execution boundaries

- **ORACLE** creates a mission charter with a sequenced plan, supplied criteria, outcome, deadline, and constraints.
- **SCOUT** extracts useful terms, asks about missing context, and creates an evidence plan. It does not browse or claim independent research.
- **ARCHITECT** generates an editable structured draft using the supplied outcome, context, constraints, and acceptance criteria.
- **SENTINEL** checks mission fields and prior agent outputs, flags missing items, and asks for evidence against each criterion. It does not claim external tests ran.

One step is performed per user action. There is no background agent loop, network access from the app, sync, or model integration. A failed task can be retried; missions can be paused or cancelled from the registry. Sensitive operations are not implemented.

## Optional AI integration architecture

No API variables are consumed in this static frontend. To add a model, add a server/serverless endpoint that keeps provider keys in server-side environment variables, validates structured mission-plan output against a schema, applies request/time limits, handles provider errors, and asks for user approval before sensitive tools. Configure the frontend with only the endpoint URL if necessary. Never put provider secrets in `VITE_*`, checked-in files, or GitHub Pages assets. `.env.example` lists no secrets and documents the backend boundary.

## Implemented

- Responsive dark command-center interface and inline SVG identity mark.
- Mission create/review/edit/delete, priority, deadline, criteria and constraints.
- Deterministic dependency plan with four distinct specialist operations.
- Stepwise execution, real progress derived from task state, event history and retry state.
- Clean first run with no seeded missions or demo records; users create their own content.
- Tutorial tab with purpose, mission, vision, values, step-by-step guidance, limits, and use cases.
- Portuguese and English interface selector.
- Editable task results; Markdown, JSON, and text exports.
- Local settings diagnostics and explicit not-run check labels.
- GitHub Actions Pages workflow.

## Known limitations

- Data remains in the current browser profile and is not encrypted or synchronized.
- SCOUT cannot perform live research; no AI provider or backend is connected.
- Agent outputs are local drafts and checks, not a replacement for human judgment or evidence.
- SENTINEL checks recorded fields and result structure only; it does not execute project tests.
- The mission plan uses a fixed deterministic sequence. No external or sensitive tools are executed.
- Browser storage can be cleared by the user or browser policy.
