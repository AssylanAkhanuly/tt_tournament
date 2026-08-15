/* Роль 10 · Инспектор / супервайзер — макеты по флоу.
   Экраны Э10.1–Э10.4 (см. `flows/10-inspektor.md` и схему роли).

   Роль турниром НЕ управляет — смотрит со стороны, поэтому на макетах нет ни
   одной кнопки, меняющей турнир: нет «Вызвать пару», «Ввести счёт», «Исправить
   счёт», «Назначить судью». Там, где у главного судьи стоит кнопка вызова, у
   инспектора — серая подпись «вызывает главный судья», а панели хода турнира и
   журнала помечены пилюлей «ТОЛЬКО ПРОСМОТР». Единственные кнопки на экранах —
   про собственные материалы инспектора: отметить эпизод, выгрузить, отправить
   заключение. */

import { Bookmark, Download, Eye, FileText, Paperclip, Send } from 'lucide-react';
import {
  A, ActionBar, Arrow, Board, Chips, Form, Hint, Panel, Row, Rows, RoleScreen, Screen,
} from './shell';
import type { ScreenMap } from './shell';
import { R10 } from './roles';
import { Login0_1 } from './role00';

/* ── данные экранов ──────────────────────────────────────────────── */

type Cls = 'live' | 'wait' | 'bad' | 'reg';

const TOURS: { nm: string; sub: string; val: string; st: string; cls: Cls }[] = [
  {
    nm: 'Чемпионат Казахстана 2026',
    sub: 'г. Астана · 12–16 марта · турнир идёт · главный судья Оспанов Т.',
    val: 'заключения нет',
    st: 'НА КОНТРОЛЕ',
    cls: 'reg',
  },
  {
    nm: 'Кубок Казахстана 2026',
    sub: 'г. Алматы · 18–22 февраля · завершён · главный судья Мукашев Б.',
    val: 'черновик от 24.02',
    st: 'ЧЕРНОВИК',
    cls: 'wait',
  },
  {
    nm: 'Первенство РК до 19 лет',
    sub: 'г. Караганда · 27–30 января · завершён · главный судья Ким Л.',
    val: 'отправлено 03.02',
    st: 'ОТПРАВЛЕНО',
    cls: 'live',
  },
  {
    nm: 'Спартакиада школьников РК',
    sub: 'г. Шымкент · 9–12 апреля · приём заявок · главный судья не назначен',
    val: 'заключения нет',
    st: 'НА КОНТРОЛЕ',
    cls: 'reg',
  },
  {
    nm: 'Кубок Президента ФНТ РК',
    sub: 'г. Павлодар · 15–17 декабря 2025 · завершён · главный судья Оспанов Т.',
    val: 'отправлено 22.12',
    st: 'ОТПРАВЛЕНО',
    cls: 'live',
  },
];

/* карта столов: 20 столов, у занятых — счёт по партиям */
const TABLES: (string | null)[] = [
  '2:1', '1:1', '0:2', '3:2', '1:0', '2:2', '0:1', '3:1', '1:2', '2:0',
  '0:0', '1:0', '2:1', null, null, null, null, null, null, null,
];

type Note = { at: string; nm: string; sub: string; st: string; cls: Cls };

/* то, что нужно контролю: правки счёта с авторами, задержки, неявки, техпобеды */
const NOTES: Note[] = [
  {
    at: '14:52',
    nm: 'Стол 4 · 1/8 · Смагулов А. — Токаев М.',
    sub: 'партия 3: было 11 : 7 → стало 7 : 11 · исправил Оспанов Т. (главный судья)',
    st: 'ПРАВКА СЧЁТА',
    cls: 'bad',
  },
  {
    at: '14:31',
    nm: 'Стол 7 · 1/8 · Жумабеков Р. — Байжанов А.',
    sub: 'задержка 26 минут — пара вызвана, стол не освободился',
    st: 'ЗАДЕРЖКА',
    cls: 'wait',
  },
  {
    at: '13:58',
    nm: 'Стол 2 · 1/16 · Гладун И. — Мұрат Е.',
    sub: 'неявка Гладуна И. · присуждена техническая победа',
    st: 'НЕЯВКА',
    cls: 'bad',
  },
  {
    at: '13:20',
    nm: 'Стол 9 · 1/16 · Ким Г. — Оспанов Д.',
    sub: 'итог матча: было 3 : 1 → стало 3 : 2 · исправил Оспанов Т. (главный судья)',
    st: 'ПРАВКА СЧЁТА',
    cls: 'bad',
  },
];

const QUEUE: { a: string; b: string; nm: string; r: string }[] = [
  { a: A(22), b: A(85), nm: 'Жумабеков Расул — Байжанов Арман', r: '1/8 финала · ждёт стол 26 мин' },
  { a: A(67), b: A(93), nm: 'Оспанов Дархан — Мұрат Ерасыл', r: '1/8 финала · ждёт стол 12 мин' },
  { a: A(44), b: A(56), nm: 'Ким Георгий — Гладун Игорь', r: '1/8 финала · по расписанию' },
  { a: A(32), b: A(51), nm: 'Смагулов Алан — Токаев Марат', r: '1/4 финала · по расписанию' },
];

/* полный журнал правок и спорных ситуаций по турниру */
const JOURNAL: Note[] = [
  ...NOTES,
  {
    at: '12:44',
    nm: 'Стол 4 · 1/16 · Ким Г. — Досжан М.',
    sub: 'судья стола заменён: Пак С. → Ким Л. · причина: смена судейской бригады',
    st: 'ЗАМЕНА СУДЬИ',
    cls: 'reg',
  },
  {
    at: '11:37',
    nm: 'Стол 11 · 1/16 · Тлеуова А. — Абаева Д.',
    sub: 'снятие Тлеуовой А. по травме · подтверждено врачом соревнований',
    st: 'СНЯТИЕ',
    cls: 'wait',
  },
  {
    at: '10:05',
    nm: 'Стол 6 · 1/32 · Досжан М. — Сериков Н.',
    sub: 'партия 2: было 9 : 11 → стало 11 : 9 · исправил Оспанов Т. · причина: обрыв связи планшета',
    st: 'ПРАВКА СЧЁТА',
    cls: 'bad',
  },
];

/* отмеченные инспектором эпизоды — материалы будущего заключения */
const EPISODES: { nm: string; sub: string }[] = [
  { nm: 'Стол 4, 14:52 — правка счёта после подтверждения', sub: 'отмечено 13.03, 15:04 · причина в журнале указана коротко' },
  { nm: 'Стол 7, 14:31 — задержка 26 минут', sub: 'отмечено 13.03, 14:58 · пара ждала свободного стола' },
  { nm: 'Стол 2, 13:58 — техническая победа без протокола неявки', sub: 'отмечено 13.03, 14:10 · проверить документ' },
  { nm: 'Стол 9, 13:20 — вторая правка итога матча за день', sub: 'отмечено 13.03, 13:35 · тот же автор правки' },
];

const FILES: { nm: string; sub: string }[] = [
  { nm: 'Протокол главной судейской коллегии.pdf', sub: '1,8 МБ · приложен 14.03.2026' },
  { nm: 'Снимок экрана спорного матча, стол 4.png', sub: '640 КБ · приложен 14.03.2026' },
  { nm: 'Наряд судей на 13 марта.pdf', sub: '320 КБ · приложен 14.03.2026' },
];

/* вместо кнопки действия — серая подпись: так видно, что это не инспектор */
const NOT_MINE = { fontSize: 10.5, fontWeight: 700, color: 'var(--c-dim)', whiteSpace: 'nowrap' as const };

/** Пилюля «только просмотр» в шапке панели — главный признак роли. */
const ReadOnly = () => (
  <span className="pill done" style={{ margin: 0 }}>
    <Eye size={11} /> ТОЛЬКО ПРОСМОТР
  </span>
);

/** Строка журнала: время, стол и матч, было → стало, кто исправил, причина. */
function NoteRow({ n, w }: { n: Note; w: number }) {
  return (
    <div className="drow" style={{ cursor: 'default' }}>
      <div className="rank" style={{ width: w }}>{n.at}</div>
      <div className="who">
        <div className="nm">{n.nm}</div>
        <div className="rl">{n.sub}</div>
      </div>
      <span className={'pill ' + n.cls} style={{ margin: 0 }}>{n.st}</span>
    </div>
  );
}

/* ── Э10.1 · Соревнования на контроле ────────────────────────────── */

export function Tours10_1() {
  return (
    <RoleScreen
      role={R10}
      nav="На контроле"
      title="Соревнования на контроле"
      sub="Сезон 2026 · назначения от председателя ГСК"
      hint="Инспектор смотрит со стороны: турниром не управляет и данные не правит (§2)."
    >
      <Chips
        items={[
          { v: '5', k: 'На контроле', tone: 'b' },
          { v: '1', k: 'Черновик заключения', tone: 'a' },
          { v: '3', k: 'Отправлено', tone: 'g' },
          { v: '9', k: 'Отмечено эпизодов' },
        ]}
      />
      <ActionBar count="5 соревнований · сезон 2026 · всё только просмотр">
        <button className="dpickbtn">
          <Download size={14} /> Выгрузить список
        </button>
      </ActionBar>
      <Rows>
        {TOURS.map((t) => (
          <Row
            key={t.nm}
            nm={t.nm}
            sub={t.sub}
            val={t.val}
            pill={{ t: t.st, cls: t.cls }}
            action="Заключение"
          />
        ))}
      </Rows>
      <Hint>
        Кнопка ведёт в собственное заключение инспектора — на турнир она не влияет. ⚠ Кто назначает
        инспектора на соревнование (вероятно председатель ГСК) и на каких категориях он работает — в
        документе федерации не сказано.
      </Hint>
    </RoleScreen>
  );
}

/* ── Э10.2 · Ход турнира глазами инспектора ──────────────────────── */

export function Live10_2() {
  return (
    <RoleScreen
      role={R10}
      nav="Ход турнира"
      title="Ход турнира — просмотр"
      sub="Чемпионат Казахстана 2026 · г. Астана · день 2, 13 марта"
      hint="Те же столы и счёт, что у главного судьи, но кнопок вызова пары и ввода счёта нет."
    >
      <ActionBar count="Столов 20 · идут 13 · очередь 4 · правок счёта за день 4 · неявок 2">
        <button className="dpickbtn">
          <Bookmark size={14} /> Отметить эпизод
        </button>
      </ActionBar>

      <div className="dtables">
        {TABLES.map((sc, i) => (
          <div key={i} className={'dtable ' + (sc ? 'busy' : 'free')} style={{ cursor: 'default' }}>
            <div className="tn">Стол {i + 1}<span className="st" /></div>
            {sc ? <div className="sc">{sc}</div> : <div className="pl">свободен</div>}
          </div>
        ))}
      </div>

      <div className="mkcols">
        <Panel title="Правки счёта, задержки и неявки" extra={<ReadOnly />}>
          <Rows>
            {NOTES.map((n) => (
              <NoteRow key={n.at + n.nm} n={n} w={42} />
            ))}
          </Rows>
        </Panel>

        <Panel title="Очередь пар" extra={<ReadOnly />}>
          {QUEUE.map((q) => (
            <div className="qitem" key={q.nm} style={{ cursor: 'default' }}>
              <span className="qav"><img src={q.a} alt="" /><img src={q.b} alt="" /></span>
              <div className="q">
                <div className="n">{q.nm}</div>
                <div className="r">{q.r}</div>
              </div>
              <span style={NOT_MINE}>вызывает главный судья</span>
            </div>
          ))}
          <Hint>Кнопки «Вызвать» здесь нет — вызов пары остаётся действием главного судьи (Э6.6).</Hint>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э10.3 · Журнал правок и спорных ситуаций ────────────────────── */

export function Journal10_3() {
  return (
    <RoleScreen
      role={R10}
      nav="Журнал правок"
      title="Журнал правок и спорных ситуаций"
      sub="Чемпионат Казахстана 2026 · день 2, 13 марта · было → стало, кто исправил, причина"
      hint="Записи журнала не редактируются и не удаляются — их можно только читать и выгружать."
    >
      <ActionBar count="7 записей за день · фильтры: все столы, все судьи, все типы событий">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="dseg2">
            <span className="on">Все события</span>
            <span>Правки счёта</span>
            <span>Неявки</span>
            <span>Задержки</span>
          </div>
          <button className="dpickbtn">
            <Bookmark size={14} /> Отметить эпизод
          </button>
          <button className="dpickbtn">
            <Download size={14} /> Выгрузить
          </button>
        </div>
      </ActionBar>

      <Rows>
        {JOURNAL.map((n) => (
          <NoteRow key={n.at + n.nm} n={n} w={46} />
        ))}
      </Rows>
    </RoleScreen>
  );
}

/* ── Э10.4 · Заключение ──────────────────────────────────────────── */

export function Report10_4() {
  return (
    <RoleScreen
      role={R10}
      nav="Заключения"
      title="Заключение по соревнованию"
      sub="Чемпионат Казахстана 2026 · черновик от 14.03.2026"
      hint="Черновик виден только инспектору. ⚠ 12.7 — кому уходит заключение, не определено."
    >
      <div className="mkcols">
        <Panel title="Заключение" extra={<span className="pill wait" style={{ margin: 0 }}>ЧЕРНОВИК</span>}>
          <div className="dseg2" style={{ marginBottom: 14 }}>
            <span className="on">По соревнованию</span>
            <span>По конкретному судье</span>
          </div>
          <Form>
            <div className="dfield">
              <div className="k">Соревнование</div>
              <div className="dval">Чемпионат Казахстана 2026</div>
            </div>
            <div className="dfield">
              <div className="k">Период проверки</div>
              <div className="dval">12–16 марта 2026</div>
            </div>
            <div className="dfield">
              <div className="k">Главный судья</div>
              <div className="dval">Оспанов Талгат</div>
            </div>
            <div className="dfield">
              <div className="k">Судей в наряде</div>
              <div className="dval">24 · столов 20</div>
            </div>
            <div className="dfield wide">
              <div className="k">Текст заключения — свободная форма</div>
              <div className="dval" style={{ fontWeight: 500, lineHeight: 1.55, color: 'var(--c-muted)' }}>
                Соревнование проведено по регламенту. Замечания: четыре правки счёта после
                подтверждения за один день, две из них — по одному столу; техническая победа на столе
                2 присуждена без приложенного протокола неявки. Предлагаю разбор с судьями столов 4 и
                9 до следующего старта.
              </div>
            </div>
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">⚠ Структура полей — оценки и критерии — в документе не описана</div>
            <button className="dsubmit">
              <Send size={15} /> Отправить заключение
            </button>
          </div>
        </Panel>

        <Panel title="Материалы" extra={<span className="pill reg" style={{ margin: 0 }}>4 ЭПИЗОДА · 3 ФАЙЛА</span>}>
          <div className="qsec">Отмеченные эпизоды из хода турнира</div>
          <Rows>
            {EPISODES.map((e) => (
              <div className="drow" key={e.nm} style={{ cursor: 'default' }}>
                <Bookmark size={16} />
                <div className="who">
                  <div className="nm">{e.nm}</div>
                  <div className="rl">{e.sub}</div>
                </div>
              </div>
            ))}
          </Rows>
          <div className="qsec">Приложенные файлы</div>
          <Rows>
            {FILES.map((f) => (
              <div className="drow" key={f.nm} style={{ cursor: 'default' }}>
                <FileText size={16} />
                <div className="who">
                  <div className="nm">{f.nm}</div>
                  <div className="rl">{f.sub}</div>
                </div>
                <Paperclip size={15} />
              </div>
            ))}
          </Rows>
          <Hint>
            ⚠ 12.7: кому уходит заключение и что оно меняет — рейтинг судьи, допуск, результат
            соревнования — не определено. Пока флоу заканчивается отправкой: заключение фиксируется в
            системе и видно ролям 1, 3 и 4 по матрице прав.
          </Hint>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── борд роли ───────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э10.1': {
    cap: 'Соревнования на контроле',
    view: () => <Tours10_1 />,
    next: 'строка турнира',
  },
  'Э10.2': {
    cap: 'Ход турнира глазами инспектора',
    view: () => <Live10_2 />,
    next: 'вкладка «журнал правок»',
  },
  'Э10.3': {
    cap: 'Журнал правок и спорных ситуаций',
    view: () => <Journal10_3 />,
    next: 'эпизоды в заключение',
  },
  'Э10.4': {
    cap: 'Заключение',
    view: () => <Report10_4 />,
  },
};

export function Role10Board() {
  return <Board role={R10} screens={SCREENS} />;
}
