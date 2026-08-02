# Cocktail Orders

A small ordering app for a home bar, themed around movie-classic cocktails
("Shaken, Not Stirred"): guests log in with their name, browse the menu by
category and submit an order with an optional note; the password-protected
barkeeper view shows all open orders live and lets the barkeeper mark
ingredients as out of stock (hiding cocktails that need them). Guests are
notified as soon as their order is ready.

## Features

- Guest login by name (no password; remembered on the device for next time)
- Movie-themed cocktail menu, filterable by category
- One-click order flow with an optional note, auto-scrolls to the order form
- One open order per guest at a time, with clear feedback if a second one is attempted
- Live queue counter showing guests how many orders are ahead of them
- Password-protected barkeeper view of all open orders, updated in real time via WebSockets
- Barkeeper view shows the full recipe (ingredients with amounts, ice, garnish) for each ordered cocktail
- Barkeeper can mark ingredients as unavailable; affected cocktails disappear from the menu automatically
- Ready notification for the guest once the barkeeper marks their order as done
- Works across devices on the same local network (e.g. guests on their phones, barkeeper on a tablet)

## Tech stack

| Layer    | Technology                                                    |
| -------- | -------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router                                   |
| Backend  | Node.js, Express, SQLite (`node:sqlite`), `ws`                  |
| Testing  | Vitest, Testing Library (frontend), Vitest + Supertest (backend) |
| CI       | GitHub Actions (lint, test, build on every push)                |

## Project structure

```
├── src/                    React frontend (components, pages, data, tests)
├── server/
│   ├── app.js              Express app + routes (importable, used by tests)
│   ├── index.js             Entry point: starts the HTTP + WebSocket servers
│   ├── app.test.js          Backend API tests
│   └── .env.example         Template for required environment variables
└── .github/workflows/ci.yml CI pipeline (lint, test, build)
```

Frontend and backend are two independent Node projects, each with its own
`package.json`, and need to be started separately.

## Getting started

### 1. Install dependencies

```bash
npm install                # frontend, from the project root
cd server && npm install   # backend
```

### 2. Configure the barkeeper password

The backend reads the barkeeper login password from an environment
variable — it's never stored in the code. From the `server/` folder:

```bash
cp .env.example .env
```

Then edit `server/.env` and set your own password:

```
BARKEEPER_PASSWORD=your-password-here
```

`.env` is gitignored and never committed.

### 3. Run both servers

In one terminal (project root):

```bash
npm run dev
```

Starts the Vite dev server for the frontend at `http://localhost:5173`.

In a second terminal (`server/` folder):

```bash
npm run dev
```

Starts the Express API on port `3001` and the WebSocket server on port
`3002`. Order data is persisted to `server/orders.db` (SQLite).

### 4. Open the app

- Customer view: `http://localhost:5173/`
- Barkeeper view: `http://localhost:5173/barkeeper` (requires the password set in step 2)

To use the app from other devices on the same Wi-Fi (e.g. guests' phones),
open `http://<your-lan-ip>:5173` instead of `localhost` — the frontend
automatically points its API and WebSocket connections at whatever host it
was loaded from.

## Testing

```bash
npm test          # frontend component tests (Vitest + Testing Library), from the project root
cd server && npm test   # backend API tests (Vitest + Supertest)
```

Backend tests run against an in-memory SQLite database (`:memory:`), so they
never touch `server/orders.db`.

## Linting

```bash
npm run lint             # frontend, from the project root
cd server && npm run lint   # backend
```

## CI

Every push runs `.github/workflows/ci.yml`, which lints, tests, and builds
both the frontend and backend in parallel jobs.

## Contributing

`main` is protected — changes go through a feature branch and a pull request
(required for everyone, including repo admins). Typical flow:

```bash
git checkout -b feature/my-change
# ... make changes, commit ...
git push -u origin feature/my-change
```

Then open a pull request on GitHub.
