import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout : la version web (dist/) servie par le vrai serveur du NAS, lancé en local
// avec un dossier de données vide. Construire d'abord : npm run e2e
const PORT = 8092;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'off',
  },
  webServer: {
    command: `rm -rf .e2e-donnees && CODE=code-de-test PORT=${PORT} DONNEES=.e2e-donnees SITE=dist node build-serveur/serveur/index.js`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
  },
});
