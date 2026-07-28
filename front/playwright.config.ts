import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-проверка веб-фич (правило из корневого CLAUDE.md → «E2E-проверка»).
 * Гоняем в реальном браузере против dev-сервера Next (переиспользуем уже
 * запущенный, если он есть).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
