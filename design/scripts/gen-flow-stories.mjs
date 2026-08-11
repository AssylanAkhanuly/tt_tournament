/* Генератор файлов историй раздела «Флоу»: `src/flows/data/roleNN.ts` →
   `src/flows/roleNN.stories.tsx`.

   Зачем генератор. Storybook строит дерево статическим разбором файла историй:
   заголовок раздела и имя каждой истории должны быть строковыми литералами
   (вызов функции в `export default` он не понимает, а имя, выставленное в
   рантайме, в боковое меню не попадает). Писать эти литералы руками —
   гарантированный дрейф с данными, поэтому файлы историй собираются отсюда.

   Запуск: `npm run gen:flows` — после правки любого `data/roleNN.ts`.
   Проверка: `npm run lint:flows`. */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FLOWS = join(ROOT, 'src', 'flows');
const DATA = join(FLOWS, 'data');

const ROLE_NUM = /\bnum:\s*'([^']+)'/;
const ROLE_TITLE = /\bnum:\s*'[^']+',\s*\n\s*title:\s*'([^']+)'/;
const SCREEN = /id:\s*'(Э\d+\.\d+)',\s*\n\s*title:\s*'([^']+)'/g;

/** Номер с ведущим нулём — иначе Storybook сортирует 1, 10, 11, …, 2.
    Пара ролей («3 и 4») → `03–04`. Повторяет `pad` из `src/flows/types.ts`. */
const pad = (num) => (num.match(/\d+/g) ?? ['0']).map((n) => n.padStart(2, '0')).join('–');

// Только файлы ролей: рядом лежит `all.ts` — общий список для обзорной страницы.
const files = readdirSync(DATA).filter((f) => /^role.*\.ts$/.test(f));
let written = 0;

for (const file of files) {
  const name = file.replace(/\.ts$/, ''); // roleNN
  const src = readFileSync(join(DATA, file), 'utf8');

  const num = src.match(ROLE_NUM)?.[1];
  const title = src.match(ROLE_TITLE)?.[1];
  if (!num || !title) {
    console.error(`${file}: не нашёл num/title роли — пропускаю`);
    process.exitCode = 1;
    continue;
  }

  const screens = [...src.matchAll(SCREEN)].map(([, id, t]) => ({ id, title: t }));
  if (screens.length === 0) {
    console.error(`${file}: не нашёл ни одного экрана — пропускаю`);
    process.exitCode = 1;
    continue;
  }

  const stories = screens
    .map(
      (s, i) =>
        `export const S${i + 1} = { name: '${s.id} · ${s.title}', render: screenRender(${name}, '${s.id}') };`,
    )
    .join('\n');

  const out = `/* Сгенерировано: npm run gen:flows (источник — data/${file}).
   Руками не правим — правим данные роли и запускаем генератор. */

import { ${name} } from './data/${file.replace(/\.ts$/, '')}';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/${pad(num)} · ${title}',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(${name}) };
${stories}
`;

  writeFileSync(join(FLOWS, `${name}.stories.tsx`), out, 'utf8');
  written += 1;
}

console.log(`Истории собраны: ${written} ролей.`);
