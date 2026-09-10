import { expect, test, type Page } from '@playwright/test';

import { E2E_GSK } from './global-setup';

/* Вход председателя ГСК и его правки рейтинга — сквозная проверка.

   Экраны собраны по макетам Storybook: вход — Э0.1, гость — шапка публичного
   сайта (Э0.4), председатель — оболочка роли, правки — диалогами с основанием.
   Утверждения конкретные: не «кнопка есть», а что после неявки рейтинг упал
   ровно на 0,20 и в истории появилась строка с тем самым основанием. Учётка
   заводится в `global-setup`. */

const строка = (page: Page, имя: string) =>
  page.locator('[data-testid="rating-row"][data-player="' + имя + '"]');

const текущий = (page: Page) => page.getByText('Текущий рейтинг').locator('..');

async function войти(page: Page, next = '/rating') {
  await page.goto('/login?next=' + encodeURIComponent(next));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === next);
  // Оболочка роли: карточка человека снизу бокового меню.
  await expect(page.getByTestId('side-person')).toContainText('Председатель ГСК (проверки)');
}

async function карточка(page: Page, имя: string) {
  await page.goto('/rating');
  await page.getByPlaceholder('Фамилия или регион').fill(имя);
  await строка(page, имя).click();
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  await expect(page.locator('h1')).toHaveText(имя);
}

test('гость видит шапку сайта с «Войти» и не видит правок на карточке', async ({ page }) => {
  await карточка(page, 'Ким Виктор');
  await expect(page.getByTestId('login-link')).toBeVisible();
  await expect(page.getByTestId('side-person')).toHaveCount(0);
  await expect(page.getByTestId('noshow-open')).toHaveCount(0);
});

test('неверный пароль не пускает и говорит об этом', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill('не-тот-пароль');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByTestId('login-error')).toHaveText('Неверная почта или пароль');
  await expect(page).toHaveURL(/\/login/);
});

test('председатель фиксирует неявку: рейтинг падает на 0,20, в истории — основание', async ({ page }) => {
  await войти(page);
  await карточка(page, 'Ким Виктор');
  // Ким Виктор в показательном наборе: 40,00 + 0,20 за турнир = 40,20.
  await expect(текущий(page)).toContainText('40,20');

  await page.getByTestId('noshow-open').click();
  await page.getByLabel('Основание неявки').fill('Не явился на кубок РК, уведомления о снятии нет');
  await page.getByTestId('noshow-submit').click();

  // Первая неявка — −0,20 (п. 15.4); размер прислал сервер, экран не считал.
  await expect(page.getByTestId('chairman-result')).toContainText('−0,20');
  await expect(текущий(page)).toContainText('40,00');
  await expect(
    page.getByTestId('card-history-row').filter({ hasText: 'уведомления о снятии нет' }),
  ).toBeVisible();
});

test('без основания неявку не зафиксировать', async ({ page }) => {
  await войти(page);
  await карточка(page, 'Оралбек Дана');
  await page.getByTestId('noshow-open').click();
  await expect(page.getByTestId('noshow-submit')).toBeDisabled();
  await page.getByRole('button', { name: 'Закрыть' }).last().click();
  await expect(page.getByTestId('noshow-submit')).toHaveCount(0);
});

test('председатель исправляет значение: оно становится ровно введённым', async ({ page }) => {
  await войти(page);
  await карточка(page, 'Нурланов Данияр');

  await page.getByTestId('correction-open').click();
  await page.getByLabel('Исправленное значение').fill('33,50');
  await page.getByLabel('Основание исправления').fill('Опечатка при переносе прежнего рейтинга');
  await page.getByTestId('correction-submit').click();

  await expect(page.getByTestId('chairman-result')).toContainText('→ 33,50');
  await expect(текущий(page)).toContainText('33,50');
  // п. 21.6: прежние записи остаются, исправление — отдельной строкой.
  await expect(
    page.getByTestId('card-history-row').filter({ hasText: 'Опечатка при переносе' }),
  ).toBeVisible();
});

test('калибровка: гостю — ссылка на вход, председателю — «Сделать действующими»', async ({ page }) => {
  await page.goto('/rating/calibration');
  await expect(page.getByTestId('param-D')).toHaveValue('15');
  await expect(page.getByTestId('publish-login')).toBeVisible();
  await expect(page.getByTestId('publish-params')).toHaveCount(0);

  await войти(page, '/rating/calibration');
  await expect(page.getByTestId('publish-params')).toBeVisible();
  await expect(page.getByTestId('publish-login')).toHaveCount(0);
});

test('разделы бокового меню переводят между экранами председателя', async ({ page }) => {
  await войти(page);
  await page.getByRole('button', { name: 'Калибровка' }).click();
  await page.waitForURL((url) => url.pathname === '/rating/calibration');
  // Заголовка у калибровки нет — узнаём её по полю коэффициента D.
  await expect(page.getByTestId('param-D')).toHaveValue('15');
});

test('выход из карточки человека возвращает гостя', async ({ page }) => {
  await войти(page);
  await page.getByTestId('side-person').click();
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByTestId('login-link')).toBeVisible();
});

/* Объединение дублей (п. 5.3). Пара заведена засевом: «Сейтказы Арман» —
   30,00, его дубль — 28,00 с одной неявкой (27,80). После объединения у
   основной должно стать ровно 29,80: старт дубля не прибавился (было бы
   57,80), а его неявка перешла (без неё осталось бы 30,00). */
test('председатель объединяет дубль: история переходит без удвоения старта', async ({ page }) => {
  await войти(page);
  await карточка(page, 'Сейтказы Арман');
  await expect(текущий(page)).toContainText('30,00');

  await page.getByTestId('merge-open').click();
  await expect(page.getByTestId('merge-submit')).toBeDisabled();
  await page.getByPlaceholder('Фамилия дубля').fill('Сейтказы');
  await page.locator('[data-testid="merge-candidate"][data-player="Сейтказы Арман (дубль)"]').click();
  await page.getByLabel('Основание объединения').fill('Один человек, две карточки');
  await page.getByTestId('merge-submit').click();

  await expect(page.getByTestId('chairman-result')).toContainText('Объединено');
  await expect(текущий(page)).toContainText('29,80');
  await expect(
    page.getByTestId('card-history-row').filter({ hasText: 'Объединение карточек' }),
  ).toBeVisible();

  // Карточки дубля в живом листе больше нет.
  await page.goto('/rating?edition=live');
  await page.getByPlaceholder('Фамилия или регион').fill('Сейтказы');
  await expect(строка(page, 'Сейтказы Арман')).toHaveCount(1);
  await expect(строка(page, 'Сейтказы Арман (дубль)')).toHaveCount(0);
});
