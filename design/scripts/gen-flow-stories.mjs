/* Генератор историй раздела «Флоу»: `src/flows/data/roleNN.ts` →
   `src/flows/roleNN.stories.tsx`.

   У роли две истории: «Узлы и макеты» (борд с требованиями под каждым экраном)
   и «Карта» — граф маршрута, где клик по узлу открывает макет во второй
   половине экрана. Обе собираются из карты экранов роли (`SCREENS` в
   `mockups/roleNN.tsx`), поэтому число экранов в подписи берём оттуда же.

   Заголовок раздела и имя истории обязаны быть строковыми литералами:
   Storybook строит дерево статическим разбором файла. Писать их руками —
   гарантированный дрейф с данными, поэтому файлы собираются отсюда.

   Запуск: `npm run gen:flows`. Проверка: `npm run lint:flows`. */

import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FLOWS = join(ROOT, 'src', 'flows');
const DATA = join(FLOWS, 'data');

const ROLE_NUM = /\bnum:\s*'([^']+)'/;
const ROLE_TITLE = /\bnum:\s*'[^']+',\s*\n\s*title:\s*'([^']+)'/;
const ROLE_SOURCE = /\bsource:\s*'([^']+)'/;
/** Экран в карте экранов роли: `'Э6.2': {`. */
const MAP_CODE = /'(Э\d+\.\d+)':\s*\{/g;

/** Роли, которые проектируются на светлой теме, — у их историй тема прибита,
    как в разделе «Дизайн». Иначе экран роли показывается на теме из тулбара, и
    один и тот же макет выглядит то светлым, то тёмным. По спортсмену решение
    принято 22.08.2026 (flows/14-sportsmen.md). */
const DAYLIGHT = new Set(['14']);
const light = (num) => (DAYLIGHT.has(num) ? `
  globals: { theme: 'daylight-fnt' },` : '');

/** Номер с ведущим нулём — иначе Storybook сортирует 1, 10, 11, …, 2.
    Пара ролей («3 и 4») → `03–04`. Повторяет `pad` из `src/flows/types.ts`. */
const pad = (num, sep = '–') => (num.match(/\d+/g) ?? ['0']).map((n) => n.padStart(2, '0')).join(sep);

/** «1 экран · 2 экрана · 5 экранов» — подпись истории читают люди. */
function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} ${one}`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

// Только файлы ролей: рядом лежит `all.ts` — общий список ролей.
const MOCKUPS = join(ROOT, 'src', 'mockups');
const files = readdirSync(DATA).filter((f) => /^role.*\.ts$/.test(f));
let written = 0;
let skipped = 0;

for (const file of files) {
  const name = file.replace(/\.ts$/, ''); // roleNN
  const src = readFileSync(join(DATA, file), 'utf8');

  const num = src.match(ROLE_NUM)?.[1];
  const title = src.match(ROLE_TITLE)?.[1];
  const source = src.match(ROLE_SOURCE)?.[1] ?? '';
  if (!num || !title) {
    console.error(`${file}: не нашёл num/title роли — пропускаю`);
    process.exitCode = 1;
    continue;
  }

  /* Считаем по карте экранов роли, а не по данным: в борде и на карте стоит
     ещё и сквозной вход (Э0.1), и подпись истории должна говорить правду о
     том, что человек видит. */
  const mock = readFileSync(join(MOCKUPS, `${name}.tsx`), 'utf8');
  const screens = [...mock.matchAll(MAP_CODE)].length;

  // Борд макетов той же роли: `role0304.tsx` → `Role0304Board`.
  const board = `Role${name.slice('role'.length)}Board`;
  const count = plural(screens, 'экран', 'экрана', 'экранов');

  const out = `/* Сгенерировано: npm run gen:flows (источник — data/${file}).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { ${name} } from './data/${name}';
import { ${board}, SCREENS } from '../mockups/${name}';

export default {
  title: 'Флоу/${pad(num)} · ${title}',
  parameters: { layout: 'fullscreen' },${light(num)}
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · ${count}',
  render: () => (
    <Paired flow={${name}}>
      <${board} />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · ${count}',
  render: () => <FlowMap flow={${name}} screens={SCREENS} />,
};
`;

  /* Файл, который не изменился, не трогаем вовсе.

     Запущенный Storybook переиндексирует историю на каждую запись, и когда все
     четырнадцать файлов переписывались разом, индексатор ловил их наполовину
     написанными («Unexpected end of file»), запоминал ошибку и отдавал 500 на
     весь `index.json` — раздел оставался пустым до перезапуска сервера. Правок
     обычно одна-две, а перезаписывались все: 12 лишних поводов сломаться.

     Саму запись всё равно делаем через временный файл и переименование —
     переименование атомарно, и половины файла читатель не увидит. */
  const path = join(FLOWS, `${name}.stories.tsx`);
  let same = false;
  try {
    same = readFileSync(path, 'utf8') === out;
  } catch {
    same = false; // файла ещё нет — пишем
  }
  if (same) {
    skipped += 1;
    continue;
  }
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, out, 'utf8');
  renameSync(tmp, path);
  written += 1;
}

console.log(
  skipped
    ? `Истории собраны: обновлено ${written}, без изменений ${skipped}.`
    : `Истории собраны: ${written} ролей.`,
);
