import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { E2E_ADMIN } from './global-setup';

/* Евразийская лига ✳ (19.11.2026, LEAGUE.md) в кабинете администратора
   федерации: дивизион → две команды (новые клубы) → состав → тур (встреча
   составляется сама) → счёт по Свейтлингу → таблица. Всё «[e2e] » —
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
}

test('лига: дивизион, команды с составом, тур, счёт по Свейтлингу и таблица', async ({ page, request }) => {
  const stamp = Date.now();
  const athletes = await createAthletes(request, stamp, 6);
  await signIn(page);

  // Дивизион.
  await page.getByRole('button', { name: 'Лига', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard/league');
  await page.getByTestId('division-create-open').click();
  const create = page.getByTestId('division-create');
  const division = `[e2e] Лига ${stamp}`;
  await create.getByTestId('division-name').fill(division);
  await create.getByTestId('division-level').fill(String(10 + (stamp % 80)));
  await create.getByRole('button', { name: 'Завести' }).click();
  await page.locator(`[data-testid="division-row"][data-name="${division}"]`).click();
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
  await page.getByTestId('tour-create').getByRole('button', { name: 'Завести' }).click();
  await page.getByTestId('tour-row').first().click();
  await page.waitForURL(/\/dashboard\/league\/tours\/[0-9a-f-]{36}$/);
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
});
