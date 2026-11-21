import { expect, test, type APIRequestContext } from '@playwright/test';

import { E2E_ADMIN, E2E_NATIONAL_COACH } from './global-setup';

/* Доска планов подготовки ✳ (21.11.2026, NATIONAL.md «Доска планов»): главный
   тренер видит строку спортсмена с пунктами плана по дням; пункт со сроком
   сегодня — «идёт», вчерашний невыполненный — «просрочено»; карточка пункта отмечает его выполненным, и доска перерисовывает его
   серым. Спортсмен — «[e2e] », его сносит засев. */

// Местная дата, как у сервера: `toISOString` в ранние часы дал бы вчерашнюю.
const iso = (days: number) => {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
  }
  await expect(page.getByTestId('plan-board-now')).toBeVisible();
  await page.screenshot({ path: 'test-results/plans-board/board.png' });

  await today.click();
  const card = page.getByTestId('plan-board-card');
  await expect(card).toContainText('Подача сегодня');
  await expect(card).toContainText(name);
  await card.getByTestId('plan-board-done').click();
  await expect(row.getByTestId('plan-board-item').filter({ hasText: 'Подача сегодня' })).toHaveAttribute('data-state', 'done');
  await page.mouse.click(5, 5); // щелчок мимо закрывает карточку
  await expect(page.getByTestId('plan-board-card')).toHaveCount(0);

  // Щелчок по пустому дню — новый пункт на этот день, как в календаре.
  const day = row.locator(`[data-testid="plan-board-cell"][data-date="${iso(0)}"]`);
  // В клетке уже лежит пункт — щёлкаем по свободному низу клетки.
  const box = (await day.boundingBox())!;
  await day.click({ position: { x: 4, y: box.height - 3 } });
  const dialog = page.getByTestId('plan-board-create');
  await expect(dialog).toContainText('Новый пункт');
  await dialog.getByTestId('plan-board-create-title').fill('Многоволан');
  await dialog.getByTestId('plan-board-create-submit').click();
  await expect(dialog).toHaveCount(0);
  await expect(row.getByTestId('plan-board-item').filter({ hasText: 'Многоволан' })).toHaveAttribute('data-state', 'live');

  // Протягивание по дням ✳ (22.11.2026): с 1-го по 3-е число месяца — пункт на три дня.
  const month = iso(0).slice(0, 8);
  const cellBox = async (d: string) => (await row.locator(`[data-testid="plan-board-cell"][data-date="${month}${d}"]`).boundingBox())!;
  const a = await cellBox('01');
  const c = await cellBox('03');
  const y = a.y + a.height - 3;
  await page.mouse.move(a.x + a.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(c.x + c.width / 2, y, { steps: 6 });
  await expect(row.getByTestId('plan-board-selection')).toHaveText('3 дня');
  await page.mouse.up();
  await expect(dialog).toContainText('Новый пункт');
  await dialog.getByTestId('plan-board-create-title').fill('Сериями');
  await dialog.getByTestId('plan-board-create-submit').click();
  await expect(dialog).toHaveCount(0);
  const range = row.getByTestId('plan-board-item').filter({ hasText: 'Сериями' });
  await expect(range).toHaveAttribute('data-start', month + '01');
  await expect(range).toHaveAttribute('data-end', month + '03');

  // Растягивание за правый край до 5-го числа — сервер хранит новые даты.
  await range.hover();
  const edge = (await row.getByTestId('plan-board-edge-end').first().boundingBox())!;
  const e5 = await cellBox('05');
  await page.mouse.move(edge.x + edge.width / 2, edge.y + edge.height / 2);
  await page.mouse.down();
  await page.mouse.move(e5.x + e5.width / 2, edge.y + edge.height / 2, { steps: 6 });
  await expect(range).toContainText('— 5 ');
  await page.screenshot({ path: 'test-results/plans-board/resize.png' });
  await page.mouse.up();
  await expect(page.getByTestId('plan-board-card')).toHaveCount(0); // отпускание края карточку не открывает
  await page.reload();
  await page.getByTestId('plan-board-month').click();
  await expect(range).toHaveAttribute('data-end', month + '05');
  await expect(range).toHaveAttribute('data-start', month + '01');
});
