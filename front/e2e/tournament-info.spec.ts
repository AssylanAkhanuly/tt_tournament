import { expect, test } from '@playwright/test';

import { E2E_ADMIN } from './global-setup';

// Собственные турниры удаляются после проверки. Данные открытого пользователем
// турнира не меняются; стандартный globalSetup для этих проверок не требуется.
test.describe('сведения и живой протокол', () => {
  let id: string;
  const name = '[e2e] Предпросмотр протокола';

  test.beforeEach(async ({ page }) => {
    const login = await page.request.post('/api/auth/login/email/', { data: E2E_ADMIN });
    expect(login.ok()).toBeTruthy();
    const response = await page.request.post('/api/tournaments/', {
      data: { name, starts_at: '2026-10-30T07:00:00Z', format: 'single_elimination' },
    });
    expect(response.status()).toBe(201);
    id = (await response.json()).id;
    await page.goto(`/tournaments/${id}/info`);
    await expect(page.getByTestId('info-name')).toHaveValue(name);
  });

  test.afterEach(async ({ page }) => {
    if (id) {
      const response = await page.request.delete(`/api/tournaments/${id}/update/`);
      expect(response.ok()).toBeTruthy();
    }
  });

  test('фокус подсвечивает документ, ввод обновляет его до сохранения, отмена восстанавливает', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const writes: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'PATCH') writes.push(request.url());
    });
    const field = (key: string) => page.locator(`[data-protocol-field="${key}"]`);

    for (const [testId, key, value] of [
      ['info-name', 'name', 'Кубок Казахстана'],
      ['info-description', 'description', 'Открытый турнир\nЛичный зачёт'],
      ['info-city', 'city', 'Астана'],
      ['info-venue', 'venue', 'Дворец спорта'],
    ]) {
      const input = page.getByTestId(testId);
      await input.focus();
      await expect(field(key)).toHaveAttribute('data-active', 'true');
      await input.fill(value);
      await expect(input).toBeFocused();
      await expect(field(key)).toContainText(value);
      await expect(page.locator('[data-protocol-field][data-active="true"]')).toHaveCount(1);
    }

    // NumberField должен обновлять протокол до blur, по мере набора.
    await page.getByTestId('info-age-min').fill('');
    await page.getByTestId('info-age-min').pressSequentially('1');
    await expect(field('age')).toContainText('от 1 лет');
    await page.getByTestId('info-age-min').pressSequentially('2');
    await expect(page.getByTestId('info-age-min')).toBeFocused();
    await expect(field('age')).toContainText('от 12 лет');
    await page.getByTestId('info-age-max').fill('18');
    await expect(field('age')).toContainText('12–18 лет');
    await expect(page.getByTestId('info-age-min')).toHaveValue('12');

    await page.getByTestId('info-format').click();
    await expect(field('format')).toHaveAttribute('data-active', 'true');
    await page.getByRole('option', { name: 'Группы и плей-офф' }).click();
    await expect(field('format')).toContainText('Группы и плей-офф');
    await page.getByTestId('info-group-size').fill('');
    await expect(field('groupSize')).toContainText('—');
    await page.getByTestId('info-group-size').pressSequentially('12');
    await expect(field('groupSize')).toHaveAttribute('data-active', 'true');
    await expect(field('groupSize')).toContainText('12');
    await expect(page.getByTestId('info-group-size')).toBeFocused();

    await page.getByTestId('info-games').click();
    await page.getByRole('option', { name: '4', exact: true }).click();
    await expect(field('gamesToWin')).toHaveAttribute('data-active', 'true');
    await expect(field('gamesToWin')).toContainText('до 4 побед');
    await page.getByTestId('info-level').click();
    await page.getByRole('option', { name: 'Любительские', exact: true }).click();
    await expect(field('level')).toHaveAttribute('data-active', 'true');
    await expect(field('level')).toContainText('Любительские');

    await page.getByRole('switch', { name: 'Рейтинговый' }).focus();
    await page.keyboard.press('Space');
    await expect(field('isRating')).toHaveAttribute('data-active', 'true');
    await expect(field('isRating')).toContainText('не учитываются');

    const days = page.getByTestId('info-dates').getByRole('spinbutton');
    await days.first().focus();
    await expect(field('dates')).toHaveAttribute('data-active', 'true');
    await days.nth(3).click();
    await page.keyboard.type('31102026');
    await expect(field('dates')).toContainText('31.10.2026');

    // Подсветка нижней части документа не прокручивает форму и не крадёт фокус.
    await page.getByTestId('info-description').scrollIntoViewIfNeeded();
    const formScroll = await page.getByTestId('info-scroll').evaluate((el) => el.scrollTop);
    await page.getByTestId('info-description').focus();
    await expect(field('description')).toBeInViewport();
    await expect(page.getByTestId('info-description')).toBeFocused();
    expect(await page.getByTestId('info-scroll').evaluate((el) => el.scrollTop)).toBe(formScroll);
    expect(writes).toEqual([]);

    await page.getByTestId('info-discard').click();
    await expect(field('name')).toHaveText(name);
    await expect(field('city')).not.toContainText('Астана');
    await expect(field('groupSize')).toHaveCount(0);
    await expect(page.getByTestId('info-save')).toBeDisabled();
    await expect(page.locator('[data-protocol-field][data-active="true"]')).toHaveCount(0);
  });

  test('на телефоне документ доступен во вкладке, правки сохраняются после перезагрузки', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByTestId('info-city').fill('Караганда');
    await page.getByRole('tab', { name: 'Протокол', exact: true }).click();
    const city = page.locator('[data-protocol-field="city"]');
    await expect(city).toBeInViewport();
    await expect(city).toHaveAttribute('data-active', 'true');
    await expect(city).toContainText('Караганда');
    const viewport = page.getByTestId('protocol-scroll');
    expect(await viewport.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    await page.getByTestId('info-save').click();
    await expect(page.getByTestId('info-save')).toBeDisabled();
    await page.reload();
    await expect(page.getByTestId('info-city')).toHaveValue('Караганда');
    await page.getByRole('tab', { name: 'Протокол', exact: true }).click();
    await expect(city).toContainText('Караганда');
    await page.getByRole('tab', { name: 'Сведения', exact: true }).click();
    await expect(page.getByTestId('info-city')).toBeVisible();
  });
});
