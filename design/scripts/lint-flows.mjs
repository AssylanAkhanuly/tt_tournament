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
   5. Макеты роли собраны картой «код → экран» (`SCREENS`), и она покрывает все
      экраны роли.
   5а. Каждая вкладка экрана (`tabs:`) описана в `flows/*.md`: экран с вкладками
      — это несколько экранов под одной шапкой, и вкладка, которой нет в
      сценарии, появляется в макете ниоткуда.
   6. Истории роли собраны по данным: борд и карта маршрута на месте, число
      экранов в подписях совпадает (файлы генерируются `npm run gen:flows`, но
      их могли поправить руками).
   7. Активный пункт сайдбара (`nav="…"` в макете) есть в меню роли
      (`mockups/roles.tsx`). Пункт переименовали или убрали, а экран остался на
      старом — и в сайдбаре не подсвечивается ничего: экран выглядит так, будто
      пришёл ниоткуда. Так было с «Реестрами» после переезда их во вкладки
      «Пользователей». Исключение — «Профиль» и «Уведомления»: в них попадают из
      шапки, пункта меню у них нет вовсе.
   8. Обратная сторона того же: «как попадает» не ссылается на пункт меню,
      которого в меню роли нет. Три пункта администратора клуба свели в один
      раздел «Соревнования», а во флоу так и осталось «пункт меню „Лига“» —
      сайдбар макета и сценарий рассказывали разное. Ловим и в `flows/*.md`, и в
      данных: любое «меню «X»» обязано называть настоящий пункт.

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
/** Вкладка экрана в данных: `{ t: 'Участники', what: '…' }`. */
const TS_TAB = /\bt:\s*'([^']+)',\s*\n?\s*what:/g;
/** Экран в карте экранов роли: `'Э6.2': {`. */
const MOCK_CODE = /'(Э\d+\.\d+)':\s*\{/g;
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

  /* Вкладки: каждая должна быть названа во флоу-документе роли. Подпись в
     макете бывает со счётчиком («Приняты · 104») — сверяем по слову до «·». */
  for (const [, tab] of all(TS_TAB, ts)) {
    const name = tab.split('·')[0].trim();
    if (!md.includes(name)) {
      problems.push(`${file}: вкладка «${name}» не описана в ${source}`);
    }
  }

  /* Макеты роли: карта «код экрана → макет». Из неё собираются и борд, и карта
     флоу, поэтому разъехаться этим двум видам нечем — но сама карта обязана
     покрывать все экраны роли. */
  const roleName = file.replace(/\.ts$/, '');
  const boardName = `Role${roleName.slice('role'.length)}Board`;
  const mockFile = file.replace(/\.ts$/, '.tsx');
  const mockPath = join(MOCKUPS_DIR, mockFile);
  if (!existsSync(mockPath)) {
    problems.push(`${mockFile}: нет макетов роли (src/mockups)`);
    continue;
  }
  const mock = readFileSync(mockPath, 'utf8');
  if (!/export const SCREENS: ScreenMap/.test(mock)) {
    problems.push(`${mockFile}: нет карты экранов SCREENS — из неё собираются борд и карта флоу`);
  }
  if (!new RegExp(`export function ${boardName}\\b`).test(mock)) {
    problems.push(`${mockFile}: нет борда ${boardName} — его импортирует история «Узлы и макеты»`);
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

  /* Истории роли: борд с требованиями и карта маршрута. Проверяем проводку —
     данные роли, борд и карту экранов, — иначе после переименования раздел
     молча остался бы пустым. Число в подписи — по карте экранов: столько
     колонок человек и видит (в них есть ещё и сквозной вход). */
  const storiesFile = file.replace(/\.ts$/, '.stories.tsx');
  const storiesPath = join(FLOWS_DIR, storiesFile);
  if (!existsSync(storiesPath)) {
    problems.push(`${storiesFile}: нет файла историй — запустите npm run gen:flows`);
    continue;
  }
  const stories = readFileSync(storiesPath, 'utf8');
  const shown = mockCodes.size;
  for (const [story, label] of [['Узлы и макеты', 'борда'], ['Карта', 'карты']]) {
    if (!new RegExp(`name: '${story} · ${shown} экран`).test(stories)) {
      problems.push(
        `${storiesFile}: в подписи ${label} не ${shown} экранов — запустите npm run gen:flows`,
      );
    }
  }
  if (!stories.includes(`<Paired flow={${roleName}}>`)) {
    problems.push(`${storiesFile}: в парную историю не подан flow={${roleName}} — запустите npm run gen:flows`);
  }
  if (!stories.includes(`<FlowMap flow={${roleName}} screens={SCREENS} />`)) {
    problems.push(`${storiesFile}: карта не подключена — запустите npm run gen:flows`);
  }
  if (!stories.includes(`import { ${boardName}, SCREENS } from '../mockups/${roleName}'`)) {
    problems.push(`${storiesFile}: истории не подключают ${boardName} и SCREENS — запустите npm run gen:flows`);
  }

  /* Раздел «Макеты» пишется руками, и число экранов в его подписи разъезжалось
     молча: добавили экран в карту, а подпись осталась старой. */
  const mockStories = join(MOCKUPS_DIR, file.replace(/\.ts$/, '.stories.tsx'));
  if (existsSync(mockStories)) {
    const text = readFileSync(mockStories, 'utf8');
    if (!new RegExp(`name: 'Макеты по флоу · ${shown} экран`).test(text)) {
      problems.push(
        `${roleName}.stories.tsx (макеты): в подписи не ${shown} экранов — столько в карте SCREENS`,
      );
    }
  }
}


/* 7. Пункт сайдбара экрана существует в меню роли.

   `nav="…"` в макете — это подсветка пункта в сайдбаре. Пункт переименовали, а
   экран остался на старом названии — и не подсвечивается ничего. Ловим статикой:
   разбираем меню ролей из `roles.tsx` и сверяем с каждым `nav="…"` макета. */
const ROLES_FILE = join(MOCKUPS_DIR, 'roles.tsx');
/** Экраны, у которых пункта меню нет намеренно: вход в них — из шапки. */
const HEAD_ENTRIES = new Set(['Профиль', 'Уведомления']);

if (!existsSync(ROLES_FILE)) {
  problems.push('mockups/roles.tsx не найден — меню ролей проверить нечем');
} else {
  const rolesSrc = readFileSync(ROLES_FILE, 'utf8');
  /** `export const R13: RoleUI = { … nav: [ … ], };` → пункты меню роли. */
  const menus = new Map();
  for (const m of rolesSrc.matchAll(/export const (R\w+): RoleUI = \{([\s\S]*?)\n\};/g)) {
    const nav = m[2].match(/nav:\s*\[([\s\S]*?)\n\s*\],/);
    if (!nav) continue;
    menus.set(m[1], new Set([...nav[1].matchAll(/,\s*'([^']+)'\]/g)].map((x) => x[1])));
  }

  for (const file of readdirSync(MOCKUPS_DIR).filter((f) => /^role.*\.tsx$/.test(f) && !f.includes('.stories.'))) {
    const src = readFileSync(join(MOCKUPS_DIR, file), 'utf8');
    /* Роль файла — по импорту из `roles`: если их несколько, экраны роли
       перемешаны, и проверять нечего. */
    const imported = [...(src.match(/import \{([^}]*)\} from '\.\/roles';/)?.[1] ?? '').matchAll(/\bR\w+\b/g)].map((x) => x[0]);
    if (imported.length !== 1) continue;
    const menu = menus.get(imported[0]);
    if (!menu) continue;
    for (const nav of new Set([...src.matchAll(/\bnav="([^"]+)"/g)].map((x) => x[1]))) {
      if (menu.has(nav) || HEAD_ENTRIES.has(nav)) continue;
      problems.push(
        `${file}: nav="${nav}" — такого пункта нет в меню ${imported[0]} (${[...menu].join(' · ')})`,
      );
    }
  }

  /* 8. Ссылки на пункт меню в сценарии — только на существующие пункты.

     Роль файла данных определяем по его же макетам: в `roleNN.tsx` ровно один
     R-конст, и это меню роли. Ищем оборот «меню «Название»» — так пишется «как
     попадает» и в markdown, и в данных. */
  for (const file of dataFiles) {
    const mockPath = join(MOCKUPS_DIR, file.replace(/\.ts$/, '.tsx'));
    if (!existsSync(mockPath)) continue;
    const mockSrc = readFileSync(mockPath, 'utf8');
    const imported = [
      ...(mockSrc.match(/import \{([^}]*)\} from '\.\/roles';/)?.[1] ?? '').matchAll(/\bR\w+\b/g),
    ].map((x) => x[0]);
    if (imported.length !== 1) continue;
    const menu = menus.get(imported[0]);
    if (!menu) continue;

    const ts = readFileSync(join(DATA_DIR, file), 'utf8');
    const source = ts.match(TS_SOURCE)?.[1];
    const mdPath = source ? join(REPO, source) : null;
    const pairs = [[file, ts]];
    if (mdPath && existsSync(mdPath)) pairs.push([source, readFileSync(mdPath, 'utf8')]);

    for (const [where, text] of pairs) {
      /* Без `\b`: в JS граница слова считается по латинице, и перед кириллицей
         её нет вовсе — с `\bменю` проверка молча не находила ничего. */
      for (const item of new Set(all(/меню\s+«([^»]+)»/gi, text).map((m) => m[1]))) {
        if (menu.has(item) || HEAD_ENTRIES.has(item)) continue;
        problems.push(
          `${where}: сценарий ведёт «меню «${item}»», а в меню ${imported[0]} такого пункта нет (${[...menu].join(' · ')})`,
        );
      }
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
