import { expect, test, type Page } from '@playwright/test';

import { E2E_GSK } from './global-setup';

/* Вход председателя ГСК и его правки рейтинга — сквозная проверка.

   Вход по почте и паролю временный (ТЗ §2 — Smart Bridge), права на правки
   рейтинга — только у председателя ГСК. Утверждения конкретные: не «кнопка
   есть», а что после неявки рейтинг упал ровно на 0,20 и в истории появилась
   строка с тем самым основанием. Учётка заводится в `global-setup`. */

const строка = (page: Page, имя: string) =>
  page.locator('[data-testid="rating-row"][data-player="' + имя + '"]');

const текущий = (page: Page) => page.getByText('Текущий рейтинг').locator('..');

async function войти(page: Page, next = '/reyting') {
  await page.goto('/vhod?next=' + encodeURIComponent(next));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === next);
  await expect(page.getByTestId('session-user')).toContainText('председатель ГСК');
}

async function карточка(page: Page, имя: string) {
  await page.goto('/reyting');
  await page.getByPlaceholder('Фамилия или регион').fill(имя);
  await строка(page, имя).click();
  await page.waitForURL(/\/reyting\/[0-9a-f-]{36}$/);
  await expect(page.locator('h1')).toHaveText(имя);
}

test('гость видит «Войти» и не видит правок на карточке', async ({ page }) => {
  await карточка(page, 'Ким Виктор');
  await expect(page.getByTestId('login-link')).toBeVisible();
  await expect(page.getByTestId('chairman-panel')).toHaveCount(0);
});

test('неверный пароль не пускает и говорит об этом', async ({ page }) => {
  await page.goto('/vhod');
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill('не-тот-пароль');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByTestId('login-error')).toHaveText('Неверная почта или пароль');
  await expect(page).toHaveURL(/\/vhod/);
});

test('председатель фиксирует неявку: рейтинг падает на 0,20, в истории — основание', async ({ page }) => {
  await войти(page);
  await карточка(page, 'Ким Виктор');
  // Ким Виктор в показательном наборе: 40,00 + 0,20 за турнир = 40,20.
  await expect(текущий(page)).toContainText('40,20');

  await page.getByTestId('noshow-reason').fill('Не явился на кубок РК, уведомления о снятии нет');
  await page.getByTestId('noshow-submit').click();

  // Первая неявка — −0,20 (п. 15.4); размер прислал сервер, экран не считал.
  await expect(page.getByTestId('chairman-result')).toContainText('−0,20');
  await expect(текущий(page)).toContainText('40,00');
  await expect(
    page.getByTestId('card-history-row').filter({ hasText: 'уведомления о снятии нет' }),
  ).toBeVisible();
});

test('председатель исправляет значение: оно становится ровно введённым', async ({ page }) => {
  await войти(page);
  await карточка(page, 'Нурланов Данияр');

  await page.getByTestId('correction-value').fill('33,50');
  await page.getByTestId('correction-reason').fill('Опечатка при переносе прежнего рейтинга');
  await page.getByTestId('correction-submit').click();

  await expect(page.getByTestId('chairman-result')).toContainText('→ 33,50');
  await expect(текущий(page)).toContainText('33,50');
  // п. 21.6: прежние записи остаются, исправление — отдельной строкой.
  await expect(
    page.getByTestId('card-history-row').filter({ hasText: 'Опечатка при переносе' }),
  ).toBeVisible();
});

test('калибровка: гостю — ссылка на вход, председателю — «Сделать действующими»', async ({ page }) => {
  await page.goto('/reyting/kalibrovka');
  await expect(page.getByTestId('param-D')).toHaveValue('15');
  await expect(page.getByTestId('publish-login')).toBeVisible();
  await expect(page.getByTestId('publish-params')).toHaveCount(0);

  await войти(page, '/reyting/kalibrovka');
  await expect(page.getByTestId('publish-params')).toBeVisible();
  await expect(page.getByTestId('publish-login')).toHaveCount(0);
});

test('выход возвращает гостя', async ({ page }) => {
  await войти(page);
  await page.getByTestId('session-user').getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByTestId('login-link')).toBeVisible();
});
