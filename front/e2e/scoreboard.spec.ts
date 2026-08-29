import { expect, test, type APIRequestContext, type Page, type Route } from '@playwright/test';

// E2E табло трансляции. Главное здесь — не отрисовка, а связка: пульт и оверлей
// это две разные вкладки, между ними только Django (строка в базе). Поэтому
// каждый сценарий держит открытыми обе страницы и проверяет, что нажатие на
// пульте доехало в эфир. Бэкенд должен быть поднят — тесты идут против него.
//
// Доска одна на весь сервер, поэтому тесты идут по очереди и каждый начинает с
// чистого счёта.
test.describe.configure({ mode: 'serial' });

const SHOTS = 'test-results/scoreboard';
const BOARD_URL = '/api/scoreboard/main/';

const CLEAN_BOARD = {
  match_label: 'MT',
  round_label: 'R 16',
  best_of: 5,
  status_lang: 'en',
  status_override: null,
  visible: true,
  first_server: '',
  left: { name: '', name2: '', country: '', games: 0, points: 0, timeout: false, card: '' },
  right: { name: '', name2: '', country: '', games: 0, points: 0, timeout: false, card: '' },
  team: { enabled: false, left: 0, right: 0 },
};

/** Запись требует ту версию, от которой отталкиваемся, — как и в пульте. */
async function writeBoard(
  request: APIRequestContext,
  patch: Record<string, unknown> = {},
  url = BOARD_URL,
) {
  const current = await (await request.get(url)).json();
  const response = await request.put(url, {
    data: { ...CLEAN_BOARD, ...patch, rev: current.rev },
  });
  expect(response.ok()).toBeTruthy();
}

async function openBoth(page: Page) {
  const overlay = await page.context().newPage();
  await page.goto('/scoreboard');
  await overlay.goto('/scoreboard/overlay');
  // На пульте предпросмотр той же плашки — по нему видно, что страница ожила.
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(overlay.getByTestId('board')).toBeVisible();
  return overlay;
}

test.beforeEach(async ({ request }) => {
  await writeBoard(request);
});

test.describe('Табло трансляции /scoreboard', () => {
  test('имена с пульта появляются в оверлее', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByLabel('Имя — Слева').fill('КИРИЛЛ ГЕРАСИМЕНКО');
    await page.getByLabel('Имя — Справа').fill('ТОМОКАДЗУ ХАРИМОТО');

    await expect(overlay.getByText('КИРИЛЛ ГЕРАСИМЕНКО')).toBeVisible();
    await expect(overlay.getByText('ТОМОКАДЗУ ХАРИМОТО')).toBeVisible();
  });

  test('очки, сетбол и завершение партии доезжают в эфир', async ({ page }) => {
    const overlay = await openBoth(page);

    const plusRight = page.getByRole('button', { name: 'Очко плюс — Справа' });
    for (let i = 0; i < 10; i += 1) await plusRight.click();
    await page.getByRole('button', { name: 'Очко плюс — Слева' }).click();

    await expect(overlay.getByTestId('points-right')).toHaveText('10');
    await expect(overlay.getByTestId('points-left')).toHaveText('1');
    await expect(overlay.getByTestId('status')).toHaveText('GAME POINT'); // 10 очков = сетбол

    await page.getByRole('button', { name: 'Завершить партию' }).click();
    await expect(overlay.getByTestId('games-right')).toHaveText('1');
    await expect(overlay.getByTestId('points-right')).toHaveText('0');
    await expect(overlay.getByTestId('status')).toHaveCount(0); // счёт 0:0 — подписи нет
  });

  test('минус не уводит счёт ниже нуля', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByRole('button', { name: 'Очко минус — Слева' }).click();
    await page.getByRole('button', { name: 'Очко плюс — Слева' }).click();
    await expect(overlay.getByTestId('points-left')).toHaveText('1');
  });

  test('горячие клавиши ведут счёт без мыши', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.locator('body').click(); // фокус вне полей ввода
    await page.keyboard.press('Digit1');
    await page.keyboard.press('Digit2');
    await page.keyboard.press('Digit2');
    await expect(overlay.getByTestId('points-left')).toHaveText('1');
    await expect(overlay.getByTestId('points-right')).toHaveText('2');

    await page.keyboard.press('KeyQ'); // минус слева
    await expect(overlay.getByTestId('points-left')).toHaveText('0');
  });

  test('плашку можно убрать из эфира и вернуть', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByRole('button', { name: 'Скрыть плашку' }).click();
    await expect(overlay.getByTestId('board')).toHaveAttribute('data-hidden', 'true');

    await page.getByRole('button', { name: 'Показать плашку' }).click();
    await expect(overlay.getByTestId('board')).not.toHaveAttribute('data-hidden', 'true');
  });

  test('второй оверлей подхватывает текущий счёт при открытии', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByRole('button', { name: 'Очко плюс — Слева' }).click();
    await expect(overlay.getByTestId('points-left')).toHaveText('1');

    // Так же ведёт себя источник в OBS после перезапуска сцены.
    const second = await page.context().newPage();
    await second.goto('/scoreboard/overlay');
    await expect(second.getByTestId('points-left')).toHaveText('1');
  });

  test('командный матч добавляет нижнюю строку', async ({ page, request }) => {
    // Командная строка и коды стран задаются через API: на пульте их не правят.
    await writeBoard(request, {
      team: { enabled: true, left: 0, right: 0 },
      left: { ...CLEAN_BOARD.left, country: 'KAZ' },
      right: { ...CLEAN_BOARD.right, country: 'JPN' },
    });

    const overlay = await openBoth(page);
    await page.getByRole('button', { name: 'Командный счёт плюс — Слева' }).click();
    await page.getByRole('button', { name: 'Командный счёт плюс — Справа' }).click();
    await page.getByRole('button', { name: 'Командный счёт плюс — Справа' }).click();

    await expect(overlay.getByTestId('team-score')).toHaveText('KAZ 1-2 JPN');
  });

  test('два стола ведутся независимо', async ({ page, request }) => {
    // Турнир транслирует несколько столов сразу: у каждого своя доска, свой
    // пульт и свой адрес для источника в OBS.
    await writeBoard(request, {}, '/api/scoreboard/table-2/');

    await page.goto('/scoreboard?board=table-2');
    await expect(page.getByTestId('board')).toBeVisible();

    const secondOverlay = await page.context().newPage();
    await secondOverlay.goto('/scoreboard/overlay?board=table-2');
    const mainOverlay = await page.context().newPage();
    await mainOverlay.goto('/scoreboard/overlay');

    await page.getByRole('button', { name: 'Очко плюс — Слева' }).click();

    await expect(secondOverlay.getByTestId('points-left')).toHaveText('1');
    await expect(mainOverlay.getByTestId('points-left')).toHaveText('0'); // соседний стол не тронут
  });

  // ── замечания федерации 22.08.2026: подача, пары, тайм-аут, карточки ──

  test('подача отмечается один раз и дальше переходит сама', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByRole('button', { name: 'Подача — Слева' }).click();
    await expect(overlay.getByTestId('serve-left1')).toHaveAttribute('data-on', 'true');
    await expect(overlay.getByTestId('serve-right1')).not.toHaveAttribute('data-on', 'true');

    // Два разыгранных очка — подача уходит сопернику, оператор ничего не нажимает.
    await page.getByRole('button', { name: 'Очко плюс — Слева' }).click();
    await page.getByRole('button', { name: 'Очко плюс — Справа' }).click();
    await expect(overlay.getByTestId('serve-right1')).toHaveAttribute('data-on', 'true');
    await expect(overlay.getByTestId('serve-left1')).not.toHaveAttribute('data-on', 'true');
  });

  test('пара: вторая фамилия в эфире и своя подача', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByLabel('Имя — Слева').fill('ГЕРАСИМЕНКО');
    // Заполненное второе имя и делает разряд парным — переключателя нет.
    await page.getByLabel('Второй игрок — Слева').fill('КОЛОДЯЖНЫЙ');
    await expect(overlay.getByText('КОЛОДЯЖНЫЙ')).toBeVisible();

    const secondServe = page.getByRole('button', { name: 'Подача второго — Слева' });
    await expect(secondServe).toBeVisible();
    await secondServe.click();
    await expect(overlay.getByTestId('serve-left2')).toHaveAttribute('data-on', 'true');
  });

  test('тайм-аут и карточки видны в эфире', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByRole('button', { name: 'Тайм-аут — Слева' }).click();
    await expect(overlay.getByTestId('timeout-left')).toBeVisible();

    const card = page.getByRole('button', { name: 'Карточка — Справа' });
    await card.click();
    await expect(overlay.getByTestId('card-right')).toHaveAttribute('data-card', 'yellow');
    await card.click();
    await expect(overlay.getByTestId('card-right')).toHaveAttribute('data-card', 'red');
    await card.click();
    await expect(overlay.getByTestId('card-right')).toHaveCount(0); // круг замкнулся
  });

  // Пульт метит в планшет у стола: всё должно быть видно сразу, без прокрутки,
  // и кнопки — под палец. Книжная и альбомная — разные худшие случаи по высоте.
  const TABLETS = [
    { name: 'альбомная', width: 1024, height: 768 },
    { name: 'книжная', width: 768, height: 1024 },
  ] as const;

  for (const tablet of TABLETS) {
    test(`пульт умещается в экран планшета: ${tablet.name}`, async ({ page, request }) => {
      // Худший случай по высоте: парный разряд (второе имя и четвёртый
      // переключатель) плюс командный матч (третий счётчик у каждой стороны).
      await writeBoard(request, {
        team: { enabled: true, left: 0, right: 0 },
        left: { ...CLEAN_BOARD.left, name: 'ИГРОК', name2: 'ПАРТНЁР' },
        right: { ...CLEAN_BOARD.right, name: 'ИГРОК', name2: 'ПАРТНЁР' },
      });

      await page.setViewportSize({ width: tablet.width, height: tablet.height });
      await page.goto('/scoreboard');
      // nextjs-portal — значок dev-инструментов Next в нижнем углу. В сборке его
      // нет, а в dev он перехватывает клики по нижнему ряду кнопок.
      await page.addStyleTag({ content: 'nextjs-portal{display:none}' });
      await expect(page.getByRole('button', { name: 'Командный счёт плюс — Слева' })).toBeVisible();

      const overflow = await page.evaluate(() => ({
        y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      expect(overflow.y).toBeLessThanOrEqual(0);
      expect(overflow.x).toBeLessThanOrEqual(0);

      // Всё, чем ведут счёт, доступно без прокрутки.
      for (const name of [
        'Очко плюс — Слева',
        'Очко плюс — Справа',
        'Партия плюс — Слева',
        'Командный счёт плюс — Справа',
        'Подача второго — Слева',
        'Карточка — Справа',
        'Завершить партию',
      ]) {
        await expect(page.getByRole('button', { name })).toBeInViewport();
      }
      await expect(page.getByTestId('board')).toBeInViewport(); // предпросмотр тоже

      // Прокрутки нет из-за overflow: hidden, поэтому лишнее не вылезает, а
      // молча обрезается. Проверяем последний по порядку орган управления
      // целиком: если нижний ряд не поместился, это видно только так.
      await expect(page.getByRole('button', { name: 'Скрыть плашку' })).toBeInViewport({
        ratio: 1,
      });

      // Кнопка счёта — не меньше 44 px, иначе по ней не попасть пальцем.
      const box = await page.getByRole('button', { name: 'Очко плюс — Слева' }).boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

      await page.screenshot({ path: `${SHOTS}/control-${tablet.width}x${tablet.height}.png` });
    });
  }

  test('эфир держит одно соединение и не опрашивает сервер', async ({ page }) => {
    // Ради этого всё и затевалось: у клиента должно быть одно постоянное
    // соединение, а не череда запросов каждые полсекунды.
    let streams = 0;
    const polls: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.includes('/api/scoreboard/')) return;
      if (url.endsWith('/stream/')) streams += 1;
      else if (request.method() === 'GET') polls.push(url);
    });

    await page.goto('/scoreboard/overlay');
    await expect(page.getByTestId('board')).toBeVisible();
    // Ждать надо дольше сторожа тишины (9 c), иначе поломанный поток прикроет
    // запасной путь и проверка это пропустит — так и случилось, когда DRF
    // отвечал 406. Заодно `streams === 1` ловит шторм переподключений.
    await page.waitForTimeout(12000);

    expect(streams).toBe(1);
    expect(polls).toEqual([]); // ни одного опроса: счёт приходит сам

    // И соединение действительно живое — счёт доезжает.
    await writeBoard(page.request, { left: { ...CLEAN_BOARD.left, points: 5 } });
    await expect(page.getByTestId('points-left')).toHaveText('5');
  });

  // ── долгая трансляция ──────────────────────────────────────────────────
  // Турнирный день — это часы в эфире. Проверяем не «открылось», а «пережило».

  test('эфир восстанавливается после ошибки бэкенда', async ({ page }) => {
    // Так выглядит выкладка бэкенда посреди трансляции: один запрос ловит 502.
    // EventSource на ответ с ошибкой закрывается насовсем, поэтому без нашего
    // пересоздания эфир замер бы до конца дня.
    let refused = 0;
    await page.route('**/api/scoreboard/*/stream/', async (route: Route) => {
      if (refused === 0) {
        refused = 1;
        await route.fulfill({ status: 502, body: 'bad gateway' });
        return;
      }
      // Дальше не вмешиваемся: проксировать поток через перехватчик нельзя,
      // он его буферизует.
      await route.fallback();
    });

    await page.goto('/scoreboard/overlay');
    await expect(page.getByTestId('board')).toBeVisible();
    await writeBoard(page.request, { left: { ...CLEAN_BOARD.left, points: 6 } });

    await expect(page.getByTestId('points-left')).toHaveText('6', { timeout: 20_000 });
    expect(refused).toBe(1); // ошибка действительно случилась, а не проскочила
  });

  test('если поток не поднимается вовсе, счёт всё равно идёт в эфир', async ({ page }) => {
    test.setTimeout(90_000);

    // Буферизующий прокси или фильтр в сети зала: соединение не встаёт никогда.
    await page.route('**/api/scoreboard/*/stream/', (route) =>
      route.fulfill({ status: 502, body: 'bad gateway' }),
    );

    await page.goto('/scoreboard/overlay');
    await expect(page.getByTestId('board')).toBeVisible();

    // Сторож сдаётся через 18 секунд тишины и переходит на опрос.
    await page.waitForTimeout(20_000);
    await writeBoard(page.request, { left: { ...CLEAN_BOARD.left, points: 4 } });

    await expect(page.getByTestId('points-left')).toHaveText('4', { timeout: 20_000 });
  });

  test('снимок обеих сторон: пульт и эфир', async ({ page, request }) => {
    // Собираем ровно ту картинку, что на референсе. Подписи матча и командная
    // строка задаются через API — на пульте их больше нет.
    await writeBoard(request, {
      team: { enabled: true, left: 1, right: 2 },
      left: { ...CLEAN_BOARD.left, name: 'KIRILL GERASSIMENKO', country: 'KAZ' },
      right: { ...CLEAN_BOARD.right, name: 'TOMOKAZU HARIMOTO', country: 'JPN' },
    });

    const overlay = await openBoth(page);

    const plusLeft = page.getByRole('button', { name: 'Очко плюс — Слева' });
    for (let i = 0; i < 9; i += 1) await plusLeft.click();
    const plusRight = page.getByRole('button', { name: 'Очко плюс — Справа' });
    for (let i = 0; i < 10; i += 1) await plusRight.click();

    await expect(overlay.getByTestId('status')).toHaveText('GAME POINT');

    // Показываем на снимке всё, что просила федерация: подачу, тайм-аут и карточку.
    await page.getByRole('button', { name: 'Подача — Справа' }).click();
    await page.getByRole('button', { name: 'Тайм-аут — Слева' }).click();
    await page.getByRole('button', { name: 'Карточка — Справа' }).click();
    await expect(overlay.getByTestId('card-right')).toHaveAttribute('data-card', 'yellow');

    // Размер плашки = размер источника «Браузер» в OBS (BOARD_SIZE в виджете).
    const box = await overlay.getByTestId('board').boundingBox();
    expect(box?.width).toBe(860);
    expect(box?.height).toBeLessThanOrEqual(160);

    // Эфир снимаем на синем фоне сцены — как это увидит зритель в OBS.
    await overlay.addStyleTag({
      // nextjs-portal — значок dev-инструментов Next, в сборке его нет
      content: 'html,body{background:#2b9ad4}body{padding:24px}nextjs-portal{display:none}',
    });
    await overlay.setViewportSize({ width: 940, height: 240 });
    await overlay.screenshot({ path: `${SHOTS}/overlay.png` });

    await page.setViewportSize({ width: 1200, height: 900 });
    await page.addStyleTag({ content: 'nextjs-portal{display:none}' });
    await page.screenshot({ path: `${SHOTS}/control.png` });
  });
});
