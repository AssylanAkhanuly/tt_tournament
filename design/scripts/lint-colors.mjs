/* Проверка трёх главных правил дизайн-системы:

   1. Цвет живёт только в токенах. Ищем «сырые» значения (#hex, rgb(), hsl())
      везде, кроме `src/theme/tokens.css` и `src/theme/themes.ts` — это источник.
   2. Все `var(--…)` ссылаются на существующий токен. Иначе бывает тихая
      поломка: переименовали токен, а инлайн-стиль в `.tsx` остался на старом
      имени — свойство становится невалидным, граница/цвет молча пропадают.
   3. Форма углов — тоже только токенами (`--r-…`). Правило появилось дорого:
      решение «интерфейс с прямыми углами» стоило 157 правок по двадцати
      файлам, потому что радиусы писали числами мимо шкалы. Круглое по сути
      (`50%` — точки, аватары, тумблер) под правило не попадает.

   Запуск: `npm run lint:colors`. */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Через fileURLToPath, а не `.pathname`: на Windows тот отдаёт «/C:/…», и
// join() склеивает «C:\C:\…» — проверка падала, не начав работу.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN = ['src', 'gen'];
const SKIP_DIRS = new Set(['node_modules', 'out', 'assets']);
const TOKENS_FILE = 'src/theme/tokens.css';
/* Инструменты темы работают с «сырыми» цветами по своей природе: список тем,
   хранилище своей палитры и конструктор с пипетками. Всё остальное — только
   токены. */
const SKIP_RAW = new Set([TOKENS_FILE, 'src/theme/themes.ts', 'src/theme/custom.ts', 'src/theme/Builder.tsx']);
const EXT = /\.(css|tsx|ts|html)$/;
const RAW = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;
/* Радиус мимо токена: `border-radius: 12px`, `borderRadius: 14`. Разрешены
   `var(--…)`, `50%` (круглое по сути), `inherit` и `0`. Значение достаём и
   проверяем отдельно: лукахед внутри `\s*` отрабатывает на бэктрекинге и
   пропускает всё подряд. */
const RADIUS = /(?:border-radius|borderRadius)\s*:\s*([^;,}\n]+)/g;
const RADIUS_OK = /var\(--r-|^(?:'?"?50%"?'?|inherit|0)$/;
const VAR_USE = /var\(\s*(--[\w-]+)/g;
const VAR_DEF = /(--[\w-]+)\s*:/g;

const files = [];
for (const dir of SCAN) walk(join(ROOT, dir));

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (EXT.test(name)) files.push(full);
  }
}

const rel = (f) => relative(ROOT, f).replaceAll('\\', '/');
const read = (f) => readFileSync(f, 'utf8');

/* известные токены: всё, что объявлено в tokens.css, темах и в самих файлах */
const known = new Set(['--font']);
for (const m of read(join(ROOT, TOKENS_FILE)).matchAll(VAR_DEF)) known.add(m[1]);
for (const m of read(join(ROOT, 'src/theme/themes.ts')).matchAll(/'(--[\w-]+)'/g)) known.add(m[1]);
for (const f of files) for (const m of read(f).matchAll(VAR_DEF)) known.add(m[1]);

const rawHits = [];
const unknownHits = [];
const radiusHits = [];
for (const file of files) {
  const path = rel(file);
  read(file)
    .split('\n')
    .forEach((line, i) => {
      const where = `${path}:${i + 1}`;
      if (!SKIP_RAW.has(path)) {
        // color-mix(...) считает прозрачность от токена — это разрешено
        const hits = line.replace(/color-mix\([^)]*\)/g, '').match(RAW);
        if (hits) rawHits.push(`${where}  ${hits.join(', ')}  →  ${line.trim().slice(0, 90)}`);
      }
      if (!SKIP_RAW.has(path)) {
        for (const m of line.matchAll(RADIUS)) {
          const value = m[1].trim();
          if (!RADIUS_OK.test(value)) {
            radiusHits.push(`${where}  ${value}  →  ${line.trim().slice(0, 90)}`);
          }
        }
      }
      for (const m of line.matchAll(VAR_USE)) {
        if (!known.has(m[1])) unknownHits.push(`${where}  ${m[1]}  →  ${line.trim().slice(0, 90)}`);
      }
    });
}

let bad = false;
if (rawHits.length) {
  bad = true;
  console.error(`Сырые цвета вне токенов (${rawHits.length}):\n` + rawHits.join('\n'));
  console.error(`\nПочини: замени на var(--c-…) из ${TOKENS_FILE}.\n`);
}
if (unknownHits.length) {
  bad = true;
  console.error(`Ссылки на несуществующие токены (${unknownHits.length}):\n` + unknownHits.join('\n'));
  console.error(`\nПочини: имя токена изменилось — возьми актуальное из ${TOKENS_FILE}.\n`);
}
if (radiusHits.length) {
  bad = true;
  console.error(`Радиусы вне токенов (${radiusHits.length}):\n` + radiusHits.join('\n'));
  console.error(`\nПочини: возьми --r-xs/sm/md/lg из ${TOKENS_FILE}; круглое — 50%.\n`);
}
if (bad) process.exit(1);
console.log(
  `Токены в порядке: ${files.length} файлов, сырых цветов и радиусов нет, все var(--…) существуют.`,
);
