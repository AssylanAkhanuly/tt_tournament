import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_REFEREE } from './global-setup';

/* Судья стола ✳ (22.11.2026, flows/09 Э9.2–Э9.5; главная схема
   `flow-tournaments`: «Судья вносит счёт, результат сразу публичный»).

   Администратор (своя API-сессия) заводит турнир «группы + плей-офф» из двух
   спортсменов засева, сам становится главным судьёй, сажает учётку судьи
   проверок судьёй стола, строит и отправляет расписание. Судья открывает «Мой
   стол», стартует матч, вносит партии (неверная партия не записывается),
   снимает лишнюю, подтверждает результат и видит «Результат принят»; счёт
   по партиям виден с сервера, и после подтверждения судья его уже не правит.
   Турнир удаляется в конце — роли в его области уходят вместе с ним. */

test.use({ actionTimeout: 15_000 });

test('судья стола: мой стол → ввод счёта по партиям → результат', async ({ page }) => {
  test.setTimeout(90_000);
  await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
  const created = await page.request.post('/api/tournaments/', {
    data: { name: `[e2e] Судья стола ${Date.now()}`, starts_at: new Date(2026, 10, 22, 12).toISOString(), format: 'group_playoff', group_size: 4, games_to_win: 3 },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const candidates = async (role: string, q = '') =>
    (await (await page.request.get(`/api/tournaments/${id}/candidates/?role=${role}&q=${encodeURIComponent(q)}`)).json()) as {
      id: string;
      email: string | null;
    }[];
  const seeded = (c: { email: string | null }) => !(c.email ?? '').startsWith('e2e-');

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
    await assign(E2E_REFEREE.email, 'referee');
    const built = await page.request.post(`/api/tournaments/${id}/schedule/build/`, {
      data: { tables: 1, match_minutes: 30, days: [{ date: '2026-11-22', start: '10:00', end: '18:00' }] },
    });
    expect(built.status(), await built.text()).toBe(200);
    expect((await page.request.post(`/api/tournaments/${id}/schedule/finalize/`)).status()).toBe(200);
    const sched = (await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json()) as {
      matches: { id: number; player1: { name: string }; player2: { name: string } }[];
    };
    expect(sched.matches).toHaveLength(1);
    const match = sched.matches[0];

    // ── Судья: «Мой стол» ───────────────────────────────────────────────
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByLabel('Эл. почта').fill(E2E_REFEREE.email);
    await page.getByLabel('Пароль').fill(E2E_REFEREE.password);
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL((u) => u.pathname === '/referee');
    await page.getByRole('button', { name: 'Мой стол', exact: true }).click();
    await page.waitForURL((u) => u.pathname === '/referee/table');
    const card = page.getByTestId('table-match');
    await expect(card).toContainText(match.player1.name);
    await expect(card).toContainText(match.player2.name);
    await expect(page.getByTestId('table-number')).toHaveText('Стол 1');
    await page.getByTestId('table-start').click();
    await page.waitForURL((u) => u.pathname === `/referee/table/${id}/${match.id}`);

    // ── Ввод счёта по партиям ───────────────────────────────────────────
    const game = async (a: string, b: string) => {
      await page.getByTestId('score-game-input-a').fill(a);
      await page.getByTestId('score-game-input-b').fill(b);
    };
    await expect(page.getByTestId('score-rule')).toHaveText('до 3 побед в партиях, сейчас 0 : 0');
    await game('11', '10'); // не по правилам — кнопка неактивна
    await expect(page.getByTestId('score-record')).toBeDisabled();
    await game('11', '7');
    await page.getByTestId('score-record').click();
    await expect(page.getByTestId('score-total')).toHaveText('1 : 0');
    await game('10', '12');
    await page.getByTestId('score-record').click();
    await expect(page.getByTestId('score-total')).toHaveText('1 : 1');
    await game('11', '4');
    await page.getByTestId('score-record').click();
    await expect(page.getByTestId('score-total')).toHaveText('2 : 1');
    await expect(page.getByTestId('score-submit')).toHaveCount(0); // матч не решён — подтверждать нечего
    await game('5', '11');
    await page.getByTestId('score-record').click();
    await expect(page.getByTestId('score-total')).toHaveText('2 : 2');
    await page.getByTestId('score-undo').click(); // снял по ошибке записанную
    await expect(page.getByTestId('score-total')).toHaveText('2 : 1');
    await game('13', '11');
    await page.getByTestId('score-record').click();
    await expect(page.getByTestId('score-total')).toHaveText('3 : 1');
    const played = await page.getByTestId('score-game').evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.score));
    expect(played).toEqual(['11 : 7', '10 : 12', '11 : 4', '13 : 11']);
    // табло-сцена: фигуры игроков по краям (у спортсменов засева снимков нет — заглушки), плашки с фамилиями
    await expect(page.getByTestId('board-figure-left')).toHaveAttribute('src', /\/national\/players\/[mf]-\d\.webp$/);
    await expect(page.getByTestId('board-figure-right')).toHaveAttribute('data-photo', 'no');
    await expect(page.getByTestId('board-plate-left')).toContainText(match.player1.name.split(' ')[0]);
    await expect(page.getByTestId('board-plate-right')).toContainText(match.player2.name.split(' ')[0]);

    // идущий матч со счётом по партиям виден с сервера ещё до подтверждения
    const live = (await (await page.request.get(`/api/tournaments/${id}/group-matches/${match.id}/scoring/`)).json()) as {
      status: string;
      games: number[][];
    };
    expect(live.status).toBe('in_progress');
    expect(live.games).toEqual([[11, 7], [10, 12], [11, 4], [13, 11]]);
    await page.screenshot({ path: 'test-results/table-referee/entry.png' });

    // ── Подтвердить результат → «Результат принят» ──────────────────────
    await page.getByTestId('score-submit').click();
    await expect(page.getByTestId('score-result')).toContainText('Результат принят');
    await expect(page.getByTestId('result-total')).toHaveText('3 : 1');
    await expect(page.getByTestId('result-by')).toContainText('Судья (проверки)');
    await page.screenshot({ path: 'test-results/table-referee/result.png' });

    // после подтверждения судья стола счёт не правит
    const late = await page.request.post(`/api/tournaments/${id}/group-matches/${match.id}/scoring/`, { data: { action: 'game', a: 11, b: 0 } });
    expect(late.status()).toBe(400);
    await page.getByTestId('result-back').click();
    await page.waitForURL((u) => u.pathname === '/referee/table');
    await expect(page.getByTestId('table-free')).toBeVisible();
  } finally {
    await page.context().clearCookies();
    await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
    await page.request.delete(`/api/tournaments/${id}/update/`);
  }
});
