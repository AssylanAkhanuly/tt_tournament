import { expect, test, type Page } from '@playwright/test';

import { E2E_GSK } from './global-setup';

/* Выпуски рейтинга (п. 8.2) — сквозная проверка потока «пересчитали →
   посмотрели → опубликовали».

   Утверждения про числа: после исправления гость видит в листе прежнее
   значение, пока выпуск не опубликован, а черновик показывает ровно этот
   сдвиг. Спортсменка — Жумабаева Айна: остальные наборы её не правят.

   Выпуски — общее состояние базы, поэтому тесты файла идут по порядку. */

test.describe.configure({ mode: 'serial' });

const ИМЯ = 'Жумабаева Айна';

async function войти(page: Page, next: string) {
  await page.goto('/login?next=' + encodeURIComponent(next));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === next);
  await expect(page.getByTestId('side-person')).toBeVisible();
}

/** Значение спортсменки в публичном листе — глазами гостя. */
async function вЛистеГостя(page: Page): Promise<string> {
  await page.goto('/rating');
  await page.getByPlaceholder('Фамилия или регион').fill(ИМЯ);
  const строка = page.locator('[data-testid="rating-row"][data-player="' + ИМЯ + '"]');
  await expect(строка).toHaveCount(1);
  return (await строка.getByTestId('rating-value').textContent()) ?? '';
}

test('гостя в раздел выпусков не пускает — уводит на вход', async ({ page }) => {
  await page.goto('/rating/editions');
  await page.waitForURL(
    (url) => url.pathname === '/login' && url.searchParams.get('next') === '/rating/editions',
  );
});

test('опубликованный выпуск держит значение, пока не выйдет следующий', async ({ page, browser }) => {
  await войти(page, '/rating/editions');

  // Первый выпуск: снимок текущих значений.
  await page.getByTestId('publish-edition').click();
  await expect(page.getByTestId('edition-result')).toContainText('Опубликован выпуск №');
  await expect(page.getByTestId('edition-row').first()).toBeVisible();

  // Исправление после выпуска: живое значение меняется…
  await page.goto('/rating');
  // Выбор выпуска — по своей метке: «Выпуски» есть ещё и в меню председателя.
  const выбор = page.getByTestId('edition-picker');
  await выбор.getByRole('button').first().click();
  await выбор.getByRole('button', { name: 'текущие значения' }).click();
  await page.getByPlaceholder('Фамилия или регион').fill(ИМЯ);
  await page.locator('[data-testid="rating-row"][data-player="' + ИМЯ + '"]').click();
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  await page.getByTestId('correction-open').click();
  await page.getByLabel('Исправленное значение').fill('48,00');
  await page.getByLabel('Основание исправления').fill('Сверка с протоколом');
  await page.getByTestId('correction-submit').click();
  await expect(page.getByTestId('chairman-result')).toContainText('→ 48,00');

  // …а гость по-прежнему видит выпуск.
  const гость = await browser.newPage();
  expect(await вЛистеГостя(гость)).toBe('47,14');

  // Черновик показывает ровно этот сдвиг.
  await page.goto('/rating/editions');
  const черновик = page.locator('[data-testid="draft-row"][data-player="' + ИМЯ + '"]');
  await expect(черновик).toContainText('47,14');
  await expect(черновик).toContainText('48,00');
  await expect(черновик).toContainText('+0,86');

  // Второй выпуск — гость видит новое значение, черновик пуст для неё.
  await page.getByTestId('publish-edition').click();
  await expect(page.getByTestId('edition-result')).toContainText('Опубликован выпуск №');
  await expect(черновик).toHaveCount(0);
  expect(await вЛистеГостя(гость)).toBe('48,00');
  await гость.close();
});

/* Апелляция (п. 21) — здесь же, после выпусков: обжалуется опубликованный
   выпуск, а выпуски публикует только этот файл. Спортсменка — Оралбек Дана:
   её значение другие наборы не меняют. */
test('апелляция: регистрируется с карточки и решается в очереди', async ({ page }) => {
  const ДАНА = 'Оралбек Дана';
  await войти(page, '/rating');

  await page.getByPlaceholder('Фамилия или регион').fill(ДАНА);
  await page.locator('[data-testid="rating-row"][data-player="' + ДАНА + '"]').click();
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  await page.getByTestId('appeal-open').click();
  await expect(page.getByTestId('appeal-submit')).toBeDisabled(); // без предмета и требования
  await page.getByLabel('Что обжалуется').fill('Начисление за матч с Жумабаевой');
  await page.getByLabel('Требование').fill('Пересчитать по исправленному протоколу');
  await page.getByTestId('appeal-submit').click();
  await expect(page.getByTestId('chairman-result')).toContainText('Апелляция №');

  // В очереди «Ждут решения».
  await page.goto('/rating/appeals');
  const строка = page.locator('[data-testid="appeal-row"][data-player="' + ДАНА + '"]');
  await expect(строка).toContainText('Ждёт решения');

  // Удовлетворить нельзя без обоснования и значения.
  await строка.click();
  await expect(page.getByTestId('appeal-uphold')).toBeDisabled();
  await page.getByLabel('Обоснование решения').fill('Ошибка в протоколе подтверждена');
  await page.getByLabel('Исправленное значение').fill('38,00');
  await page.getByTestId('appeal-uphold').click();

  // Из очереди ушла, во вкладке «Решённые» — удовлетворена.
  await expect(строка).toHaveCount(0);
  const вкладки = page.getByTestId('appeal-tabs');
  await вкладки.getByRole('button').first().click();
  await вкладки.getByRole('button', { name: 'Решённые' }).click();
  await expect(строка).toContainText('Удовлетворена');

  // Значение исправлено строкой журнала.
  await page.goto('/rating');
  await page.getByPlaceholder('Фамилия или регион').fill(ДАНА);
  await page.locator('[data-testid="rating-row"][data-player="' + ДАНА + '"]').click();
  await expect(page.getByText('Текущий рейтинг').locator('..')).toContainText('38,00');
  await expect(
    page.getByTestId('card-history-row').filter({ hasText: 'Апелляция №' }),
  ).toBeVisible();
});

/* Журнал (п. 20, 22.2): правка из теста выпусков видна в нём с суммой,
   основанием и автором. */
test('журнал показывает правку с суммой, основанием и автором', async ({ page }) => {
  await войти(page, '/rating/journal');
  await page.getByPlaceholder('Спортсмен').fill(ИМЯ);
  const строка = page
    .locator('[data-testid="journal-row"][data-player="' + ИМЯ + '"]')
    .filter({ hasText: 'Сверка с протоколом' });
  await expect(строка).toContainText('+0,86');
  await expect(строка).toContainText('Председатель ГСК (проверки)');
});
