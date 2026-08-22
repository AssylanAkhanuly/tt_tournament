/* Служебный снимок чужого сайта для доски референсов. Не часть сборки.
   node scripts/refshot.mjs <url> <out.png> [w] [h] [fullpage] */
import { chromium } from 'playwright-core';
const [url, out, w = '1440', h = '1000', full] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
  locale: 'en-US' });
try { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e) { console.log('goto', e.message); }
await p.waitForTimeout(3500);
for (const t of ['Accept all','Alle akzeptieren','Accept All','Zustimmen','I agree','Accept','Godkjenn','Принять','Alles accepteren','AGREE','Consent']) {
  try { const btn = p.getByRole('button', { name: t, exact: false }).first();
    if (await btn.isVisible({ timeout: 600 })) { await btn.click({ timeout: 1500 }); await p.waitForTimeout(1200); break; } } catch {}
}
await p.waitForTimeout(1500);
try { await p.screenshot({ path: out, fullPage: full === 'full' }); console.log('ok', out); }
catch (e) { console.log('shot fail', e.message); }
await b.close();
