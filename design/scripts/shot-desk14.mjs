/* Служебный скрипт: снять все экраны роли 14 на десктопе по одному.

   Борд «Макеты/14 · Спортсмен» держит все экраны роли в одной строке, каждая
   колонка помечена кодом (`data-code="Э14.3"`). Скрипт открывает борд, ждёт
   отрисовки и снимает каждую колонку отдельным файлом — так экраны можно
   смотреть по одному, а не искать глазами в общей ленте.

   Запуск (Storybook уже поднят): node scripts/shot-desk14.mjs [папка] */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const out = process.argv[2] ?? '.shots/desk14';
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({
  viewport: { width: 1680, height: 1100 },
  deviceScaleFactor: 2,
});

/* Тема — светлая на знаке ФНТ: варианты роли рисуются на ней (22.08.2026). */
const id = 'макеты-14-·-спортсмен--flow';
await page.goto(
  `http://localhost:6006/iframe.html?id=${id}&viewMode=story&globals=${encodeURIComponent('theme:daylight-fnt')}`,
  { waitUntil: 'networkidle', timeout: 90_000 },
);
await page.waitForSelector('[data-code]', { timeout: 60_000 });
await page.waitForTimeout(4000);

const codes = await page.$$eval('[data-code]', (els) => els.map((e) => e.dataset.code));
console.log('колонок:', codes.length, codes.join(' '));

for (const code of codes) {
  const col = page.locator(`[data-code="${code}"]`).first();
  await col.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const file = `${out}/${code.replace(/[^\wА-Яа-я.]/g, '')}.png`;
  await col.screenshot({ path: file });
  console.log('ok', file);
}

await browser.close();
