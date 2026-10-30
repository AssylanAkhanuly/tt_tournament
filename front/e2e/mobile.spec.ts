import { expect, test } from '@playwright/test';

import { E2E_GSK } from './global-setup';

/* Телефон ✳ (11.09.2026): на узком экране у председателя — телефонная оболочка
   роли, как `PhoneRoleApp` в Storybook: шапка с аватаром, вкладки разделов
   внизу, главные кнопки над ними. Бокового меню нет. */

test.use({ viewport: { width: 390, height: 844 } });

test('на телефоне — вкладки разделов вместо бокового меню, выход из аватара', async ({ page }) => {
  await page.goto('/login?next=' + encodeURIComponent('/rating'));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/rating');

  await expect(page.getByTestId('side-person')).toHaveCount(0);
  await expect(page.getByTestId('phone-person')).toBeVisible();
  // Строка листа — фамилия и рейтинг видны целиком, не сжаты до нуля.
  const ахметов = page.locator('[data-testid="rating-row"][data-player="Ахметов Ерлан"]');
  await expect(ахметов).toContainText('АХМЕТОВ Ерлан');
  await expect(ахметов.getByTestId('rating-value')).toHaveText('82,01');
  expect((await ахметов.boundingBox())!.width).toBeLessThanOrEqual(390);
  // «Добавить спортсмена» — в меню «⋯» над таблицей ✳ (28.10.2026).
  await page.getByTestId('rating-more').click();
  await expect(page.getByTestId('athlete-open')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Календарь', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/calendar');
  await expect(page.getByRole('button', { name: 'Календарь', exact: true })).toHaveAttribute('aria-current', 'true');

  await page.getByTestId('phone-person').click();
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByTestId('login-link')).toBeVisible();
});
