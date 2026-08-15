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
const MOCKUPS_DIR = join(ROOT, 'src', 'mockups');

/** Заголовок экрана в markdown: `## Э6.2 · Заявки участников`. */
const MD_SCREEN = /^##\s+(Э\d+\.\d+)\s+·\s+(.+?)\s*$/gm;
/** Экран в данных: `id: 'Э6.2'` + следующий за ним `title: '…'`. */
const TS_SCREEN = /id:\s*'(Э\d+\.\d+)',\s*\n\s*title:\s*'([^']+)'/g;
const TS_TO = /\bto:\s*'(Э\d+\.\d+)'/g;
/** Колонка борда макетов: `<Screen code="Э6.2" …>`. */
const MOCK_CODE = /code="(Э\d+\.\d+)"/g;
const TS_SOURCE = /\bsource:\s*'([^']+)'/;

const problems = [];
const all = (re, text) => [...text.matchAll(re)];
/** Хвост пометки в заголовке markdown («… ⚠ 12.6») в данных не повторяется. */
const clean = (s) => s.replace(/\s*[—–-]?\s*(только просмотр\s*)?[✳⚠].*$/u, '').trim();

/* Сквозные экраны Э0.x (вход, свой профиль, уведомления, публичная часть)
   описаны один раз в `data/role00.ts` и разрешены и в переходах, и в макетах
   любой роли: борд роли начинается со входа, иначе маршрут обрывается на
   середине. Дублировать их в четырнадцати файлах не нужно. */
const COMMON = new Set(
  all(TS_SCREEN, readFileSync(join(DATA_DIR, 'role00.ts'), 'utf8')).map((m) => m[1]),
);
if (COMMON.size === 0) problems.push('data/role00.ts: сквозные экраны Э0.x не найдены');

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
    if (!tsScreens.has(to) && !COMMON.has(to)) {
      problems.push(`${file}: переход to: '${to}' — такого экрана у роли нет`);
    }
  }

  // Файл историй роли: показывает её схему, и схема должна быть отрисована.
  const storiesFile = file.replace(/\.ts$/, '.stories.tsx');
  const storiesPath = join(FLOWS_DIR, storiesFile);
  if (!existsSync(storiesPath)) {
    problems.push(`${storiesFile}: нет файла историй — запустите npm run gen:flows`);
    continue;
  }
  const stories = readFileSync(storiesPath, 'utf8');
  const scheme = stories.match(/diagrams\/out\/(flow-role-[\d-]+)\.png/)?.[1];
  if (!scheme) {
    problems.push(`${storiesFile}: история не подключает схему — запустите npm run gen:flows`);
    continue;
  }
  if (!existsSync(join(REPO, 'diagrams', `${scheme}.d2`))) {
    problems.push(`${scheme}.d2: схема роли не сгенерирована — запустите npm run gen:diagrams`);
  }
  if (!existsSync(join(REPO, 'diagrams', 'out', `${scheme}.png`))) {
    problems.push(
      `${scheme}.png: схема не отрисована — powershell -File diagrams/build.ps1`,
    );
  }
  // Число экранов в подписи истории — из данных, чтобы не разъезжалось.
  if (!new RegExp(`name: 'Схема · ${tsScreens.size} экран`).test(stories)) {
    problems.push(
      `${storiesFile}: в подписи истории не ${tsScreens.size} экранов — запустите npm run gen:flows`,
    );
  }

  /* Парный вид: узлы маршрута и макеты в одной истории. Проверяем именно
     проводку — историю, данные роли в неё и борд макетов, — иначе после
     переименования борда раздел молча остался бы без макетов. */
  const roleName = file.replace(/\.ts$/, '');
  const boardName = `Role${roleName.slice('role'.length)}Board`;
  if (!new RegExp(`name: 'Узлы и макеты · ${tsScreens.size} экран`).test(stories)) {
    problems.push(
      `${storiesFile}: нет парной истории «Узлы и макеты» на ${tsScreens.size} экранов — запустите npm run gen:flows`,
    );
  }
  if (!stories.includes(`<Paired flow={${roleName}}>`)) {
    problems.push(`${storiesFile}: в парную историю не подан flow={${roleName}} — запустите npm run gen:flows`);
  }
  if (!stories.includes(`import { ${boardName} } from '../mockups/${roleName}'`)) {
    problems.push(`${storiesFile}: парная история не подключает борд ${boardName} — запустите npm run gen:flows`);
  }

  // Макеты роли: на каждый экран флоу — своя колонка борда с тем же кодом.
  const mockFile = file.replace(/\.ts$/, '.tsx');
  const mockPath = join(MOCKUPS_DIR, mockFile);
  if (!existsSync(mockPath)) {
    problems.push(`${mockFile}: нет макетов роли (src/mockups)`);
    continue;
  }
  const mock = readFileSync(mockPath, 'utf8');
  // Борд роли — то, что парная история импортирует по имени.
  if (!new RegExp(`export function ${boardName}\\b`).test(mock)) {
    problems.push(`${mockFile}: нет борда ${boardName} — его импортирует парная история раздела «Флоу»`);
  }
  const mockCodes = new Set(all(MOCK_CODE, mock).map((m) => m[1]));
  for (const [id, title] of tsScreens) {
    if (!mockCodes.has(id)) {
      problems.push(`${mockFile}: нет макета экрана ${id} «${title}»`);
    }
  }
  for (const id of mockCodes) {
    // Сквозной экран в борде роли — это норма: маршрут начинается со входа.
    if (!tsScreens.has(id) && !COMMON.has(id)) {
      problems.push(`${mockFile}: макет ${id} — такого экрана нет ни у роли, ни среди сквозных`);
    }
  }
}

if (problems.length) {
  console.error('Флоу разъехались:\n' + problems.map((p) => `  • ${p}`).join('\n'));
  process.exit(1);
}

console.log(
  `Флоу в порядке: ${dataFiles.length} ролей, ${screens} экранов, коды и названия совпадают с flows/*.md.`,
);
