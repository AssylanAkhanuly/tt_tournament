import { expect, test, type Browser, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_REFEREE } from './global-setup';

/* Расписание «группы + плей-офф» ✳ (30.10.2026). Строит и правит только
   главный судья турнира — в своём кабинете «Главный судья»: параметры →
   черновик (группы, пары, время, стол, судья стола) → правка → «Отправить»;
   отправленное не меняется. Администратор видит то же без правки. Турнир
   заводится здесь и удаляется в конце: роль главного судьи уходит вместе с ним. */

// Действию — свой предел: застрявший шаг называет себя, а не съедает всю проверку.
test.use({ actionTimeout: 15_000 });

async function войти(page: Page, who: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

async function окно(browser: Browser, baseURL: string | undefined) {
  return (await browser.newContext({ baseURL })).newPage();
}

test('главный судья: черновик расписания, правка матча и группы, отправка; администратор только видит', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90_000); // два окна и весь путь расписания
  // ── Турнир: 8 спортсменов, главный судья, два судьи стола ─────────────
  await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
  const created = await page.request.post('/api/tournaments/', {
    data: { name: `[e2e] Расписание ${Date.now()}`, starts_at: new Date(2026, 10, 20, 12).toISOString(), format: 'group_playoff', group_size: 4 },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const кандидаты = async (role: string, q = '') =>
    (await (await page.request.get(`/api/tournaments/${id}/candidates/?role=${role}&q=${encodeURIComponent(q)}`)).json()) as {
      id: string;
      email: string | null;
    }[];
  // Игроки и судьи стола — учётки засева, а не «[e2e]»-учётки проверок: роль в
  // турнире открыла бы им чужой кабинет, а соседние проверки на этом держатся.
  const свои = (c: { email: string | null }) => !(c.email ?? '').startsWith('e2e-');
  const игроки = (await кандидаты('player')).filter(свои).slice(0, 8);
  for (const p of игроки) {
    expect((await page.request.post(`/api/tournaments/${id}/participants/`, { data: { user_id: p.id } })).status()).toBe(201);
  }
  const назначить = async (email: string, position: string) => {
    const [u] = await кандидаты('referee', email);
    const r = await page.request.post(`/api/tournaments/${id}/referees/`, { data: { user_id: u.id, position } });
    expect(r.status(), await r.text()).toBe(201);
  };
  await назначить(E2E_REFEREE.email, 'chief_referee');
  const мимо = new Set(игроки.map((p) => p.id));
  for (const s of (await кандидаты('referee')).filter((c) => свои(c) && !мимо.has(c.id)).slice(0, 2)) {
    const r = await page.request.post(`/api/tournaments/${id}/referees/`, { data: { user_id: s.id, position: 'referee' } });
    expect(r.status(), await r.text()).toBe(201);
  }

  try {
    // ── Администратор: раздел есть, расписания нет, построить он не может ─
    const админ = await окно(browser, info.project.use.baseURL);
    await войти(админ, E2E_ADMIN);
    await админ.waitForURL((url) => url.pathname === '/dashboard');
    await админ.goto(`/dashboard/tournaments/${id}/schedule`);
    await expect(админ.getByTestId('schedule-empty')).toHaveText('Расписания пока нет');
    await expect(админ.getByTestId('schedule-build')).toHaveCount(0);

    // ── Главный судья: кабинет «Главный судья», его турнир, «Расписание» ──
    await page.context().clearCookies(); // окно было под администратором (заведение турнира)
    await войти(page, E2E_REFEREE);
    await page.waitForURL((url) => url.pathname === '/referee');
    await page.getByTestId('side-person').click();
    await page.getByTestId('person-role').click();
    await page.getByTestId('role-menu').getByRole('menuitemradio', { name: 'Главный судья' }).click();
    await page.waitForURL((url) => url.pathname === '/chief');
    await page.goto(`/chief/tournaments/${id}`);
    await page.waitForURL((url) => url.pathname === `/chief/tournaments/${id}/info`);
    await expect(page.getByRole('navigation', { name: 'Разделы' }).getByRole('button').and(page.locator(':not([data-testid])'))).toHaveText([
      'Сведения',
      'Спортсмены',
      'Расписание',
    ]);
    await page.getByRole('button', { name: 'Расписание', exact: true }).click();
    await page.waitForURL((url) => url.pathname === `/chief/tournaments/${id}/schedule`);

    // Параметры → «Сформировать»: два стола и два игровых дня со своими часами.
    const столов = page.getByTestId('schedule-tables');
    await столов.fill('2');
    await столов.press('Tab');
    // Дни по умолчанию — даты турнира (один день, 20.11, 10:00–18:00).
    const дни = page.getByTestId('play-day');
    await expect(дни).toHaveCount(1);
    await expect(дни.first().getByTestId('play-day-start')).toContainText('10');
    const часы = async (day: number, which: 'start' | 'end', hhmm: string) => {
      await дни.nth(day).getByTestId('play-day-' + which).getByRole('spinbutton').first().click();
      await page.keyboard.type(hhmm);
    };
    await часы(0, 'end', '1100'); // первый день — час: два слота на двух столах
    await page.getByTestId('play-day-add').click(); // следующий — 21.11 с теми же часами
    await expect(дни).toHaveCount(2);
    await часы(1, 'start', '1500');
    await часы(1, 'end', '1800');
    await page.screenshot({ path: 'test-results/schedule/play-days.png' });
    await page.getByTestId('schedule-build').click();
    const расписание = page.getByTestId('schedule');
    await expect(расписание).toHaveAttribute('data-status', 'draft');
    await expect(page.getByTestId('schedule-status')).toHaveText('Черновик');
    const матчи = page.getByTestId('schedule-match');
    await expect(матчи).toHaveCount(12); // две группы по четыре — по шесть матчей
    // У каждого матча — стол 1 или 2 и судья стола.
    for (const стол of await матчи.evaluateAll((rows) => rows.map((r) => r.getAttribute('data-table')))) {
      expect(['1', '2']).toContain(стол);
    }
    await expect(page.getByText('не назначен')).toHaveCount(0);
    // Дни легли как заданы: 20.11 — с 10:00 до 11:00, остальное — 21.11 с 15:00.
    const поДням = ((await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json()) as {
      matches: { scheduled_at: string }[];
      settings: { days: { date: string; start: string; end: string }[] };
    });
    expect(поДням.settings.days).toEqual([
      { date: '2026-11-20', start: '10:00', end: '11:00' },
      { date: '2026-11-21', start: '15:00', end: '18:00' },
    ]);
    const начала = поДням.matches.map((m) => new Date(m.scheduled_at));
    const местное = (d: Date) => d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    expect(new Set(начала.filter((d) => d.getDate() === 20).map(местное))).toEqual(new Set(['20 10:00', '20 10:30']));
    expect(начала.filter((d) => d.getDate() === 21).map(местное).sort()[0]).toBe('21 15:00');
    // В «Матчах» — фамилия и инициалы, рядом фото (нет снимка — заглушка).
    const пара = матчи.first().getByTestId('match-player');
    await expect(пара).toHaveCount(2);
    await expect(пара.first()).toHaveText(/^\S+ [А-ЯЁA-Z]\.( [А-ЯЁA-Z]\.)?$/);
    await expect(пара.first().getByTestId('person-avatar')).toBeVisible();
    await page.screenshot({ path: 'test-results/schedule/draft.png' });

    // Правка матча: занятый в это же время стол сервер не даёт. Берём матч, у
    // которого в его время есть сосед на другом столе.
    const сетка = (await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json()) as {
      matches: { id: number; scheduled_at: string; table: number }[];
    };
    const сосед = сетка.matches.find((m) => сетка.matches.some((x) => x.id !== m.id && x.scheduled_at === m.scheduled_at))!;
    const строка = page.locator(`[data-testid="schedule-match"][data-id="${сосед.id}"]`);
    await строка.click();
    const карточка = page.getByTestId('schedule-match-drawer');
    await expect(карточка).toBeVisible();
    const первыйСтол = String(сосед.table);
    await карточка.getByTestId('schedule-match-table').click();
    await page.getByRole('option', { name: первыйСтол === '1' ? '2' : '1', exact: true }).click();
    await карточка.getByTestId('schedule-match-save').click();
    await expect(карточка.getByTestId('schedule-match-error')).toHaveText('Этот стол в это время занят.');
    // Время — на свободный слот (последний в списке — конец второго дня): сохраняется.
    await карточка.getByTestId('schedule-match-time').click();
    await page.getByRole('option').last().click();
    await page.waitForTimeout(400); // снимок — после закрытия списка
    await page.screenshot({ path: 'test-results/schedule/match-drawer.png' });
    await карточка.getByTestId('schedule-match-save').click();
    await expect(карточка).toHaveCount(0);

    // «День»: сетка по столам — каждый матч дня в столбце своего стола.
    await page.getByTestId('nav-sub').filter({ hasText: 'День' }).click();
    const блоки = page.getByTestId('schedule-day-match');
    await expect(блоки.first()).toBeVisible();
    const сейчас = (await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json()) as {
      matches: { id: number; table: number; scheduled_at: string }[];
    };
    const первыйДень = new Date(сейчас.matches.map((m) => m.scheduled_at).sort()[0]).toDateString();
    const заДень = сейчас.matches.filter((m) => new Date(m.scheduled_at).toDateString() === первыйДень);
    await expect(блоки).toHaveCount(заДень.length);
    await expect(page.getByTestId('schedule-day-count')).toHaveText('Матчей: ' + заДень.length);
    for (const m of заДень) {
      await expect(page.locator(`[data-testid="schedule-day-table"][data-table="${m.table}"] [data-id="${m.id}"]`)).toHaveCount(1);
    }
    await page.screenshot({ path: 'test-results/schedule/day.png' });

    // Группы: перенос игрока перетаскиванием (dnd kit) — пары пересчитываются (3 + 10 матчей).
    await page.getByTestId('nav-sub').filter({ hasText: 'Группы' }).click();
    const группы = page.getByTestId('schedule-group');
    await expect(группы).toHaveCount(2);
    // Тянется только имя: из ячейки таблицы перенос не начинается.
    const куда = группы.nth(1);
    const ячейкаРяда = (await группы.first().getByTestId('schedule-cell').nth(1).boundingBox())!;
    const цель = (await куда.boundingBox())!;
    await page.mouse.move(ячейкаРяда.x + ячейкаРяда.width / 2, ячейкаРяда.y + ячейкаРяда.height / 2);
    await page.mouse.down();
    await page.mouse.move(цель.x + цель.width / 2, цель.y + цель.height / 2, { steps: 10 });
    await expect(куда).not.toHaveAttribute('data-over', 'true');
    await page.mouse.up();
    await expect(группы.nth(0).getByTestId('schedule-group-player')).toHaveCount(4);
    // …и не с фамилии: берутся только за ручку ⠿.
    const фамилия = (await группы.first().getByTestId('schedule-name').first().locator('span').last().boundingBox())!;
    await page.mouse.move(фамилия.x + фамилия.width / 2, фамилия.y + фамилия.height / 2);
    await page.mouse.down();
    await page.mouse.move(цель.x + цель.width / 2, цель.y + цель.height / 2, { steps: 10 });
    await expect(куда).not.toHaveAttribute('data-over', 'true');
    await page.mouse.up();
    const кто = группы.first().getByTestId('schedule-drag').first();
    const а = (await кто.boundingBox())!;
    const б = (await куда.boundingBox())!;
    await page.mouse.move(а.x + а.width / 2, а.y + а.height / 2);
    await page.mouse.down();
    await page.mouse.move(а.x + а.width / 2 + 20, а.y + а.height / 2, { steps: 5 }); // порог 5 px
    await page.mouse.move(б.x + б.width / 2, б.y + б.height / 2, { steps: 10 });
    await expect(куда).toHaveAttribute('data-over', 'true'); // группа под курсором подсвечена
    // Под курсором — копия имени шириной в имя (ручка + фамилия), а не во всю строку.
    const имя = (await группы.first().getByTestId('schedule-name').first().boundingBox())!;
    const копия = (await page.getByTestId('schedule-drag-overlay').boundingBox())!;
    expect(Math.abs(копия.width - имя.width)).toBeLessThan(2);
    expect(копия.width).toBeLessThan((await группы.first().getByTestId('schedule-group-player').first().boundingBox())!.width / 2);
    await page.screenshot({ path: 'test-results/schedule/dragging.png' });
    await page.mouse.up();
    await expect(группы.nth(0).getByTestId('schedule-group-player')).toHaveCount(3);
    await expect(группы.nth(1).getByTestId('schedule-group-player')).toHaveCount(5);
    await page.screenshot({ path: 'test-results/schedule/groups.png' });
    await page.getByTestId('nav-sub').filter({ hasText: 'Матчи' }).click();
    await expect(матчи).toHaveCount(13);

    // «Отправить» — с подтверждением; после — без правки.
    await page.getByTestId('schedule-finalize').click();
    await page.getByTestId('schedule-finalize-confirm').getByRole('button', { name: 'Отправить' }).click();
    await expect(расписание).toHaveAttribute('data-status', 'final');
    await expect(page.getByTestId('schedule-status')).toHaveText('Отправлено');
    await expect(page.getByTestId('schedule-finalize')).toHaveCount(0);
    await expect(page.getByTestId('schedule-params')).toHaveCount(0);
    await матчи.first().click();
    await expect(page.getByTestId('schedule-match-drawer')).toHaveCount(0);

    // Администратор видит отправленное, без правки.
    await админ.reload();
    await expect(админ.getByTestId('schedule-status')).toHaveText('Отправлено');
    await expect(админ.getByTestId('schedule-match')).toHaveCount(13);
    await expect(админ.getByTestId('schedule-finalize')).toHaveCount(0);

    // Результаты: администратор записывает счёт и неявку — таблица группы их
    // показывает со стороны каждого игрока, итог (победа 2, поражение 1, неявка 0)
    // и место считает сервер.
    const итог = (await (await админ.request.get(`/api/tournaments/${id}/schedule/`)).json()) as {
      groups: { id: number; name: string }[];
      matches: { id: number; group: number; player1: { id: string }; player2: { id: string } }[];
    };
    const группаA = итог.groups[0];
    const [сыгран, неявка] = итог.matches.filter((m) => m.group === группаA.id);
    const счёт = (m: { id: number }, data: object) =>
      админ.request.post(`/api/tournaments/${id}/groups/${группаA.id}/matches/${m.id}/score/`, { data });
    expect((await счёт(сыгран, { score1: 3, score2: 1 })).status()).toBe(200);
    // Победитель неявки — «1» или «2» (игрок 1 или 2), не id.
    expect((await счёт(неявка, { walkover: true, winner: '2' })).status()).toBe(200);
    await админ.goto(`/dashboard/tournaments/${id}/schedule?view=groups`);
    // Вид — из адреса: перезагрузка оставляет «Группы».
    await expect(админ.getByTestId('nav-sub').filter({ hasText: 'Группы' })).toHaveAttribute('aria-current', 'true');
    const ячейка = (row: string, col: string) => админ.locator(`[data-testid="schedule-cell"][data-row="${row}"][data-col="${col}"]`);
    await expect(ячейка(сыгран.player1.id, сыгран.player2.id)).toHaveText('3:1');
    await expect(ячейка(сыгран.player2.id, сыгран.player1.id)).toHaveText('1:3');
    await expect(ячейка(неявка.player2.id, неявка.player1.id)).toHaveText('+:−');
    await expect(ячейка(неявка.player1.id, неявка.player2.id)).toHaveText('−:+');
    const очки = (who: string) =>
      админ.locator(`[data-testid="schedule-group-player"][data-id="${who}"] [data-testid="schedule-points"]`);
    await expect(очки(сыгран.player1.id)).toHaveText(сыгран.player1.id === неявка.player2.id ? '4' : '2');
    await expect(очки(неявка.player1.id)).toHaveText(неявка.player1.id === сыгран.player2.id ? '1' : '0');
    await админ.screenshot({ path: 'test-results/schedule/groups-results.png' });
    // «Матчи» — тот же счёт в своей колонке.
    await админ.getByTestId('nav-sub').filter({ hasText: 'Матчи' }).click();
    await админ.waitForURL((url) => url.search === '');
    await expect(админ.locator(`[data-testid="schedule-match"][data-id="${сыгран.id}"] [data-testid="match-result"]`)).toHaveText('3:1');
    await админ.context().close();
  } finally {
    await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
    await page.request.delete(`/api/tournaments/${id}/update/`);
  }
});
