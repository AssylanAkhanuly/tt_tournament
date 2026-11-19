import { expect, test, type APIRequestContext } from '@playwright/test';

import { E2E_ADMIN } from './global-setup';

/* Расписание тура Лиги ✳ (19.11.2026, LEAGUE.md «Расписание тура») — как у
   турнира: параметры (столов, минут на встречу, игровые дни) → «Сформировать»
   → «Список» и «День» → правка стола и времени (занятый стол отбивает сервер)
   → «Отправить» → только смотреть. Сезон, лига, четыре команды и тур заводятся
   по API (их экраны проверяет league.spec.ts). Всё «[e2e] » сносит засев. */

async function setup(request: APIRequestContext, stamp: number) {
  const r0 = await request.post('/api/auth/login/email/', { data: { email: E2E_ADMIN.email, password: E2E_ADMIN.password } });
  expect(r0.status()).toBe(200);
  const season = await (await request.post('/api/league/seasons/', { data: { year: 2026, name: `[e2e] Сезон расписания ${stamp}` } })).json();
  const div = await (
    await request.post('/api/league/divisions/', {
      data: { season_id: season.id, gender: 'm', name: `[e2e] Лига расписания ${stamp}`, level: 100 + (stamp % 800) },
    })
  ).json();
  for (const n of ['А', 'Б', 'В', 'Г']) {
    const club = await (await request.post('/api/clubs/', { data: { name: `[e2e] Клуб ${n} ${stamp}` } })).json();
    const t = await request.post(`/api/league/divisions/${div.id}/teams/`, { data: { club_id: club.id, name: `[e2e] ${n} ${stamp}` } });
    expect(t.status(), await t.text()).toBe(201);
  }
  const tour = await request.post(`/api/league/divisions/${div.id}/tours/`, { data: { number: 1, city: 'Астана', starts_on: '2026-12-05' } });
  expect(tour.status(), await tour.text()).toBe(201);
  return (await tour.json()).id as string;
}

test('расписание тура: сформировать, список и день, правка с конфликтом, отправить', async ({ page, request }) => {
  const stamp = Date.now();
  const tourId = await setup(request, stamp);

  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(E2E_ADMIN.email);
  await page.getByLabel('Пароль').fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');

  // Расписания нет — параметры: два стола, 120 минут, день тура по умолчанию.
  await page.goto(`/dashboard/league/tours/${tourId}/schedule`);
  const params = page.getByTestId('tour-schedule-params');
  await params.getByTestId('tour-schedule-tables').fill('2');
  await params.getByTestId('tour-schedule-minutes').fill('120');
  await expect(params.getByTestId('play-day')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/league-schedule/params.png' });
  await params.getByTestId('tour-schedule-build').click();

  // «Список»: шесть встреч в трёх временах, по два стола — 10:00, 12:00, 14:00.
  const rows = page.getByTestId('tour-schedule-row');
  await expect(rows).toHaveCount(6);
  await expect(page.getByTestId('tour-schedule-status')).toHaveText('Черновик');
  const times = await rows.locator('td:first-child').allTextContents();
  expect([...new Set(times)]).toEqual(['05.12 10:00', '05.12 12:00', '05.12 14:00']);
  await page.screenshot({ path: 'test-results/league-schedule/list.png' });

  // «День»: столбец на стол, по три блока встреч.
  await page.getByTestId('nav-sub').filter({ hasText: /^День$/ }).click();
  await page.waitForURL(/view=day/);
  await expect(page.getByTestId('tour-day-table')).toHaveCount(2);
  await expect(page.locator('[data-testid="tour-day-table"][data-table="1"] [data-testid="tour-day-match"]')).toHaveCount(3);
  await page.screenshot({ path: 'test-results/league-schedule/day.png' });

  // Правка: встреча 14:00 стола 2 — на стол 1 в 10:00 → стол занят; в 16:00 — можно.
  await page.locator('[data-testid="tour-day-table"][data-table="2"] [data-testid="tour-day-match"]').last().click();
  const edit = page.getByTestId('tour-match-edit');
  await edit.getByTestId('tour-match-table').click();
  await page.getByRole('option', { name: 'Стол 1', exact: true }).click();
  await edit.getByRole('spinbutton', { name: /час/ }).click();
  await page.keyboard.type('1000');
  await edit.getByTestId('tour-match-save').click();
  await expect(edit.getByTestId('tour-match-error')).toContainText('стол');
  await edit.getByRole('spinbutton', { name: /час/ }).click();
  await page.keyboard.type('1600');
  await edit.getByTestId('tour-match-save').click();
  await expect(edit).toHaveCount(0);
  await expect(page.locator('[data-testid="tour-day-table"][data-table="1"] [data-testid="tour-day-match"]')).toHaveCount(4);

  // «Отправить» с подтверждением — дальше только смотреть.
  await page.getByTestId('tour-schedule-finalize').click();
  await page.getByTestId('tour-schedule-finalize-confirm').getByRole('button', { name: 'Отправить' }).click();
  await expect(page.getByTestId('tour-schedule-status')).toHaveText('Отправлено');
  await expect(page.getByTestId('tour-schedule-params-open')).toHaveCount(0);
  await expect(page.locator('[data-testid="tour-day-match"]').first()).toBeDisabled();
  await page.screenshot({ path: 'test-results/league-schedule/final.png' });
});
