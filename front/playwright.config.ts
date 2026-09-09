import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-проверка веб-фич (правило из корневого CLAUDE.md → «E2E-проверка»).
 * Гоняем в реальном браузере против dev-сервера Next (переиспользуем уже
 * запущенный, если он есть).
 */
export default defineConfig({
  testDir: './e2e',
  /* База приводится в известное состояние до прогона: проверки рейтинга
     сверяют конкретные числа, а числа живут в базе. */
  globalSetup: './e2e/global-setup.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  /* Два сервера ✳ (10.09.2026): фронт и Django.

     Раньше поднимался только Next, и наборы, которым нужен бэкенд (табло,
     рейтинг), молча падали на первом же тесте — а в CLAUDE.md это значилось
     как известное неудобство. Теперь Playwright поднимает и Django, поэтому
     `npm run test:e2e` гоняется целиком. Уже запущенные серверы
     переиспользуются, так что при живом `npm run dev` ничего не дублируется. */
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'C:/apps/tt_back/venv/Scripts/python.exe manage.py runserver 8000 --noreload',
      cwd: '../back',
      url: 'http://localhost:8000/api/rating/params/',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
