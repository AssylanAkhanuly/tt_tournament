import { expect, test, type Page } from '@playwright/test';

import { E2E_GSK } from './global-setup';

/* Журнал и калибровка председателя ГСК ✳ (03.11.2026). Выпусков и апелляций
   нет (решение владельца продукта того же дня): изменение рейтинга видно на
   карточке спортсмена, лист — живые значения.

   Идут отдельным проектом после остальных проверок (`playwright.config.ts`):
   сохранённые коэффициенты меняют каждый следующий расчёт. Спортсменка —
   Жумабаева Айна: её не трогает ни одна другая проверка.

   Утверждения конкретные: исправление на 49,50 видно в листе сразу и в журнале
   строкой с основанием, автором и изменением; в подсказке у D выделено именно
   D; сохранённое D = 10 переживает перезагрузку. */

test.describe.configure({ mode: 'serial' });

const ИМЯ = 'Жумабаева Айна';
const строка = (page: Page, имя: string) => page.locator('[data-testid="rating-row"][data-player="' + имя + '"]');
const текущий = (page: Page) => page.getByText('Текущий рейтинг').locator('..');

async function войти(page: Page, next: string) {
  await page.goto('/login?next=' + encodeURIComponent(next));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === next.split('?')[0]);
  await expect(page.getByTestId('side-person')).toContainText('Председатель ГСК (проверки)');
}

async function карточка(page: Page, имя: string) {
  await page.goto('/rating');
  await page.getByPlaceholder('Фамилия или регион').fill(имя);
  await строка(page, имя).click();
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  await expect(page.locator('h1')).toHaveText(имя);
}

test('гостя из разделов председателя уводит на вход', async ({ page }) => {
  for (const path of ['/rating/journal', '/rating/calibration']) {
    await page.goto(path);
    await page.waitForURL(/\/login\?next=/);
    expect(decodeURIComponent(page.url())).toContain('next=' + path);
  }
});

test('в меню нет выпусков и апелляций, на карточке — одна кнопка «Редактировать»', async ({ page }) => {
  await войти(page, '/rating');
  await expect(page.getByRole('button', { name: 'Журнал', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Калибровка', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Выпуски', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Апелляции', exact: true })).toHaveCount(0);

  await карточка(page, ИМЯ);
  await expect(page.getByTestId('correction-open')).toBeVisible();
  await expect(page.getByTestId('noshow-open')).toHaveCount(0);
  await expect(page.getByTestId('appeal-open')).toHaveCount(0);
  await expect(page.getByTestId('merge-open')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/rating-governance/card.png' });
});

test('журнал: исправление — строкой с основанием и автором, отбор и поиск', async ({ page }) => {
  await войти(page, '/rating');
  await карточка(page, ИМЯ);
  await page.getByTestId('correction-open').click();
  await page.getByTestId('correction-value').fill('49,50');
  await page.getByTestId('correction-reason').fill('[e2e] Опечатка в протоколе');
  await page.getByTestId('correction-submit').click();
  await expect(текущий(page)).toContainText('49,50');

  // Лист живой: исправление видно сразу.
  await page.goto('/rating');
  await page.getByPlaceholder('Фамилия или регион').fill(ИМЯ);
  await expect(строка(page, ИМЯ).getByTestId('rating-value')).toHaveText('49,50');

  await page.getByRole('button', { name: 'Журнал', exact: true }).click();
  await page.waitForURL(/\/rating\/journal$/);
  await page.getByPlaceholder('Фамилия спортсмена').fill('Жумабаева');
  const записи = page.locator('[data-testid="journal-row"][data-player="' + ИМЯ + '"]');
  await expect(записи.first()).toContainText('[e2e] Опечатка в протоколе');
  await expect(записи.first()).toContainText('Председатель ГСК (проверки)');
  await expect(записи.first()).toContainText('49,50');

  await page.getByTestId('filters-open').click();
  await page.getByRole('menuitem', { name: /Вид записи/ }).click();
  await page.getByRole('menuitemradio', { name: 'Исправление' }).or(page.getByRole('menuitem', { name: 'Исправление' })).click();
  await expect(page.locator('[data-testid="journal-row"]:not([data-kind="correction"])')).toHaveCount(0);
  await expect(page.locator('[data-testid="journal-row"][data-kind="correction"][data-player="' + ИМЯ + '"]')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/rating-governance/journal.png' });

  await page.getByPlaceholder('Фамилия спортсмена').fill('Ким');
  await expect(записи).toHaveCount(0);
});

test('калибровка: формула у коэффициента, без панели доли побед, сохранение делает действующим', async ({ page }) => {
  await войти(page, '/rating/calibration');
  // «Прогона» и «Ожидаемой доли побед» нет ✳ (03.11.2026).
  await expect(page.getByTestId('nav-sub')).toHaveCount(0);
  await expect(page.getByTestId('calibration-insights')).toHaveCount(0);
  await expect(page.getByText('Ожидаемая доля побед')).toHaveCount(0);
  await expect(page.getByTestId('params-save')).toBeDisabled();
  // Число не обрезано: поле ввода — между «−» и «+», а не в колонке в 40px.
  const k = page.getByTestId('param-k');
  await expect(k).toHaveValue('0,6');
  expect((await k.boundingBox())!.width).toBeGreaterThan(90);
  // «+» прибавляет шаг коэффициента: K 0,6 → 0,65, черновик изменён.
  await page.getByRole('button', { name: 'Увеличить: K стандартный' }).click();
  await expect(k).toHaveValue('0,65');
  await expect(page.getByTestId('params-save')).toBeEnabled();
  await page.getByRole('button', { name: 'Уменьшить: K стандартный' }).click();
  await expect(k).toHaveValue('0,6');

  // Подсказка у D — формула, и выделено в ней именно D.
  await page.getByRole('button', { name: 'Формула: D — масштаб шкалы' }).hover();
  const формула = page.getByTestId('formula');
  await expect(формула).toContainText('E = 1 / (1 + 10');
  await expect(формула.getByTestId('formula-mark')).toHaveText('D');

  const d = page.getByTestId('param-d');
  await d.fill('10');
  await d.blur();
  await expect(page.getByTestId('params-save')).toBeEnabled();
  await page.screenshot({ path: 'test-results/rating-governance/calibration.png', fullPage: true });
  await page.getByTestId('params-save').click();
  await expect(page.getByTestId('params-save')).toBeDisabled();
  await page.reload();
  await expect(page.getByTestId('param-d')).toHaveValue('10');

  // Вернуть как было: следующий расчёт не должен зависеть от этой проверки.
  await page.getByTestId('param-d').fill('15');
  await page.getByTestId('param-d').blur();
  await page.getByTestId('params-save').click();
  await expect(page.getByTestId('params-save')).toBeDisabled();
  await page.reload();
  await expect(page.getByTestId('param-d')).toHaveValue('15');
});
