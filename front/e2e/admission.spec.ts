import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_COACH } from './global-setup';

/* Допуск заявки ✳ (19.11.2026, ADMISSION.md).

   1. Условия допуска в «Настройках» раздела «Спортсмены»: вид соревнования
      засеял их, администратор меняет и сохраняет, первая заявка их
      замораживает — поля неактивны, у заголовка замок.
   2. Старший тренер региона в своём кабинете подаёт заявку списком: лишний
      по квоте валит всю заявку и подписан причиной, без него заявка проходит,
      заявленные встают в «Заявлены».

   Спортсмены и турниры — «[e2e] », их сносит засев в global-setup. Готовит их
   отдельная API-сессия администратора, а не страница: страница входит тренером. */

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

async function adminApi(request: APIRequestContext) {
  const r = await request.post('/api/auth/login/email/', { data: { email: E2E_ADMIN.email, password: E2E_ADMIN.password } });
  expect(r.status(), await r.text()).toBe(200);
}

async function createMainStart(request: APIRequestContext, name: string): Promise<string> {
  const r = await request.post('/api/tournaments/', {
    data: { name, starts_at: new Date().toISOString(), format: 'single_elimination', template: 'main_start' },
  });
  expect(r.status(), await r.text()).toBe(201);
  return ((await r.json()) as { id: string }).id;
}

async function createAthlete(request: APIRequestContext, name: string) {
  const r = await request.post('/api/rating/athletes/', {
    data: { name, region: E2E_COACH.region, sex: 'm', birth_date: '2010-03-15' },
  });
  expect(r.status(), await r.text()).toBe(201);
}

test('настройки допуска: засев вида, правка и сохранение, заморозка первой заявкой', async ({ page, request }) => {
  await adminApi(request);
  const name = `[e2e] Допуск ${Date.now()}`;
  const id = await createMainStart(request, name);

  await signIn(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  await page.goto(`/dashboard/tournaments/${id}/players`);
  await page.getByTestId('tournament-settings').click();
  const drawer = page.getByTestId('tournament-settings-drawer');
  const admission = drawer.getByTestId('admission-settings');
  await expect(admission).toHaveAttribute('data-locked', 'false');

  // Засев главного старта: подаёт тренер региона, квота 3, предела нет.
  const coach = admission.getByTestId('admission-applicant-regional_head_coach');
  const self = admission.getByTestId('admission-applicant-self');
  await expect(coach).toHaveAttribute('data-selected', 'true');
  await expect(self).not.toHaveAttribute('data-selected', 'true');
  await expect(admission.getByTestId('admission-quota')).toHaveValue('3');
  await expect(admission.getByTestId('admission-limit')).toHaveValue('');

  // Правка — черновик: без изменений «Сохранить» неактивна.
  const save = drawer.getByTestId('settings-save');
  await expect(save).toBeDisabled();
  await self.getByText('Спортсмен сам').click();
  await expect(self).toHaveAttribute('data-selected', 'true');
  await admission.getByTestId('admission-quota').fill('2');
  await admission.getByTestId('admission-limit').fill('40');
  await page.screenshot({ path: 'test-results/admission/settings.png' });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(drawer).toHaveCount(0);

  const saved = (await (await request.get(`/api/tournaments/${id}/`)).json()) as {
    applicant_kinds: string[];
    region_quota: number | null;
    participant_limit: number | null;
  };
  expect([saved.applicant_kinds, saved.region_quota, saved.participant_limit]).toEqual([
    ['self', 'regional_head_coach'],
    2,
    40,
  ]);

  // Первая заявка (администратор записался сам — теперь самозапись разрешена)
  // замораживает условия: поля неактивны, у заголовка замок.
  const join = await request.post(`/api/tournaments/${id}/participants/join/`);
  expect(join.status(), await join.text()).toBe(201);
  await page.reload();
  await page.getByTestId('tournament-settings').click();
  const locked = page.getByTestId('tournament-settings-drawer').getByTestId('admission-settings');
  await expect(locked).toHaveAttribute('data-locked', 'true');
  await expect(locked.getByTestId('admission-locked')).toBeVisible();
  await expect(locked.getByTestId('admission-quota')).toBeDisabled();
  await page.screenshot({ path: 'test-results/admission/settings-locked.png' });
});

test('старший тренер региона: заявка списком, лишний по квоте валит всю заявку', async ({ page, request }) => {
  await adminApi(request);
  const stamp = Date.now();
  const name = `[e2e] ЧРК тренера ${stamp}`;
  const id = await createMainStart(request, name);
  const athletes = [1, 2, 3, 4].map((n) => `[e2e] Заявка ${stamp} №${n}`);
  for (const a of athletes) await createAthlete(request, a);

  // Вход ведёт тренера в его кабинет.
  await signIn(page, E2E_COACH);
  await page.waitForURL((url) => url.pathname === '/coach');
  await page.goto(`/coach/tournaments/${id}`);

  // Сведения: кто подаёт и квота — из условий допуска турнира.
  const facts = page.getByTestId('tournament-fact');
  await expect(facts.filter({ hasText: 'Заявку подаёт' })).toContainText('Старший тренер региона');
  await expect(facts.filter({ hasText: 'Квота региона' })).toContainText('3');
  await expect(page.getByTestId('coach-entries')).toContainText('Пока никого');

  await page.getByTestId('application-open').click();
  const dialog = page.getByTestId('application-dialog');
  await dialog.getByTestId('application-search').fill(String(stamp));
  const candidates = dialog.getByTestId('application-candidate');
  await expect(candidates).toHaveCount(4);
  await expect(candidates.first()).toContainText(E2E_COACH.region);
  for (const a of athletes) await dialog.locator(`[data-name="${a}"]`).click();
  const submit = dialog.getByTestId('application-submit');
  await expect(submit).toHaveText('Подать заявку (4)');
  await submit.click();

  // Четвёртый сверх квоты: заявка не прошла целиком, причина — у одного.
  const refused = dialog.locator('[data-refused="true"]');
  await expect(refused).toHaveCount(1);
  await expect(refused.getByTestId('application-reason')).toContainText('Сверх квоты региона');
  await expect(refused).toHaveAttribute('data-name', athletes[3]);
  await page.screenshot({ path: 'test-results/admission/coach-refused.png' });
  const after = (await (await request.get(`/api/tournaments/${id}/`)).json()) as { participant_count: number };
  expect(after.participant_count).toBe(0);

  // Убрали лишнего — заявка проходит, все трое в «Заявлены».
  const extra = (await refused.getAttribute('data-name'))!;
  await refused.click();
  await expect(submit).toHaveText('Подать заявку (3)');
  await submit.click();
  await expect(dialog).toHaveCount(0);
  const entries = page.getByTestId('coach-entry');
  await expect(entries).toHaveCount(3);
  await expect(page.getByTestId('coach-entries')).not.toContainText(extra);
  await page.screenshot({ path: 'test-results/admission/coach-entered.png' });

  // В выдаче остался только лишний — заявленных второй раз не предлагают.
  await page.getByTestId('application-open').click();
  await page.getByTestId('application-search').fill(String(stamp));
  await expect(page.getByTestId('application-candidate')).toHaveCount(1);
  await expect(page.getByTestId('application-candidate')).toHaveAttribute('data-name', extra);
  // Esc в поле поиска очищает поле, а не окно — закрываем «Отменой».
  await page.getByTestId('application-dialog').getByRole('button', { name: 'Отмена' }).click();
  await expect(page.getByTestId('application-dialog')).toHaveCount(0);

  // «Отозвать» с подтверждением: спортсмен выходит из турнира и снова в кандидатах.
  const first = entries.first();
  const withdrawn = (await first.getAttribute('data-name'))!;
  await first.getByTestId('withdraw').click();
  await expect(page.getByTestId('withdraw-confirm')).toContainText(withdrawn);
  await page.screenshot({ path: 'test-results/admission/coach-withdraw.png' });
  await page.getByTestId('withdraw-confirm').getByRole('button', { name: 'Отозвать' }).click();
  await expect(entries).toHaveCount(2);
  await expect(page.getByTestId('coach-entries')).not.toContainText(withdrawn);
  await page.getByTestId('application-open').click();
  await page.getByTestId('application-search').fill(String(stamp));
  await expect(page.getByTestId('application-candidate')).toHaveCount(2);
  await expect(page.locator(`[data-testid="application-candidate"][data-name="${withdrawn}"]`)).toHaveCount(1);
});
