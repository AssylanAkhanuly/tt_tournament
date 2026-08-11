/* Генератор историй раздела «Флоу»: `src/flows/data/roleNN.ts` →
   `src/flows/roleNN.stories.tsx`.

   История роли — одна: её СХЕМА (PNG из `diagrams/out/`, собранный из
   `diagrams/flow-role-NN.d2`). Картинка подключается прямо из `diagrams/out`,
   без копии в `design/` — иначе те же несколько мегабайт лежали бы в
   репозитории дважды.

   Заголовок раздела и имя истории обязаны быть строковыми литералами:
   Storybook строит дерево статическим разбором файла. Писать их руками —
   гарантированный дрейф с данными, поэтому файлы собираются отсюда.

   Порядок: `npm run gen:diagrams` → `powershell -File diagrams/build.ps1` →
   `npm run gen:flows`. Проверка: `npm run lint:flows`. */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FLOWS = join(ROOT, 'src', 'flows');
const DATA = join(FLOWS, 'data');

const ROLE_NUM = /\bnum:\s*'([^']+)'/;
const ROLE_TITLE = /\bnum:\s*'[^']+',\s*\n\s*title:\s*'([^']+)'/;
const ROLE_SOURCE = /\bsource:\s*'([^']+)'/;
const SCREEN = /id:\s*'(Э\d+\.\d+)'/g;

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
const files = readdirSync(DATA).filter((f) => /^role.*\.ts$/.test(f));
let written = 0;

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

  const screens = [...src.matchAll(SCREEN)].length;
  // Имя файла схемы: `flow-role-01`, у пары ролей — `flow-role-03-04`.
  const scheme = `flow-role-${pad(num, '-')}`;

  const out = `/* Сгенерировано: npm run gen:flows (источник — data/${file}).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/${scheme}.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/${pad(num)} · ${title}',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · ${plural(screens, 'экран', 'экрана', 'экранов')}',
  render: () => <Scheme src={scheme} alt="Флоу роли ${num} · ${title}" source="${source}" />,
};
`;

  writeFileSync(join(FLOWS, `${name}.stories.tsx`), out, 'utf8');
  written += 1;
}

console.log(`Истории собраны: ${written} ролей.`);
