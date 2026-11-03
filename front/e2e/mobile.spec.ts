import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_GSK } from './global-setup';

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
  // Шапки нет ✳ (03.11.2026): ни знака, ни аватара; вкладка — одним словом.
  await expect(page.getByText('Национальный рейтинг', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('phone-person')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Рейтинг', exact: true })).toHaveAttribute('aria-current', 'true');
  // Строка листа — фамилия и рейтинг видны целиком, не сжаты до нуля.
  const ахметов = page.locator('[data-testid="rating-row"][data-player="Ахметов Ерлан"]');
  await expect(ахметов).toContainText('АХМЕТОВ Ерлан');
  await expect(ахметов.getByTestId('rating-value')).toHaveText('82,01');
  expect((await ахметов.boundingBox())!.width).toBeLessThanOrEqual(390);
  // Отбор и действия — один значок настроек рядом с поиском, панель снизу ✳ (03.11.2026).
  await expect(page.getByTestId('rating-more')).toHaveCount(0);
  // Поиск занимает строку, значок — справа от него.
  expect((await page.getByPlaceholder('Фамилия или регион').locator('..').boundingBox())!.width).toBeGreaterThan(280);
  await expect(page.getByTestId('filters-open')).toHaveCount(0);
  const поиск = (await page.getByPlaceholder('Фамилия или регион').boundingBox())!;
  const значок = (await page.getByTestId('table-tools-open').boundingBox())!;
  expect(Math.abs(поиск.y + поиск.height / 2 - (значок.y + значок.height / 2))).toBeLessThan(4); // в одной строке
  // Панель вложенная: сначала три пункта, у каждого свой вид и «назад».
  await page.getByTestId('table-tools-open').click();
  const панель = page.getByTestId('table-tools');
  const меню = панель.getByTestId('table-tools-menu');
  await expect(меню.getByTestId('table-tools-filters')).toContainText('Не выбраны');
  await expect(меню.getByTestId('athlete-open')).toBeVisible();
  await expect(меню.getByTestId('rating-export')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/mobile/tools-menu.png' });

  await меню.getByTestId('table-tools-filters').click();
  await expect(панель).toHaveAttribute('data-view', 'filters');
  await панель.getByRole('radio', { name: 'Женщины' }).click();
  await expect(панель.getByRole('radio', { name: 'Женщины' })).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: 'test-results/mobile/tools-sheet.png' });
  await панель.getByTestId('table-tools-back').click();
  await expect(меню.getByTestId('table-tools-filters')).toContainText('Женщины');

  await меню.getByTestId('rating-export').click();
  await expect(панель.getByTestId('export-details')).toContainText('Женщины');
  await page.screenshot({ path: 'test-results/mobile/tools-export.png' });
  await панель.getByTestId('table-tools-back').click();

  await меню.getByTestId('athlete-open').click();
  await expect(панель.getByTestId('athlete-form')).toBeVisible();
  await expect(панель.getByTestId('athlete-submit')).toBeDisabled();
  await page.screenshot({ path: 'test-results/mobile/tools-add.png' });
  await панель.getByTestId('table-tools-back').click();
  await expect(меню).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(панель).toHaveCount(0);
  await expect(page.locator('[data-testid="rating-row"][data-player="Ахметов Ерлан"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="rating-row"]').first()).toBeVisible();

  // Календарь и «Выйти» — во вкладке «Ещё».
  await page.getByTestId('phone-more').click();
  const ещё = page.getByTestId('phone-more-sheet');
  await expect(ещё.getByTestId('phone-person')).toContainText('Председатель ГСК (проверки)');
  await expect(ещё.getByRole('button', { name: 'Выйти' })).toBeInViewport();
  await page.waitForTimeout(400); // анимация панели — для снимка
  await page.screenshot({ path: 'test-results/mobile/more-tab.png' });
  await ещё.getByRole('button', { name: 'Календарь' }).click();
  await page.waitForURL((url) => url.pathname === '/calendar');

  await page.getByTestId('phone-more').click();
  await page.getByTestId('phone-more-sheet').getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByTestId('login-link')).toBeVisible();
});

test('на телефоне таблицы и график — от края до края, без полей ✳ (03.11.2026)', async ({ page }) => {
  await page.goto('/login?next=' + encodeURIComponent('/rating/journal'));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/rating/journal');

  // Журнал: таблица во всю ширину экрана, счётчика записей нет.
  const журнал = page.getByTestId('journal');
  await expect(page.getByTestId('journal-row').first()).toBeVisible();
  const j = (await журнал.boundingBox())!;
  expect(j.x).toBe(0);
  expect(j.width).toBe(390);
  await expect(page.getByTestId('table-count')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/mobile/journal.png' });

  // Карточка: история и график — тоже от края до края.
  await page.goto('/rating');
  await page.locator('[data-testid="rating-row"][data-player="Ахметов Ерлан"]').click();
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  const история = page.getByTestId('card-history');
  await expect(история).toBeVisible();
  expect((await история.boundingBox())!.x).toBe(0);
  expect((await история.boundingBox())!.width).toBe(390);
  await page.screenshot({ path: 'test-results/mobile/card.png', fullPage: true });
  await page.getByRole('tab', { name: 'График' }).click();
  const график = page.getByTestId('card-chart');
  expect((await график.boundingBox())!.x).toBe(0);
  expect((await график.boundingBox())!.width).toBe(390);
  await page.screenshot({ path: 'test-results/mobile/chart.png' });
});

test('на телефоне окна и карточки календаря — панелями снизу ✳ (03.11.2026)', async ({ page }) => {
  await page.goto('/login?next=' + encodeURIComponent('/rating'));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/rating');

  // «Редактировать» на карточке — окно встаёт панелью снизу во всю ширину.
  await page.locator('[data-testid="rating-row"][data-player="Ахметов Ерлан"]').click();
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  await page.getByTestId('correction-open').click();
  const окно = page.getByTestId('correction-dialog');
  // Настоящая панель (`Drawer`): с ручкой и без крестика окна.
  await expect(окно).toHaveAttribute('data-sheet', 'yes');
  await expect(окно.locator('.drawer__handle')).toBeVisible();
  await expect(окно.getByRole('button', { name: 'Закрыть' })).toHaveCount(0);
  await page.waitForTimeout(400);
  const o = (await окно.boundingBox())!;
  expect(o.width).toBe(390);
  expect(Math.round(o.y + o.height)).toBeGreaterThanOrEqual(840);
  await page.screenshot({ path: 'test-results/mobile/correction-sheet.png' });
  await page.keyboard.press('Escape');

  // Календарь: карточка турнира — панель снизу, не поповер за краем.
  await page.goto('/calendar');
  const турнир = page.getByTestId('calendar-tournament').first();
  await expect(турнир).toBeVisible();
  await турнир.click();
  const карточка = page.getByTestId('tournament-details');
  await expect(карточка).toBeVisible();
  await page.waitForTimeout(400);
  const c = (await карточка.boundingBox())!;
  expect(c.x).toBe(0);
  expect(c.width).toBe(390);
  await expect(карточка.getByRole('button', { name: 'Подробнее' })).toBeInViewport();
  await page.screenshot({ path: 'test-results/mobile/calendar-sheet.png' });
});

test('на телефоне календарь: месяц без года, «+» в правом нижнем углу ✳ (03.11.2026)', async ({ page }) => {
  await page.goto('/login?next=' + encodeURIComponent('/dashboard'));
  await page.getByLabel('Эл. почта').fill(E2E_ADMIN.email);
  await page.getByLabel('Пароль').fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');

  const месяц = page.getByTestId('calendar-month');
  await expect(месяц).toHaveText(/^[А-Я][а-я]+$/); // «Ноябрь», без года
  const плюс = page.getByTestId('tournament-create-open');
  await expect(плюс).toHaveAccessibleName('Новый турнир');
  const b = (await плюс.boundingBox())!;
  expect(390 - (b.x + b.width)).toBeLessThan(24); // прижат вправо
  expect(b.y).toBeGreaterThan(600); // и вниз
  await page.screenshot({ path: 'test-results/mobile/calendar-fab.png' });
  await плюс.click();
  await expect(page.getByTestId('tournament-create')).toHaveAttribute('data-sheet', 'yes');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/mobile/create-sheet.png' });
});

test('на телефоне длинная панель — 90 % экрана, кнопка подвала во всю ширину ✳ (03.11.2026)', async ({ page }) => {
  await page.goto('/login?next=' + encodeURIComponent('/dashboard'));
  await page.getByLabel('Эл. почта').fill(E2E_ADMIN.email);
  await page.getByLabel('Пароль').fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const турниры = (await (await page.request.get('/api/tournaments/')).json()) as { id: string; name: string }[];
  const демо = турниры.find((t) => t.name === '[demo] Чемпионат Республики Казахстан')!;
  await page.goto('/dashboard/tournaments/' + демо.id + '/players');

  await page.getByTestId('roster-add-player').click();
  const окно = page.getByTestId('roster-dialog');
  await expect(окно).toHaveAttribute('data-sheet', 'yes');
  await expect(page.getByTestId('roster-candidate').first()).toBeVisible();
  await page.waitForTimeout(500);
  const o = (await окно.boundingBox())!;
  expect(Math.round(o.height)).toBe(Math.round(844 * 0.9));
  // Кнопка — во всю ширину за вычетом полей панели (24 px с каждой стороны).
  const кнопка = (await page.getByTestId('roster-submit').boundingBox())!;
  expect(Math.round(кнопка.width)).toBe(390 - 48);
  // Поиск и кнопка на месте, прокручивается только выдача.
  await expect(page.getByTestId('roster-search')).toBeInViewport();
  await expect(page.getByTestId('roster-submit')).toBeInViewport();
  await page.screenshot({ path: 'test-results/mobile/roster-sheet.png' });
});
