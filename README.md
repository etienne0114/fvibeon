# Learn Frontend

Single-project React + TypeScript + Chakra UI shell that talks to `learn/backend` for authentication, dashboard telemetry, course enrollment, and AI tutor chat.

## Development
1. Install dependencies (peer conflicts exist at the time of writing, so we rely on `--legacy-peer-deps`):
   ```bash
   cd learn/frontend
   npm install --legacy-peer-deps
   ```
2. Run the backend first (`learn/backend`), then start Vite for this UI:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` (or the port Vite reports) to interact with the Learn workspace. The JWT returned from `/api/auth` is stored in `localStorage` and is used on every subsequent request.
4. Build artifacts are output to `dist/` via `npm run build`.

## Architecture
- `src/components/layout` – workspace shell, sidebar navigation, and reusable layout pieces for high-density dashboards.
- `src/components/ui` – reusable Chakra-based building blocks (cards, stat tiles, tutor chat panel, etc.).
- `src/features/learn` – the Learn experience organized by dashboard, course explorer, chat, translator, and the workspace home that ties them together.
- `src/hooks` – custom hooks (`useAuth`, `useCourses`, `useDashboard`, `useTutorChat`, `useTranslator`) that centralize API calls, local state, and error handling for each section.
- `src/api` – Axios helpers for `/auth`, `/courses`, `/learn`, `/ai`, and the translator backend so the sandboxed workspace uses the real Vibeon services.
- `src/api/translator.ts` + `src/hooks/useTranslator.ts` + `src/features/learn/translator` – translator UI that mirrors the vibeon translator experience by fetching supported languages, health status, and translations from the translator service and presenting them in a dedicated panel.

## Notes
- There is now a top-level `index.html` so Vite can bootstrap the app, and the theme/global styles stay in `src/theme.ts`/`src/styles.css`.
- `npm run build` currently logs Vite’s CJS deprecation warning but completes successfully.
