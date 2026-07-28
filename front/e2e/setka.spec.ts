import { expect, test } from '@playwright/test';

// E2E турнирной сетки (React Flow). Проверяем реальный рендер и интерактив,
// а не только typecheck — по правилу из корневого CLAUDE.md.
test.describe('Турнирная сетка /setka', () => {
  test('рендерит сетку: карточки, коннекторы, без подписей кругов', async ({ page }) => {
    await page.goto('/setka');

    // 7 матчей (4 четвертьфинала + 2 полуфинала + финал)
    const nodes = page.locator('.react-flow__node-match');
    await expect(nodes).toHaveCount(7);

    // участники и счёт на месте
    await expect(page.getByText('Смагулов А.').first()).toBeVisible();
    await expect(page.getByText('Токаев М.').first()).toBeVisible();
    await expect(page.getByText('Байжанов А.').first()).toBeVisible();

    // коннекторы-локти: наш SVG в ViewportPortal с непустым path d
    const wire = page.locator('.react-flow__viewport-portal svg path').first();
    await expect(wire).toHaveCount(1);
    const d = await wire.getAttribute('d');
    expect((d ?? '').length).toBeGreaterThan(40); // 6 локтей по 4 точки

    // «только сетка»: подписей кругов нет
    await expect(page.getByText(/ФИНАЛ/i)).toHaveCount(0);

    // ярлык атрибуции React Flow скрыт
    await expect(page.locator('.react-flow__attribution')).not.toBeVisible();

    // кнопки зума (Controls) присутствуют
    await expect(page.locator('.react-flow__controls-zoomin')).toBeVisible();
  });

  test('кнопка зума меняет масштаб холста', async ({ page }) => {
    await page.goto('/setka');
    const viewport = page.locator('.react-flow__viewport');
    await expect(viewport).toBeVisible();

    const before = await viewport.getAttribute('style');
    await page.locator('.react-flow__controls-zoomin').click();
    await expect
      .poll(async () => viewport.getAttribute('style'), { timeout: 5_000 })
      .not.toBe(before); // transform (scale) изменился после зума
  });
});
