import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

import {
  E2E_ADMIN,
  E2E_COACH,
  E2E_DOCTOR,
  E2E_NATIONAL_COACH,
  E2E_PERSONAL_COACH,
  E2E_PSYCHOLOGIST,
  E2E_TEAM_COACH,
} from './global-setup';

/* Национальная команда ✳ (19.11.2026, NATIONAL.md) — сквозные сценарии ролей:
   1) главный тренер вносит в сборную и ведёт план, врач — медкарту, тренеру
      из неё — ограничение без диагноза;
   2) личный тренер составляет план и отправляет на согласование, главный
      возвращает с комментарием и согласует; тренер сборной видит свою группу
      без правки; психолог ведёт спортивную карточку, которой нет у штаба;
   3) штаб заводит сбор в календаре подготовки, старший тренер региона подаёт
      рапорт на своего спортсмена, главный тренер возвращает, автор
      дорабатывает, главный согласует — история из четырёх шагов.
   Спортсмены и мероприятия «[e2e] » сносит засев. */

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

async function apiAs(request: APIRequestContext, account: { email: string; password: string }) {
  const r = await request.post('/api/auth/login/email/', { data: { email: account.email, password: account.password } });
  expect(r.status()).toBe(200);
}

async function makeAthlete(request: APIRequestContext, name: string, region = 'Астана') {
  await apiAs(request, E2E_ADMIN);
  const r = await request.post('/api/rating/athletes/', { data: { name, sex: 'm', region, birth_year: 2009 } });
  expect(r.status(), await r.text()).toBe(201);
}

/** Член сборной через API главного тренера, с личным тренером. */
async function makeMember(request: APIRequestContext, name: string, ageGroup: string) {
  await makeAthlete(request, name);
  await apiAs(request, E2E_NATIONAL_COACH);
  const cands = (await (await request.get('/api/national/members/candidates/?q=' + encodeURIComponent(name))).json()) as { id: string; name: string }[];
  const user = cands.find((c) => c.name === name)!;
  const m = await request.post('/api/national/members/', { data: { user_id: user.id, age_group: ageGroup } });
  expect(m.status(), await m.text()).toBe(201);
  const id = ((await m.json()) as { id: string }).id;
  const coaches = (await (await request.get('/api/national/members/personal-coaches/')).json()) as { id: string; name: string }[];
  const coach = coaches.find((c) => c.name === 'Личный тренер (проверки)')!;
  expect((await request.patch(`/api/national/members/${id}/`, { data: { personal_coach_id: coach.id } })).status()).toBe(200);
  return id;
}

test('сборная: тренер — состав и план, врач — медкарта, тренеру — ограничение без диагноза', async ({ browser, request }) => {
  const stamp = Date.now();
  const athlete = `[e2e] Сборная ${stamp}`;
  await makeAthlete(request, athlete);

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

  await row.click();
  await coach.waitForURL(/\/national\/members\/[0-9a-f-]{36}\/plan$/);
  const memberUrl = coach.url().replace(/\/plan$/, '');
  await expect(coach.getByTestId('member-name')).toHaveText(athlete);
  await coach.getByTestId('plan-create-open').click();
  await coach.getByTestId('plan-goal').fill('Отбор на чемпионат Азии');
  await coach.getByTestId('plan-create-submit').click();
  await expect(coach.getByTestId('plan-progress')).toHaveText('0 из 0');
  for (const title of ['Подача короткая под правую', 'Приём длинной подачи']) {
    await coach.getByTestId('item-create-open').click();
    await coach.getByTestId('item-title').fill(title);
    await coach.getByTestId('item-create-submit').click();
    await expect(coach.locator(`[data-testid="item-row"][data-title="${title}"]`)).toBeVisible();
  }
  await coach.locator('[data-testid="item-row"][data-title="Подача короткая под правую"]').getByTestId('item-done').click();
  await expect(coach.getByTestId('plan-progress')).toHaveText('1 из 2');
  await coach.getByTestId('home-link').click();
  await coach.waitForURL((url) => url.pathname === '/national');
  await expect(row.getByTestId('member-plan')).toHaveText('1 из 2');

  const doctor = await signIn(browser, E2E_DOCTOR, '/doctor');
  const drow = doctor.locator(`[data-testid="member-row"][data-name="${athlete}"]`);
  await expect(drow).toBeVisible();
  await expect(drow.getByTestId('member-plan')).toHaveCount(0);
  await expect(doctor.getByTestId('member-add-open')).toHaveCount(0);
  await drow.click();
  await doctor.waitForURL(/\/doctor\/members\/[0-9a-f-]{36}\/medical$/);

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

  await coach.goto(memberUrl + '/medical');
  await expect(coach.getByTestId('limit-row')).toHaveCount(1);
  await expect(coach.getByTestId('limit-row')).toContainText('Без прыжковой работы');
  await expect(coach.getByText('Растяжение связок голеностопа')).toHaveCount(0);
});

test('сборная: личный тренер составляет план, главный возвращает и согласует; тренер группы и психолог', async ({ browser, request }) => {
  const stamp = Date.now();
  const athlete = `[e2e] Личный ${stamp}`;
  const memberId = await makeMember(request, athlete, 'junior');

  // Личный тренер: план и отправка на согласование.
  const personal = await signIn(browser, E2E_PERSONAL_COACH, '/personal-coach');
  await personal.locator(`[data-testid="member-row"][data-name="${athlete}"]`).click();
  await personal.waitForURL(/\/personal-coach\/members\/[0-9a-f-]{36}\/plan$/);
  await personal.getByTestId('plan-create-open').click();
  await personal.getByTestId('plan-goal').fill('Первенство Азии');
  await personal.getByTestId('plan-create-submit').click();
  await expect(personal.getByTestId('plan-status')).toHaveAttribute('data-status', 'draft');
  await personal.getByTestId('item-create-open').click();
  await personal.getByTestId('item-title').fill('Топспин с подрезки');
  await personal.getByTestId('item-create-submit').click();
  await personal.getByTestId('plan-submit').click();
  await expect(personal.getByTestId('plan-status')).toHaveAttribute('data-status', 'submitted');
  await expect(personal.getByTestId('item-create-open')).toHaveCount(0);

  // Главный тренер: возврат с комментарием.
  const coach = await signIn(browser, E2E_NATIONAL_COACH, '/national');
  await coach.goto(`/national/members/${memberId}/plan`);
  await expect(coach.getByTestId('plan-status')).toHaveAttribute('data-status', 'submitted');
  await expect(coach.getByTestId('strip-personal-coach')).toContainText('Личный тренер (проверки)');
  await coach.getByTestId('plan-return-open').click();
  await coach.getByTestId('plan-return-comment').fill('Добавьте сбор');
  await coach.getByTestId('plan-return-submit').click();
  await expect(coach.getByTestId('plan-status')).toHaveAttribute('data-status', 'returned');

  // Личный тренер видит комментарий и отправляет снова; главный согласует.
  await personal.reload();
  await expect(personal.getByTestId('plan-review-comment')).toContainText('Добавьте сбор');
  await personal.getByTestId('plan-submit').click();
  await expect(personal.getByTestId('plan-status')).toHaveAttribute('data-status', 'submitted');
  await coach.reload();
  await coach.getByTestId('plan-approve').click();
  await expect(coach.getByTestId('plan-status')).toHaveAttribute('data-status', 'approved');
  await expect(coach.getByRole('button', { name: 'Спортивная карточка', exact: true })).toHaveCount(0);
  await coach.screenshot({ path: 'test-results/national/plan-approved.png' });

  // Тренер юношей: видит спортсмена своей группы, без «Внести» и без правки плана.
  const team = await signIn(browser, E2E_TEAM_COACH, '/national');
  await expect(team.locator(`[data-testid="member-row"][data-name="${athlete}"]`)).toBeVisible();
  await expect(team.getByTestId('member-add-open')).toHaveCount(0);
  await team.goto(`/national/members/${memberId}/plan`);
  await expect(team.getByTestId('plan-status')).toHaveAttribute('data-status', 'approved');
  await expect(team.getByTestId('item-create-open')).toHaveCount(0);
  await expect(team.getByTestId('strip-personal-coach')).toHaveCount(0);

  // Психолог: спортивная карточка.
  const psych = await signIn(browser, E2E_PSYCHOLOGIST, '/psychologist');
  await psych.locator(`[data-testid="member-row"][data-name="${athlete}"]`).click();
  await psych.waitForURL(/\/psychologist\/members\/[0-9a-f-]{36}\/sport$/);
  await psych.getByTestId('sport-add-open').click();
  await psych.getByTestId('sport-text').fill('Волнение в решающих партиях');
  await psych.getByTestId('sport-add-submit').click();
  await expect(psych.getByTestId('sport-row')).toContainText('Волнение в решающих партиях');
});

test('сборная: календарь подготовки и рапорт старшего тренера региона — возврат, доработка, согласование', async ({ browser, request }) => {
  const stamp = Date.now();
  const athlete = `[e2e] Рапорт ${stamp}`;
  await makeAthlete(request, athlete, E2E_COACH.region);
  const camp = `[e2e] УТС ${stamp}`;

  // Штаб заводит сбор.
  const coach = await signIn(browser, E2E_NATIONAL_COACH, '/national');
  await coach.getByRole('button', { name: 'Календарь подготовки', exact: true }).click();
  await coach.waitForURL((url) => url.pathname === '/national/calendar');
  await coach.getByTestId('event-create-open').click();
  await coach.getByTestId('event-title').fill(camp);
  await coach.getByTestId('event-city').fill('Щучинск');
  await coach.getByTestId('event-starts').fill(iso(20));
  await coach.getByTestId('event-ends').fill(iso(30));
  await coach.getByTestId('event-submit').click();
  await expect(coach.locator(`[data-testid="event-row"][data-title="${camp}"]`)).toContainText('Щучинск');

  // Старший тренер региона подаёт рапорт.
  const regional = await signIn(browser, E2E_COACH, '/coach');
  await regional.getByRole('button', { name: 'Рапорты', exact: true }).click();
  await regional.waitForURL((url) => url.pathname === '/coach/reports');
  await regional.getByTestId('report-create-open').click();
  const dialog = regional.getByTestId('report-create');
  await pick(regional, 'report-event', `${camp} · ${iso(20).split('-').reverse().join('.')}`);
  await pick(regional, 'report-group', 'Юноши');
  await dialog.getByTestId('report-search').fill(String(stamp));
  await dialog.locator(`[data-testid="report-candidate"][data-name="${athlete}"]`).click();
  await dialog.getByTestId('report-text').fill('Прошу командировать на сбор');
  await dialog.getByTestId('report-submit').click();
  await expect(dialog).toHaveCount(0);
  const rrow = regional.locator(`[data-testid="report-row"][data-event="${camp}"]`);
  await expect(rrow).toHaveAttribute('data-status', 'submitted');

  // Главный тренер: лист рапорта и возврат.
  await coach.getByRole('button', { name: 'Рапорты', exact: true }).click();
  await coach.waitForURL((url) => url.pathname === '/national/reports');
  const crow = coach.locator(`[data-testid="report-row"][data-event="${camp}"]`);
  await crow.click();
  const drawer = coach.getByTestId('report-drawer');
  await expect(drawer.getByTestId('report-athletes')).toContainText(athlete);
  await expect(drawer.getByTestId('report-text-view')).toHaveText('Прошу командировать на сбор');
  await coach.waitForTimeout(500); // снимок — после выезда панели
  await coach.screenshot({ path: 'test-results/national/report-sheet.png' });
  await drawer.getByTestId('report-return-open').click();
  await coach.getByTestId('report-return-comment').fill('Приложите приказ региона');
  await coach.getByTestId('report-return-submit').click();
  await expect(drawer).toHaveCount(0);
  await expect(crow).toHaveAttribute('data-status', 'returned');

  // Автор дорабатывает.
  await regional.reload();
  await rrow.click();
  await expect(regional.getByTestId('report-history')).toContainText('Приложите приказ региона');
  await regional.getByTestId('report-resubmit-open').click();
  await regional.getByTestId('report-resubmit-text').fill('Прошу командировать на сбор. Приказ № 12 приложен');
  await regional.getByTestId('report-resubmit-submit').click();
  await expect(rrow).toHaveAttribute('data-status', 'submitted');

  // Главный тренер согласует — рапорт уходит в федерацию.
  await coach.reload();
  await crow.click();
  await drawer.getByTestId('report-approve').click();
  await expect(crow).toHaveAttribute('data-status', 'approved');
  await crow.click();
  await expect(drawer.getByTestId('report-history-row')).toHaveCount(4);
  await expect(drawer.locator('[data-testid="report-history-row"]').last()).toHaveAttribute('data-action', 'approved');
});
