#!/usr/bin/env node
/* design.mjs — половина ChatGPT в пайплайне макетов.
 *
 *   бриф + арт-дирекшн  ──►  OpenAI Images (gpt-image-1)  ──►  PNG-мокап
 *
 * PNG — это ВИЗУАЛЬНЫЙ ОРИЕНТИР (направление, композиция, палитра), а не
 * финал. Дальше Claude смотрит на картинку и собирает по ней настоящий
 * компонент Storybook (чёткий текст, реальные токены, рабочий код).
 *
 * Запуск:
 *   node gen/design.mjs <brief> [--n 3] [--size 1024x1536] [--quality high]
 *   <brief>  — имя файла в gen/briefs/<brief>.md  (или путь к .md)
 *
 * Ключ (в порядке приоритета):
 *   1. env OPENAI_API_KEY
 *   2. файл из env OPENAI_KEY_FILE
 * Ключ НИКОГДА не хранится в репозитории. Текущий ключ был засвечен в чате —
 * его надо перевыпустить и положить в env/файл вне репо.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out', 'mockups');
const MODEL = 'gpt-image-1';
const ENDPOINT = 'https://api.openai.com/v1/images/generations';

// ── аргументы ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (!argv.length || argv[0].startsWith('-')) {
  console.error('Использование: node gen/design.mjs <brief> [--n 3] [--size 1024x1536] [--quality high]');
  process.exit(1);
}
const briefArg = argv[0];
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const n = Math.min(10, Math.max(1, parseInt(opt('n', '3'), 10)));
const size = opt('size', '1024x1536');       // портрет под телефон
const quality = opt('quality', 'high');       // low | medium | high

// ── ключ ───────────────────────────────────────────────────────────────────
function getKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  const f = process.env.OPENAI_KEY_FILE;
  if (f && existsSync(f)) return readFileSync(f, 'utf8').trim();
  console.error(
    '\nНет ключа OpenAI. Задай ОДНО из:\n' +
    '  $env:OPENAI_API_KEY = "sk-..."            (переменная окружения)\n' +
    '  $env:OPENAI_KEY_FILE = "C:\\...\\.key"     (путь к файлу с ключом)\n' +
    'Ключ держать ВНЕ репозитория. Прежний ключ засвечен — перевыпусти его.\n');
  process.exit(2);
}

// ── промпт ─────────────────────────────────────────────────────────────────
function buildPrompt(brief) {
  const context = readFileSync(join(HERE, 'context.md'), 'utf8');
  return (
    context +
    '\n\n## ЭТОТ ЭКРАН\n' + brief.trim() +
    '\n\n## ФОРМАТ ВЫВОДА\n' +
    'Один чистый UI-скриншот экрана приложения (не фото телефона в руке). ' +
    'Реалистичный современный интерфейс iOS в описанной тёмной теме. ' +
    'Соблюдай палитру, скругления и композицию из арт-дирекшна выше.'
  );
}

function resolveBrief(arg) {
  const p = arg.endsWith('.md') ? resolve(arg) : join(HERE, 'briefs', arg + '.md');
  if (!existsSync(p)) { console.error('Бриф не найден: ' + p); process.exit(3); }
  return { name: arg.replace(/\.md$/, '').split(/[\\/]/).pop(), text: readFileSync(p, 'utf8') };
}

// ── генерация ──────────────────────────────────────────────────────────────
async function one(key, prompt, i) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ model: MODEL, prompt, size, quality, n: 1 }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) throw new Error('401 — ключ отклонён (перевыпусти засвеченный ключ). ' + body);
    throw new Error(res.status + ' — ' + body);
  }
  const data = await res.json();
  return { b64: data.data[0].b64_json, usage: data.usage, i };
}

async function main() {
  const key = getKey();
  const brief = resolveBrief(briefArg);
  const prompt = buildPrompt(brief.text);
  mkdirSync(OUT, { recursive: true });

  console.log(`Генерирую ${n} вариант(ов) «${brief.name}» · ${size} · ${quality} …`);
  const jobs = Array.from({ length: n }, (_, i) => one(key, prompt, i + 1));
  const results = await Promise.allSettled(jobs);

  const saved = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const file = join(OUT, `${brief.name}-v${r.value.i}.png`);
      writeFileSync(file, Buffer.from(r.value.b64, 'base64'));
      saved.push(file);
      console.log('  ✓ ' + file);
    } else {
      console.error('  ✗ ' + r.reason.message);
    }
  }
  if (!saved.length) process.exit(4);
  console.log(`\nГотово: ${saved.length}/${n}. Дальше — Claude смотрит PNG и собирает компонент Storybook.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
