import { defineConfig, devices } from '@playwright/test';
import { basePath } from './scripts/build-env';

// Runs against a production build (service worker included) of the SAMPLE itinerary, via `vite preview`.
// The build goes to dist-e2e so it never overwrites the real build in dist.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:4173${basePath()}`, ...devices['iPhone 13'], browserName: 'chromium', serviceWorkers: 'allow' },
  webServer: {
    command: 'npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    // No sync repo, a fake feedback relay (routed in the test) and no Turnstile, whatever a local .env says.
    env: { TRIP_DATA: 'sample', VITE_DATA_REPO: '', VITE_SHOPPING_URL: 'https://shopping.test/', VITE_FEEDBACK_URL: 'https://feedback.test/', VITE_TURNSTILE_SITE_KEY: '' },
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
