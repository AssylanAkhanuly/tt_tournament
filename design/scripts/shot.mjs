/* Скриншот истории Storybook. Служебный скрипт для проверки макетов глазами.
   Запуск: node scripts/shot.mjs <story-id> <out.png> [ширина] [высота] [селектор] */
import { chromium } from 'playwright-core';

const [id, out, w = '1600', h = '1100', sel] = process.argv.slice(2);
if (!id || !out) {
  console.error('usage: node scripts/shot.mjs <story-id> <out.png> [w] [h] [selector]');
  process.exit(1);
}

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
});
await page.goto(`http://localhost:6006/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`, {
  waitUntil: 'networkidle',
  timeout: 60_000,
});
await page.waitForTimeout(2500);

const target = sel ? page.locator(sel).first() : page;
await target.screenshot({ path: out, ...(sel ? {} : { fullPage: true }) });
await browser.close();
console.log('ok', out);
