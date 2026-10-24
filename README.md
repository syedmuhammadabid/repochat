# RepoChat (React + Node.js)

Chat with any public GitHub repo's docs. Every answer cites the exact section, and citations are verified by code.

## Architecture
- **client/**: React (Vite). `RepoLoader`, `Chat`, `Message` components; safe rendering, no `dangerouslySetInnerHTML`.
- **server/**: Node.js + Express. Zod request validation, Helmet, rate limiting, health check at `/api/health`.
- **Pipeline:** Loader (`lib/docs.js`, deterministic: README, CONTRIBUTING, `docs/**/*.md` split by heading) → Answerer (`lib/gemini.js`, Gemini via Google AI Studio, JSON-schema output, timeout + retry with backoff) → Verifier (`lib/qa.js`, plain code checks every cited section ID exists; one retry, then an honest "not found in the docs").
- No vector DB: Gemini's long context holds the docs directly.

## Run locally (Node 20+)
```
cp server/.env.example server/.env      # add your key from https://aistudio.google.com/apikey
npm install --prefix server && npm install --prefix client
npm run dev --prefix server             # terminal 1 (port 3001)
npm run dev --prefix client             # terminal 2 (open the printed URL)
```

## Deploy on Render (free web service)
- Build command: `npm run build`   Start command: `npm start`
- Environment: `GEMINI_API_KEY` (optional `GEMINI_MODEL`, `GITHUB_TOKEN`)
- Free instances sleep when idle, so open the URL once before demoing.

Never commit your key.
