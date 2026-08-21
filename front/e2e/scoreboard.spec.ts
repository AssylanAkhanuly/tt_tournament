import { expect, test, type Page } from '@playwright/test';

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
  left: { name: '', country: '', games: 0, points: 0 },
  right: { name: '', country: '', games: 0, points: 0 },
  team: { enabled: false, left: 0, right: 0 },
};

async function openBoth(page: Page) {
  const overlay = await page.context().newPage();
  await page.goto('/scoreboard');
  await overlay.goto('/scoreboard/overlay');
  await expect(page.getByText('в эфире')).toBeVisible(); // бэкенд отвечает
  await expect(overlay.getByTestId('board')).toBeVisible();
  return overlay;
}

// Запись требует ту версию, от которой отталкиваемся, — как и в пульте.
test.beforeEach(async ({ request }) => {
  const current = await (await request.get(BOARD_URL)).json();
  const response = await request.put(BOARD_URL, { data: { ...CLEAN_BOARD, rev: current.rev } });
  expect(response.ok()).toBeTruthy();
});

test.describe('Табло трансляции /scoreboard', () => {
  test('имена с пульта появляются в оверлее', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByLabel('Имя — Слева').fill('КИРИЛЛ ГЕРАСИМЕНКО');
    await page.getByLabel('Страна — Слева').fill('KAZ');
    await page.getByLabel('Имя — Справа').fill('ТОМОКАДЗУ ХАРИМОТО');
    await page.getByLabel('Страна — Справа').fill('JPN');

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

  test('командный матч добавляет нижнюю строку', async ({ page }) => {
    const overlay = await openBoth(page);

    await page.getByLabel('Страна — Слева').fill('KAZ');
    await page.getByLabel('Страна — Справа').fill('JPN');
    await page.getByLabel('Командный матч').check();
    await page.getByRole('button', { name: 'Командный счёт плюс — Слева' }).click();
    await page.getByRole('button', { name: 'Командный счёт плюс — Справа' }).click();
    await page.getByRole('button', { name: 'Командный счёт плюс — Справа' }).click();

    await expect(overlay.getByTestId('team-score')).toHaveText('KAZ 1-2 JPN');
  });

  test('два стола ведутся независимо', async ({ page, request }) => {
    // Турнир транслирует несколько столов сразу: у каждого своя доска, свой
    // пульт и свой адрес для источника в OBS.
    const secondBoard = '/api/scoreboard/table-2/';
    const current = await (await request.get(secondBoard)).json();
    await request.put(secondBoard, { data: { ...CLEAN_BOARD, rev: current.rev } });

    await page.goto('/scoreboard?board=table-2');
    await expect(page.getByRole('heading', { name: /table-2/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Открыть оверлей' })).toHaveAttribute(
      'href',
      '/scoreboard/overlay?board=table-2',
    );

    const secondOverlay = await page.context().newPage();
    await secondOverlay.goto('/scoreboard/overlay?board=table-2');
    const mainOverlay = await page.context().newPage();
    await mainOverlay.goto('/scoreboard/overlay');

    await page.getByRole('button', { name: 'Очко плюс — Слева' }).click();

    await expect(secondOverlay.getByTestId('points-left')).toHaveText('1');
    await expect(mainOverlay.getByTestId('points-left')).toHaveText('0'); // соседний стол не тронут
  });

  test('снимок обеих сторон: пульт и эфир', async ({ page }) => {
    const overlay = await openBoth(page);

    // Собираем ровно ту картинку, что на референсе.
    await page.getByLabel('Имя — Слева').fill('KIRILL GERASSIMENKO');
    await page.getByLabel('Страна — Слева').fill('KAZ');
    await page.getByLabel('Имя — Справа').fill('TOMOKAZU HARIMOTO');
    await page.getByLabel('Страна — Справа').fill('JPN');
    await page.getByLabel('Тип матча').fill('MT');
    await page.getByLabel('Круг').fill('R 16');
    await page.getByLabel('Командный матч').check();
    await page.getByRole('button', { name: 'Командный счёт плюс — Слева' }).click();
    await page.getByRole('button', { name: 'Командный счёт плюс — Справа' }).click();
    await page.getByRole('button', { name: 'Командный счёт плюс — Справа' }).click();

    const plusLeft = page.getByRole('button', { name: 'Очко плюс — Слева' });
    for (let i = 0; i < 9; i += 1) await plusLeft.click();
    const plusRight = page.getByRole('button', { name: 'Очко плюс — Справа' });
    for (let i = 0; i < 10; i += 1) await plusRight.click();

    await expect(overlay.getByTestId('status')).toHaveText('GAME POINT');

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

    await page.setViewportSize({ width: 1200, height: 1400 });
    await page.screenshot({ path: `${SHOTS}/control.png`, fullPage: true });
  });
});
