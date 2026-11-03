import { expect, test } from '@playwright/test';

import { E2E_ADMIN } from './global-setup';

/* Результаты без расписания ✳ (03.11.2026, решение владельца продукта). В
   «Расписании» без расписания — две большие кнопки: «Автоматически» и
   «Вручную». Вручную — пустая таблица матчей и «Добавить матч»: пара и счёт в
   партиях. После первого матча расписание у турнира не собрать — сервер
   отказывает, кнопок выбора больше нет. «Завершить турнир» пересчитывает
   рейтинг участников. Турнир заводится здесь и удаляется в конце. */

test.use({ actionTimeout: 15_000 });

async function войти(page: import('@playwright/test').Page) {
  await page.goto('/login?next=/dashboard');
  await page.getByLabel('Эл. почта').fill(E2E_ADMIN.email);
  await page.getByLabel('Пароль').fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');
}

for (const phone of [false, true]) {
  test('результаты вручную: два способа, пустая таблица, матч со счётом, расписание больше не собрать' + (phone ? ' (телефон)' : ''), async ({ page }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await войти(page);
    const created = await page.request.post('/api/tournaments/', {
      data: { name: `[e2e] Вручную ${Date.now()}`, starts_at: new Date(2026, 10, 21, 12).toISOString(), format: 'group_playoff', group_size: 4 },
    });
    expect(created.status(), await created.text()).toBe(201);
    const { id } = (await created.json()) as { id: string };
    // Свои спортсмены «[e2e] …»: завершение пишет им рейтинг, а показательных
    // спортсменов, чьи числа сверяют другие проверки, оно не трогает. Засев их сносит.
    const метка = Date.now();
    const игроки: { id: string; name: string }[] = [];
    for (const [i, legacy] of [30, 30, 30].entries()) {
      const name = `[e2e] Вручную ${метка} ${'АБВ'[i]}`;
      const r = await page.request.post('/api/rating/athletes/', { data: { name, origin: 'legacy', legacy } });
      expect(r.status(), await r.text()).toBe(201);
      игроки.push({ id: ((await r.json()) as { user_id: string }).user_id, name });
    }
    for (const p of игроки) {
      expect((await page.request.post(`/api/tournaments/${id}/participants/`, { data: { user_id: p.id } })).status()).toBe(201);
    }
    try {
      await page.goto(`/dashboard/tournaments/${id}/schedule`);
      await expect(page.getByTestId('results-way')).toBeVisible();
      // Кнопки — по центру области по высоте: сверху и снизу места поровну.
      const way = (await page.getByTestId('results-way').boundingBox())!;
      const area = (await page.getByTestId('schedule').boundingBox())!;
      expect(Math.abs(way.y - area.y - (area.y + area.height - way.y - way.height))).toBeLessThan(4);
      await page.screenshot({ path: `test-results/manual/${phone ? 'phone-' : ''}way.png` });
      await page.getByTestId('results-way-manual').click();

      // Пустая таблица и «Добавить матч»; без матчей можно вернуться к выбору.
      const таблица = page.getByTestId('manual-matches');
      await expect(таблица.getByTestId('table-empty')).toHaveText('Матчей нет');
      await expect(page.getByTestId('manual-cancel')).toBeVisible();

      await page.getByTestId('manual-add').click();
      const окно = page.getByTestId('manual-dialog');
      await expect(окно).toHaveAttribute('data-sheet', phone ? 'yes' : 'no');
      await expect(page.getByTestId('manual-save')).toBeDisabled();
      const выбрать = async (testId: string, name: string) => {
        await page.getByTestId(testId).click();
        await page.getByRole('option', { name, exact: true }).last().click();
      };
      await выбрать('manual-a', игроки[0].name);
      await выбрать('manual-b', игроки[1].name);
      // По умолчанию 3:0; соперник взял одну партию.
      await page.getByRole('button', { name: 'Больше: Партий у соперника' }).click();
      // Порядок сверху вниз: спортсмен, его партии, партии соперника, соперник.
      const y = async (id: string) => (await page.getByTestId(id).boundingBox())!.y;
      const ys = [await y('manual-a'), await y('manual-score-a'), await y('manual-score-b'), await y('manual-b')];
      expect([...ys].sort((p, q) => p - q)).toEqual(ys);
      // Подписей у партий нет, поле узкое.
      await expect(окно.getByText('Партий у спортсмена')).toHaveCount(0);
      expect((await page.getByTestId('manual-score-a').locator('..').boundingBox())!.width).toBeLessThanOrEqual(160);
      await page.screenshot({ path: `test-results/manual/${phone ? 'phone-' : ''}dialog.png` });
      await page.getByTestId('manual-save').click();
      await expect(окно).toHaveCount(0);

      const строка = page.getByTestId('manual-row');
      await expect(строка).toHaveCount(1);
      await expect(строка.getByTestId('manual-score')).toHaveText('3:1');
      await expect(строка).toHaveAttribute('data-a', игроки[0].name);
      await expect(page.getByTestId('manual-cancel')).toHaveCount(0); // способ закреплён
      await page.screenshot({ path: `test-results/manual/${phone ? 'phone-' : ''}table.png` });

      // После перезагрузки — та же таблица, а не выбор способа; сервер расписание не собирает.
      await page.reload();
      await expect(page.getByTestId('manual-row')).toHaveCount(1);
      await expect(page.getByTestId('results-way')).toHaveCount(0);
      const снимок = await (await page.request.get(`/api/tournaments/${id}/schedule/`)).json();
      expect(снимок.mode).toBe('manual');
      expect(снимок.can_build).toBe(false);

      // «Завершить турнир» → рейтинг пересчитан: победитель вверх, проигравший вниз.
      const рейтинг = async (userId: string) =>
        Number(((await (await page.request.get(`/api/rating/${userId}/`)).json()) as { profile: { value: string } }).profile.value);
      expect(await рейтинг(игроки[0].id)).toBe(30); // перенос прежнего рейтинга один к одному
      const былоA = 30;
      const былоB = 30;
      await page.getByTestId('manual-finish').click();
      await expect(page.getByTestId('manual-finish-confirm')).toBeVisible();
      await page.screenshot({ path: `test-results/manual/${phone ? 'phone-' : ''}finish.png` });
      await page.getByTestId('manual-finish-ok').click();
      await expect(page.getByTestId('manual-finished')).toBeVisible();
      const изменения = page.getByTestId('rating-change');
      await expect(изменения).toHaveCount(2);
      await expect(изменения.first()).toHaveAttribute('data-player', игроки[0].name);
      await expect(изменения.first().getByTestId('rating-delta')).toHaveText(/^\+\d+,\d\d$/);
      expect(await рейтинг(игроки[0].id)).toBeGreaterThan(былоA);
      expect(await рейтинг(игроки[1].id)).toBeLessThan(былоB);
      await page.screenshot({ path: `test-results/manual/${phone ? 'phone-' : ''}rating.png` });
      // Матчи после завершения не меняются: «Добавить матч» и удаления нет.
      await page.getByRole('tab', { name: 'Матчи' }).click();
      await expect(page.getByTestId('manual-row')).toHaveCount(1);
      await expect(page.getByTestId('manual-add')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Убрать матч' })).toHaveCount(0);
    } finally {
      await page.request.delete(`/api/tournaments/${id}/`);
    }
  });
}
