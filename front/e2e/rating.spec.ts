import { expect, test, type Page } from '@playwright/test';

/* Рейтинг игроков: лист и карточка спортсмена — сквозная проверка в браузере.

   Числа берутся из показательного набора (`seed_rating_demo`), посчитанного
   боевым расчётом. Утверждения конкретные: порядок строк, значение в ячейке,
   сходимость истории. Сломается расчёт, отдача API или разбор чисел на фронте —
   тест покраснеет. */

const строка = (page: Page, имя: string) =>
  page.locator('[data-testid="rating-row"][data-player="' + имя + '"]');

/** Выбрать значение в фильтре.

    Открытие списка держится на React, а под дев-сервером с восемью
    работниками страница успевает отрисоваться раньше, чем к ней подключится
    обработчик: первый клик тогда уходит в никуда. Поэтому клик по кнопке
    фильтра повторяется, пока список не откроется. */
async function фильтр(page: Page, подпись: RegExp, значение: string) {
  await expect(async () => {
    await page.getByRole('button', { name: подпись }).click();
    await expect(page.getByRole('button', { name: значение, exact: true })).toBeVisible({
      timeout: 1000,
    });
  }).toPass();
  await page.getByRole('button', { name: значение, exact: true }).click();
}

/** Показательные спортсмены (`seed_rating_demo`) — по убыванию рейтинга. */
const ДЕМО = [
  'Ахметов Ерлан',
  'Сулейменов Азамат',
  'Жумабаева Айна',
  'Ли Александр',
  'Ким Виктор',
  'Оралбек Дана',
  'Нурланов Данияр',
  'Оспанов Тимур',
];

/** Порядок показательных спортсменов среди всех строк листа.

    В дев-базе кроме показательного набора лежат и другие карточки — например,
    загруженный состав сборной. Проверка не должна зависеть от того, что ещё
    лежит в базе: из листа берутся только показательные фамилии и сверяется их
    взаимный порядок. Сломается сортировка или фильтр — порядок разъедется.

    Читается с повтором: список приходит по сети, и одиночное чтение может
    попасть между сменой отбора и ответом сервера. */
async function ожидатьДемо(page: Page, ожидание: string[]) {
  await expect(async () => {
    const порядок = await page
      .locator('[data-testid="rating-row"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-player')));
    expect(порядок.filter((n): n is string => !!n && ДЕМО.includes(n))).toEqual(ожидание);
  }).toPass();
}

test('лист открыт без входа и отсортирован по убыванию рейтинга', async ({ page }) => {
  await page.goto('/rating');
  await expect(page.locator('[data-testid="rating-row"]').first()).toBeVisible();

  await ожидатьДемо(page, ДЕМО);

  // Значения посчитаны расчётом, а не подставлены: 82,00 после трёх побед
  // на чемпионате РК даёт 82,01 — прибавка почти нулевая, потому что все
  // соперники слабее и победы ожидаемы.
  await expect(строка(page, 'Ахметов Ерлан').getByTestId('rating-value')).toHaveText('82,01');
  await expect(строка(page, 'Сулейменов Азамат').getByTestId('rating-value')).toHaveText('50,05');
});

test('фильтр по полу оставляет только женщин', async ({ page }) => {
  await page.goto('/rating');
  await фильтр(page, /Пол/, 'Женщины');

  // Из показательных остаются две женщины и ни одного мужчины: не сработай
  // фильтр — в порядке окажутся все восемь.
  await ожидатьДемо(page, ['Жумабаева Айна', 'Оралбек Дана']);
});

test('возрастная выборка сужает список, не меняя значений', async ({ page }) => {
  await page.goto('/rating');
  const общий = await строка(page, 'Оспанов Тимур').getByTestId('rating-value').textContent();

  await фильтр(page, /Возраст/, 'U15');

  await expect(строка(page, 'Оспанов Тимур')).toBeVisible();
  await expect(строка(page, 'Ахметов Ерлан')).toHaveCount(0); // 1998 года — не U15
  // п. 7.2–7.3: возрастной рейтинг не отдельный, значение то же самое.
  await expect(строка(page, 'Оспанов Тимур').getByTestId('rating-value')).toHaveText(общий ?? '');
});

test('поиск находит спортсмена по фамилии', async ({ page }) => {
  await page.goto('/rating');
  await page.getByPlaceholder('Фамилия или регион').fill('Ким');

  await expect(строка(page, 'Ким Виктор')).toBeVisible();
  await expect(строка(page, 'Ахметов Ерлан')).toHaveCount(0);
});

test('строка листа открывает карточку спортсмена', async ({ page }) => {
  await page.goto('/rating');
  await строка(page, 'Ким Виктор').click();

  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  // Заголовок страницы, а не заголовок карточки внутри: фамилия стоит и там,
  // и там, и без уточнения локатор находит оба.
  await expect(page.locator('h1')).toHaveText('Ким Виктор');
});

test('карточка сходится: рейтинг равен сумме изменений в истории', async ({ page }) => {
  await page.goto('/rating');
  await строка(page, 'Оспанов Тимур').click();
  await expect(page.getByTestId('card-history-row').first()).toBeVisible();

  const число = (s: string) =>
    Number(s.replace('−', '-').replace(',', '.').replace(/[^\d.\-+]/g, ''));

  const rows = page.getByTestId('card-history-row');
  const n = await rows.count();
  let сумма = 0;
  for (let i = 0; i < n; i++) {
    const cells = await rows.nth(i).locator(':scope > span').allTextContents();
    const [до, изм, после] = [число(cells[4]), число(cells[5]), число(cells[6])];
    // Каждая строка сходится сама по себе — требование таблицы п. 20.
    expect(до + изм).toBeCloseTo(после, 6);
    сумма += изм;
  }

  // И значение карточки равно сумме журнала — главный инвариант рейтинга.
  const тайл = page.getByText('Текущий рейтинг').locator('..');
  const значение = число((await тайл.textContent()) ?? '');
  expect(значение).toBeCloseTo(сумма, 2);
});

test('в карточке новичка виден переходный период и стартовое значение 1,00', async ({ page }) => {
  await page.goto('/rating');
  await строка(page, 'Оспанов Тимур').click();

  await expect(page.getByText('Стартовое значение', { exact: true })).toBeVisible();
  await expect(page.getByText(/1,00 · Новый/)).toBeVisible();
  // ● — пометка матча переходного периода (п. 11.2).
  await expect(page.getByTestId('card-history-row').filter({ hasText: '●' }).first()).toBeVisible();
});

test('в карточке легионера видно, что старт посчитан из позиции ITTF', async ({ page }) => {
  await page.goto('/rating');
  await строка(page, 'Ли Александр').click();

  // Rmax = 90, k = 10, позиция 100: 90 − 10 × ln(100) = 43,95 (пример п. 17.12).
  await expect(page.getByText(/43,95 · Из позиции ITTF/)).toBeVisible();
  await expect(page.getByText('Позиция в ITTF на момент входа')).toBeVisible();
});

test('у спортсмена без рейтинга карточки нет, и это сказано прямо', async ({ page }) => {
  await page.goto('/rating/00000000-0000-0000-0000-000000000000');
  await expect(page.getByText('Карточки нет')).toBeVisible();
});
