import { expect, test, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_GSK, E2E_PLAYER, E2E_REFEREE } from './global-setup';

/* Кабинеты спортсмена и судьи ✳ (28.10.2026). Спортсмена — пока пустой:
   оболочка роли без разделов. У судьи ✳ (29.10.2026) — «Календарь» всех
   турниров, как у администратора, но без «Нового турнира»; страница турнира —
   сведения и заявка на судейство, составов судья не видит. Проверяется, что вход ведёт каждого в свой кабинет, роль
   стоит в меню человека, а с чужой ролью в кабинет не пустит. Турниры,
   заведённые здесь, помечены «[e2e] » — их сносит засев в global-setup. */

async function войти(page: Page, who: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

for (const [who, path, title, name] of [[E2E_PLAYER, '/player', 'Спортсмен', 'Спортсмен (проверки)']] as const) {
  test(`${title}: после входа — свой пустой кабинет`, async ({ page }) => {
    await войти(page, who);
    await page.waitForURL((url) => url.pathname === path);
    await expect(page.getByTestId('workspace-blank')).toBeAttached();
    await expect(page.getByRole('navigation', { name: 'Разделы' })).toHaveCount(0);
    await expect(page.getByTestId('side-person')).toContainText(name);

    await page.getByTestId('side-person').click();
    await expect(page.getByTestId('person-role')).toHaveText(title);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: `test-results/workspaces${path}.png` });
  });
}

/** Вход через API: сессия ложится в куки контекста страницы. Ответ — учётка. */
async function сессия(page: Page, who: { email: string; password: string }) {
  const r = await page.request.post('/api/auth/login/email/', { data: who });
  expect(r.status(), await r.text()).toBe(200);
  return (await r.json()) as { id: string };
}

test('судья: «Календарь» без «Нового турнира», страница турнира — сведения и заявка, составы не видны', async ({
  page,
}) => {
  // Турнир заводит администратор; приём заявок судей пока закрыт.
  await сессия(page, E2E_ADMIN);
  const now = new Date();
  const день = new Date(now.getFullYear(), now.getMonth(), 12, 12);
  const имя = `[e2e] Кубок судьи ${Date.now()}`;
  const created = await page.request.post('/api/tournaments/', {
    data: { name: имя, starts_at: день.toISOString(), format: 'single_elimination' },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  await page.context().clearCookies();

  await войти(page, E2E_REFEREE);
  await page.waitForURL((url) => url.pathname === '/referee');
  // Раздел раскрыт — текущий его подпункт, вид «Месяц».
  await expect(page.getByTestId('nav-sub').filter({ hasText: 'Месяц' })).toHaveAttribute('aria-current', 'true');
  const ключ =
    день.getFullYear() + '-' + String(день.getMonth() + 1).padStart(2, '0') + '-' + String(день.getDate()).padStart(2, '0');
  const событие = page.locator(`[data-day="${ключ}"]`).getByText(имя);
  await expect(событие).toBeVisible();
  // Проверка — когда список уже пришёл: до него шапки с кнопками нет вовсе.
  await expect(page.getByTestId('nav-sub').filter({ hasText: 'Месяц' })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('button', { name: 'Новый турнир' })).toHaveCount(0);

  // «Подробнее» — страница турнира: сведения и заявка, разделов турнира нет.
  await событие.click();
  await page.getByTestId('tournament-details').getByRole('button', { name: 'Подробнее' }).click();
  await page.waitForURL((url) => url.pathname === `/referee/tournaments/${id}`);
  await expect(page.getByTestId('tournament-context')).toContainText(имя);
  await expect(page.getByTestId('tournament-about')).toContainText('Олимпийская система');
  await expect(page.getByRole('navigation', { name: 'Разделы' })).toHaveCount(0);
  await expect(page.getByTestId('participants')).toHaveCount(0);
  await expect(page.getByTestId('referees')).toHaveCount(0);
  // И сервер судье составы не отдаёт.
  expect((await page.request.get(`/api/tournaments/${id}/participants/`)).status()).toBe(403);
  expect((await page.request.get(`/api/tournaments/${id}/referees/`)).status()).toBe(403);

  // Приём закрыт — подать нечего.
  const панель = page.getByTestId('application-panel');
  await expect(панель.getByTestId('recruitment-state')).toHaveText('Приём закрыт');
  await expect(панель.getByTestId('application-submit')).toHaveCount(0);
  await expect(панель.getByTestId('application-pick')).toHaveCount(0);
});

test('приём заявок судей: председатель открывает со сроком, судья подаёт и отзывает, администратор назначает', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(60_000); // два окна, два входа и весь путь заявки
  await сессия(page, E2E_ADMIN);
  const created = await page.request.post('/api/tournaments/', {
    data: { name: `[e2e] Приём ${Date.now()}`, starts_at: new Date().toISOString(), format: 'single_elimination' },
  });
  const { id } = (await created.json()) as { id: string };
  await page.context().clearCookies();

  // Администратор — во втором окне: открывает приём со сроком на подпункте «Заявки».
  const админ = await (await browser.newContext({ baseURL: info.project.use.baseURL })).newPage();
  await войти(админ, E2E_ADMIN);
  await админ.waitForURL((url) => url.pathname === '/dashboard');
  await админ.goto(`/dashboard/tournaments/${id}/referees?tab=applications`);
  await expect(админ.getByTestId('table-empty')).toHaveText('Заявок нет');
  // «Настройки» — панель справа: строка «Приём заявок» с переключателем; срок —
  // строкой ниже и только у открытого приёма.
  await админ.getByTestId('tournament-settings').click();
  const панельНастроек = админ.getByTestId('tournament-settings-drawer');
  await expect(панельНастроек).toBeVisible();
  const переключатель = админ.getByRole('switch', { name: 'Приём заявок' });
  await expect(переключатель).not.toBeChecked();
  await expect(панельНастроек.getByTestId('recruitment-until')).toHaveCount(0);
  // Сохранённый приём — по ответу сервера.
  const сохранено = async () =>
    (await (await админ.request.get(`/api/tournaments/${id}/`)).json()) as {
      referee_recruitment_open: boolean;
      referee_recruitment_until: string | null;
    };
  // Панель — справа: правый край у края окна.
  const пн = (await панельНастроек.boundingBox())!;
  expect(пн.x + пн.width).toBeGreaterThan(админ.viewportSize()!.width - 2);
  // Правки — черновик: «Отменить» и «Сохранить» внизу, пока ничего не изменено — неактивны.
  const отменить = панельНастроек.getByTestId('settings-discard');
  const сохранить = панельНастроек.getByTestId('settings-save');
  await expect(отменить).toBeDisabled();
  await expect(сохранить).toBeDisabled();
  // Сам переключатель HeroUI — скрытое поле; нажимают по нему, как человек, — по подписи.
  const строкаПриёма = админ.getByTestId('recruitment-settings').getByText('Приём заявок', { exact: true });
  await строкаПриёма.click();
  await expect(переключатель).toBeChecked();
  await expect(панельНастроек.getByTestId('recruitment-until')).toBeVisible();
  // «Отменить» — всё как было сохранено.
  await отменить.click();
  await expect(переключатель).not.toBeChecked();
  await expect(панельНастроек.getByTestId('recruitment-until')).toHaveCount(0);
  await expect(сохранить).toBeDisabled();

  await строкаПриёма.click();
  const срок = new Date(Date.now() + 7 * 864e5);
  const дд = (n: number) => String(n).padStart(2, '0');
  const подпись = дд(срок.getDate()) + '.' + дд(срок.getMonth() + 1) + '.' + срок.getFullYear();
  // Сегменты поля даты HeroUI: день, месяц, год — печатаются подряд.
  await админ.getByTestId('recruitment-until').getByRole('spinbutton').first().click();
  await админ.keyboard.type(дд(срок.getDate()) + дд(срок.getMonth() + 1) + срок.getFullYear());
  await админ.waitForTimeout(400); // снимок — после анимации появления
  await админ.screenshot({ path: 'test-results/workspaces/recruitment-settings.png' });
  // До «Сохранить» на сервер ничего не ушло.
  expect((await сохранено()).referee_recruitment_open).toBe(false);
  await сохранить.click();
  // Сохранили — панель закрылась, на сервере и приём, и срок.
  await expect(панельНастроек).toHaveCount(0);
  expect(await сохранено()).toMatchObject({
    referee_recruitment_open: true,
    referee_recruitment_until: срок.getFullYear() + '-' + дд(срок.getMonth() + 1) + '-' + дд(срок.getDate()),
  });

  // Судья: приём со сроком; без отмеченной должности не подать.
  await войти(page, E2E_REFEREE);
  await page.waitForURL((url) => url.pathname === '/referee');
  await page.goto(`/referee/tournaments/${id}`);
  // Ссылка «поделиться» на раздел турнира ведёт судью на его страницу турнира…
  await page.goto(`/tournaments/${id}/players`);
  await page.waitForURL((url) => url.pathname === `/referee/tournaments/${id}`);
  const панель = page.getByTestId('application-panel');
  await expect(панель.getByTestId('recruitment-state')).toHaveText('Приём до ' + подпись);
  const подать = панель.getByTestId('application-submit');
  await expect(подать).toBeDisabled();
  await панель.getByText('Судья стола').click();
  await панель.getByText('Главный судья соревнований').click();
  await page.screenshot({ path: 'test-results/workspaces/referee-apply.png' });
  await подать.click();
  await expect(панель).toHaveAttribute('data-status', 'pending');
  await expect(панель.getByTestId('application-mine')).toContainText('Ждёт решения');
  // Должности — по старшинству, а не в порядке отметки.
  await expect(панель.getByTestId('application-positions')).toHaveText('Главный судья соревнований, Судья стола');

  // Отозвать — и форма снова на месте; подаём ещё раз.
  await панель.getByTestId('application-withdraw').click();
  await expect(панель).toHaveAttribute('data-status', 'none');
  await панель.getByText('Главный судья соревнований').click();
  await панель.getByTestId('application-submit').click();
  await expect(панель).toHaveAttribute('data-status', 'pending');

  // Администратор видит заявку и назначает на отмеченную должность. У подпункта
  // «Заявки» в сайдбаре — значок с числом ждущих.
  await админ.reload();
  await expect(админ.getByTestId('nav-sub-badge')).toHaveText('1');
  const строка = админ.getByTestId('application-row');
  await expect(строка).toHaveCount(1);
  await expect(строка).toHaveAttribute('data-status', 'pending');
  await expect(строка).toContainText('Судья (проверки)');
  // Флажков нет; щелчок по строке — карточка заявки справа.
  await expect(строка.getByRole('checkbox')).toHaveCount(0);
  await строка.click();
  const заявка = админ.getByTestId('application-drawer');
  await expect(заявка.getByTestId('application-profile')).toContainText('Судья (проверки)');
  await expect(заявка.getByTestId('application-profile')).toContainText(E2E_REFEREE.email);
  await expect(заявка.getByTestId('application-status')).toHaveText('Ждёт решения');
  // Справа: правый край панели — у края окна.
  const з = (await заявка.boundingBox())!;
  expect(з.x + з.width).toBeGreaterThan(админ.viewportSize()!.width - 2);
  // Должности — только отмеченные в заявке; выбрана первая свободная.
  await expect(заявка.getByRole('radio')).toHaveCount(1);
  await expect(заявка.getByRole('radio', { name: 'Главный судья соревнований' })).toBeChecked();
  await админ.waitForTimeout(400); // снимок — после анимации появления
  await админ.screenshot({ path: 'test-results/workspaces/application-drawer.png' });
  await заявка.getByTestId('application-accept').click();
  // Решили — карточка закрылась, решение видно в строке, ждущих больше нет.
  await expect(заявка).toHaveCount(0);
  await expect(админ.getByTestId('nav-sub-badge')).toHaveCount(0);
  await expect(строка).toHaveAttribute('data-status', 'accepted');
  await expect(строка).toContainText('Назначен: Главный судья соревнований');
  // У решённой заявки в карточке действий нет — только «Профиль».
  await строка.click();
  await expect(заявка.getByTestId('application-status')).toHaveText('Назначен: Главный судья соревнований');
  await expect(заявка.getByTestId('application-accept')).toHaveCount(0);
  await expect(заявка.getByTestId('application-reject')).toHaveCount(0);
  await expect(заявка.getByTestId('application-profile-open')).toBeVisible();
  await заявка.getByRole('button', { name: 'Закрыть' }).click();
  await expect(заявка).toHaveCount(0);
  await админ.screenshot({ path: 'test-results/workspaces/applications.png' });
  // …и он в коллегии турнира. Полоса над таблицей при смене подпункта не
  // сдвигается: кнопки — на тех же местах.
  const настройкиДо = await админ.getByTestId('tournament-settings').boundingBox();
  await админ.getByTestId('nav-sub').filter({ hasText: 'Коллегия' }).click();
  await админ.getByTestId('referee-row').first().waitFor();
  expect(await админ.getByTestId('tournament-settings').boundingBox()).toEqual(настройкиДо);
  await expect(админ.locator('[data-testid="referee-row"][data-position="chief_referee"]')).toContainText(
    'Судья (проверки)',
  );

  // Судья видит решение.
  await page.reload();
  await expect(панель).toHaveAttribute('data-status', 'accepted');
  await expect(панель.getByTestId('application-mine')).toContainText('Назначен: Главный судья соревнований');
  await expect(панель.getByTestId('application-submit')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/workspaces/referee-accepted.png' });

  // Срок необязателен: «Без срока» — приём открыт, пока его не выключат.
  await админ.getByTestId('nav-sub').filter({ hasText: 'Заявки' }).click();
  // Вкладка — новая таблица со своей полосой: жмём, когда она уже на месте.
  await админ.getByTestId('application-row').first().waitFor();
  await админ.getByTestId('tournament-settings').click();
  // Панель открывается с сохранённым: срок на месте.
  await expect(админ.getByTestId('recruitment-until')).toContainText(подпись.split('.')[0]);
  await админ.getByTestId('recruitment-until-clear').click();
  await админ.getByTestId('settings-save').click();
  await expect(админ.getByTestId('tournament-settings-drawer')).toHaveCount(0);
  expect((await сохранено()).referee_recruitment_until).toBe(null);
  await page.reload();
  await expect(панель.getByTestId('recruitment-state')).toHaveText('Приём открыт');
  await админ.context().close();
});

test('администратор в кабинете судьи видит турнир как судья: ни составов, ни разделов', async ({ page }) => {
  await войти(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  // Демо-турнир засева: его не удаляют соседние проверки (свои турниры они сносят).
  const t = ((await (await page.request.get('/api/tournaments/')).json()) as { id: string; name: string }[]).find(
    (x) => x.name === '[demo] Чемпионат Республики Казахстан',
  )!;
  // Сменил роль в меню человека — кабинет судьи.
  await page.getByTestId('side-person').click();
  await page.getByTestId('person-role').click();
  await page.getByTestId('role-menu').getByRole('menuitemradio', { name: 'Судья' }).click();
  await page.waitForURL((url) => url.pathname === '/referee');
  await page.goto(`/referee/tournaments/${t.id}`);
  await expect(page.getByTestId('application-panel')).toBeVisible();
  await expect(page.getByTestId('tournament-about')).toBeVisible();
  // Разделов турнира, составов и правки нет — хотя у учётки есть роль администратора.
  await expect(page.getByRole('navigation', { name: 'Разделы' })).toHaveCount(0);
  await expect(page.getByTestId('participants')).toHaveCount(0);
  await expect(page.getByTestId('referees')).toHaveCount(0);
  await expect(page.getByTestId('tournament-info')).toHaveCount(0);
  await expect(page.getByTestId('person-role')).toHaveCount(0); // меню закрыто
  await page.getByTestId('side-person').click();
  await expect(page.getByTestId('person-role')).toHaveText('Судья');
});

test('судье кабинеты администратора и председателя не открыть', async ({ page }) => {
  await войти(page, E2E_REFEREE);
  await page.waitForURL((url) => url.pathname === '/referee');
  // Демо-турнир засева: его не удаляют соседние проверки (свои турниры они сносят).
  const t = ((await (await page.request.get('/api/tournaments/')).json()) as { id: string; name: string }[]).find(
    (x) => x.name === '[demo] Чемпионат Республики Казахстан',
  )!;
  for (const path of [`/dashboard/tournaments/${t.id}/players`, `/gsk/tournaments/${t.id}/referees`]) {
    await page.goto(path);
    await page.waitForURL((url) => url.pathname === '/login');
  }
});

test('с другой ролью в пустой кабинет не пускает', async ({ page }) => {
  await войти(page, E2E_GSK);
  await page.waitForURL((url) => url.pathname === '/rating');
  for (const path of ['/player', '/referee']) {
    await page.goto(path);
    await page.waitForURL((url) => url.pathname === '/login');
  }
});
