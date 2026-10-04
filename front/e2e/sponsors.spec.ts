import { expect, test } from '@playwright/test';

// Полоса партнёров — второй источник «Браузер» в OBS рядом с плашкой счёта.
// Состояния у неё нет, поэтому проверяем то, что может сломаться: знак не
// загрузился (файл не тот или не доехал в public), порядок, подпись из адреса
// и размер, под который настроен источник.

const SHOTS = 'test-results/scoreboard';
const ORDER = ['ministry', 'fnt', 'halyk', 'erg', 'kazakhmys', 'add-capital', 'allur'];
// Размер источника в OBS (SPONSOR_STRIP_SIZE в виджете).
const SOURCE = { width: 1400, height: 100 };

test.describe('Полоса партнёров /scoreboard/sponsors', () => {
  test('все знаки загружены и стоят в заданном порядке', async ({ page }) => {
    await page.goto('/scoreboard/sponsors');

    const logos = page.getByTestId('sponsors').locator('img');
    await expect(logos).toHaveCount(ORDER.length);
    expect(await logos.evaluateAll((list) => list.map((img) => img.getAttribute('data-testid')))).toEqual(
      ORDER.map((id) => `sponsor-${id}`),
    );

    // «Виден» мало: битая картинка тоже занимает место. Загруженная имеет
    // собственные размеры.
    for (const id of ORDER) {
      const logo = page.getByTestId(`sponsor-${id}`);
      await expect(logo).toBeVisible();
      await expect
        .poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
        .toBeGreaterThan(100);
    }

    // Слева направо, без переноса на вторую строку.
    const boxes = await logos.evaluateAll((list) =>
      list.map((img) => {
        const box = img.getBoundingClientRect();
        return { left: box.left, right: box.right, middle: box.top + box.height / 2 };
      }),
    );
    for (let i = 1; i < boxes.length; i += 1) {
      expect(boxes[i].left).toBeGreaterThan(boxes[i - 1].right);
      expect(Math.abs(boxes[i].middle - boxes[0].middle)).toBeLessThan(1);
    }
  });

  test('подпись берётся из адреса, без неё полоса начинается со знаков', async ({ page }) => {
    await page.goto('/scoreboard/sponsors');
    await expect(page.getByTestId('sponsor-ministry')).toBeVisible();
    await expect(page.getByTestId('sponsors-label')).toHaveCount(0);

    await page.goto('/scoreboard/sponsors?label=Astana');
    const label = page.getByTestId('sponsors-label');
    await expect(label).toHaveText('Astana');
    // Подпись стоит перед первым знаком.
    const labelBox = await label.boundingBox();
    const firstBox = await page.getByTestId('sponsor-ministry').boundingBox();
    expect(labelBox!.x + labelBox!.width).toBeLessThan(firstBox!.x);
  });

  test('полоса с подписью помещается в источник OBS; снимок поверх кадра', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/scoreboard/sponsors?label=Astana');
    for (const id of ORDER) {
      await expect
        .poll(() =>
          page.getByTestId(`sponsor-${id}`).evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(100);
    }

    const box = await page.getByTestId('sponsors').boundingBox();
    expect(box!.x).toBe(0);
    expect(box!.y).toBe(0);
    expect(box!.width).toBeLessThanOrEqual(SOURCE.width);
    expect(box!.height).toBeLessThanOrEqual(SOURCE.height);

    // Фон страницы прозрачный — иначе в OBS полоса закрыла бы видео.
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      'rgba(0, 0, 0, 0)',
    );

    // Снимаем как в эфире: тёмный пол зала и светлый кадр — худший случай для
    // белых знаков без подложки.
    for (const [name, bg] of [
      ['dark', 'linear-gradient(#3b4152,#555c70)'],
      ['light', 'linear-gradient(#c9ced6,#e9ebee)'],
    ] as const) {
      await page.addStyleTag({
        content: `html{background:${bg}}body{padding:24px}nextjs-portal{display:none}`,
      });
      await page.setViewportSize({ width: SOURCE.width + 48, height: SOURCE.height + 48 });
      await page.screenshot({ path: `${SHOTS}/sponsors-${name}.png` });
    }
  });
});
