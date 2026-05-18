# MethodHub Frontend

React + Vite frontend for recruitment operations.

## Scripts

```bash
npm run dev      # uses --mode dev  -> loads .env.dev
npm run build    # uses --mode prod -> loads .env.prod
npm run preview  # preview production build mode
npm run lint
```

## Environment Files

- `.env.dev` – local/dev endpoints and ports
- `.env.prod` – production endpoints
- `.env.example` – reference template

All runtime environment variables used by Vite should be prefixed with `VITE_`.

### Microsoft Calendar (Graph API) Variables

Set these in both `.env.dev` and `.env.prod`:

```bash
VITE_MS_CLIENT_ID=<azure-app-client-id>
VITE_MS_TENANT_ID=common
VITE_MS_REDIRECT_URI=<frontend-url>
VITE_MS_GRAPH_SCOPES=User.Read,Calendars.Read
```

`VITE_MS_CLIENT_ID` is required to enable Outlook connect/sync actions in the Calendar screen.

### AI Job Description Generator

The Account Manager job-opening flow now supports AI JD generation.

- Preferred production path: expose `POST /api/job-description/generate` from your backend.
- Local development fallback: add `GROQ_API_KEY` to `.env.dev` and the Vite dev server will serve `/internal/ai/job-description`.
- Optional model override: `GROQ_JD_MODEL` defaults to `llama-3.1-8b-instant`.

### AI Resume Parsing

The Account Manager and Recruiter candidate create flow can auto-fill candidate fields from an uploaded resume.

- Preferred production path: expose `POST /api/candidate/parse-resume` from your backend.
- Local development fallback: add `GROQ_API_KEY` to `.env.dev` and the Vite dev server will serve `/internal/ai/parse-resume`.
- Optional model override: `GROQ_RESUME_MODEL` defaults to `GROQ_JD_MODEL` or `llama-3.1-8b-instant`.
- Supported upload formats: PDF, DOC, DOCX, and TXT.

## Styling Convention

- Global style entry: `src/styles/globals.scss` (imported once in `src/main.jsx`)
- Component/page styles: colocated CSS/SCSS modules (`*.module.scss`) or component-specific CSS
- Avoid adding additional global CSS entry files.

## Icon Convention

- Use React icon components (Feather/Lucide-like set via `react-icons`) for consistency.
- Prefer code-based icons over static SVG asset imports unless a branded icon is required.

## Asset Convention

- Keep application images in `src/assets/`.
- Use `public/` only for truly static files referenced by absolute path.
- Do not commit generated output folders like `dist/`.
