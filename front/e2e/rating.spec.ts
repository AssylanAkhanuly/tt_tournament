import { expect, test, type Page } from '@playwright/test';

/* Рейтинг игроков: лист и карточка спортсмена — сквозная проверка в браузере.

   Числа берутся из показательного набора (`seed_rating_demo`), посчитанного
   боевым расчётом. Утверждения конкретные: порядок строк, значение в ячейке,
   сходимость истории. Сломается расчёт, отдача API или разбор чисел на фронте —
   тест покраснеет. */

const строка = (page: Page, имя: string) =>
  page.locator('[data-testid="rating-row"][data-player="' + имя + '"]');

/** Выбрать значение в отборе ✳ (16.09.2026): отборы собраны под кнопкой
    «Фильтры», значения — в подменю группы.

    Открытие держится на React, а под дев-сервером страница успевает
    отрисоваться раньше, чем к ней подключится обработчик: первый клик тогда
    уходит в никуда. Поэтому нажатие повторяется, пока меню не откроется. */
async function фильтр(page: Page, группа: string, значение: string) {
  const пункт = page.getByRole('menuitemradio', { name: значение, exact: true });
  await expect(async () => {
    if (!(await пункт.isVisible())) {
      await page.getByTestId('filters-open').click();
      await page.getByRole('menuitem', { name: new RegExp('^' + группа) }).click();
    }
    /* Клик внутри повтора: подменю появляется с анимацией, и элемент,
       найденный до её конца, успевает смениться («element was detached»).
       Повторный выбор того же значения ничего не портит — оно одно. */
    await пункт.click({ timeout: 1500 });
  }).toPass();
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
  await фильтр(page, 'Пол', 'Женщины');

  // Из показательных остаются две женщины и ни одного мужчины: не сработай
  // фильтр — в порядке окажутся все восемь.
  await ожидатьДемо(page, ['Жумабаева Айна', 'Оралбек Дана']);
});

test('возрастная выборка сужает список, не меняя значений', async ({ page }) => {
  await page.goto('/rating');
  const общий = await строка(page, 'Оспанов Тимур').getByTestId('rating-value').textContent();

  await фильтр(page, 'Возраст', 'U15');

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

/** Строка «подпись — значение» в паспортной части карточки. Первая по порядку:
    ниже в истории стартовая запись называется так же. */
const поле = (page: Page, подпись: string) => page.getByText(подпись, { exact: true }).first().locator('..');

test('в карточке новичка виден переходный период и стартовое значение 1,00', async ({ page }) => {
  await page.goto('/rating');
  await строка(page, 'Оспанов Тимур').click();

  // Происхождение старта на экран не выводится ✳ (10.09.2026) — только число.
  await expect(поле(page, 'Стартовое значение')).toContainText('1,00');
  // ● — пометка матча переходного периода (п. 11.2).
  await expect(page.getByTestId('card-history-row').filter({ hasText: '●' }).first()).toBeVisible();
});

test('в карточке легионера видно, что старт посчитан из позиции ITTF', async ({ page }) => {
  await page.goto('/rating');
  await строка(page, 'Ли Александр').click();

  // Rmax = 90, k = 10, позиция 100: 90 − 10 × ln(100) = 43,95 (пример п. 17.12).
  await expect(поле(page, 'Стартовое значение')).toContainText('43,95');
  await expect(поле(page, 'Позиция в ITTF на момент входа')).toContainText('100');
});

test('у спортсмена без рейтинга карточки нет, и это сказано прямо', async ({ page }) => {
  await page.goto('/rating/00000000-0000-0000-0000-000000000000');
  await expect(page.getByText('Карточки нет')).toBeVisible();
});

test('история рейтинга переключается на график ✳ (16.09.2026)', async ({ page }) => {
  await page.goto('/rating');
  await строка(page, 'Ахметов Ерлан').click();
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId('card-history-row').first()).toBeVisible();

  await page.getByRole('tab', { name: 'График' }).click();
  await expect(page.getByRole('img', { name: 'История рейтинга' })).toBeVisible();
  // Вкладка именно переключает: таблицы под графиком нет.
  await expect(page.getByTestId('card-history-row')).toHaveCount(0);

  await page.getByRole('tab', { name: 'Таблица' }).click();
  await expect(page.getByTestId('card-history-row').first()).toBeVisible();
  await expect(page.getByRole('img', { name: 'История рейтинга' })).toHaveCount(0);
});

/* Сортировка колонкой ✳ (16.09.2026). Считает её сервер: таблица (TanStack)
   держит состояние, а порядок приходит из `GET /api/rating/?sort=…`. Сравнение
   строк — по кодам символов, как сортирует локальная SQLite (на боевой
   PostgreSQL сортировка по правилам языка, и порядок казахских букв может
   отличаться — проверка живёт на дев-базе). */
const имена = (page: Page) =>
  page.locator('[data-testid="rating-row"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-player') ?? ''));

test('сортировка колонкой идёт по всему листу', async ({ page }) => {
  await page.goto('/rating');
  await expect(page.locator('[data-testid="rating-row"]').first()).toBeVisible();
  // Без спроса лист по убыванию рейтинга: первый — сильнейший показательный.
  await ожидатьДемо(page, ДЕМО);

  await page.getByTestId('sort-name').click();
  await expect(async () => {
    const список = await имена(page);
    expect(список.length).toBeGreaterThan(1);
    expect([...список].sort()).toEqual(список);
  }).toPass();

  await page.getByTestId('sort-name').click();
  await expect(async () => {
    const список = await имена(page);
    expect([...список].sort().reverse()).toEqual(список);
  }).toPass();

  /* Колонка «Рейтинг» с первого клика идёт по убыванию: у числовой колонки это
     умолчание TanStack, и для рейтинга оно верное — сильнейший сверху. Второй
     клик разворачивает, и слабейшие оказываются на первой странице: значит
     сортировал сервер, а не страница (на ней сотня из ста двадцати пяти). */
  const значения = async () =>
    page
      .locator('[data-testid="rating-value"]')
      .evaluateAll((els) => els.map((e) => Number((e.textContent ?? '').replace(',', '.'))));

  await page.getByTestId('sort-value').click();
  await expect(async () => {
    const список = await значения();
    expect([...список].sort((a, b) => b - a)).toEqual(список);
    expect(список[0]).toBeGreaterThan(50);
  }).toPass();

  await page.getByTestId('sort-value').click();
  await expect(async () => {
    const список = await значения();
    expect([...список].sort((a, b) => a - b)).toEqual(список);
    expect(список[0]).toBeLessThan(50);
  }).toPass();
});
