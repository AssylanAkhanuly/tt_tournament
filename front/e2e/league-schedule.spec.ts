import { expect, test, type APIRequestContext } from '@playwright/test';

import { E2E_ADMIN, E2E_CLUB_ADMIN, E2E_REFEREE } from './global-setup';

/* Расписание тура Лиги ✳ (19.11.2026, LEAGUE.md «Расписание тура») — как у
   турнира: судьи стола тура («Судьи») → параметры (столов, минут на встречу,
   игровые дни) → «Сформировать» → «Список» и «День» → правка стола и времени
   (занятый стол отбивает сервер) → «Отправить» → только смотреть; отправленное
   видят клуб («Расписание» кабинета) и судья («Лига»). Хлебные крошки — путь
   «Календарь / сезон / лига / тур». Сезон, лига, четыре команды и тур заводятся
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
  // Команда «А» — клуба администратора проверок: ему видно расписание своих встреч.
  const clubs = (await (await request.get('/api/clubs/')).json()) as { id: string; name: string }[];
  const own = clubs.find((c) => c.name === E2E_CLUB_ADMIN.club)!;
  for (const n of ['А', 'Б', 'В', 'Г']) {
    const club = n === 'А' ? own : await (await request.post('/api/clubs/', { data: { name: `[e2e] Клуб ${n} ${stamp}` } })).json();
    const t = await request.post(`/api/league/divisions/${div.id}/teams/`, { data: { club_id: club.id, name: `[e2e] ${n} ${stamp}` } });
    expect(t.status(), await t.text()).toBe(201);
  }
  const tour = await request.post(`/api/league/divisions/${div.id}/tours/`, { data: { number: 1, city: 'Астана', starts_on: '2026-12-05' } });
  expect(tour.status(), await tour.text()).toBe(201);
  return { tourId: (await tour.json()).id as string, season: season.name as string, league: div.name as string };
}

async function signIn(page: import('@playwright/test').Page, who: { email: string; password: string }, home: string) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === home);
}

test('расписание тура: судьи, сформировать, список и день, правка, отправить, видят клуб и судья', async ({ page, request, browser }) => {
  const stamp = Date.now();
  const { tourId, season, league } = await setup(request, stamp);
  await signIn(page, E2E_ADMIN, '/dashboard');

  // Без судей расписания нет: «Сформировать» отказывает.
  await page.goto(`/dashboard/league/tours/${tourId}/schedule`);
  await page.getByTestId('tour-schedule-params').getByTestId('tour-schedule-build').click();
  await expect(page.getByTestId('tour-schedule-error')).toContainText('судей');

  // Хлебные крошки: путь до тура, последнее звено — без ссылки.
  await expect(page.getByTestId('crumb')).toHaveText(['Календарь', `Евразийская лига · ${season}`, league, 'Тур 1 · Астана']);

  // «Судьи»: двое судей стола из учёток проверок (роль «судья»).
  await page.getByRole('button', { name: 'Судьи', exact: true }).click();
  await page.waitForURL(/\/referees$/);
  await page.getByTestId('tour-referee-add-open').click();
  const add = page.getByTestId('tour-referee-add');
  await add.getByTestId('tour-referee-search').fill('проверки');
  for (const name of ['Судья (проверки)', 'Администратор федерации (проверки)']) {
    await add.locator(`[data-testid="tour-referee-candidate"][data-name="${name}"]`).click();
    await expect(page.locator(`[data-testid="tour-referee-row"][data-name="${name}"]`)).toHaveCount(1);
  }
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test-results/league-schedule/referees.png' });

  // Параметры: два стола, 120 минут, день тура по умолчанию.
  await page.getByRole('button', { name: 'Расписание', exact: true }).click();
  await page.waitForURL(/\/schedule$/);
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
  // У каждой встречи — судья стола из назначенных.
  for (const text of await rows.allTextContents()) expect(text).toMatch(/\(проверки\)/);
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

  // Отправленное видит клуб — три встречи своей команды — и судья — свои.
  const club = await (await browser.newContext()).newPage();
  await signIn(club, E2E_CLUB_ADMIN, '/club');
  await club.getByRole('button', { name: 'Расписание', exact: true }).click();
  await club.waitForURL(/\/club\/schedule$/);
  await club.getByTestId('club-schedule-search').fill(String(stamp));
  await expect(club.getByTestId('club-schedule-row')).toHaveCount(3);
  await club.screenshot({ path: 'test-results/league-schedule/club.png' });
  const referee = await (await browser.newContext()).newPage();
  await signIn(referee, E2E_REFEREE, '/referee');
  await referee.goto('/referee/league');
  await referee.getByTestId('referee-league-search').fill(String(stamp));
  await expect(referee.getByTestId('referee-league-row').first()).toBeVisible();
  for (const text of await referee.getByTestId('referee-league-row').allTextContents()) expect(text).toContain('Судья (проверки)');
  await referee.screenshot({ path: 'test-results/league-schedule/referee.png' });
});
