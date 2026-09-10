import { expect, test, type Page } from '@playwright/test';

/* Калибровка коэффициентов — сквозная проверка в браузере.

   Считает бэкенд, экран только показывает, поэтому проверка идёт до конца: от
   поля на странице до числа, посчитанного боевым движком. Утверждения
   конкретные — именно то число, которое даёт формула п. 9.2 при заданных
   коэффициентах. Сломается расчёт, ручка предпросчёта или разбор ответа —
   тест покраснеет.

   Коэффициенты берутся с сервера и приведены к значениям по умолчанию засевом
   (`global-setup`): D = 15, K = 0,60, потолок 1,00. */

const строка = (page: Page, имя: string) =>
  page.locator('[data-testid="standing-row"][data-player="' + имя + '"]');

const рейтинг = (page: Page, имя: string) => строка(page, имя).getByTestId('rating-value');

/** Два равных соперника в одном матче — самая проверяемая точка формулы. */
async function двоеРавных(page: Page) {
  await page.goto('/rating/calibration');
  // Ждём, пока приедут коэффициенты: до них расчёта нет и полей тоже.
  await expect(page.getByTestId('param-D')).toHaveValue('15');
  await page.getByRole('button', { name: 'Очистить' }).click();
  await page.getByLabel('Прежний рейтинг: Спортсмен А').fill('20');
  await page.getByLabel('Прежний рейтинг: Спортсмен Б').fill('20');
  await page.getByTestId('add-match').click();
}

test('считает изменение по формуле п. 9.2 с коэффициентом уровня п. 13', async ({ page }) => {
  await двоеРавных(page);

  // Соревнование демо — чемпионат РК, уровень «высшие»: C = 1,20.
  // При равных рейтингах E = 0,50, K = 0,60 → 0,60 × 1,20 × 0,50 = 0,36.
  await expect(рейтинг(page, 'Спортсмен А')).toHaveText('20,36');
  await expect(рейтинг(page, 'Спортсмен Б')).toHaveText('19,64');
});

test('любительский турнир вдвое дешевле республиканского', async ({ page }) => {
  await двоеРавных(page);
  await page
    .getByLabel('Уровень соревнования: Чемпионат Республики Казахстан')
    .selectOption('amateur');

  // C = 0,60: 0,60 × 0,60 × 0,50 = 0,18.
  await expect(рейтинг(page, 'Спортсмен А')).toHaveText('20,18');
  await expect(рейтинг(page, 'Спортсмен Б')).toHaveText('19,82');
});

test('масштаб D меняет ожидаемый результат, а с ним и изменение', async ({ page }) => {
  await page.goto('/rating/calibration');
  await expect(page.getByTestId('param-D')).toHaveValue('15');
  await page.getByRole('button', { name: 'Очистить' }).click();
  await page.getByLabel('Прежний рейтинг: Спортсмен А').fill('20');
  await page.getByLabel('Прежний рейтинг: Спортсмен Б').fill('35');
  await page.getByTestId('add-match').click();

  // Разрыв 15 при D = 15 даёт слабому E = 1/11 ≈ 0,0909.
  // 0,60 × 1,20 × (1 − 0,0909) = 0,6546 → +0,65.
  await expect(рейтинг(page, 'Спортсмен А')).toHaveText('20,65');

  await page.getByTestId('param-D').fill('40');
  // Шире шкала — дешевле победа над более сильным.
  await expect(рейтинг(page, 'Спортсмен А')).not.toHaveText('20,65');
  const после = await рейтинг(page, 'Спортсмен А').textContent();
  expect(Number((после ?? '').replace(',', '.'))).toBeLessThan(20.65);
});

test('потолок п. 12.1 режет изменение и помечает строку истории', async ({ page }) => {
  await двоеРавных(page);
  await page.getByTestId('param-cap').fill('0.1');

  await expect(рейтинг(page, 'Спортсмен А')).toHaveText('20,10');
  await expect(рейтинг(page, 'Спортсмен Б')).toHaveText('19,90');
  await expect(page.getByTestId('history-row').first()).toContainText('⛔');
});

test('история п. 20 сходится: рейтинг до плюс изменение равен рейтингу после', async ({ page }) => {
  await page.goto('/rating/calibration');
  await expect(page.getByTestId('param-D')).toHaveValue('15');
  await page.getByTestId('fill-round-robin').click();

  const rows = page.getByTestId('history-row');
  await expect(rows.first()).toBeVisible();
  const n = await rows.count();
  expect(n).toBeGreaterThan(10); // круговая шестерых — 15 матчей, 30 строк

  for (let i = 0; i < Math.min(n, 12); i++) {
    // Только прямые дети: внутри ячейки изменения живут пометки ⛔ и ●
    // отдельными span, и вложенные сдвинули бы нумерацию колонок.
    const cells = await rows.nth(i).locator(':scope > span').allTextContents();
    const число = (s: string) => Number(s.replace('−', '-').replace(',', '.').replace(/[^\d.\-+]/g, ''));
    const [до, изм, после] = [число(cells[4]), число(cells[5]), число(cells[6])];
    expect(до + изм).toBeCloseTo(после, 6);
  }
});

test('новичок идёт по переходному периоду п. 11 и это видно в таблице', async ({ page }) => {
  await page.goto('/rating/calibration');
  await expect(строка(page, 'Новичок')).toContainText('переходный период, ещё 20');

  await page.getByTestId('fill-round-robin').click();
  await expect(строка(page, 'Новичок')).toContainText('переходный период, ещё 15'); // сыграл 5
});

test('стартовое значение легионера считает сервер по п. 17.4', async ({ page }) => {
  await page.goto('/rating/calibration');
  // Rmax = 90, k = 10, позиция 100: 90 − 10 × ln(100) = 43,95 (пример п. 17.12).
  await expect(строка(page, 'Легионер (ITTF 100)')).toContainText('43,95');

  await page.getByLabel('Позиция ITTF: Легионер (ITTF 100)').fill('50');
  await expect(строка(page, 'Легионер (ITTF 100)')).toContainText('50,88');
});

test('введённое имя спортсмена доходит до таблицы прогона', async ({ page }) => {
  await page.goto('/rating/calibration');
  await expect(строка(page, 'Спортсмен А')).toBeVisible();
  await page.getByLabel('Фамилия и имя спортсмена').first().fill('Ахметов Ерлан');

  await expect(строка(page, 'Ахметов Ерлан')).toBeVisible();
  await expect(строка(page, 'Спортсмен А')).toHaveCount(0);
});

test('коэффициент места п. 10 применяется к победителю турнира', async ({ page }) => {
  await двоеРавных(page);
  await expect(рейтинг(page, 'Спортсмен А')).toHaveText('20,36');

  await page.getByLabel('1 место: Чемпионат Республики Казахстан').selectOption({ label: 'Спортсмен А' });
  // P = 1,20: 0,36 × 1,20 = 0,432 → +0,43.
  await expect(рейтинг(page, 'Спортсмен А')).toHaveText('20,43');
});

test('наблюдения по шкале приходят с сервера и меняются вместе с D', async ({ page }) => {
  await page.goto('/rating/calibration');
  await expect(page.getByTestId('param-D')).toHaveValue('15');
  await expect(page.getByText('МС против КМС при этом D')).toBeVisible();
  await expect(page.getByText('82 %')).toBeVisible();

  await page.getByTestId('param-D').fill('10');
  await expect(page.getByText('91 %')).toBeVisible();
});
