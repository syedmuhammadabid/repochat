# RepoChat

Chat with the documentation of any **public GitHub repository**. RepoChat loads a repository's README, CONTRIBUTING guide, and Markdown files under `docs/`, then lets you ask questions with answers that cite the exact documentation sections used.

Built with React, Node.js, Express, and configurable Gemini or OpenRouter models. RepoChat was created for a Hacktoberfest MLH hackathon and is open to improvements that keep the project small, accessible, and reliable.

## Features

- Load documentation from a public GitHub repository URL.
- Read up to 25 documentation files and 150,000 characters.
- Ask follow-up questions in a focused chat interface.
- Get citations that link directly to the source section on GitHub.
- Verify citations in application code instead of trusting model output.
- Show clear errors for invalid repositories, missing documentation, rate limits, and missing configuration.
- Run locally or deploy as a single Node.js web service.

## Demo

To try RepoChat locally, follow the [setup instructions](#getting-started), open the Vite development URL, and paste a public repository URL such as:

```text
https://github.com/facebook/react
```

Ask questions that should be answered by the repository documentation. RepoChat will say that it could not find an answer when the loaded documentation does not support one.

## Tech stack

- **Frontend:** React 18 and Vite
- **Backend:** Node.js 20+, Express, Zod, Helmet, and express-rate-limit
- **AI:** Gemini REST API through Google AI Studio or OpenRouter-compatible models
- **Documentation source:** GitHub's repository tree API and raw file URLs

## Getting started

### Prerequisites

- Node.js 20 or newer
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey), or an OpenRouter API key
- Git

### 1. Clone the repository

```bash
git clone https://github.com/syedmuhammadabid/repochat.git
cd repochat
```

### 2. Install dependencies

```bash
npm install --prefix server
npm install --prefix client
```

### 3. Configure the server

Copy `server/.env.example` to `server/.env` and configure either Gemini or OpenRouter.

macOS/Linux:

```bash
cp server/.env.example server/.env
```

PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

The available variables are:

| Variable | Required | Description |
| --- | --- | --- |
| `AI_PROVIDER` | No | `gemini` (default) or `openrouter`. |
| `GEMINI_API_KEY` | When using Gemini | API key used by the server to call Gemini. |
| `GEMINI_MODEL` | No | Gemini model name. Defaults to the value in `server/lib/gemini.js`. |
| `OPENROUTER_API_KEY` | When using OpenRouter | API key used by the server to call OpenRouter. |
| `OPENROUTER_MODEL` | No | OpenRouter model ID. Defaults to a free model. |
| `OPENROUTER_SITE_URL` | No | Public app URL sent to OpenRouter for attribution. |
| `GITHUB_TOKEN` | No | Optional token that raises GitHub API rate limits. |
| `PORT` | No | Server port. Defaults to `3001`. |

Never commit `server/.env` or expose provider keys in client-side code.

### 4. Start the development servers

Run these commands in separate terminals:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

Open the URL printed by Vite. The client uses the backend at `http://localhost:3001`.

## Production build

Build the client and start the server from the repository root:

```bash
npm run build
npm start
```

The server serves the built client from `client/dist`. Set the API key for the selected provider in the production environment before starting the server.

## How it works

RepoChat keeps the documentation pipeline explicit:

1. **Loader** - validates a GitHub URL, fetches README/CONTRIBUTING/docs Markdown, and splits content into headed sections.
2. **Answerer** - sends only the loaded sections and chat history to the configured AI provider with a structured response schema.
3. **Verifier** - checks every returned citation against the loaded section IDs and retries once when citations are invalid.

There is no login, database, vector store, private-repository support, or code search. Answers are limited to the documentation that was loaded.

## Project structure

```text
client/
  src/
    App.jsx
    api.js
    components/
      Chat.jsx
      Message.jsx
      RepoLoader.jsx
server/
  lib/
    docs.js       # Loader: GitHub docs fetching and section splitting
    ai.js         # Configured AI provider selector
    gemini.js     # Gemini REST client with bounded retries
    openrouter.js # OpenRouter REST client with bounded retries
    qa.js         # Answerer and plain-code citation verifier
  routes/
    api.js        # /api/health, /api/load, and /api/chat
  server.js       # Express server and static client hosting
```

## Contributing

Contributions are welcome, especially improvements that make RepoChat easier to use, test, document, or contribute to during Hacktoberfest.

### Before opening an issue

- Search existing issues and pull requests first.
- For bugs, include reproduction steps, the repository URL if it is public, expected behavior, actual behavior, and relevant logs with secrets removed.
- For feature requests, explain the user problem and how the proposal fits the project's scope.

### Pull request workflow

1. Fork the repository and create a focused branch.
2. Make the smallest change that addresses one issue.
3. Do not add API keys, credentials, generated build output, or `server/.env`.
4. Run the validation commands below.
5. Open a pull request with a clear summary, testing notes, and screenshots for visible UI changes.

Please keep the Loader -> Answerer -> Verifier separation intact. New features should not introduce accounts, persistent storage, embeddings/vector databases, streaming, or support for private repositories without prior discussion.

## Validation

Run the following checks before submitting a pull request:

```bash
node --check server/server.js
node --check server/routes/api.js
node --check server/lib/docs.js
node --check server/lib/errors.js
node --check server/lib/gemini.js
node --check server/lib/qa.js
npm run build
```

Also manually check:

- A public repository produces an answer with a working citation link.
- An unrelated question produces the "couldn't find that" response.
- An invalid GitHub URL produces a clear error.

## Security and privacy

RepoChat is designed for public repositories only. Do not submit private or sensitive repository URLs. API keys belong only in server environment variables and must never be committed, logged, or sent to the browser.

If you discover a security issue, please do not include credentials or other sensitive data in a public issue. Contact the maintainers privately first.

## License

This repository is being prepared for open source. A license file should be added before distributing or accepting external contributions so that reuse terms are clear.
