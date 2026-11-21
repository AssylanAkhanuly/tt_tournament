import { expect, test, type APIRequestContext } from '@playwright/test';

import { E2E_ADMIN, E2E_NATIONAL_COACH } from './global-setup';

/* Доска планов подготовки ✳ (21.11.2026, NATIONAL.md «Доска планов»): главный
   тренер видит строку спортсмена с пунктами плана по дням; пункт со сроком
   сегодня — «идёт», вчерашний невыполненный — «просрочено» и попадает в
   сводку; карточка пункта отмечает его выполненным, и доска перерисовывает его
   серым. Спортсмен — «[e2e] », его сносит засев. */

const iso = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

async function apiAs(request: APIRequestContext, account: { email: string; password: string }) {
  const r = await request.post('/api/auth/login/email/', { data: { email: account.email, password: account.password } });
  expect(r.status()).toBe(200);
}

test('доска планов: пункты по дням, просрочка в сводке, отметка «выполнено»', async ({ page, request }) => {
  const name = `[e2e] Доска ${Date.now() % 100000}`;
  await apiAs(request, E2E_ADMIN);
  expect((await request.post('/api/rating/athletes/', { data: { name, sex: 'm', region: 'Астана', birth_year: 2008 } })).status()).toBe(201);
  await apiAs(request, E2E_NATIONAL_COACH);
  const cands = (await (await request.get('/api/national/members/candidates/?q=' + encodeURIComponent(name))).json()) as { id: string; name: string }[];
  const m = await request.post('/api/national/members/', { data: { user_id: cands.find((c) => c.name === name)!.id, age_group: 'junior' } });
  const memberId = ((await m.json()) as { id: string }).id;
  const plan = await request.post(`/api/national/members/${memberId}/plans/`, { data: { starts_on: iso(-10), ends_on: iso(20), goal: 'Чемпионат' } });
  const planId = ((await plan.json()) as { id: string }).id;
  for (const [title, due] of [['Подача сегодня', iso(0)], ['Видеоразбор вчера', iso(-1)]])
    expect((await request.post(`/api/national/plans/${planId}/items/`, { data: { kind: 'work', title, due } })).status()).toBe(201);

  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(E2E_NATIONAL_COACH.email);
  await page.getByLabel('Пароль').fill(E2E_NATIONAL_COACH.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/national');
  await page.getByRole('button', { name: 'Планы подготовки' }).click();
  await page.waitForURL((url) => url.pathname === '/national/plans');

  // Вчерашний пункт может лежать в прошлой неделе (понедельник) — смотрим месяц.
  await page.getByTestId('plan-board-month').click();
  const row = page.locator(`[data-testid="plan-board-row"][data-name="${name}"]`);
  const today = row.getByTestId('plan-board-item').filter({ hasText: 'Подача сегодня' });
  await expect(today).toHaveAttribute('data-state', 'live');
  if (new Date().getDate() > 1) {
    await expect(row.getByTestId('plan-board-item').filter({ hasText: 'Видеоразбор вчера' })).toHaveAttribute('data-state', 'overdue');
    await expect(page.getByTestId('plan-board-summary')).toContainText('Просрочено');
  }
  await expect(page.getByTestId('plan-board-now')).toBeVisible();
  await page.screenshot({ path: 'test-results/plans-board/board.png' });

  await today.click();
  const card = page.getByTestId('plan-board-card');
  await expect(card).toContainText('Подача сегодня');
  await expect(card).toContainText(name);
  await card.getByTestId('plan-board-done').click();
  await expect(row.getByTestId('plan-board-item').filter({ hasText: 'Подача сегодня' })).toHaveAttribute('data-state', 'done');
});
