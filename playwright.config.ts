import { defineConfig, devices } from '@playwright/test'

// End-to-End-Tests gegen echten Server + echte Datenbank (DATABASE_URL muss
// gesetzt und migriert sein, wie fuer die Server-Tests). Eigene Ports, damit
// ein laufender Dev-Server nicht stoert.
const SERVER_PORT = 3101
const FRONTEND_PORT = 5174
export const BARKEEPER_PASSWORD = 'e2e-password'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
    ...devices['Pixel 7'],
    // Lokal (z.B. in einer Sandbox mit vorinstalliertem Chromium) laesst sich
    // der Browser ueberschreiben; in CI installiert der Workflow ihn.
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  webServer: [
    {
      command: 'node index.js',
      cwd: 'server',
      url: `http://localhost:${SERVER_PORT}/api/ping`,
      env: {
        PORT: String(SERVER_PORT),
        BARKEEPER_PASSWORD,
        DATABASE_URL: process.env.DATABASE_URL ?? '',
      },
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      env: { VITE_API_URL: `http://localhost:${SERVER_PORT}` },
      reuseExistingServer: false,
    },
  ],
})
