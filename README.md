# Cocktail Orders

A small ordering app for a home bar, themed around movie-classic cocktails
("Shaken, Not Stirred"): guests log in with their name, browse the menu by
category and submit an order with an optional note; the password-protected
barkeeper view shows all open orders live and lets the barkeeper mark
ingredients as out of stock (hiding cocktails that need them). Guests are
notified as soon as their order is ready.

**Live:** https://kind-ground-07fd6390f.6.azurestaticapps.net

## Features

- Guest login by name (no password, just an identifier for the session)
- Movie-themed cocktail menu, filterable by category
- One-click order flow with an optional note, auto-scrolls to the order form
- One open order per guest at a time, with clear feedback if a second one is attempted
- Live queue counter showing guests how many orders are ahead of them
- Password-protected barkeeper view of all open orders, updated in real time via WebSockets
- Barkeeper can mark ingredients as unavailable; affected cocktails disappear from the menu automatically
- Free-text cocktail ordering ("something bitter, no rum, without ice") powered by an LLM (Groq): a clear single match (plus any serving note like "no ice") goes straight into the order form to review and confirm; an ambiguous wish shows a pick-list instead
- Guests can rate cocktails they've had; a "recommended for you" section suggests cocktails liked by guests with similar taste (collaborative filtering)
- Ready notification for the guest once the barkeeper marks their order as done: the WebSocket signal makes the guest's page refetch the open orders, and when their order is no longer open an in-app banner ("Deine Bestellung ist fertig!") appears. It only shows while the page is open; there are no push notifications
- Works across devices on the same local network (e.g. guests on their phones, barkeeper on a tablet), or deployed to Azure for access from anywhere
- Help guide (`?` button) explaining ordering and the wish feature

## Security model

- **Barkeeper actions are protected on the server, not just in the UI.** The login returns a signed token (HMAC-SHA256, valid for 12 hours, key derived from `BARKEEPER_PASSWORD`), and every barkeeper route (completing orders, marking ingredients (un)available) rejects requests without a valid token. The password is compared in constant time, and failed logins are rate-limited per IP.
- **Orders are validated on the server:** one open order per guest, name/note length limits, and order items are rebuilt from the menu, so clients can only say *which* cocktail they want.
- **The menu lives in `shared/cocktails.json`** and is read by both the frontend and the server. The LLM prompt for free-text wishes is built from the server's copy, never from client input. Wishes are limited to 300 characters and rate-limited per IP.
- **Guests are identified by name only, on purpose.** This is a house-bar app: anyone who knows a guest's name can see that guest's order history and ratings. There are no accounts or passwords for guests.

## Screenshots

| Guest menu | Barkeeper view |
| --- | --- |
| ![Guest-facing cocktail menu](./docs/screenshots/menu.png) | ![Barkeeper dashboard with open orders and ingredient toggles](./docs/screenshots/barkeeper.png) |

## Tech stack

| Layer    | Technology                                                    |
| -------- | -------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, React Router                        |
| Backend  | Node.js, Express, Prisma + PostgreSQL, `ws`                     |
| AI       | [Groq](https://groq.com) (free tier) via the OpenAI SDK, for the free-text wish feature |
| Testing  | Vitest, Testing Library (frontend), Vitest + Supertest (backend) |
| CI       | GitHub Actions (lint, test, build on every push)                |

## Project structure

```
├── src/                    React frontend (components, pages, data, tests)
├── shared/cocktails.json   The menu, read by both frontend and server
├── server/
│   ├── app.js              Express app + routes (importable, used by tests)
│   ├── barkeeperAuth.js     Barkeeper token + password check + route guard
│   ├── menu.js              Loads shared/cocktails.json for the server
│   ├── index.js             Entry point: starts the HTTP + WebSocket servers
│   ├── prisma.js            Prisma Client singleton
│   ├── prisma/schema.prisma Database schema + migrations
│   ├── recommendations.js   Collaborative filtering (ratings → suggestions)
│   ├── groq.js               Free-text wish → cocktail match, via Groq
│   ├── app.test.js          Backend API tests
│   ├── Dockerfile            Backend container image
│   └── .env.example         Template for required environment variables
├── docker-compose.yml       Local PostgreSQL for development/testing
├── infra/                   Bicep IaC (Container App + Static Web App)
└── .github/workflows/
    ├── ci.yml                CI pipeline (lint, test, build)
    └── deploy.yml            Deploys to Azure on push to main
```

Frontend and backend are two independent Node projects, each with its own
`package.json`, and need to be started separately.

## Getting started

### 1. Start a local PostgreSQL database

```bash
docker compose up -d postgres
```

Starts Postgres in Docker, listening on `localhost:5433`.

### 2. Install dependencies

```bash
npm install                # frontend, from the project root
cd server && npm install   # backend; also runs `prisma generate`
```

### 3. Configure environment variables

The backend reads its config from environment variables — none of it is
stored in the code. From the `server/` folder:

```bash
cp .env.example .env
```

Then edit `server/.env`:

```
BARKEEPER_PASSWORD=your-password-here
DATABASE_URL=postgresql://cocktail:cocktail@localhost:5433/cocktail
GROQ_API_KEY=your-groq-api-key
```

`.env` is gitignored and never committed. The default `DATABASE_URL` matches
the `docker-compose.yml` Postgres from step 1. `GROQ_API_KEY` is only needed
for the free-text recommendation feature — get a free key at
[console.groq.com](https://console.groq.com); everything else works without it.

### 4. Apply database migrations

```bash
cd server && npx prisma migrate dev
```

### 5. Run both servers

In one terminal (project root):

```bash
npm run dev
```

Starts the Vite dev server for the frontend at `http://localhost:5173`.

In a second terminal (`server/` folder):

```bash
npm run dev
```

Starts the Express API and WebSocket server together on port `3001`.

### 6. Open the app

- Customer view: `http://localhost:5173/`
- Barkeeper view: `http://localhost:5173/barkeeper` (requires the password set in step 3)

To use the app from other devices on the same Wi-Fi (e.g. guests' phones),
open `http://<your-lan-ip>:5173` instead of `localhost` — the frontend
automatically points its API and WebSocket connections at whatever host it
was loaded from.

## Testing

```bash
npm test          # frontend component tests (Vitest + Testing Library), from the project root
cd server && npm test   # backend API tests (Vitest + Supertest)
```

Backend tests run against the local Postgres from `docker-compose.yml` and
clear the `orders`/`unavailable_ingredients` tables before each test, so
tests stay isolated from each other.

## Linting

```bash
npm run lint             # frontend, from the project root
cd server && npm run lint   # backend
```

## CI

Every push runs `.github/workflows/ci.yml`, which lints, tests, and builds
both the frontend and backend in parallel jobs (the backend job runs against
a Postgres service container).

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which deploys to
Azure:

- **Frontend** → Azure Static Web Apps (Free tier)
- **Backend** → Azure Container Apps (scale-to-zero), image built and pushed
  to GHCR
- **Database** → an external managed Postgres (e.g. [Neon](https://neon.tech))

Infrastructure is defined as code in `infra/` (Bicep) and re-applied on every
deploy. See `infra/main.bicep` and `.github/workflows/deploy.yml` for the
full setup, including the required GitHub secrets
(`AZURE_CLIENT_ID`/`AZURE_TENANT_ID`/`AZURE_SUBSCRIPTION_ID` for OIDC login,
`DATABASE_URL`, `BARKEEPER_PASSWORD`, `GHCR_PAT`, `GROQ_API_KEY`).

## Contributing

`main` is protected — changes go through a feature branch and a pull request
(required for everyone, including repo admins). Typical flow:

```bash
git checkout -b feature/my-change
# ... make changes, commit ...
git push -u origin feature/my-change
```

Then open a pull request on GitHub.
