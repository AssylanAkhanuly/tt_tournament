/* Генератор схем по ролям: `src/flows/data/roleNN.ts` → `diagrams/flow-role-NN.d2`.

   Схема на роль: экраны — контейнеры, внутри зоны экрана, действия и состояния;
   между экранами — переходы маршрута. Содержание берётся из тех же данных, что
   и корневой `flows/*.md`, поэтому схема не разъезжается с текстом.

   Дальше рисует штатный пайплайн: `powershell -File diagrams/build.ps1`
   (dagre для `flow-*`, SVG + PNG в `diagrams/out/`).

   Запуск: `npm run gen:diagrams`. */

import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import esbuild from 'esbuild';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(ROOT, '..');
const DIAGRAMS = join(REPO, 'diagrams');
const TMP = join(ROOT, 'node_modules', '.cache', 'flows');

/* Данные лежат в TypeScript — собираем их в CommonJS и подключаем как обычный
   модуль: так генератор читает настоящие объекты, а не разбирает исходник
   регулярками. */
mkdirSync(TMP, { recursive: true });
const bundle = join(TMP, 'flows-data.cjs');
esbuild.buildSync({
  entryPoints: [join(ROOT, 'src', 'flows', 'data', 'all.ts')],
  outfile: bundle,
  bundle: true,
  format: 'cjs',
  platform: 'node',
  logLevel: 'silent',
});
const { ROLES } = createRequire(import.meta.url)(bundle);

/** Номер роли в имени файла: `1` → `01`, `3 и 4` → `03-04`. */
const slug = (num) => (num.match(/\d+/g) ?? ['0']).map((n) => n.padStart(2, '0')).join('-');

/** Пометки в подписи узла: в схеме их видно так же, как в тексте. */
const markSign = (mark) => (mark === 'ours' ? ' ✳' : mark === 'open' ? ' ⚠' : '');

/* Кавычки внутри подписи ломают разбор D2, а слишком длинная строка растягивает
   схему на тысячи пикселей — переносим по словам. */
const clean = (s) => String(s).replace(/"/g, '«').replace(/\\/g, '/');

function wrap(text, width = 46) {
  const words = clean(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > width) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines.join('\\n');
}

const label = (parts) => parts.filter(Boolean).join('\\n');

let written = 0;

for (const role of ROLES) {
  const id = slug(role.num);
  const lines = [];

  lines.push('...@_theme', '');
  lines.push('direction: down', '');
  lines.push(`# Роль ${role.num} · ${role.title} — поэкранный флоу.`);
  lines.push('# СГЕНЕРИРОВАНО: npm run gen:diagrams (design/scripts/gen-flow-diagrams.mjs).');
  lines.push(`# Содержание — ${role.source}; руками этот файл не правим.`);
  lines.push('#');
  lines.push('# Как читать: контейнер — экран (код Э№.№ в заголовке), внутри');
  lines.push('#   синее   — зона экрана: из чего он состоит');
  lines.push('#   жёлтое  — действие: что нажимает и когда');
  lines.push('#   серое   — состояние экрана или открытый вопрос');
  lines.push('#   красное — блокировка, отказ, «нельзя»');
  lines.push('');

  // Шапка роли: должность по документу федерации, устройство, маршрут.
  lines.push(
    `head: "${label([
      `${role.num} · ${role.title.toUpperCase()}`,
      wrap(role.duty, 60),
      wrap(`Устройство: ${role.device}${role.scope ? ` · область: ${role.scope}` : ''}`, 60),
    ])}" { class: rbac }`,
  );
  if (role.hypothesis) {
    lines.push(
      `hyp: "${label(['РОЛЬ В ДОКУМЕНТЕ ФЕДЕРАЦИИ НЕ ЗАПОЛНЕНА', wrap(role.hypothesis, 60)])}" { class: muted }`,
    );
    lines.push('head -> hyp { class: loop }');
  }
  lines.push('');

  const screenKey = (i) => `s${i + 1}`;
  const byId = new Map(role.screens.map((s, i) => [s.id, screenKey(i)]));

  role.screens.forEach((screen, i) => {
    const key = screenKey(i);
    lines.push(`${key}: "${label([`${screen.id} · ${screen.title}${markSign(screen.mark)}`, screen.note ? wrap(screen.note, 56) : ''])}" {`);
    // Сетка внутри экрана: зоны и действия не связаны стрелками, и без неё
    // dagre выкладывает их одной длинной строкой. Две колонки, а не три:
    // схему смотрят как картинку, и лучше высокая и читаемая, чем широкая —
    // PNG шире ~2400 px пайплайн ужимает, и текст плывёт.
    lines.push('  grid-columns: 2');
    lines.push('  style.fill: "#f8faff"');
    lines.push('  style.stroke: "#93c5fd"');
    lines.push('');
    lines.push(`  entry: "${label(['КАК СЮДА ПОПАДАЕТ', ...screen.entry.map((e) => `• ${wrap(e, 44)}`)])}" { class: start }`);

    screen.zones.forEach((z, zi) => {
      lines.push(
        `  z${zi + 1}: "${label([
          `${clean(z.title)}${markSign(z.mark)}`,
          ...z.items.map((it) => `• ${wrap(it, 44)}`),
          z.note ? wrap(z.note, 44) : '',
        ])}" { class: step }`,
      );
    });

    screen.actions.forEach((a, ai) => {
      lines.push(
        `  a${ai + 1}: "${label([
          `${clean(a.el)}${markSign(a.mark)}`,
          a.when ? wrap(`когда: ${a.when}`, 44) : '',
          wrap(`→ ${a.effect}`, 44),
        ])}" { class: rbac }`,
      );
    });

    screen.states.forEach((st, si) => {
      const cls = st.tone === 'danger' ? 'block' : st.tone === 'success' ? 'good' : 'muted';
      lines.push(
        `  st${si + 1}: "${label([clean(st.title), st.text ? wrap(st.text, 44) : ''])}" { class: ${cls} }`,
      );
    });

    lines.push('}');
    lines.push('');
  });

  // Маршрут: последовательность экранов + переходы, заданные действиями.
  lines.push('head -> s1');
  role.screens.forEach((_, i) => {
    if (i > 0) lines.push(`${screenKey(i - 1)} -> ${screenKey(i)}`);
  });
  const seen = new Set();
  role.screens.forEach((screen, i) => {
    // С первого экрана (это пульт роли) ведут ссылки во все разделы сразу —
    // на схеме такой веер превращает маршрут в лесенку и ничего не объясняет:
    // «из пульта можно в любой экран» и так видно. Рисуем только переходы,
    // двигающие работу дальше.
    if (i === 0) return;
    for (const a of screen.actions) {
      if (!a.to) continue;
      const target = byId.get(a.to);
      const from = screenKey(i);
      if (!target || target === from) continue;
      const isNext = target === screenKey(i + 1);
      const edge = `${from} -> ${target}`;
      if (isNext || seen.has(edge)) continue;
      seen.add(edge);
      lines.push(`${edge}: "${wrap(clean(a.el), 30)}" { class: loop }`);
    }
  });
  lines.push('');

  // Границы роли и открытые вопросы — то же, что в конце файла роли.
  if (role.cannot?.length) {
    lines.push(
      `no: "${label(['ЧЕГО РОЛЬ НЕ МОЖЕТ', ...role.cannot.map((c) => `• ${wrap(c, 52)}`)])}" { class: block }`,
    );
    lines.push(`${screenKey(role.screens.length - 1)} -> no { class: loop }`);
  }
  if (role.questions?.length) {
    lines.push(
      `q: "${label(['ОТКРЫТЫЕ ВОПРОСЫ К ФЕДЕРАЦИИ', ...role.questions.map((x) => `• ${wrap(x, 52)}`)])}" { class: muted }`,
    );
    lines.push(`${screenKey(role.screens.length - 1)} -> q { class: loop }`);
  }

  writeFileSync(join(DIAGRAMS, `flow-role-${id}.d2`), lines.join('\n') + '\n', 'utf8');
  written += 1;
}

// Схемы ролей, которых больше нет в данных, из diagrams/ убираем.
const keep = new Set(ROLES.map((r) => `flow-role-${slug(r.num)}.d2`));
for (const f of readdirSync(DIAGRAMS)) {
  if (/^flow-role-.*\.d2$/.test(f) && !keep.has(f)) unlinkSync(join(DIAGRAMS, f));
}

console.log(`Схемы ролей собраны: ${written} файлов в diagrams/flow-role-*.d2`);
