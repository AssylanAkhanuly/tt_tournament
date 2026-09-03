import { chromium } from 'playwright-core';
const [id, out, sel] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(`http://localhost:6006/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
await (sel ? page.locator(sel).first() : page).screenshot({ path: out, ...(sel ? {} : { fullPage: true }) });
await browser.close();
console.log('ok', out);
