import { expect, test, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_GSK, E2E_PLAYER, E2E_REFEREE } from './global-setup';

/* Кабинет администратора федерации ✳ (28.10.2026): оболочка на HeroUI,
   главная страница — календарь всех турниров. Проверяется то, что сломается
   при поломке: вход ведёт сюда (председателя — по-прежнему в рейтинг), турнир
   стоит в клетке своего дня, листание месяцев, меню человека справа со сменой
   роли, чужого в кабинет не пускает. Турниры, заведённые здесь, помечены
   «[e2e] » — их сносит засев в global-setup. */

async function войти(page: Page, who: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

/** Турнир через API под сессией администратора (у него `is_staff`). */
async function завести(page: Page, name: string, day: Date) {
  const r = await page.request.post('/api/tournaments/', {
    data: { name, starts_at: day.toISOString(), format: 'single_elimination' },
  });
  expect(r.status(), await r.text()).toBe(201);
}

const ключ = (d: Date) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

test('главная администратора — календарь: турнир в клетке своего дня, месяцы листаются', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');

  const now = new Date();
  const здесь = new Date(now.getFullYear(), now.getMonth(), 15, 12);
  const следующий = new Date(now.getFullYear(), now.getMonth() + 1, 10, 12);
  const stamp = Date.now();
  await завести(page, `[e2e] Кубок ${stamp}`, здесь);
  await завести(page, `[e2e] Первенство ${stamp}`, следующий);
  await page.reload();

  // Раздел раскрыт — текущий его подпункт, вид «Месяц».
  await expect(page.getByTestId('nav-sub').filter({ hasText: 'Месяц' })).toHaveAttribute('aria-current', 'true');
  const клетка = page.locator(`[data-day="${ключ(здесь)}"]`);
  await expect(клетка.getByText(`[e2e] Кубок ${stamp}`)).toBeVisible();
  // Турнир следующего месяца в этом месяце не виден…
  await expect(page.getByText(`[e2e] Первенство ${stamp}`)).toHaveCount(0);
  await page.screenshot({ path: 'test-results/dashboard/calendar.png' });

  // Сетка без обёртки занимает всю рабочую область: низ последней недели — у
  // низа окна.
  const сетка = (await page.getByRole('grid').boundingBox())!;
  expect(сетка.y + сетка.height).toBeGreaterThan(page.viewportSize()!.height - 2);

  // Турнир открывает карточку подробностей рядом с собой (как событие в
  // Google Календаре); Esc закрывает.
  const событие = клетка.getByText(`[e2e] Кубок ${stamp}`);
  await событие.click();
  const окно = page.getByTestId('tournament-details');
  await expect(окно).toBeVisible();
  await expect(окно.getByRole('heading')).toHaveText(`[e2e] Кубок ${stamp}`);
  await expect(окно).toContainText('Олимпийская система');
  await expect(окно).toContainText(
    здесь.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', ''),
  );
  const у = (await событие.boundingBox())!;
  const к = (await окно.boundingBox())!;
  expect(к.x).toBeGreaterThanOrEqual(у.x + у.width - 2); // справа от турнира, а не по центру экрана
  await page.waitForTimeout(400); // снимок — после анимации появления
  await page.screenshot({ path: 'test-results/dashboard/details.png' });
  await page.keyboard.press('Escape');
  await expect(окно).toHaveCount(0);

  // «Подробнее» ведёт на страницу турнира — первым раздел «Сведения».
  await событие.click();
  await окно.getByRole('button', { name: 'Подробнее' }).click();
  await page.waitForURL(/\/dashboard\/tournaments\/[0-9a-f-]{36}\/info$/);
  await expect(page.getByTestId('tournament-context')).toContainText(`[e2e] Кубок ${stamp}`);
  await expect(page.getByTestId('info-name')).toHaveValue(`[e2e] Кубок ${stamp}`);
  await page.getByRole('button', { name: 'Спортсмены', exact: true }).click();
  await expect(page.getByTestId('table-empty')).toHaveText('Участников нет'); // заведён без участников
  await page.getByTestId('tournament-back').click();
  await page.waitForURL((url) => url.pathname === '/dashboard');

  // …и появляется на своём дне после листания.
  const месяц = await page.getByTestId('calendar-month').textContent();
  await page.getByRole('button', { name: 'Следующий месяц' }).click();
  await expect(page.getByTestId('calendar-month')).not.toHaveText(месяц!);
  await expect(
    page.locator(`[data-day="${ключ(следующий)}"]`).getByText(`[e2e] Первенство ${stamp}`),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Сегодня' }).click();
  await expect(page.getByTestId('calendar-month')).toHaveText(месяц!);
});

test('сегодняшняя клетка подсвечена, линия «сейчас» стоит на доле суток со временем слева', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const now = new Date();
  const клетка = page.locator('[data-today]');
  await expect(клетка).toHaveCount(1);
  await expect(клетка).toHaveAttribute('data-day', ключ(now));
  // Линия одна — только в сегодняшней клетке.
  await expect(page.getByTestId('calendar-now')).toHaveCount(1);
  const линия = клетка.getByTestId('calendar-now');
  // Время на значке — сейчас (или уже следующая минута, если она успела наступить).
  const время = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  expect([время(now), время(new Date(now.getTime() + 60_000))]).toContain(
    await линия.getByTestId('calendar-now-time').textContent(),
  );
  // Высота линии в клетке — доля прошедших суток (с запасом на минуту и край).
  const к = (await клетка.boundingBox())!;
  const л = (await линия.boundingBox())!;
  const доля = (now.getHours() * 60 + now.getMinutes()) / 1440;
  const ждём = Math.min(Math.max(доля * к.height, 8), к.height - 8);
  expect(Math.abs(л.y + л.height / 2 - к.y - ждём)).toBeLessThan(4);
});

test('день, где турниры не влезают: «Ещё N» открывает карточку дня со всеми', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const now = new Date();
  const день = new Date(now.getFullYear(), now.getMonth(), now.getDate() === 24 ? 25 : 24, 12);
  const stamp = Date.now();
  const имена = Array.from({ length: 10 }, (_, n) => `[e2e] День ${stamp} №${n + 1}`);
  // Десять турниров дописываются к настоящему списку в ответе сервера, а не
  // заводятся в базе: проверка — про раскладку клетки, а общий список турниров
  // в это время читают соседние проверки (таблица сверяет число строк).
  await page.route('**/api/tournaments/', async (route) => {
    const real = (await (await route.fetch()).json()) as Record<string, unknown>[];
    const extra = имена.map((name, n) => ({
      ...real[0],
      id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
      name,
      starts_at: день.toISOString(),
      status: 'open',
      description: '',
    }));
    await route.fulfill({ json: [...real, ...extra] });
  });
  await page.reload();

  const клетка = page.locator(`[data-day="${ключ(день)}"]`);
  const ещё = клетка.getByTestId('calendar-more');
  await expect(ещё).toBeVisible();
  // В клетке видна часть, а «Ещё N» — ровно остаток.
  const видно = await клетка.getByTestId('calendar-tournament').count();
  expect(видно).toBeGreaterThan(0);
  await expect(ещё).toHaveText(`Ещё ${10 - видно}`);
  // Клетка не прокручивается и ничего не режет: «Ещё» целиком внутри неё.
  const к = (await клетка.boundingBox())!;
  const е = (await ещё.boundingBox())!;
  expect(е.y + е.height).toBeLessThanOrEqual(к.y + к.height + 1);
  expect(await клетка.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);

  await ещё.click();
  const карточка = page.getByTestId('calendar-day');
  await expect(карточка.getByRole('heading')).toHaveText(String(день.getDate()));
  await expect(карточка).toContainText(['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][день.getDay()]);
  for (const имя of имена) await expect(карточка.getByText(имя, { exact: true })).toBeVisible();
  await page.waitForTimeout(400); // снимок — после анимации появления
  await page.screenshot({ path: 'test-results/dashboard/day-more.png' });

  // Турнир из карточки дня открывает свою карточку.
  await карточка.getByText(имена[9], { exact: true }).click();
  await expect(page.getByTestId('tournament-details').getByRole('heading')).toHaveText(имена[9]);
});

test('«Новый турнир» заводит турнир, и он встаёт в календарь на свой день', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');

  const now = new Date();
  const день = new Date(now.getFullYear(), now.getMonth(), 20, 12);
  const name = `[e2e] Первенство области ${Date.now()}`;

  await page.getByRole('button', { name: 'Новый турнир' }).click();
  const форма = page.getByTestId('tournament-create');
  await expect(форма).toBeVisible();
  const сохранить = форма.getByRole('button', { name: 'Завести' });
  await expect(сохранить).toBeDisabled(); // без названия не заводится

  await форма.getByLabel('Название').fill(name);
  // Дата — DatePicker HeroUI по-русски: день.месяц.год, сегменты вводятся подряд.
  const дата = форма.getByTestId('tournament-date');
  await дата.locator('[data-type="day"]').click();
  await page.keyboard.type('20' + String(день.getMonth() + 1).padStart(2, '0') + день.getFullYear());
  await expect(дата).toContainText('20');
  await expect(дата.locator('[data-type="day"]')).toHaveText('20');
  await expect(форма.getByLabel('Игроков в группе')).toHaveCount(0);
  await форма.getByRole('button', { name: /Олимпийская система/ }).click();
  await page.getByRole('option', { name: 'Группы и плей-офф' }).click();
  await expect(форма.getByLabel('Игроков в группе')).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard/create.png' });
  await сохранить.click();

  await expect(форма).toHaveCount(0);
  await expect(page.locator(`[data-day="${ключ(день)}"]`).getByText(name)).toBeVisible();
  await page.locator(`[data-day="${ключ(день)}"]`).getByText(name).click();
  await expect(page.getByTestId('tournament-details')).toContainText('Группы и плей-офф');
});

test('вид «Таблица»: поиск сужает, строка открывает турнир, вид переживает перезагрузку', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');

  await page.getByTestId('nav-sub').filter({ hasText: 'Таблица' }).click();
  await page.waitForURL((url) => url.search === '?view=table');
  const rows = page.getByTestId('tournament-table-row');
  const всего = (await (await page.request.get('/api/tournaments/')).json()).length;
  await expect(rows).toHaveCount(всего);
  await page.screenshot({ path: 'test-results/dashboard/table.png' });

  // Сортировка заголовком: «Турнир» — по алфавиту, второй щелчок — обратно.
  const имена = () => rows.locator('td:first-child').allTextContents();
  await page.getByRole('columnheader', { name: /Турнир/ }).click();
  await expect.poll(async () => { const n = await имена(); return n.join('|') === [...n].sort((a, b) => a.localeCompare(b, 'ru')).join('|'); }).toBe(true);
  await page.getByRole('columnheader', { name: /Турнир/ }).click();
  await expect.poll(async () => { const n = await имена(); return n.join('|') === [...n].sort((a, b) => b.localeCompare(a, 'ru')).join('|'); }).toBe(true);

  await page.getByTestId('tournament-search').fill('Чемпионат Республики');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('[demo] Чемпионат Республики Казахстан');

  await page.getByTestId('tournament-search').fill('нет такого турнира');
  await expect(rows).toHaveCount(0);
  await expect(page.getByTestId('table-empty')).toHaveText('Ничего не найдено');

  await page.reload();
  await expect(page.getByTestId('nav-sub').filter({ hasText: 'Таблица' })).toHaveAttribute('aria-current', 'true');
  await page.getByTestId('tournament-search').fill('Чемпионат Республики');
  await rows.first().click();
  await page.waitForURL(/\/dashboard\/tournaments\/[0-9a-f-]{36}\/info$/);
  await expect(page.getByTestId('tournament-context')).toContainText('[demo] Чемпионат Республики Казахстан');

  await page.goto('/dashboard?view=table');
  await page.getByTestId('nav-sub').filter({ hasText: 'Месяц' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard' && url.search === '');
  await expect(page.getByRole('grid')).toBeVisible();
});

test('«Добавить» в разделе турнира: выбор в выдаче, кнопка в подвале, у судьи — шаг «Должность»', async ({ page }) => {
  test.setTimeout(60_000); // долгая: оба окна добавления, должности, карточка судьи
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const r = await page.request.post('/api/tournaments/', {
    data: { name: `[e2e] Состав ${Date.now()}`, starts_at: new Date().toISOString(), format: 'single_elimination' },
  });
  expect(r.status(), await r.text()).toBe(201);
  const t = (await r.json()) as { id: string };
  await page.goto(`/dashboard/tournaments/${t.id}/players`);
  await expect(page.getByTestId('table-empty')).toHaveText('Участников нет');

  // Спортсмены: один шаг — отметили в выдаче, «Добавить» в подвале.
  await page.getByTestId('roster-add-player').click();
  const окно = page.getByTestId('roster-dialog');
  await expect(окно.getByTestId('roster-steps')).toHaveCount(0); // шаг один — трекера нет
  const добавить = окно.getByTestId('roster-submit');
  await expect(добавить).toBeDisabled(); // никого не выбрали
  await окно.getByTestId('roster-search').fill('Ахметов Ерлан');
  const кандидат = окно.locator('[data-testid="roster-candidate"][data-name="Ахметов Ерлан"]');
  await кандидат.click();
  await expect(кандидат).toHaveAttribute('aria-selected', 'true');
  await page.waitForTimeout(300); // снимок — после анимации появления
  await page.screenshot({ path: 'test-results/dashboard/roster-dialog.png' });
  await добавить.click();
  await expect(окно).toHaveCount(0);
  await expect(page.getByTestId('participant-row')).toHaveText([/Ахметов Ерлан/]);

  // Судья: «Выбор» → «Далее» → «Должность» → «Добавить».
  await page.getByRole('button', { name: 'Судьи', exact: true }).click();
  await page.waitForURL((url) => url.pathname.endsWith('/referees'));
  await expect(page.getByTestId('table-empty')).toHaveText('Судей нет');

  async function назначить(email: string, name: string, должность: string) {
    await page.getByTestId('roster-add-referee').click();
    const о = page.getByTestId('roster-dialog');
    await expect(о.getByTestId('roster-steps').locator('[aria-current="step"]')).toContainText('Выбор');
    await о.getByTestId('roster-search').fill(email);
    await о.locator(`[data-testid="roster-candidate"][data-name="${name}"]`).click();
    await о.getByTestId('roster-next').click();
    await expect(о.getByTestId('roster-steps').locator('[aria-current="step"]')).toContainText('Должность');
    // Щёлкаем подпись, как человек: настоящий input у HeroUI спрятан под кружком.
    await о.getByTestId('roster-positions').getByText(должность, { exact: true }).click();
    await expect(о.getByRole('radio', { name: должность })).toBeChecked();
    return о;
  }

  let о = await назначить(E2E_REFEREE.email, 'Судья (проверки)', 'Главный судья соревнований');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/dashboard/roster-position.png' });
  await о.getByTestId('roster-submit').click();
  await expect(о).toHaveCount(0);
  await expect(page.locator('[data-testid="referee-row"][data-position="chief_referee"]')).toContainText(
    'Судья (проверки)',
  );

  // Главный судья в турнире один: второму эта должность недоступна, подписано кем занята.
  о = await назначить(E2E_ADMIN.email, 'Администратор федерации (проверки)', 'Судья стола');
  await expect(о.getByRole('radio', { name: /Главный судья соревнований/ })).toBeDisabled();
  await expect(о.getByTestId('roster-positions')).toContainText('занято: Судья (проверки)');
  await о.getByTestId('roster-submit').click();
  await expect(page.getByTestId('referee-row')).toHaveCount(2);
  await expect(page.locator('[data-testid="referee-row"][data-position="referee"]')).toContainText(
    'Администратор федерации (проверки)',
  );

  // Щелчок по строке — карточка судьи справа: профиль и должность.
  await page.locator('[data-testid="referee-row"][data-position="chief_referee"]').click();
  const карточка = page.getByTestId('referee-drawer');
  await expect(карточка.getByTestId('referee-profile')).toContainText('Судья (проверки)');
  // Справа: правый край панели — у правого края окна.
  const панель = (await карточка.boundingBox())!;
  expect(панель.x + панель.width).toBeGreaterThan(page.viewportSize()!.width - 2);
  await expect(карточка.getByTestId('referee-profile')).toContainText(E2E_REFEREE.email);
  // «Других турниров» в карточке нет ✳ (28.10.2026).
  await expect(карточка.getByText('Другие турниры')).toHaveCount(0);
  // Своя должность ему доступна — «занято» относится только к чужим.
  await expect(карточка.getByRole('radio', { name: 'Главный судья соревнований' })).toBeEnabled();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/dashboard/referee-drawer.png' });
  await карточка.getByRole('button', { name: 'Закрыть' }).click();
  await expect(карточка).toHaveCount(0);

  // Сменить должность: судья стола → заместитель главного судьи.
  await page.locator('[data-testid="referee-row"][data-position="referee"]').click();
  const к = page.getByTestId('referee-drawer');
  await expect(к.getByTestId('referee-profile')).toContainText('Администратор федерации (проверки)');
  await expect(к.getByRole('radio', { name: /Главный судья соревнований/ })).toBeDisabled();
  await expect(к.getByTestId('referee-save')).toBeDisabled(); // ничего не меняли
  await к.getByTestId('roster-positions').getByText('Заместитель главного судьи', { exact: true }).click();
  await к.getByTestId('referee-save').click();
  await expect(page.locator('[data-testid="referee-row"][data-position="deputy_chief_referee"]')).toContainText(
    'Администратор федерации (проверки)',
  );

  // «Профиль» в подвале карточки — значок с подсказкой; ведёт на страницу человека.
  const турнир = page.url();
  await к.getByRole('button', { name: 'Профиль' }).hover();
  await expect(page.getByRole('tooltip')).toHaveText('Профиль');
  await page.screenshot({ path: 'test-results/dashboard/referee-footer.png' });
  await к.getByTestId('referee-profile-open').click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId('person-header')).toContainText('Администратор федерации (проверки)');
  await expect(page.getByTestId('person-header')).toContainText(E2E_ADMIN.email);
  await expect(
    page.locator('[data-testid="person-role-row"][data-kind="deputy_chief_referee"]'),
  ).toContainText(/\[e2e\] Состав/);
  await page.screenshot({ path: 'test-results/dashboard/person.png' });
  await page.getByTestId('person-back').click();
  await page.waitForURL(турнир);

  // «Убрать из турнира» — с подтверждением; должность освобождается.
  await page.locator('[data-testid="referee-row"][data-position="chief_referee"]').click();
  const убрать = page.getByTestId('referee-drawer');
  await убрать.getByTestId('referee-remove').click();
  await page.getByTestId('referee-remove-confirm').getByRole('button', { name: 'Отмена' }).click();
  await expect(page.getByTestId('referee-row')).toHaveCount(2); // отмена — ничего не убрано
  await убрать.getByTestId('referee-remove').click();
  await page.getByTestId('referee-remove-confirm').getByRole('button', { name: 'Убрать' }).click();
  await expect(page.getByTestId('referee-drawer')).toHaveCount(0);
  await expect(page.getByTestId('referee-row')).toHaveCount(1);
  await expect(page.locator('[data-testid="referee-row"][data-position="chief_referee"]')).toHaveCount(0);
});

test('внутри турнира сайдбар — разделы турнира: спортсмены и судьи', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  // Демо-турнир из засева: восемь участников, рейтинг учтён.
  const r = await page.request.get('/api/tournaments/');
  const demo = ((await r.json()) as { id: string; name: string; participant_count: number }[]).find(
    (t) => t.name === '[demo] Чемпионат Республики Казахстан',
  )!;
  // Каждый раздел турнира — своя страница.
  await page.goto('/dashboard/tournaments/' + demo.id);
  // Без раздела — первый, «Сведения».
  await page.waitForURL((url) => url.pathname === '/dashboard/tournaments/' + demo.id + '/info');

  // Сайдбар: «Все турниры», название турнира, разделы турнира вместо разделов кабинета.
  await expect(page.getByTestId('tournament-context')).toContainText(demo.name);
  // Разделы — кнопки без стрелки раскрытия и подпунктов.
  const разделы = page
    .getByRole('navigation', { name: 'Разделы' })
    .getByRole('button')
    .and(page.locator(':not([data-testid])'));
  await expect(разделы).toHaveText(['Сведения', 'Спортсмены', 'Судьи', 'Расписание']);
  await expect(page.getByRole('button', { name: 'Сведения', exact: true })).toHaveAttribute('aria-current', 'true');
  // Смена раздела сайдбар не сдвигает: шапка турнира не пропадает на время загрузки.
  const местаДо = await разделы.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
  const сдвиги: number[] = [];
  await page.exposeFunction('__shift', (y: number) => сдвиги.push(y));
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Разделы"]')!;
    const y0 = nav.getBoundingClientRect().y;
    const watch = () => {
      const n = document.querySelector('nav[aria-label="Разделы"]');
      if (n && Math.round(n.getBoundingClientRect().y) !== Math.round(y0))
        (window as unknown as { __shift: (y: number) => void }).__shift(n.getBoundingClientRect().y);
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.getByRole('button', { name: 'Спортсмены', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard/tournaments/' + demo.id + '/players');
  await expect(page.getByRole('button', { name: 'Спортсмены', exact: true })).toHaveAttribute('aria-current', 'true');

  const rows = page.getByTestId('participant-row');
  await expect(rows).toHaveCount(demo.participant_count);
  expect(await разделы.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)))).toEqual(местаДо);
  expect(сдвиги).toEqual([]);
  await expect(rows.first()).toContainText(/\d+,\d{2}/); // рейтинг до — числом с запятой
  await page.screenshot({ path: 'test-results/dashboard/tournament.png' });

  // «Судьи» — свой раздел в адресе; засев назначил судью «проверки» на этот турнир.
  await page.getByRole('button', { name: 'Судьи', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard/tournaments/' + demo.id + '/referees');
  await expect(page.getByTestId('referee-row')).toHaveText([/Судья \(проверки\)/]);
  await page.screenshot({ path: 'test-results/dashboard/referees.png' });

  await page.getByTestId('tournament-back').click();
  await page.waitForURL((url) => url.pathname === '/dashboard');
  // Раздел раскрыт — текущий его подпункт, вид «Месяц».
  await expect(page.getByTestId('nav-sub').filter({ hasText: 'Месяц' })).toHaveAttribute('aria-current', 'true');
});

test('меню человека открывается справа, роль раскрывает вложенное меню и переключает кабинет', async ({
  page,
}) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');

  const card = page.getByTestId('side-person');
  await card.click();
  const menu = page.getByTestId('person-menu');
  await expect(menu).toBeVisible();
  // Справа от карточки, а не над ней.
  const cardBox = (await card.boundingBox())!;
  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.x).toBeGreaterThanOrEqual(cardBox.x + cardBox.width);
  // Подписей-заголовков в меню нет; радиус у меню и карточки один.
  await expect(menu.getByText('Вы вошли как')).toHaveCount(0);
  const радиус = (sel: Parameters<Page['getByTestId']>[0]) =>
    page.getByTestId(sel).evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(await радиус('person-menu')).toBe(await радиус('side-person'));

  const roleRow = page.getByTestId('person-role');
  await expect(roleRow).toHaveText('Администратор федерации');
  await roleRow.click();
  const roles = page.getByTestId('role-menu');
  await expect(roles).toBeVisible();
  // Справа от меню: вложенное меню HeroUI заходит на край родителя на
  // несколько пикселей, поэтому сравниваем с серединой, а не с правым краем.
  expect((await roles.boundingBox())!.x).toBeGreaterThan(menuBox.x + menuBox.width / 2);
  await expect(roles.getByText('Работать как')).toHaveCount(0);
  await expect(roles.getByRole('menuitemradio', { name: 'Администратор федерации' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.screenshot({ path: 'test-results/dashboard/role-menu.png' });

  // Вторая роль ведёт в её кабинет, и там текущей стала уже она.
  await roles.getByRole('menuitemradio', { name: 'Председатель ГСК' }).click();
  await page.waitForURL((url) => url.pathname === '/rating');
  await page.getByTestId('side-person').click();
  await page.getByTestId('person-role').click();
  await expect(
    page.getByTestId('role-menu').getByRole('menuitemradio', { name: 'Председатель ГСК' }),
  ).toHaveAttribute('aria-checked', 'true');

  // И обратно.
  await page.getByTestId('role-menu').getByRole('menuitemradio', { name: 'Администратор федерации' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');

  // «Профиль» — окно с именем, почтой и ролями человека.
  await page.getByTestId('side-person').click();
  await page.getByRole('menuitem', { name: 'Профиль' }).click();
  const профиль = page.getByTestId('profile');
  await expect(профиль.getByRole('heading')).toHaveText('Администратор федерации (проверки)');
  await expect(профиль).toContainText(E2E_ADMIN.email);
  await expect(профиль).toContainText('Председатель ГСК');
  await page.waitForTimeout(400); // снимок — после анимации появления
  await page.screenshot({ path: 'test-results/dashboard/profile.png' });
  await page.keyboard.press('Escape');
  await expect(профиль).toHaveCount(0);
});

test('у председателя ГСК тот же «Календарь»: сетка, таблица, страница турнира', async ({ page }) => {
  await войти(page, E2E_GSK);
  await page.waitForURL((url) => url.pathname === '/rating');

  await page.getByRole('button', { name: 'Календарь', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/calendar');
  await expect(page.getByRole('grid')).toBeVisible();
  await expect(page.getByTestId('calendar-month')).toBeVisible();
  // Заводить турниры председателю сервер не разрешает — кнопки нет.
  await expect(page.getByRole('button', { name: 'Новый турнир' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/dashboard/gsk-calendar.png' });

  await page.getByTestId('nav-sub').filter({ hasText: 'Таблица' }).click();
  await page.waitForURL((url) => url.pathname === '/calendar' && url.search === '?view=table');
  await page.getByTestId('tournament-search').fill('Чемпионат Республики');
  await page.getByTestId('tournament-table-row').first().click();
  await page.waitForURL(/\/gsk\/tournaments\/[0-9a-f-]{36}\/info$/);
  await expect(page.getByTestId('tournament-context')).toContainText('[demo] Чемпионат Республики Казахстан');
  await page.getByRole('button', { name: 'Спортсмены', exact: true }).click();
  await expect(page.getByTestId('participant-row')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Спортсмены', exact: true })).toHaveAttribute('aria-current', 'true');
  await page.getByTestId('tournament-back').click();
  await page.waitForURL((url) => url.pathname === '/calendar');
});

test('страница турнира — в кабинете роли; ссылка «поделиться» ведёт в свой кабинет', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const [t] = (await (await page.request.get('/api/tournaments/')).json()) as { id: string }[];
  for (const [old, now] of [
    // «Поделиться»: в старшем кабинете смотрящего, раздел сохраняется, без раздела — «Сведения».
    [`/tournaments/${t.id}`, `/dashboard/tournaments/${t.id}/info`],
    [`/tournaments/${t.id}/referees`, `/dashboard/tournaments/${t.id}/referees`],
    // Прежние страницы председателя `/calendar/<id>…` переехали в его кабинет.
    [`/calendar/${t.id}/players`, `/gsk/tournaments/${t.id}/players`],
    [`/dashboard/tournaments/${t.id}`, `/dashboard/tournaments/${t.id}/info`],
  ]) {
    await page.goto(old);
    await page.waitForURL((url) => url.pathname === now);
  }
  // Сам календарь председателя на месте — перенаправляются только страницы турниров.
  await page.goto('/calendar');
  await expect(page).toHaveURL(/\/calendar$/);
});

test('«Сведения»: даты, место, возраст ползунком и полями, формат — черновиком с «Сохранить»', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const now = new Date();
  const день = new Date(now.getFullYear(), now.getMonth(), 20, 12);
  const имя = `[e2e] Сведения ${Date.now()}`;
  await завести(page, имя, день);
  const t = ((await (await page.request.get('/api/tournaments/')).json()) as { id: string; name: string }[]).find(
    (x) => x.name === имя,
  )!;
  await page.goto(`/dashboard/tournaments/${t.id}`);
  await page.waitForURL((url) => url.pathname === `/dashboard/tournaments/${t.id}/info`);
  await expect(page.getByRole('button', { name: 'Сведения', exact: true })).toHaveAttribute('aria-current', 'true');

  const сохранить = page.getByTestId('info-save');
  const отменить = page.getByTestId('info-discard');
  await expect(сохранить).toBeDisabled();
  // Возраст: поля «от» и «до» двигают оба конца ползунка.
  await page.getByTestId('info-age-min').fill('12');
  await page.getByTestId('info-age-min').press('Tab');
  await page.getByTestId('info-age-max').fill('18');
  await page.getByTestId('info-age-max').press('Tab');
  const ползунок = page.getByTestId('info-age-slider');
  await expect(ползунок.getByRole('slider', { name: 'От' })).toHaveValue('12');
  await expect(ползунок.getByRole('slider', { name: 'До' })).toHaveValue('18');
  // …и ползунок — поля: левый конец стрелкой вправо.
  await ползунок.getByRole('slider', { name: 'От' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('info-age-min')).toHaveValue('13');
  // «Отменить» — всё как было.
  await expect(отменить).toBeEnabled();
  await отменить.click();
  await expect(page.getByTestId('info-age-min')).toHaveValue('');
  await expect(сохранить).toBeDisabled();

  await page.getByTestId('info-city').fill('Астана');
  await page.getByTestId('info-venue').fill('Дворец спорта «Казахстан»');
  await page.getByTestId('info-age-min').fill('12');
  await page.getByTestId('info-age-min').press('Tab');
  await page.getByTestId('info-age-max').fill('18');
  await page.getByTestId('info-age-max').press('Tab');
  // Окончание — день «конца» диапазона дат: день, месяц, год печатаются подряд.
  const конец = new Date(день.getTime() + 2 * 864e5);
  const дд = (n: number) => String(n).padStart(2, '0');
  const сегменты = page.getByTestId('info-dates').getByRole('spinbutton');
  await сегменты.nth(3).click();
  await page.keyboard.type(дд(конец.getDate()) + дд(конец.getMonth() + 1) + конец.getFullYear());
  await page.screenshot({ path: 'test-results/dashboard/info.png' });
  const ответ = page.waitForResponse((r) => r.url().includes(`/api/tournaments/${t.id}/update/`));
  await сохранить.click();
  expect((await ответ).status()).toBe(200);
  await expect(сохранить).toBeDisabled();

  const d = await (await page.request.get(`/api/tournaments/${t.id}/`)).json();
  expect(d).toMatchObject({
    city: 'Астана',
    venue: 'Дворец спорта «Казахстан»',
    age_min: 12,
    age_max: 18,
    ends_at: конец.getFullYear() + '-' + дд(конец.getMonth() + 1) + '-' + дд(конец.getDate()),
  });
  // Сохранённое переживает перезагрузку.
  await page.reload();
  await expect(page.getByTestId('info-city')).toHaveValue('Астана');
  await expect(page.getByTestId('info-age-max')).toHaveValue('18');
});

test('протокол на «Сведениях» скачивается PDF-файлом кнопкой в углу листа', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const имя = `[e2e] Протокол ${Date.now()}`;
  await завести(page, имя, new Date());
  const t = ((await (await page.request.get('/api/tournaments/')).json()) as { id: string; name: string }[]).find(
    (x) => x.name === имя,
  )!;
  await page.goto(`/dashboard/tournaments/${t.id}/info`);
  const лист = page.getByTestId('protocol-document');
  const кнопка = лист.getByTestId('protocol-download');
  // Кнопка — в правом верхнем углу листа.
  const л = (await лист.boundingBox())!;
  const к = (await кнопка.boundingBox())!;
  expect(к.x + к.width).toBeGreaterThan(л.x + л.width - 24);
  expect(к.y).toBeLessThan(л.y + 24);

  const [файл] = await Promise.all([page.waitForEvent('download'), кнопка.click()]);
  expect(файл.suggestedFilename()).toBe(`Протокол — ${имя}.pdf`);
  const путь = await файл.path();
  const { readFileSync } = await import('node:fs');
  const байты = readFileSync(путь!);
  expect(байты.subarray(0, 5).toString()).toBe('%PDF-'); // настоящий PDF, а не пустышка
  expect(байты.length).toBeGreaterThan(20_000); // в нём картинка листа
  await expect(кнопка).toBeEnabled();
});

test('«Спортсмены»: фото-заглушка в строке, карточка справа, «Настройки» — приём заявок игроков', async ({
  page,
  browser,
}, info) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const имя = `[e2e] Состав игроков ${Date.now()}`;
  await завести(page, имя, new Date());
  const t = ((await (await page.request.get('/api/tournaments/')).json()) as { id: string; name: string }[]).find(
    (x) => x.name === имя,
  )!;
  const [игрок] = (await (
    await page.request.get(`/api/tournaments/${t.id}/candidates/?role=player&q=${E2E_PLAYER.email}`)
  ).json()) as { id: string }[];
  expect((await page.request.post(`/api/tournaments/${t.id}/participants/`, { data: { user_id: игрок.id } })).status()).toBe(201);

  await page.goto(`/dashboard/tournaments/${t.id}/players`);
  const строка = page.getByTestId('participant-row');
  await expect(строка).toHaveCount(1);
  // Фото нет — в строке силуэт-заглушка.
  await expect(строка.getByTestId('person-avatar')).toHaveAttribute('data-photo', 'no');

  // «Настройки» — приём заявок игроков: открыт по умолчанию; закрыли — записаться самому нельзя.
  await page.getByTestId('tournament-settings').click();
  const настройки = page.getByTestId('tournament-settings-drawer');
  const переключатель = настройки.getByRole('switch', { name: 'Приём заявок' });
  await expect(переключатель).toBeChecked();
  await настройки.getByText('Приём заявок', { exact: true }).click();
  await expect(переключатель).not.toBeChecked();
  await настройки.getByTestId('settings-save').click();
  await expect(настройки).toHaveCount(0);
  const сам = await browser.newContext({ baseURL: info.project.use.baseURL });
  expect((await сам.request.post('/api/auth/login/email/', { data: E2E_PLAYER })).status()).toBe(200);
  const запись = await сам.request.post(`/api/tournaments/${t.id}/participants/join/`);
  expect(запись.status()).toBe(400);
  expect(await запись.text()).toContain('Приём заявок игроков закрыт');
  await сам.close();

  // Щелчок по строке — карточка справа: имя, «Профиль», «Убрать из турнира».
  await строка.click();
  const карточка = page.getByTestId('player-drawer');
  await expect(карточка.getByTestId('player-profile')).toContainText('Спортсмен (проверки)');
  const к = (await карточка.boundingBox())!;
  expect(к.x + к.width).toBeGreaterThan(page.viewportSize()!.width - 2);
  await expect(карточка.getByTestId('player-profile-open')).toBeVisible();
  await page.waitForTimeout(400); // снимок — после анимации появления
  await page.screenshot({ path: 'test-results/dashboard/player-drawer.png' });
  await карточка.getByTestId('player-remove').click();
  await page.getByTestId('player-remove-confirm').getByRole('button', { name: 'Убрать' }).click();
  await expect(карточка).toHaveCount(0);
  await expect(page.getByTestId('table-empty')).toHaveText('Участников нет');
});

test('председатель ГСК после входа по-прежнему в рейтинге', async ({ page }) => {
  await войти(page, E2E_GSK);
  await page.waitForURL((url) => url.pathname === '/rating');
});

test('гостя и председателя из кабинета уводит на вход', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL((url) => url.pathname === '/login');

  await войти(page, E2E_GSK);
  await page.waitForURL((url) => url.pathname === '/rating');
  await page.goto('/dashboard');
  await page.waitForURL((url) => url.pathname === '/login');
});
