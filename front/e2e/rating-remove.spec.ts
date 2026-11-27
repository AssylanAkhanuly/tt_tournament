import { expect, test, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_GSK } from './global-setup';

/* Удаление из рейтинга ✳ (27.11.2026): председатель ГСК убирает спортсмена с
   карточки подтверждением (без основания), значок «Удалён» — в шапке профиля,
   в листе его нет, «Вернуть в рейтинг» возвращает. Страны СНГ — в регионах.
   Итог без счёта ✳ (27.11.2026): в ручном вводе «Итог» — большие кнопки «В» /
   «П», такой матч в рейтинг не идёт. Спортсмены и турнир — «[e2e] …». */

test.use({ actionTimeout: 15_000 });

async function signIn(page: Page, who: { email: string; password: string }, next: string) {
  await page.goto('/login?next=' + next);
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === next);
}

async function athlete(page: Page, name: string, region = '') {
  const r = await page.request.post('/api/rating/athletes/', { data: { name, origin: 'legacy', legacy: 30, region } });
  expect(r.status(), await r.text()).toBe(201);
  return ((await r.json()) as { user_id: string; region: string });
}

const listed = async (page: Page, name: string) =>
  ((await (await page.request.get('/api/rating/?all=1&q=' + encodeURIComponent(name))).json()) as { count: number }).count;

test('ГСК удаляет спортсмена из рейтинга подтверждением и возвращает', async ({ page, browser }) => {
  await signIn(page, E2E_GSK, '/gsk');
  // Страны СНГ — в выборе региона и проходят проверку карточки.
  const regions = (await (await page.request.get('/api/rating/regions/')).json()) as string[];
  expect(regions.slice(-9)).toEqual(['Азербайджан', 'Армения', 'Беларусь', 'Кыргызстан', 'Молдова', 'Россия', 'Таджикистан', 'Туркменистан', 'Узбекистан']);
  const name = `[e2e] Удаляемый ${Date.now()}`;
  const a = await athlete(page, name, 'Узбекистан');
  expect(a.region).toBe('Узбекистан');
  expect(await listed(page, name)).toBe(1);

  await page.goto('/rating/' + a.user_id);
  await page.getByTestId('remove-open').click();
  // Только подтверждение — поля основания нет.
  const dialog = page.getByTestId('remove-dialog');
  await expect(dialog).toContainText('Удалить из рейтинга?');
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
  await page.getByTestId('remove-submit').click();

  // Значок — внутри шапки профиля, места в листе нет, внизу только «Вернуть».
  const hero = page.getByTestId('member-hero');
  await expect(hero.getByTestId('card-removed')).toContainText('Удалён из рейтинга');
  // Шапка красная, полосы «Записано» нет.
  await expect(hero).toHaveAttribute('data-danger', 'yes');
  await expect(page.getByTestId('chairman-result')).toHaveCount(0);
  await expect(hero).not.toContainText('Место в листе');
  await expect(page.getByTestId('restore-submit')).toBeVisible();
  await expect(page.getByTestId('correction-open')).toHaveCount(0);
  expect(await listed(page, name)).toBe(0);
  await page.screenshot({ path: 'test-results/rating-remove/removed.png' });

  // Гостю карточки удалённого нет.
  const guest = await browser.newContext();
  expect((await guest.request.get(new URL('/api/rating/' + a.user_id + '/', page.url()).toString())).status()).toBe(404);
  await guest.close();

  await page.getByTestId('restore-submit').click();
  await expect(page.getByTestId('remove-open')).toBeVisible();
  await expect(page.getByTestId('card-removed')).toHaveCount(0);
  await expect(page.getByTestId('member-hero')).not.toHaveAttribute('data-danger', 'yes');
  expect(await listed(page, name)).toBe(1);
});

test('ручной ввод: итог без счёта большими кнопками и вне рейтинга', async ({ page }) => {
  await signIn(page, E2E_ADMIN, '/dashboard');
  const created = await page.request.post('/api/tournaments/', {
    data: { name: `[e2e] Итог ${Date.now()}`, starts_at: new Date(2026, 10, 21, 12).toISOString(), format: 'group_playoff', group_size: 4 },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const stamp = Date.now();
  const players = [];
  for (const letter of ['А', 'Б']) {
    const name = `[e2e] Итог ${stamp} ${letter}`;
    players.push({ id: (await athlete(page, name)).user_id, name });
  }
  for (const p of players) {
    expect((await page.request.post(`/api/tournaments/${id}/participants/`, { data: { user_id: p.id } })).status()).toBe(201);
  }
  try {
    await page.goto(`/dashboard/tournaments/${id}/schedule`);
    await page.getByTestId('results-way-manual').click();
    await page.getByTestId('manual-add').click();
    const pick = async (testId: string, name: string) => {
      await page.getByTestId(testId).click();
      await page.getByRole('option', { name, exact: true }).last().click();
    };
    await pick('manual-a', players[0].name);
    await page.getByTestId('manual-mode').getByText('Итог', { exact: true }).click();
    // Партий нет — две большие кнопки, по умолчанию «Победа».
    await expect(page.getByTestId('manual-score-a')).toHaveCount(0);
    const win = page.getByTestId('manual-win');
    const loss = page.getByTestId('manual-loss');
    await expect(win).toHaveAttribute('aria-checked', 'true');
    expect((await win.boundingBox())!.height).toBeGreaterThanOrEqual(100);
    await loss.click();
    await expect(loss).toHaveAttribute('aria-checked', 'true');
    await expect(win).toHaveAttribute('aria-checked', 'false');
    await pick('manual-b', players[1].name);
    await page.screenshot({ path: 'test-results/rating-remove/outcome.png' });
    await page.getByTestId('manual-save').click();

    // Спортсмен проиграл: «П : В», вне рейтинга, победитель — соперник.
    const score = page.getByTestId('manual-row').getByTestId('manual-score');
    await expect(score).toHaveAttribute('data-rated', 'no');
    await expect(score).toContainText('П : В');
    await expect(score).toContainText('вне рейтинга');

    // Завершили — рейтинг не менялся ни у кого.
    await page.getByTestId('manual-finish').click();
    await page.getByTestId('manual-finish-ok').click();
    await expect(page.getByTestId('manual-finished')).toBeVisible();
    await expect(page.getByTestId('manual-rating').getByTestId('table-empty')).toBeVisible();
    if ((await page.getByTestId('manual-unfinish').count()) > 0) {
      await page.getByTestId('manual-unfinish').click();
      await page.getByTestId('manual-unfinish-ok').click();
    }
  } finally {
    await page.request.delete(`/api/tournaments/${id}/`);
  }
});
