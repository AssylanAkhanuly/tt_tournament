import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { E2E_ADMIN } from './global-setup';

/* Евразийская лига ✳ (19.11.2026, LEAGUE.md) в кабинете администратора
   федерации: сезон — «Новым турниром» с видом «Евразийская лига» → страница
   сезона, регистрация команд открывается → лига сезона → две команды (новые
   клубы) → состав → тур (встреча составляется сама) → счёт по Свейтлингу →
   таблица лиги → знаком вверх: сезон, календарь — сезон в «Месяце» в клетке дня
   тура и строкой в «Таблице». Всё «[e2e] » —
   сносит засев в global-setup (дивизионы, команды, клубы, спортсмены). */

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(E2E_ADMIN.email);
  await page.getByLabel('Пароль').fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');
}

async function createAthletes(request: APIRequestContext, stamp: number, n: number) {
  const r0 = await request.post('/api/auth/login/email/', { data: { email: E2E_ADMIN.email, password: E2E_ADMIN.password } });
  expect(r0.status()).toBe(200);
  const names: string[] = [];
  for (let i = 1; i <= n; i++) {
    const name = `[e2e] Лига ${stamp} №${i}`;
    const r = await request.post('/api/rating/athletes/', { data: { name, sex: 'm', region: 'Астана', birth_year: 2000 } });
    expect(r.status(), await r.text()).toBe(201);
    names.push(name);
  }
  return names;
}

async function addTeam(page: Page, club: string) {
  await page.getByTestId('team-create-open').click();
  const dialog = page.getByTestId('team-create');
  // Клубов может не быть вовсе — тогда «Новый клуб…» выбран сам.
  if (await dialog.getByTestId('team-new-club').count() === 0) {
    await dialog.getByTestId('team-club').click();
    await page.getByRole('option', { name: 'Новый клуб…' }).click();
  }
  await dialog.getByTestId('team-new-club').fill(club);
  await dialog.getByRole('button', { name: 'Заявить' }).click();
  await expect(dialog).toHaveCount(0);
}

async function fillSquad(page: Page, team: string, athletes: string[], stamp: number) {
  await page.locator(`[data-testid="team-row"][data-name="${team}"]`).click();
  const squad = page.getByTestId('squad-dialog');
  for (const name of athletes) {
    await squad.getByTestId('squad-search').fill(String(stamp));
    await squad.locator(`[data-testid="squad-candidate"][data-name="${name}"]`).click();
    await expect(squad.locator(`[data-testid="squad-member"][data-name="${name}"]`)).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(squad).toHaveCount(0);
}

async function pick(page: Page, testId: string, option: string) {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: option, exact: true }).click();
  // Список закрывается с анимацией: следующий выбор не должен видеть его пункты.
  await expect(page.getByRole('listbox')).toHaveCount(0);
}

test('лига: сезон, лига, команды с составом, тур, счёт по Свейтлингу и таблица', async ({ page, request }) => {
  const stamp = Date.now();
  // Тур — в текущем месяце: «Месяц» открывается на нём.
  const now = new Date();
  const tourDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getDate() === 21 ? '22' : '21'}`;
  const athletes = await createAthletes(request, stamp, 6);
  await signIn(page);

  // Лиги нет ни разделом меню, ни подпунктом: только «Месяц» и «Таблица».
  await expect(page.getByRole('navigation').getByText('Лига', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('nav-sub')).toHaveText(['Месяц', 'Таблица']);

  // Сезон — «Новый турнир» с видом «Евразийская лига»: год, без дат и формата;
  // после «Завести» — страница сезона.
  await page.getByTestId('tournament-create-open').click();
  const create = page.getByTestId('tournament-create');
  const seasonName = `[e2e] Сезон ${stamp}`;
  const division = `[e2e] Лига ${stamp}`;
  await create.getByLabel('Название').fill(seasonName);
  await pick(page, 'tournament-kind-picker', 'Евразийская лига');
  await expect(create.getByTestId('tournament-date')).toHaveCount(0);
  await expect(create.getByTestId('season-year')).toHaveValue(String(now.getFullYear()));
  await page.screenshot({ path: 'test-results/league/create.png' });
  await create.getByRole('button', { name: 'Завести' }).click();
  await page.waitForURL(/\/dashboard\/league\/seasons\/[0-9a-f-]{36}\/leagues$/);
  const seasonUrl = page.url();

  // «Команды» сезона: пока пусто; регистрация нового сезона закрыта, пока её не
  // открыли, — в «Настройках», как приём заявок у спортсменов турнира.
  await page.getByRole('button', { name: 'Команды', exact: true }).click();
  await page.waitForURL(/\/seasons\/[0-9a-f-]{36}\/teams$/);
  await expect(page.getByTestId('table-empty')).toBeVisible();
  await page.getByTestId('season-settings').click();
  const drawer = page.getByTestId('season-settings-drawer');
  const save = drawer.getByTestId('season-save');
  await expect(save).toBeDisabled();
  await drawer.getByTestId('season-registration-switch').click();
  await expect(drawer.getByTestId('season-registration-until')).toBeVisible();
  await page.screenshot({ path: 'test-results/league/season-settings.png' });
  await save.click();
  await expect(drawer).toHaveCount(0);

  // Лига сезона.
  await page.getByRole('button', { name: 'Лиги', exact: true }).click();
  await page.waitForURL(/\/leagues$/);
  await page.getByTestId('league-create-open').click();
  const newLeague = page.getByTestId('league-create');
  await newLeague.getByTestId('league-name').fill(division);
  await newLeague.getByTestId('league-level').fill(String(10 + (stamp % 80)));
  await newLeague.getByRole('button', { name: 'Завести' }).click();
  await expect(newLeague).toHaveCount(0);
  await page.screenshot({ path: 'test-results/league/season.png' });
  // Строка лиги раскрывается: туров ещё нет; «Открыть лигу» — на её страницу.
  await page.locator(`[data-testid="league-row"][data-name="${division}"]`).click();
  await expect(page.getByTestId('league-tours')).toContainText('Туров нет');
  await page.getByTestId('league-open').click();
  await page.waitForURL(/\/dashboard\/league\/[0-9a-f-]{36}\/table$/);

  // Две команды из новых клубов, по три игрока в составе.
  await page.getByRole('button', { name: 'Команды', exact: true }).click();
  await page.waitForURL(/\/teams$/);
  const clubA = `[e2e] Клуб А ${stamp}`;
  const clubB = `[e2e] Клуб Б ${stamp}`;
  await addTeam(page, clubA);
  await addTeam(page, clubB);
  await fillSquad(page, clubA, athletes.slice(0, 3), stamp);
  await fillSquad(page, clubB, athletes.slice(3, 6), stamp);
  await expect(page.locator(`[data-testid="team-row"][data-name="${clubA}"]`)).toContainText('3');
  await page.screenshot({ path: 'test-results/league/teams.png' });

  // Тур — встреча составляется сама.
  await page.getByRole('button', { name: 'Туры', exact: true }).click();
  await page.waitForURL(/\/tours$/);
  await page.getByTestId('tour-create-open').click();
  await page.getByTestId('tour-create').getByTestId('tour-city').fill('Астана');
  // Дата — русское поле по сегментам (день, месяц, год), а не родное браузерное.
  await page.getByTestId('tour-create').getByRole('spinbutton', { name: /день/ }).click();
  await page.keyboard.type(tourDay.split('-').reverse().join(''));
  await page.getByTestId('tour-create').getByRole('button', { name: 'Завести' }).click();
  await page.getByTestId('tour-row').first().click();
  await page.waitForURL(/\/dashboard\/league\/tours\/[0-9a-f-]{36}\/matches$/);
  await expect(page.getByTestId('match-row')).toHaveCount(1);

  // Счёт: расстановка и три победы подряд — встреча решена, четвёртая неактивна.
  await page.getByTestId('match-row').click();
  const dialog = page.getByTestId('match-dialog');
  for (let i = 0; i < 3; i++) {
    await pick(page, `lineup-a-${i}`, athletes[i]);
    await pick(page, `lineup-b-${i}`, athletes[3 + i]);
  }
  for (const [i, s] of ['3 : 1', '3 : 0', '3 : 2'].entries()) await pick(page, `rubber-${i}`, s);
  await expect(dialog.getByTestId('rubber-3')).toBeDisabled();
  await page.screenshot({ path: 'test-results/league/result.png' });
  await dialog.getByTestId('result-save').click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('match-row')).toContainText('3 : 0');

  // Таблица дивизиона: победитель — первым, 2 очка; проигравший — 1.
  // Знак в шапке со страницы тура ведёт к турам дивизиона.
  await page.getByTestId('home-link').click();
  await page.waitForURL(/\/dashboard\/league\/[0-9a-f-]{36}\/tours$/);
  await page.getByRole('button', { name: 'Таблица', exact: true }).click();
  await page.waitForURL(/\/table$/);
  const rows = page.getByTestId('standing-row');
  await expect(rows.first()).toHaveAttribute('data-team', clubA);
  await expect(rows.first()).toContainText('2');
  await expect(rows.nth(1)).toHaveAttribute('data-team', clubB);
  await page.screenshot({ path: 'test-results/league/table.png' });

  // Знак со страницы лиги — в сезон, оттуда — в календарь. Сезон стоит в клетке
  // дня тура; карточка — сведения сезона, «Подробнее» ведёт на страницу сезона.
  await page.getByTestId('home-link').click();
  await page.waitForURL(seasonUrl);
  // Сводка лиги: две команды, первый сегмент — тур сыгран, в раскрытии «Сыграно».
  const leagueRow = page.locator(`[data-testid="league-row"][data-name="${division}"]`);
  await expect(leagueRow).toContainText('2 команды');
  await expect(leagueRow.getByTestId('league-tour-seg').first()).toHaveAttribute('data-state', 'done');
  await leagueRow.click();
  await expect(page.getByTestId('league-tour-row').first()).toContainText('Сыграно');
  // «Команды» сезона — обе команды с лигой и составом, внесены федерацией —
  // «Принята»; строка открывает карточку заявки, из неё — в команды лиги.
  await page.getByRole('button', { name: 'Команды', exact: true }).click();
  await page.waitForURL(/\/teams$/);
  const teamA = page.locator(`[data-testid="season-team-row"][data-name="${clubA}"]`);
  await expect(page.getByTestId('season-team-row')).toHaveCount(2);
  await expect(teamA).toContainText(division);
  await expect(teamA).toContainText('3');
  await expect(teamA.getByTestId('team-status')).toHaveText('Принята');
  await page.screenshot({ path: 'test-results/league/season-teams.png' });
  await teamA.click();
  await expect(page.getByTestId('team-decision-squad').locator('li')).toHaveCount(3);
  await page.getByTestId('team-decision').getByRole('button', { name: 'Открыть лигу' }).click();
  await page.waitForURL(/\/dashboard\/league\/[0-9a-f-]{36}\/teams$/);
  // Знак ведёт в сезон, когда лига загрузилась (до того — в календарь).
  await expect(page.locator(`[data-testid="team-row"][data-name="${clubA}"]`)).toBeVisible();
  await page.getByTestId('home-link').click();
  await page.waitForURL(seasonUrl);
  await page.getByTestId('home-link').click();
  await page.waitForURL((url) => url.pathname === '/dashboard' && !url.searchParams.get('view'));
  const title = `Евразийская лига · ${seasonName}`;
  const event = page.locator(`[data-day="${tourDay}"]`).getByText(title);
  await expect(event).toBeVisible();
  await event.click();
  const card = page.getByTestId('tournament-details');
  await expect(card).toContainText('Астана');
  await expect(card).toContainText('встреч сыграно 1 из 1');
  await expect(card).toContainText('Лиг: 1, туров: 1');
  await expect(card).toContainText('Команд: 2');
  await expect(card).toContainText('Регистрация идёт');
  await page.screenshot({ path: 'test-results/league/calendar.png' });
  await card.getByRole('button', { name: 'Подробнее' }).click();
  await page.waitForURL(seasonUrl);

  // В «Таблице» календаря — строкой рядом с турнирами, со значком вида.
  await page.goto('/dashboard?view=table');
  await page.getByTestId('tournament-search').fill(seasonName);
  const row = page.getByTestId('tournament-table-row').filter({ hasText: seasonName });
  await expect(row).toHaveCount(1);
  await expect(row.getByTestId('tournament-kind')).toHaveText('Евразийская лига');
  await expect(row).toContainText('Командные встречи');
  await page.screenshot({ path: 'test-results/league/table-row.png' });
});
