# Cocktail Orders

A small ordering app for a home bar: guests log in with their name, browse the
cocktail menu and submit an order with an optional note; the barkeeper sees
all open orders live and marks them as done. Customers are notified as soon
as their order is ready.

## Features

- Guest login by name (no password, just an identifier for the session)
- Cocktail menu with a one-click order flow, optional note per order
- One open order per guest at a time, with clear feedback if a second one is attempted
- Live barkeeper view of all open orders, updated in real time via WebSockets
- Ready notification for the guest once the barkeeper marks their order as done
- Works across devices on the same local network (e.g. guests on their phones, barkeeper on a tablet)

## Tech stack

| Layer    | Technology                                   |
| -------- | --------------------------------------------- |
| Frontend | React 19, Vite, React Router                  |
| Backend  | Node.js, Express, SQLite (`node:sqlite`), `ws` |
| CI       | GitHub Actions (ESLint on every push)          |

## Project structure

```
├── src/            React frontend (components, pages, data)
├── server/         Express + SQLite + WebSocket backend
└── .github/        CI workflow (ESLint)
```

Frontend and backend are two independent Node projects, each with its own
`package.json`, and need to be started separately.

## Getting started

### 1. Install dependencies

```bash
npm install          # frontend, from the project root
cd server && npm install   # backend
```

### 2. Run both servers

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

### 3. Open the app

- Customer view: `http://localhost:5173/`
- Barkeeper view: `http://localhost:5173/barkeeper`

To use the app from other devices on the same Wi-Fi (e.g. guests' phones),
open `http://<your-lan-ip>:5173` instead of `localhost` — the frontend
automatically points its API and WebSocket connections at whatever host it
was loaded from.

## Linting

```bash
npm run lint
```

Runs automatically on every push via the GitHub Actions workflow in
`.github/workflows/eslint.yml`.
