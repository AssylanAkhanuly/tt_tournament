/* Проверка ссылок в документах проекта.

   Документы ссылаются друг на друга тремя способами, и все три молча гниют:
   файл переименовали — ссылка ведёт в пустоту; вопрос убрали из QUESTIONS.md —
   а на него продолжают ссылаться; раздел ТЗ перенумеровали — ссылка «§4.3»
   указывает не туда. Читатель это замечает последним.

   Проверяем:
   1. Относительные ссылки `[текст](путь)` — файл существует.
   2. Ссылки на вопросы («QUESTIONS 12.6», «вопрос 6.3») — раздел и пункт есть
      в QUESTIONS.md.
   3. Ссылки на разделы ТЗ («§4.3», «TZ.md §7.2») — такой раздел есть в TZ.md.

   Запуск: `npm run lint:docs`. */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(ROOT, '..');

/** Что проверяем: корневые документы, флоу, схемы, данные флоу, README модулей. */
const FILES = [
  ...readdirSync(REPO).filter((f) => f.endsWith('.md')).map((f) => join(REPO, f)),
  ...readdirSync(join(REPO, 'flows')).filter((f) => f.endsWith('.md')).map((f) => join(REPO, 'flows', f)),
  ...readdirSync(join(REPO, 'diagrams')).filter((f) => f.endsWith('.md') || f.endsWith('.d2')).map((f) => join(REPO, 'diagrams', f)),
  ...readdirSync(join(ROOT, 'src', 'flows', 'data')).filter((f) => f.endsWith('.ts')).map((f) => join(ROOT, 'src', 'flows', 'data', f)),
  join(ROOT, 'README.md'),
  join(REPO, 'back', 'CLAUDE.md'),
].filter(existsSync);

const problems = [];
const rel = (f) => relative(REPO, f).replaceAll('\\', '/');
const read = (f) => readFileSync(f, 'utf8');

/* Что вообще существует: разделы и пункты вопросов, разделы ТЗ. */
const questions = read(join(REPO, 'QUESTIONS.md'));
const qSections = new Set([...questions.matchAll(/^##\s+(\d+)\./gm)].map((m) => m[1]));
const qItems = new Set([...questions.matchAll(/^\*\*(\d+\.\d+)\./gm)].map((m) => m[1]));

const tz = read(join(REPO, 'TZ.md'));
const tzSections = new Set([
  ...[...tz.matchAll(/^##\s+(\d+)\./gm)].map((m) => m[1]),
  ...[...tz.matchAll(/^###\s+(\d+\.\d+)\./gm)].map((m) => m[1]),
]);

/* Ссылка на «§N» может вести не в ТЗ, а в соседний документ («ROLES.md §6»),
   поэтому смотрим, что стоит перед ней. */
const OTHER_DOCS = /(ROLES|ENGINE|QUESTIONS|ARCHITECTURE|TESTING|USERFLOW|Положени)/i;

for (const file of FILES) {
  const txt = read(file);
  const isMd = file.endsWith('.md');

  if (isMd) {
    for (const m of txt.matchAll(/\[([^\]]+)\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      const target = m[2];
      if (/^(https?:|mailto:)/.test(target)) continue;
      const base = file.slice(0, file.lastIndexOf('\\') + 1 || file.lastIndexOf('/') + 1);
      if (!existsSync(join(base, target))) {
        problems.push(`${rel(file)}: ссылка [${m[1]}] → ${target} — файла нет`);
      }
    }
  }

  for (const m of txt.matchAll(/(?:QUESTIONS\**\s*\**§?\s*\**|вопрос[а-я]*\s+\**)(\d+)(?:\.(\d+))?/gi)) {
    const [sec, item] = [m[1], m[2]];
    if (item) {
      if (!qItems.has(`${sec}.${item}`)) problems.push(`${rel(file)}: вопроса ${sec}.${item} нет в QUESTIONS.md`);
    } else if (!qSections.has(sec)) {
      problems.push(`${rel(file)}: раздела ${sec} нет в QUESTIONS.md`);
    }
  }

  for (const m of txt.matchAll(/§\s?(\d+(?:\.\d+)?)/g)) {
    // Название документа может стоять и до ссылки («ROLES.md §6»), и после
    // неё («§2.4 Положения задаёт срок») — смотрим в обе стороны.
    const around = txt.slice(Math.max(0, m.index - 40), m.index + 40);
    if (OTHER_DOCS.test(around)) continue; // ссылка не в ТЗ
    // Внутри QUESTIONS.md «§9.4» — ссылка на собственный пункт, а не на ТЗ.
    if (file.endsWith('QUESTIONS.md') && qItems.has(m[1])) continue;
    if (!tzSections.has(m[1])) problems.push(`${rel(file)}: раздела §${m[1]} нет в TZ.md`);
  }
}

if (problems.length) {
  console.error('Ссылки в документах разъехались:\n' + problems.map((p) => `  • ${p}`).join('\n'));
  process.exit(1);
}

console.log(
  `Ссылки в порядке: ${FILES.length} файлов, вопросов ${qItems.size} в ${qSections.size} разделах, разделов ТЗ ${tzSections.size}.`,
);
