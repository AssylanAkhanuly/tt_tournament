import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_CLUB_ADMIN } from './global-setup';

/* Заявка команды клубом ✳ (19.11.2026, LEAGUE.md «Заявка клуба»): федерация
   заводит сезон с открытой регистрацией и лигу → администратор клуба в своём
   кабинете заявляет команду и сам набирает состав → федерация в «Командах»
   сезона отклоняет с комментарием → клуб видит причину и подаёт снова →
   федерация принимает → состав клубу больше не правится. Всё «[e2e] » сносит
   засев. */

async function signIn(page: Page, who: { email: string; password: string }, home: string) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === home);
}

async function api(request: APIRequestContext) {
  const r = await request.post('/api/auth/login/email/', { data: { email: E2E_ADMIN.email, password: E2E_ADMIN.password } });
  expect(r.status()).toBe(200);
}

test('клуб заявляет команду и состав, федерация отклоняет, клуб подаёт снова, федерация принимает', async ({ page, browser, request }) => {
  const stamp = Date.now();
  // Сезон с открытой регистрацией и лига — федерация, по API: экран сезона проверяет league.spec.ts.
  await api(request);
  const until = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const season = await (
    await request.post('/api/league/seasons/', { data: { year: 2026, name: `[e2e] Сезон клуба ${stamp}`, registration_until: until } })
  ).json();
  const league = `[e2e] Лига клуба ${stamp}`;
  const div = await request.post('/api/league/divisions/', {
    data: { season_id: season.id, gender: 'm', name: league, level: 100 + (stamp % 800) },
  });
  expect(div.status(), await div.text()).toBe(201);

  // Клуб: кабинет «Команды» → «Заявить команду» в открытый сезон.
  await signIn(page, E2E_CLUB_ADMIN, '/club');
  await page.getByTestId('club-apply-open').click();
  const apply = page.getByTestId('club-apply');
  await apply.getByTestId('club-apply-season').click();
  await page.getByRole('option', { name: season.name, exact: true }).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await apply.getByTestId('club-apply-division').click();
  await page.getByRole('option', { name: `${league} · мужчины`, exact: true }).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  const teamName = `[e2e] Команда клуба ${stamp}`;
  await apply.getByTestId('club-apply-name').fill(teamName);
  await page.screenshot({ path: 'test-results/club/apply.png' });
  await apply.getByRole('button', { name: 'Подать заявку' }).click();

  // Сразу открывается состав: заявка «ждёт решения», клуб набирает игроков сам.
  const squad = page.getByTestId('squad-dialog');
  await expect(squad.getByTestId('team-status')).toHaveText('Ждёт решения');
  // Три разных кандидата сразу: список обновляется после каждого добавления.
  await expect(squad.getByTestId('squad-candidate').nth(2)).toBeVisible();
  const names = await squad.getByTestId('squad-candidate').evaluateAll((els) => els.slice(0, 3).map((e) => e.getAttribute('data-name')!));
  for (const [i, name] of names.entries()) {
    await squad.locator(`[data-testid="squad-candidate"][data-name="${name}"]`).click();
    await expect(squad.getByTestId('squad-member')).toHaveCount(i + 1);
  }
  await page.screenshot({ path: 'test-results/club/squad.png' });
  await page.keyboard.press('Escape');
  const row = page.locator(`[data-testid="club-team-row"][data-name="${teamName}"]`);
  await expect(row).toContainText('3');
  await expect(row).toHaveAttribute('data-status', 'submitted');

  // Федерация: «Команды» сезона — заявка ждёт; отказ без причины не проходит.
  const admin = await (await browser.newContext()).newPage();
  await signIn(admin, E2E_ADMIN, '/dashboard');
  await admin.goto(`/dashboard/league/seasons/${season.id}/teams`);
  const pending = admin.locator(`[data-testid="season-team-row"][data-name="${teamName}"]`);
  await expect(pending.getByTestId('team-status')).toHaveText('Ждёт решения');
  await pending.click();
  const decision = admin.getByTestId('team-decision');
  await expect(decision.getByTestId('team-decision-squad').locator('li')).toHaveCount(3);
  await decision.getByTestId('team-reject').click();
  await expect(decision.getByTestId('team-reject-confirm')).toBeDisabled();
  await decision.getByTestId('team-reject-comment').fill('Нет чека взноса');
  await admin.screenshot({ path: 'test-results/club/decision.png' });
  await decision.getByTestId('team-reject-confirm').click();
  await expect(decision).toHaveCount(0);
  await expect(pending.getByTestId('team-status')).toHaveText('Отклонена');

  // Клуб: причина видна, «Подать снова».
  await page.reload();
  await row.click();
  await expect(page.getByTestId('club-team-comment')).toContainText('Нет чека взноса');
  await page.getByTestId('club-team-resubmit').click();
  await expect(squad.getByTestId('team-status')).toHaveText('Ждёт решения');
  await page.keyboard.press('Escape');

  // Федерация принимает.
  await admin.reload();
  await pending.click();
  await decision.getByTestId('team-accept').click();
  await expect(decision).toHaveCount(0);
  await expect(pending.getByTestId('team-status')).toHaveText('Принята');

  // Клуб: состав принятой заявки только смотреть.
  await page.reload();
  await expect(row).toHaveAttribute('data-status', 'accepted');
  await row.click();
  await expect(squad.getByTestId('squad-member')).toHaveCount(3);
  await expect(squad.getByTestId('squad-search')).toHaveCount(0);
  await expect(squad.getByTestId('squad-remove')).toHaveCount(0);
  await expect(page.getByTestId('club-team-state')).toContainText('Заявка принята — состав меняет федерация.');
  await page.screenshot({ path: 'test-results/club/accepted.png' });
});
