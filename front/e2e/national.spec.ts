import { expect, test, type Browser, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_DOCTOR, E2E_NATIONAL_COACH } from './global-setup';

/* Национальная команда ✳ (19.11.2026, NATIONAL.md). Главный тренер вносит
   спортсмена в сборную, заводит план и отмечает пункт — в составе «1 из 2»;
   врач видит того же спортсмена без колонки плана и ведёт медкарту — допуск
   и травму с ограничением нагрузки; тренер в медкарте видит ограничение, но
   не диагноз. Спортсмены «[e2e] » — их и членство в сборной сносит засев. */

const iso = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

async function signIn(browser: Browser, account: { email: string; password: string }, home: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(account.email);
  await page.getByLabel('Пароль').fill(account.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === home);
  return page;
}

async function pick(page: Page, testId: string, option: string) {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('сборная: тренер — состав и план, врач — медкарта, тренеру — ограничение без диагноза', async ({ browser, request }) => {
  const stamp = Date.now();
  const athlete = `[e2e] Сборная ${stamp}`;
  expect((await request.post('/api/auth/login/email/', { data: E2E_ADMIN })).status()).toBe(200);
  const made = await request.post('/api/rating/athletes/', { data: { name: athlete, sex: 'm', region: 'Астана', birth_year: 2008 } });
  expect(made.status(), await made.text()).toBe(201);

  // Главный тренер: внести в сборную.
  const coach = await signIn(browser, E2E_NATIONAL_COACH, '/national');
  await coach.getByTestId('member-add-open').click();
  const add = coach.getByTestId('member-add');
  await add.getByTestId('member-search').fill(String(stamp));
  await add.locator(`[data-testid="member-candidate"][data-name="${athlete}"]`).click();
  await pick(coach, 'member-age-group', 'Юноши');
  await add.getByTestId('member-add-submit').click();
  await expect(add).toHaveCount(0);
  const row = coach.locator(`[data-testid="member-row"][data-name="${athlete}"]`);
  await expect(row).toContainText('Юноши');
  await expect(row.getByTestId('member-plan')).toHaveText('Нет');
  await expect(row.getByTestId('clearance')).toHaveAttribute('data-status', 'none');

  // План: период, два пункта, один выполнен.
  await row.click();
  await coach.waitForURL(/\/national\/members\/[0-9a-f-]{36}\/plan$/);
  const memberUrl = coach.url().replace(/\/plan$/, '');
  await expect(coach.getByTestId('member-name')).toHaveText(athlete);
  await coach.getByTestId('plan-create-open').click();
  await coach.getByTestId('plan-goal').fill('Отбор на чемпионат Азии');
  await coach.getByTestId('plan-create-submit').click();
  await expect(coach.getByTestId('plan-progress')).toHaveText('0 из 0');
  for (const title of ['Подача короткая под правую', 'УТС, Алматы']) {
    await coach.getByTestId('item-create-open').click();
    await coach.getByTestId('item-title').fill(title);
    await coach.getByTestId('item-create-submit').click();
    await expect(coach.locator(`[data-testid="item-row"][data-title="${title}"]`)).toBeVisible();
  }
  await coach.locator('[data-testid="item-row"][data-title="Подача короткая под правую"]').getByTestId('item-done').click();
  await expect(coach.getByTestId('plan-progress')).toHaveText('1 из 2');
  await coach.screenshot({ path: 'test-results/national/plan.png' });
  await coach.getByTestId('home-link').click();
  await coach.waitForURL((url) => url.pathname === '/national');
  await expect(row.getByTestId('member-plan')).toHaveText('1 из 2');

  // Врач: тот же спортсмен, без плана; допуск и травма.
  const doctor = await signIn(browser, E2E_DOCTOR, '/doctor');
  const drow = doctor.locator(`[data-testid="member-row"][data-name="${athlete}"]`);
  await expect(drow).toBeVisible();
  await expect(drow.getByTestId('member-plan')).toHaveCount(0);
  await expect(doctor.getByTestId('member-add-open')).toHaveCount(0);
  await drow.click();
  await doctor.waitForURL(/\/doctor\/members\/[0-9a-f-]{36}$/);

  await doctor.getByTestId('medical-add-open').click();
  await doctor.getByTestId('medical-until').fill(iso(180));
  await doctor.getByTestId('medical-title').fill('Годен');
  await doctor.getByTestId('medical-submit').click();
  await expect(doctor.getByTestId('member-strip').getByTestId('clearance')).toHaveAttribute('data-status', 'ok');

  await doctor.getByTestId('medical-add-open').click();
  await pick(doctor, 'medical-kind', 'Травма');
  await doctor.getByTestId('medical-until').fill(iso(14));
  await doctor.getByTestId('medical-title').fill('Растяжение связок голеностопа');
  await doctor.getByTestId('medical-limit').fill('Без прыжковой работы');
  await doctor.getByTestId('medical-submit').click();
  await expect(doctor.getByTestId('medical-row')).toHaveCount(2);
  await expect(doctor.locator('[data-testid="medical-row"][data-kind="injury"]')).toContainText('Растяжение связок голеностопа');
  await doctor.screenshot({ path: 'test-results/national/medical-doctor.png' });

  // Тренер в медкарте: ограничение видно, диагноза нет.
  await coach.goto(memberUrl + '/medical');
  await expect(coach.getByTestId('limit-row')).toHaveCount(1);
  await expect(coach.getByTestId('limit-row')).toContainText('Без прыжковой работы');
  await expect(coach.getByTestId('member-strip').getByTestId('clearance')).toHaveAttribute('data-status', 'ok');
  await expect(coach.getByText('Растяжение связок голеностопа')).toHaveCount(0);
  await coach.screenshot({ path: 'test-results/national/medical-coach.png' });
});
