/* Проверка синхронности поэкранных флоу: корневые `flows/*.md` ↔ данные
   Storybook `src/flows/data/*.ts`.

   Коды экранов Э№.№ — общий язык трёх источников (markdown, диаграмма
   `flow-roles.d2`, Storybook). Разъезжаются они молча: экран добавили в
   markdown, а в раздел дизайна он не попал — и по нему просто не нарисуют
   макет. Проверяем:

   1. У каждого файла данных есть `source`, и такой файл существует.
   2. Набор кодов экранов в данных совпадает с заголовками markdown.
   3. Названия экранов совпадают (по коду).
   4. Каждый переход `to:` ведёт на код, описанный у той же роли.
   5. Файл историй роли собран по данным: есть история на каждый экран, имена
      совпадают (файлы генерируются `npm run gen:flows`, но их могли поправить
      руками).

   Запуск: `npm run lint:flows`. */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(ROOT, '..');
const FLOWS_DIR = join(ROOT, 'src', 'flows');
const DATA_DIR = join(FLOWS_DIR, 'data');

/** Заголовок экрана в markdown: `## Э6.2 · Заявки участников`. */
const MD_SCREEN = /^##\s+(Э\d+\.\d+)\s+·\s+(.+?)\s*$/gm;
/** Экран в данных: `id: 'Э6.2'` + следующий за ним `title: '…'`. */
const TS_SCREEN = /id:\s*'(Э\d+\.\d+)',\s*\n\s*title:\s*'([^']+)'/g;
const TS_TO = /\bto:\s*'(Э\d+\.\d+)'/g;
const TS_SOURCE = /\bsource:\s*'([^']+)'/;

const problems = [];
const all = (re, text) => [...text.matchAll(re)];
/** Хвост пометки в заголовке markdown («… ⚠ 12.6») в данных не повторяется. */
const clean = (s) => s.replace(/\s*[—–-]?\s*(только просмотр\s*)?[✳⚠].*$/u, '').trim();

// Только файлы ролей: рядом лежит `all.ts` — общий список для обзорной страницы.
const dataFiles = readdirSync(DATA_DIR).filter((f) => /^role.*\.ts$/.test(f));
if (dataFiles.length === 0) problems.push('Нет ни одного файла данных в src/flows/data');

let screens = 0;

for (const file of dataFiles) {
  const ts = readFileSync(join(DATA_DIR, file), 'utf8');

  const source = ts.match(TS_SOURCE)?.[1];
  if (!source) {
    problems.push(`${file}: не указан source — из какого flows/*.md перенесён`);
    continue;
  }
  const mdPath = join(REPO, source);
  if (!existsSync(mdPath)) {
    problems.push(`${file}: source «${source}» не существует`);
    continue;
  }

  const md = readFileSync(mdPath, 'utf8');
  const mdScreens = new Map(all(MD_SCREEN, md).map((m) => [m[1], clean(m[2])]));
  const tsScreens = new Map(all(TS_SCREEN, ts).map((m) => [m[1], m[2]]));
  screens += tsScreens.size;

  for (const [id, title] of mdScreens) {
    if (!tsScreens.has(id)) {
      problems.push(`${file}: экран ${id} «${title}» есть в ${source}, но не перенесён в Storybook`);
    }
  }
  for (const [id, title] of tsScreens) {
    if (!mdScreens.has(id)) {
      problems.push(`${file}: экран ${id} «${title}» есть в Storybook, но не описан в ${source}`);
    } else if (clean(mdScreens.get(id)) !== clean(title)) {
      problems.push(
        `${file}: у ${id} разные названия — в ${source} «${mdScreens.get(id)}», в данных «${title}»`,
      );
    }
  }

  for (const [, to] of all(TS_TO, ts)) {
    if (!tsScreens.has(to)) problems.push(`${file}: переход to: '${to}' — такого экрана у роли нет`);
  }

  // Файл историй: по истории на экран, имена совпадают с данными.
  const storiesFile = file.replace(/\.ts$/, '.stories.tsx');
  const storiesPath = join(FLOWS_DIR, storiesFile);
  if (!existsSync(storiesPath)) {
    problems.push(`${storiesFile}: нет файла историй — запустите npm run gen:flows`);
    continue;
  }
  const stories = readFileSync(storiesPath, 'utf8');
  for (const [id, title] of tsScreens) {
    if (!stories.includes(`name: '${id} · ${title}'`)) {
      problems.push(
        `${storiesFile}: нет истории «${id} · ${title}» — запустите npm run gen:flows`,
      );
    }
  }
  if (!stories.includes("name: 'Весь флоу'")) {
    problems.push(`${storiesFile}: нет истории «Весь флоу» — запустите npm run gen:flows`);
  }
}

if (problems.length) {
  console.error('Флоу разъехались:\n' + problems.map((p) => `  • ${p}`).join('\n'));
  process.exit(1);
}

console.log(
  `Флоу в порядке: ${dataFiles.length} ролей, ${screens} экранов, коды и названия совпадают с flows/*.md.`,
);
