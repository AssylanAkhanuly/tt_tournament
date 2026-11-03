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
  /* Выпуски, апелляции и калибровка ✳ (03.11.2026) — отдельным проектом после
     остальных: выпуск меняет то, что показывает публичный лист, а сохранённые
     коэффициенты — каждый следующий расчёт. Запусти их параллельно с проверками
     листа и неявок, и те сверяли бы числа со снимком, а не с живыми значениями.
     База снова чистая на следующем прогоне: засев сносит выпуски. */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /rating-governance\.spec\.ts/ },
    {
      name: 'rating-governance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /rating-governance\.spec\.ts/,
      dependencies: ['chromium'],
    },
  ],
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
      // Публичный лист — открыт без входа, по нему и видно, что Django поднялся.
      url: 'http://localhost:8000/api/rating/',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
