import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_REFEREE } from './global-setup';

/* «Столы» у главного судьи ✳ (23.11.2026): все столы турнира карточками.
   Администратор (своя API-сессия) заводит турнир из двух спортсменов засева,
   сам — главный судья, учётка судьи проверок — судья стола; расписание на два
   стола отправлено. Судья стола стартует матч и записывает партию — у главного
   судьи на «Столах» этот стол «идёт» со счётом матча, игроками и судьёй, второй
   стол свободен; в «Ближайших» и «Результатах» матча нет. */

test('главный судья: «Столы» — идущий матч на своём столе со счётом и судьёй', async ({ page, playwright }) => {
  test.setTimeout(90_000);
  await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
  const created = await page.request.post('/api/tournaments/', {
    data: { name: `[e2e] Столы ${Date.now()}`, starts_at: new Date(2026, 10, 24, 12).toISOString(), format: 'group_playoff', group_size: 4, games_to_win: 3 },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const candidates = async (role: string, q = '') =>
    (await (await page.request.get(`/api/tournaments/${id}/candidates/?role=${role}&q=${encodeURIComponent(q)}`)).json()) as { id: string; email: string | null }[];

  try {
    for (const p of (await candidates('player')).filter((c) => !(c.email ?? '').startsWith('e2e-')).slice(0, 2)) {
      expect((await page.request.post(`/api/tournaments/${id}/participants/`, { data: { user_id: p.id } })).status()).toBe(201);
    }
    for (const [email, position] of [[E2E_ADMIN.email, 'chief_referee'], [E2E_REFEREE.email, 'referee']]) {
      const [u] = await candidates('referee', email);
      expect((await page.request.post(`/api/tournaments/${id}/referees/`, { data: { user_id: u.id, position } })).status()).toBe(201);
    }
    expect(
      (await page.request.post(`/api/tournaments/${id}/schedule/build/`, {
        data: { tables: 2, match_minutes: 30, days: [{ date: '2026-11-24', start: '10:00', end: '18:00' }] },
      })).status(),
    ).toBe(200);
    expect((await page.request.post(`/api/tournaments/${id}/schedule/finalize/`)).status()).toBe(200);
    const sched = (await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json()) as {
      matches: { id: number; table: number; player1: { name: string }; player2: { name: string } }[];
    };
    const match = sched.matches[0];

    // Судья стола — своей сессией: старт и первая партия 11 : 7.
    const referee = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
    await referee.post('/api/auth/login/email/', { data: E2E_REFEREE });
    const scoring = `/api/tournaments/${id}/group-matches/${match.id}/scoring/`;
    expect((await referee.post(scoring, { data: { action: 'start' } })).status()).toBe(200);
    expect((await referee.post(scoring, { data: { action: 'game', a: 11, b: 7 } })).status()).toBe(200);
    await referee.dispose();

    await page.goto(`/chief/tournaments/${id}/tables`);
    const card = page.locator(`[data-testid="table-card"][data-table="${match.table}"]`);
    await expect(card).toHaveAttribute('data-state', 'live');
    await expect(card).toContainText('идёт');
    await expect(card).toContainText(match.player1.name.split(' ')[0]);
    await expect(card).toContainText(match.player2.name.split(' ')[0]);
    await expect(card).toContainText('1');
    await expect(card.getByTestId('table-referee')).toContainText('Судья');
    const other = match.table === 1 ? 2 : 1;
    await expect(page.locator(`[data-testid="table-card"][data-table="${other}"]`)).toHaveAttribute('data-state', 'free');
    await expect(page.getByTestId('tables-upcoming')).toContainText('Нет');
    await expect(page.getByTestId('tables-results')).toContainText('Нет');
    await page.screenshot({ path: 'test-results/tables/board.png' });

    // Вид таблицей ✳ (23.11.2026): переключатель в заголовке, та же картина строками.
    await page.getByTestId('tables-view-table').click();
    await page.waitForURL((u) => u.searchParams.get('view') === 'table');
    const row = page.locator(`[data-testid="tables-row"][data-table="${match.table}"]`);
    await expect(row).toContainText('идёт');
    await expect(row).toContainText('1:0');
    await expect(page.locator(`[data-testid="tables-row"][data-table="${other}"]`)).toContainText('свободен');
  } finally {
    await page.request.delete(`/api/tournaments/${id}/update/`);
  }
});
