import { expect, test, type Browser, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_DEPUTY, E2E_REFEREE, E2E_SECRETARY } from './global-setup';

/* Бригада турнира ✳ (24.11.2026, flows/07 «Главный секретарь», flows/08
   «Заместитель главного судьи»; решения совещания 04.11.2026).

   Администратор (своя API-сессия) заводит турнир «группы + плей-офф» из двух
   спортсменов засева и сам становится главным судьёй; секретарь, заместитель и
   судья стола — учётки проверок. Секретарь в своём кабинете собирает черновик
   и передаёт его главному судье — «Отправить» у него нет; судья отправляет.
   Судья стола подтверждает счёт. Главный судья на «Столах» передаёт
   полномочия заместителю — и сам перестаёт править счёт; заместитель
   исправляет счёт и возвращает полномочия. Турнир удаляется в конце. */

test.use({ actionTimeout: 15_000 });

const DAY = [{ date: '2026-11-22', start: '10:00', end: '18:00' }];

async function войти(page: Page, who: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

async function окно(browser: Browser, baseURL: string | undefined) {
  return (await browser.newContext({ baseURL })).newPage();
}

test('секретарь передаёт расписание судье; полномочия у заместителя — правит он, судья только смотрит', async ({ page, browser }, info) => {
  test.setTimeout(240_000); // четыре окна; новые маршруты dev-сервер собирает при первом заходе
  await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
  const created = await page.request.post('/api/tournaments/', {
    data: { name: `[e2e] Бригада ${Date.now()}`, starts_at: new Date(2026, 10, 22, 12).toISOString(), format: 'group_playoff', group_size: 4, games_to_win: 3 },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const candidates = async (role: string, q = '') =>
    (await (await page.request.get(`/api/tournaments/${id}/candidates/?role=${role}&q=${encodeURIComponent(q)}`)).json()) as {
      id: string;
      email: string | null;
    }[];
  const seeded = (c: { email: string | null }) => !(c.email ?? '').startsWith('e2e-');
  const base = info.project.use.baseURL;

  try {
    for (const p of (await candidates('player')).filter(seeded).slice(0, 2)) {
      expect((await page.request.post(`/api/tournaments/${id}/participants/`, { data: { user_id: p.id } })).status()).toBe(201);
    }
    const assign = async (email: string, position: string) => {
      const [u] = await candidates('referee', email);
      const r = await page.request.post(`/api/tournaments/${id}/referees/`, { data: { user_id: u.id, position } });
      expect(r.status(), await r.text()).toBe(201);
    };
    await assign(E2E_ADMIN.email, 'chief_referee');
    await assign(E2E_SECRETARY.email, 'chief_secretary');
    await assign(E2E_DEPUTY.email, 'deputy_chief_referee');
    await assign(E2E_REFEREE.email, 'referee');

    // ── Секретарь: кабинет «Главный секретарь», рабочий стол, черновик ─────
    const sec = await окно(browser, base);
    await войти(sec, E2E_SECRETARY);
    // Судья после входа — в кабинете судьи (старшинство ролей), в кабинет бригады — по адресу или «Работать как».
    await sec.waitForURL((url) => url.pathname === '/referee');
    await sec.goto('/secretary');
    await expect(sec.getByTestId('side-person')).toBeVisible();
    await sec.goto(`/secretary/tournaments/${id}`);
    await sec.waitForURL((url) => url.pathname === `/secretary/tournaments/${id}/info`);
    await expect(sec.getByRole('navigation', { name: 'Вкладки страницы' }).getByRole('button')).toHaveText([
      'Сведения',
      'Спортсмены',
      'Судьи',
      'Расписание',
      'Столы',
    ]);
    // «Сведения» — тот же обзор, что у главного судьи, только на чтение.
    await expect(sec.getByTestId('tournament-overview')).toBeVisible();
    // Только просмотр — значения текстом, полей нет.
    await expect(sec.getByTestId('params-name')).toHaveText(/Бригада/);
    await expect(sec.getByTestId('overview-params').locator('input, textarea, button[role="switch"], [role="switch"]')).toHaveCount(0);
    await expect(sec.getByTestId('overview-place-edit')).toHaveCount(0);
    // Полномочия у главного судьи — секретарю в углу «Только просмотр», имени держателя нет.
    await expect(sec.getByTestId('authority-view-only')).toBeVisible();
    await expect(sec.getByText('Администратор федерации (проверки)')).toHaveCount(0);
    // Передавать полномочия может только главный судья — у секретаря кнопок нет.
    await expect(sec.getByTestId('authority-transfer')).toHaveCount(0);
    // «Спортсмены» и «Судьи» — только смотреть: без «Добавить» и «Настроек».
    await sec.goto(`/secretary/tournaments/${id}/players?view=table`);
    await expect(sec.getByTestId('participant-row')).toHaveCount(2);
    await expect(sec.getByRole('button', { name: 'Добавить' })).toHaveCount(0);
    await sec.goto(`/secretary/tournaments/${id}/referees`);
    await expect(sec.locator('[data-testid="referee-row"][data-position="chief_secretary"]')).toContainText('Секретарь (проверки)');
    await expect(sec.getByRole('button', { name: 'Добавить' })).toHaveCount(0);
    await expect(sec.getByTestId('nav-sub')).toHaveCount(0);
    const built = await sec.request.post(`/api/tournaments/${id}/schedule/build/`, { data: { tables: 1, match_minutes: 30, days: DAY } });
    expect(built.status(), await built.text()).toBe(200);
    await sec.goto(`/secretary/tournaments/${id}/schedule`);
    await expect(sec.getByTestId('schedule-finalize')).toHaveCount(0);
    await sec.getByTestId('schedule-submit').click();
    await expect(sec.getByTestId('schedule-submitted')).toHaveText('У главного судьи');
    await expect(sec.getByTestId('schedule-submit')).toHaveCount(0);
    await sec.screenshot({ path: 'test-results/brigade/secretary-schedule.png' });

    // ── Главный судья видит переданное и отправляет ─────────────────────────
    const snap = (await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json()) as { submitted_at: string | null; can_finalize: boolean };
    expect(snap.submitted_at).not.toBeNull();
    expect(snap.can_finalize).toBe(true);
    expect((await page.request.post(`/api/tournaments/${id}/schedule/finalize/`)).status()).toBe(200);
    const sched = (await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json()) as { matches: { id: number }[] };
    const match = sched.matches[0];

    // ── Судья стола подтверждает 3:1 ─────────────────────────────────────────
    const ref = await окно(browser, base);
    await ref.request.post('/api/auth/login/email/', { data: E2E_REFEREE });
    const sub = await ref.request.post(`/api/tournaments/${id}/group-matches/${match.id}/scoring/`, { data: { action: 'submit', score1: 3, score2: 1 } });
    expect(sub.status(), await sub.text()).toBe(200);

    // ── Главный судья: «Столы», правит; передаёт заместителю — больше не правит ─
    const chief = await окно(browser, base);
    await войти(chief, E2E_ADMIN);
    await chief.waitForURL((url) => url.pathname === '/dashboard');
    await chief.goto(`/chief/tournaments/${id}/tables`);
    const bar = chief.getByTestId('authority-bar');
    await expect(bar).toHaveAttribute('data-holder', 'chief_referee');
    await expect(bar.getByTestId('authority-view-only')).toHaveCount(0);
    await expect(chief.getByTestId('tables-correct')).toHaveCount(1);
    await chief.locator('[data-testid="authority-transfer"][data-to="deputy_chief_referee"]').click();
    await expect(bar).toHaveAttribute('data-holder', 'deputy_chief_referee');
    await expect(bar.getByTestId('authority-view-only')).toBeVisible();
    await expect(bar).toHaveAttribute('data-transferred', 'true');
    await expect(chief.getByTestId('tables-correct')).toHaveCount(0);
    await expect(chief.getByTestId('authority-return')).toBeVisible();
    await chief.screenshot({ path: 'test-results/brigade/chief-transferred.png' });
    // «Судьи» → «Доступ к правке»: правит заместитель; у судьи стола — свои матчи.
    await chief.goto(`/chief/tournaments/${id}/referees`);
    const access = (position: string) => chief.locator(`[data-testid="referee-row"][data-position="${position}"] [data-testid="referee-access"]`);
    await expect(access('deputy_chief_referee')).toHaveAttribute('data-access', 'run');
    await expect(access('chief_referee')).toHaveAttribute('data-access', 'view');
    await expect(access('referee')).toHaveAttribute('data-access', 'own');
    await expect(chief.getByTestId('person-avatar').first()).toBeVisible();
    await chief.screenshot({ path: 'test-results/brigade/chief-referees.png' });
    // Сервер тоже не даёт: правка счёта главным судьёй — 403.
    const denied = await chief.request.post(`/api/tournaments/${id}/group-matches/${match.id}/scoring/`, { data: { action: 'correct', score1: 3, score2: 0 } });
    expect(denied.status()).toBe(403);

    // ── Заместитель: полномочия у него, исправляет счёт, возвращает ──────────
    const dep = await окно(browser, base);
    await войти(dep, E2E_DEPUTY);
    // Судья после входа — в кабинете судьи (старшинство ролей), в кабинет бригады — по адресу или «Работать как».
    await dep.waitForURL((url) => url.pathname === '/referee');
    await dep.goto('/deputy');
    await expect(dep.getByTestId('side-person')).toBeVisible();
    await dep.goto(`/deputy/tournaments/${id}/tables`);
    await expect(dep.getByTestId('authority-mine')).toBeVisible();
    await dep.getByTestId('tables-correct').click();
    await dep.getByTestId('correct-score2').fill('2');
    await dep.getByTestId('correct-score2').press('Tab');
    await dep.getByTestId('correct-save').click();
    await expect(dep.getByTestId('correct-dialog')).toHaveCount(0);
    await expect(dep.locator(`[data-testid="tables-result"][data-match="${match.id}"]`)).toContainText('3:2');
    const scored = (await (await dep.request.get(`/api/tournaments/${id}/group-matches/${match.id}/scoring/`)).json()) as {
      score1: number;
      score2: number;
      result_by: string;
    };
    expect([scored.score1, scored.score2, scored.result_by]).toEqual([3, 2, 'Заместитель (проверки)']);
    await dep.screenshot({ path: 'test-results/brigade/deputy-corrected.png' });
    await dep.getByTestId('authority-return').click();
    await expect(dep.getByTestId('authority-bar')).toHaveAttribute('data-holder', 'chief_referee');
    await expect(dep.getByTestId('authority-view-only')).toBeVisible();
    await expect(dep.getByTestId('tables-correct')).toHaveCount(0);

    // Журнал: передача и возврат.
    await dep.getByTestId('authority-log-open').click();
    await expect(dep.getByTestId('authority-log-row')).toHaveCount(2);
  } finally {
    await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
    await page.request.delete(`/api/tournaments/${id}/update/`);
  }
});
