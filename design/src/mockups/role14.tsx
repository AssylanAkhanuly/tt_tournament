/* Роль 14 · Спортсмен — макеты по флоу. Экраны Э14.1–Э14.7
   (см. `flows/14-sportsmen.md` и карту роли).

   Сейчас проектируем **веб**: у спортсмена те же семь экранов, что были
   нарисованы телефоном, но десктопом — как у остальных ролей. Мобильное
   приложение (TZ §10) остаётся на потом, его экраны лежат рядом в
   `role14app.tsx` и показываются историей «Приложение · позже».

   Роль — единственная, кто заявляется сам, и единственная, кто платит взнос
   картой. Счёт своего матча спортсмен не вводит: его ведёт судья стола. */

import { useState, type ReactNode } from 'react';
import {
  ArrowUpDown, BarChart3, Check, CreditCard, Download, Lock, Pencil, Receipt, Send, Trophy, X,
} from 'lucide-react';
import {
  A, ActionBar, Alert, Also, Arrow, Board, Chips, Empty, Field, Form, Ghost, Input, Modal, Off, P,
  Pager, Panel, Queue, RoleScreen, Row, Rows, Screen, Search, Shot, States, Tabs,
} from './shell';
import { Select } from '../ui';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { DeskFrame, type DeskVariant } from '../deskShell';
import { MY_GROUP, OTHER_GROUPS, myBracket, playoffBracket } from './myBracket';
import type { ScreenMap } from './shell';
import { R14 } from './roles';
import { Login0_1, SignUp0_5, SignUp0_5States } from './role00';

/* Спортсмен макета — Ким Георгий (тот же, что в реестрах ролей 2 и 12). */
const ME = A(44);

/* ── Э14.1 · Главная ───────────────────────────────────────────── */

export function Home14_1({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Главная" title="Ким Георгий" sub="Астана · СКА · КМС">
      <Chips
        items={[
          { v: '2456', k: 'Рейтинг', tone: 'b' },
          { v: '7', k: 'Место в РК' },
          { v: '+24', k: 'За турнир', tone: 'g' },
          { v: '128', k: 'Матчей сыграно' },
        ]}
      />
      <Queue items={[{ n: '1', t: 'заявка ждёт решения судьи', to: 'Э14.4' }]} />

      <div className="mkcols">
        <Panel title="Сейчас играю" extra={<P t="ВАС ВЫЗВАЛИ · СТОЛ 5" cls="live" />}>
          <Rows>
            <Row
              av={A(22)}
              nm="Жумабеков Расул"
              sub="1/8 финала · рейтинг 2312"
              val="14:20"
              pill={{ t: 'ПОДОЙДИТЕ К СТОЛУ', cls: 'live' }}
              to="Э14.5"
            />
          </Rows>
        </Panel>

        <Panel title="Ближайший турнир">
          <Rows>
            <Row
              nm="Кубок Алматы 2026"
              sub="ОРТ · Алматы · 12–14 сентября"
              pill={{ t: 'ЗАЯВКА ПОДАНА', cls: 'reg' }}
              to="Э14.4"
            />
            <Row nm="Чемпионат Республики Казахстан" sub="Главный старт · Астана · 18–22 сентября" pill={{ t: 'ЗАЯВЛЯЕТ РЕГИОН', cls: 'done' }} />
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Home14_1States = () => (
  <States>
    <Shot tone="info" title="Ближайшего турнира нет" text="Вместо карточки турнира — подводка к календарю.">
      <Empty title="Заявок нет" text="Ближайшие открытые ОРТ — в календаре." />
    </Shot>

    <Shot tone="info" title="Турнир идёт" text="Появляется блок «Сейчас играю»: соперник, стол, время.">
      <Rows>
        <Row av={A(22)} nm="Стол 5 · сейчас" sub="соперник Жумабеков Р. · 1/8 финала" pill={{ t: 'ИДЁТ', cls: 'live' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.2 · Календарь ─────────────────────────────────────────── */

/** В календаре только то, куда спортсмен заявляется сам: открытые
    республиканские. Старты, куда состав подаёт регион или клуб, сюда не
    попадают — строка с неактивной кнопкой человеку ничего не даёт. */
const OPEN = [
  { nm: 'Кубок Алматы 2026', mt: 'Алматы · 12–14 сентября', till: 'приём до 05.09', fee: true },
  { nm: 'ОРТ «Кубок Иртыша»', mt: 'Павлодар · 25 апреля', till: 'приём до 18.04', fee: true },
  { nm: 'ОРТ «Шымкент Open»', mt: 'Шымкент · 9 мая', till: 'приём до 02.05', fee: false },
];

/** Вкладка «Мои турниры»: где я уже заявлен — в том числе не собой. */
const MINE = [
  { nm: 'Чемпионат Республики Казахстан', mt: 'Астана · 18–22 сентября', by: 'заявил старший тренер региона' },
  { nm: 'Евразийская лига · 3-й тур', mt: 'Шымкент · 16–18 мая', by: 'заявил клуб · команда «СКА», мужская 2 лига' },
];

/** Вкладка «Куда могу заявиться»: только открытые республиканские — те, куда
    спортсмен подаёт заявку сам. */
const Open14_2 = () => (
  <>
    <div className="dcount">
      Главные старты и Лигу заявляют регион и клуб — они во вкладке «Мои турниры»
    </div>
    <Rows>
      {OPEN.map((t) => (
        <div className="drow" key={t.nm}>
          <div className="who">
            <div className="nm">{t.nm}</div>
            <div className="rl">ОРТ · {t.mt} · {t.till}</div>
          </div>
          {t.fee && <P t="НУЖЕН ГОДОВОЙ ВЗНОС" cls="reg" />}
          <button className="dpickbtn" data-to="Э14.3">Заявиться</button>
        </div>
      ))}
    </Rows>
  </>
);

/** Вкладка «Мои турниры»: где я уже заявлен, включая заявки региона и клуба. */
const Mine14_2 = () => (
  <>
    <div className="dcount">Заявлен, но заявку подавал не я</div>
    <Rows>
      {MINE.map((t) => (
        <Row key={t.nm} nm={t.nm} sub={`${t.mt} · ${t.by}`} pill={{ t: 'ЗАЯВЛЕН', cls: 'live' }} to="Э14.4" />
      ))}
      <Row
        nm="Кубок Алматы 2026"
        sub="Алматы · 12–14 сентября · заявился сам"
        pill={{ t: 'ЗАЯВКА ПРИНЯТА', cls: 'live' }}
        to="Э14.4"
      />
    </Rows>
  </>
);

export function Calendar14_2({ tab }: { tab?: string }) {
  return (
    <RoleScreen role={R14} nav="Календарь" title="Календарь" sub="Открытые республиканские · сезон 2026">
      <Tabs
        active={tab}
        items={[
          { t: 'Куда могу заявиться · 3', view: <Open14_2 /> },
          { t: 'Мои турниры · 3', view: <Mine14_2 /> },
        ]}
      />
    </RoleScreen>
  );
}

const Calendar14_2States = () => (
  <States>
    <Shot tone="info" title="Приём не открыт / закрыт" text="Кнопка заменена сроком.">
      <Rows>
        <Row nm="ОРТ «Шымкент Open»" sub="приём откроется 20.04" pill={{ t: 'ЖДЁМ', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="warning" title="Взнос не оплачен, а турнир его требует" text="Кнопка с предупреждением — ⚠ 6.1.">
      <Rows>
        <Row nm="Кубок Алматы 2026" sub="нужен годовой взнос федерации" pill={{ t: 'ВЗНОС НЕ ОПЛАЧЕН', cls: 'wait' }} />
      </Rows>
      <Alert>Заявку подать можно, но допуск может не пройти — решение федерации не получено.</Alert>
    </Shot>

    <Shot
      tone="info"
      title="Открытых приёмов нет ✳"
      text="Пустой список с подсказкой, когда откроется ближайший."
      wide
    >
      <Empty
        title="Сейчас заявиться некуда"
        text="Ближайший открытый приём — ОРТ «Шымкент Open», с 20 апреля. Турниры, куда вас заявляют регион или клуб, — во вкладке «Мои турниры»."
      />
    </Shot>
  </States>
);

/* ── Э14.3 · Заявка на ОРТ ─────────────────────────────────────── */

export function Apply14_3() {
  return (
    <RoleScreen role={R14} nav="Календарь" title="Заявка на турнир" sub="Кубок Алматы 2026 · ОРТ">
      <div className="mkcols">
        <Panel title="Заявка">
          <Form>
            <Input label="Разряд" value="Одиночный" />
            <Input label="Возрастная группа" value="Взрослые" />
            <Input label="Парный разряд ✳" value="партнёр не выбран" wide />
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Решение принимает главный судья турнира</div>
            <button className="dsubmit" style={{ padding: '11px 16px' }}>
              <Send size={15} /> Подать заявку
            </button>
          </div>
        </Panel>

        <Panel title="Условия допуска">
          <Rows>
            <Row nm="Годовой взнос федерации" sub="оплачен 14.01.2026" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
            <Row nm="Удостоверение личности" sub="приложено" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
            <Row nm="Медицинский допуск" sub="действует до 30.11.2026" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
            <Row nm="Ценз по рейтингу" sub="не требуется" pill={{ t: 'НЕ НУЖЕН', cls: 'done' }} />
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Apply14_3States = () => (
  <States>
    <Shot
      tone="warning"
      title="Пара — подтверждение вторым игроком"
      text="⚠ Не описано, как именно партнёр подтверждает пару; дальше не проектируем."
      wide
    >
      <Rows>
        <Row nm="Парный разряд · Пак С." sub="ждём подтверждения партнёра" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.4 · Моя заявка ────────────────────────────────────────── */

export function MyApp14_4() {
  return (
    <RoleScreen role={R14} nav="Моя заявка" title="Моя заявка" sub="Кубок Алматы 2026 · подана 02.09">
      <div className="mkcols">
        <Panel title="Состояние" extra={<P t="НА РАССМОТРЕНИИ" cls="wait" />}>
          <Form>
            <Field label="Турнир" value="Кубок Алматы 2026 · ОРТ" wide />
            <Field label="Разряд" value="Одиночный" />
            <Field label="Подана" value="02.09.2026, 19:40" />
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Пока приём открыт, заявку можно отозвать</div>
            <Ghost>Отозвать заявку</Ghost>
          </div>
        </Panel>

        <Panel title="Что дальше">
          <Rows>
            <Row nm="Решение судьи" sub="придёт уведомлением" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
            <Row nm="Жеребьёвка" sub="после закрытия приёма, 05.09" pill={{ t: 'ПОТОМ', cls: 'done' }} />
            <Row nm="Вызов на стол" sub="в день игры, уведомлением" pill={{ t: 'ПОТОМ', cls: 'done' }} />
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const MyApp14_4States = () => (
  <States>
    <Shot tone="danger" title="Заявка отклонена" text="Причина — текст судьи, видна сразу; пока приём открыт можно исправить и подать снова.">
      <Rows>
        <Row nm="ОРТ «Кубок Иртыша»" sub="«нет медицинского допуска»" pill={{ t: 'ОТКЛОНЕНА', cls: 'bad' }} />
      </Rows>
      <button className="dsubmit" style={{ padding: '11px 16px' }}>Исправить и подать снова</button>
    </Shot>

    <Shot tone="success" title="Заявка принята" text="Дальше — вызов на стол уведомлением, экран матча (Э14.5).">
      <Rows>
        <Row nm="Кубок Алматы 2026" sub="принята 03.09 · ждите жеребьёвку" pill={{ t: 'ПРИНЯТА', cls: 'live' }} to="Э14.5" />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.5 · Мой турнир и мой матч ─────────────────────────────── */

/* Экран турнира — три вкладки: свой матч, участники и сетка. Сетке нужен весь
   экран (её и на фронте так смотрят), поэтому это отдельная вкладка, а не
   панель в углу: рядом с ней ничего не помещается. */
const TABS14_5 = ['Мой матч', 'Участники', 'Сетка'];

/* Участники турнира: посев, рейтинг, регион и клуб. Список большой (128 на
   главном старте), поэтому это таблица с поиском, сортировкой и страницами по
   30 — глазами в такой список не ищут. Себя и своего соперника человек должен
   находить сразу, поэтому их строки помечены. */
type Ply14 = { s: number; nm: string; city: string; club: string; r: number; me?: boolean; foe?: boolean };

const SURNAMES = [
  'Смагулов', 'Ким', 'Токаев', 'Жумабеков', 'Пак', 'Гладун', 'Оспанов', 'Байжанов',
  'Абиш', 'Сериков', 'Цой', 'Ли', 'Мурат', 'Асан', 'Бекзат', 'Кайрат',
  'Нурлан', 'Тлеу', 'Садык', 'Жанибек', 'Алтай', 'Ерасыл', 'Мади', 'Арман',
];
const FIRSTS = ['Алан', 'Георгий', 'Марат', 'Расул', 'Сергей', 'Игорь', 'Тимур', 'Ерасыл', 'Данияр', 'Асхат'];
const CITIES: [string, string][] = [
  ['Астана', 'СКА'], ['Алматы', '«Алатау»'], ['Шымкент', '«Жетісу»'], ['Караганда', '«Шахтёр»'],
  ['Павлодар', '«Иртыш»'], ['Актобе', '«Актобе»'], ['Тараз', 'без клуба'], ['Костанай', '«Тобол»'],
];

/** 128 участников: посев по рейтингу, рейтинг убывает от первого номера.
    Фамилия и имя не повторяются парами — иначе в списке появляется второй
    «Ким Георгий», и непонятно, кто из них ты. */
const PLAYERS: Ply14[] = Array.from({ length: 128 }, (_, i) => {
  const [city, club] = CITIES[i % CITIES.length];
  const nm = `${SURNAMES[i % SURNAMES.length]} ${FIRSTS[Math.floor(i / SURNAMES.length) % FIRSTS.length]}`;
  return { s: i + 1, nm, city, club, r: 2612 - i * 7 - (i % 5) };
});
PLAYERS[1] = { ...PLAYERS[1], nm: 'Ким Георгий', city: 'Астана', club: 'СКА', r: 2456, me: true };
PLAYERS[3] = { ...PLAYERS[3], nm: 'Жумабеков Расул', city: 'Алматы', club: '«Алатау»', r: 2312, foe: true };

const PER_PAGE = 30;
/** Колонки таблицы участников: по каким сортируют. */
const COLS14: { k: 's' | 'nm' | 'club' | 'r'; t: string; num?: boolean }[] = [
  { k: 's', t: '№ посева', num: true },
  { k: 'nm', t: 'Участник' },
  { k: 'club', t: 'Регион и клуб' },
  { k: 'r', t: 'Рейтинг', num: true },
];

/** Вкладка «Мой матч»: с кем играю сейчас и как шёл по сетке. */
const MyMatch14_5 = () => (
  <div className="mkcols">
    <Panel title="Мой матч" extra={<P t="ИДЁТ" cls="live" />}>
      <Rows>
        <Row av={ME} nm="Ким Георгий" sub="рейтинг 2456" val="2" pill={{ t: 'ВЫ', cls: 'reg' }} />
        <Row av={A(22)} nm="Жумабеков Расул" sub="рейтинг 2312" val="1" />
      </Rows>
      <div className="dactionbar" style={{ marginTop: 12 }}>
        <div className="dcount">Счёт ведёт судья стола — вводить и подтверждать его не нужно</div>
        <P t="ТОЛЬКО СМОТРИМ" cls="done" />
      </div>
    </Panel>

    <Panel title="Мой путь по сетке">
      <Rows>
        <Row nm="1/16 финала" sub="Оралбек Д. · 4:1" pill={{ t: 'ПОБЕДА', cls: 'live' }} />
        <Row nm="1/8 финала" sub="Жумабеков Р. · идёт" pill={{ t: 'СЕЙЧАС', cls: 'reg' }} />
        <Row nm="1/4 финала" sub="соперник определится" pill={{ t: 'ПОТОМ', cls: 'done' }} />
      </Rows>
    </Panel>
  </div>
);

/** Вкладка «Участники»: таблица состава — поиск, сортировка, страницы по 30.

    Списком строк это не работает: на главном старте 128 участников, и человек
    ищет в нём либо себя, либо конкретного соперника. Поэтому поиск по фамилии,
    сортировка по любому столбцу и страницы — как в реестрах федерации. */
function Players14_5() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS14)[number]['k']; up: boolean }>({ k: 's', up: true });
  const [page, setPage] = useState(0);

  const found = PLAYERS.filter((p) => {
    const t = q.trim().toLowerCase();
    return !t || p.nm.toLowerCase().includes(t) || p.club.toLowerCase().includes(t) || p.city.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const k = sort.k;
    const v = k === 'nm' || k === 'club' ? String(a[k]).localeCompare(String(b[k]), 'ru') : Number(a[k]) - Number(b[k]);
    return sort.up ? v : -v;
  });
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);

  /* Панели вокруг таблицы нет: заголовок «Участники» повторял бы подпись
     вкладки, а счётчик и без него стоит в строке поиска. */
  return (
    <>
      <div className="dactionbar">
        <Search
          value={q}
          placeholder="Фамилия, клуб или регион"
          onChange={(v) => { setQ(v); setPage(0); }}
          wide
        />
        <span className="dcount">
          {rows.length === PLAYERS.length ? `${PLAYERS.length} участников` : `найдено ${rows.length} из ${PLAYERS.length}`}
        </span>
      </div>

      <div className="mktable">
        <div className="mktable-h">
          {COLS14.map((c) => (
            <button
              key={c.k}
              type="button"
              className={(c.num ? 'num' : '') + (sort.k === c.k ? ' on' : '')}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
            >
              {c.t}
              {sort.k === c.k && <ArrowUpDown size={11} />}
            </button>
          ))}
          <span />
        </div>
        <div className="mktable-b">
          {shown.map((p) => (
            <div className={'mktable-r' + (p.me ? ' me' : '')} key={p.s}>
              <span className="num">{p.s}</span>
              <span className="nm">{p.nm}</span>
              <span>{p.city} · {p.club}</span>
              <span className="num">{p.r}</span>
              <span>
                {p.me && <P t="ВЫ" cls="reg" />}
                {p.foe && <P t="ВАШ СОПЕРНИК" cls="live" />}
              </span>
            </div>
          ))}
          {shown.length === 0 && (
            <div className="dcount" style={{ padding: '14px 12px' }}>
              По запросу «{q}» никого нет — проверьте написание фамилии.
            </div>
          )}
        </div>
      </div>

      <div className="dactionbar" style={{ marginTop: 10 }}>
        <span className="dcount">
          {rows.length ? `${cur * PER_PAGE + 1}–${cur * PER_PAGE + shown.length} из ${rows.length}` : '0 из 0'}
        </span>
        <Pager page={cur} pages={pages} onPick={setPage} />
      </div>
    </>
  );
}

/** Вкладка «Сетка»: сетку рисует тот же компонент, что и на фронте — не
    картинка и не свои прямоугольники, а настоящий холст по общей модели
    сетки. Ни заголовка, ни подписей: сетка занимает экран целиком, а что это
    за турнир — написано в шапке экрана. */
const Bracket14_5 = () => (
  <div className="mkbracket mkbracket-fill">
    <BracketFlow bracket={myBracket} minZoom={0.15} fitPadding={0.06} />
  </div>
);

/** Вкладка «Группы» — только у формата «групповой этап с плей-офф» (TZ §5.1).
    Спортсмену тут важно одно: выхожу я из группы или нет, поэтому место и
    «выходит / не выходит» стоят в строке, а не считаются в уме. */
const Groups14_5 = () => (
  <div className="mkcols">
    <Panel title="Моя группа · A" extra={<P t="ВЫХОДЯТ ДВОЕ" cls="reg" />}>
      <Rows>
        {MY_GROUP.map((g) => (
          <Row
            key={g.nm}
            av={g.me ? ME : undefined}
            nm={`${g.place} · ${g.nm}`}
            sub={`${g.wl} по матчам · партии ${g.sets}`}
            val={g.me ? 'вы' : undefined}
            pill={g.out ? { t: 'В ПЛЕЙ-ОФФ', cls: 'live' } : { t: 'ВЫБЫЛ', cls: 'done' }}
          />
        ))}
      </Rows>
      <div className="dcount" style={{ marginTop: 10 }}>
        Группа сыграна · дальше — плей-офф на соседней вкладке
      </div>
    </Panel>

    <Panel title="Остальные группы · 8">
      <Rows>
        {OTHER_GROUPS.map((g) => (
          <Row key={g.nm} nm={g.nm} sub={g.sub} val={g.out} />
        ))}
      </Rows>
    </Panel>
  </div>
);

/** Плей-офф после групп: сетка короче, и в неё попадают вышедшие из групп. */
const Playoff14_5 = () => (
  <div className="mkbracket mkbracket-fill">
    <BracketFlow bracket={playoffBracket} minZoom={0.15} fitPadding={0.06} />
  </div>
);

/** Экран турнира. `tab` — с какой вкладки открыт: переключатель рабочий, и
    борд показывает те же вкладки открытыми, чтобы их было видно без кликов.
    `groups` — формат с групповым этапом: добавляется вкладка «Группы», а
    «Сетка» показывает плей-офф из вышедших. */
export function Match14_5({ tab, groups }: { tab?: string; groups?: boolean }) {
  return (
    <RoleScreen
      role={R14}
      nav="Мой матч"
      title="Кубок Алматы 2026"
      sub={groups ? 'Группы и плей-офф · группа A · стол 5' : '1/8 финала · стол 5'}
    >
      <Tabs
        active={tab}
        items={[
          { t: TABS14_5[0], view: <MyMatch14_5 /> },
          { t: TABS14_5[1], view: <Players14_5 /> },
          ...(groups ? [{ t: 'Группы', view: <Groups14_5 /> }] : []),
          { t: TABS14_5[2], view: groups ? <Playoff14_5 /> : <Bracket14_5 /> },
        ]}
      />
    </RoleScreen>
  );
}

const Match14_5States = () => (
  <States>
    <Shot tone="danger" title="Счёт своего матча спортсмен не вводит" text="Счёт ведёт судья на столе; спортсмен его не вводит и не подтверждает.">
      <Rows>
        <Row nm="Счёт матча" sub="ведёт судья стола" pill={{ t: 'ТОЛЬКО СМОТРИМ', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="success" title="Вас вызвали" text="«Подойдите к столу N» — после вызова главным судьёй.">
      <Rows>
        <Row nm="Подойдите к столу 5" sub="вызвал главный судья · сейчас" pill={{ t: 'ВЫЗОВ', cls: 'live' }} />
      </Rows>
    </Shot>

    <Shot
      tone="info"
      title="Турнир завершён"
      text="Тот же экран открывается строкой турнира из аналитики: сетка на чтение, мои матчи, дельта рейтинга."
      wide
    >
      <Rows>
        <Row nm="1/16 финала" sub="Оралбек Д. · 4:1" val="+11" pill={{ t: 'ПОБЕДА', cls: 'live' }} />
        <Row nm="1/8 финала" sub="Жумабеков Р. · 2:4" val="−3" pill={{ t: 'ПОРАЖЕНИЕ', cls: 'bad' }} />
        <Row nm="Итог турнира" sub="1/8 финала · рейтинг пересчитан 15.09" val="+8" pill={{ t: 'ЗАВЕРШЁН', cls: 'done' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.6 · Аналитика ─────────────────────────────────────────── */

export function Stats14_6() {
  return (
    <RoleScreen role={R14} nav="Аналитика" title="Аналитика" sub="Сезон 2026 · 128 матчей">
      <Chips
        items={[
          { v: '2456', k: 'Рейтинг', tone: 'b' },
          { v: '+24', k: 'За сезон', tone: 'g' },
          { v: '68%', k: 'Побед' },
          { v: '7', k: 'Турниров сыграно' },
        ]}
      />
      <div className="mkcols">
        {/* Строка турнира открывает тот же экран, что и по ходу игры (Э14.5),
            но завершённый: сетка с моим путём, мои матчи и из чего сложилась
            дельта рейтинга. Отдельного экрана «прошлый турнир» не заводим. */}
        <Panel title="Рейтинг по турнирам">
          <Rows>
            <Row nm="Кубок Алматы 2026" sub="1/8 финала · 14.09" val="+8" pill={{ t: 'МОЯ СЕТКА И МАТЧИ', cls: 'reg' }} to="Э14.5" />
            <Row nm="Открытие сезона 2026" sub="1/4 финала · 19.01" val="+22" pill={{ t: 'МОЯ СЕТКА И МАТЧИ', cls: 'reg' }} to="Э14.5" />
            <Row nm="ОРТ «Кубок Иртыша» 2025" sub="финал · 26.10" val="+16" pill={{ t: 'МОЯ СЕТКА И МАТЧИ', cls: 'reg' }} to="Э14.5" />
          </Rows>
        </Panel>

        <Panel title="Расширенная аналитика ⚠" extra={<BarChart3 size={15} />}>
          <Empty title="Пока не проектируем" text="⚠ Что в неё входит и платная ли она — решения федерации нет." />
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Stats14_6States = () => (
  <States>
    <Shot
      tone="warning"
      title="Расширенная аналитика — заглушка"
      text="Состав расширенной аналитики и её оплата не зафиксированы; до решения не проектируем."
      wide
    >
      <Empty title="Расширенная аналитика" text="⚠ Что в неё входит и платная ли она — решения федерации нет." />
    </Shot>
  </States>
);

/* ── Э14.7 · Профиль и взнос ───────────────────────────────────── */

export function Profile14_7() {
  return (
    <RoleScreen role={R14} nav="Профиль" title="Профиль" sub="Ким Георгий · 2003 · Астана">
      <div className="mkcols">
        {/* Профиль — на чтение. Правка вынесена отдельным экраном (Э14.9):
            телефон и почта меняются сразу, клуб — только после подтверждения
            клубом, и на одном экране эти два поведения путаются. */}
        <Panel
          title="Профиль"
          extra={
            <button className="dpickbtn" data-to="Э14.9">
              <Pencil size={14} /> Изменить данные
            </button>
          }
        >
          <Form>
            <Field label="Дата рождения" value="14.06.2003" />
            <Field label="Разряд" value="мастер спорта" />
            <Field label="Регион" value="Астана" />
            <Field label="Тренер" value="Гладун Игорь" />
            <Field label="Телефон" value="+7 705 118 44 03" />
            <Field label="Почта" value="g.kim@mail.kz" />
            <Field label="Клуб" value="СКА · Астана" />
            <Field label="Принадлежность к клубу" value="подтвердил клуб «СКА», 12.01.2026" />
          </Form>
        </Panel>

        <Panel
          title="Годовой взнос 2026"
          extra={
            <button className="dpickbtn" data-to="Э14.12">
              <Receipt size={14} /> История платежей
            </button>
          }
        >
          <Form>
            <Field label="Сумма" value="₸ 10 000" />
            <Input label="Срок" value="до 31 марта" />
          </Form>
          <div style={{ marginTop: 12 }}>
            <button className="dsubmit" style={{ width: '100%' }} data-to="Э14.8">
              <CreditCard size={15} /> Оплатить картой
            </button>
          </div>
          <Alert>
            Оплата идёт на платёжной странице Халык Банка. Состояние поставится само, по
            подтверждению банка — держать вкладку открытой не нужно.
          </Alert>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Profile14_7States = () => (
  <States>
    <Shot tone="success" title="Оплачено" text="Состояние меняется само, по подтверждению банка, и видно также тренеру.">
      <Rows>
        <Row nm="Взнос 2026" sub="оплачен картой 14.01" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
    </Shot>

    <Shot tone="info" title="Ждём подтверждения банка" text="«Платёж обрабатывается»: вкладку держать не нужно.">
      <Rows>
        <Row nm="Платёж отправлен" sub="Halyk ePay · обрабатывается" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
      </Rows>
    </Shot>

    <Shot tone="danger" title="Оплата не прошла" text="Причина от банка и кнопка повторить.">
      <Rows>
        <Row nm="Платёж отклонён" sub="банк: недостаточно средств" pill={{ t: 'НЕ ПРОШЛА', cls: 'bad' }} action="Повторить" />
      </Rows>
    </Shot>

    <Shot tone="info" title="Смена клуба ждёт клуб" text="В профиле ещё прежний клуб.">
      <Rows>
        <Row nm="СКА · Астана" sub="заявка в «Алатау» · Алматы отправлена 14.02" pill={{ t: 'ЖДЁМ КЛУБ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.10 · Оплата прошла · Э14.11 · Оплата не прошла ────────── */

/** Страница возврата: банк отправил человека обратно к нам, и первое, что он
    должен увидеть, — прошёл платёж или нет. Ответ стоит один посреди экрана, а
    не строкой в панели: из банка возвращаются с этим вопросом и ни с каким
    другим. Под ним — то, ради чего платили, и одна кнопка «что дальше». */
const Result14 = ({
  ok,
  title,
  lead,
  facts,
  action,
  note,
}: {
  ok: boolean;
  title: string;
  lead: string;
  facts: [string, string][];
  action: { t: string; to: string; icon: ReactNode };
  note: string;
}) => (
  <RoleScreen role={R14} nav="Профиль" title="Оплата взноса" sub="Годовой взнос 2026 · Ким Георгий">
    <div className={'mkresult' + (ok ? ' ok' : ' bad')}>
      <span className="mkresult-ic">{ok ? <Check size={30} /> : <X size={30} />}</span>
      <div className="mkresult-t">{title}</div>
      <div className="mkresult-s">{lead}</div>

      <div className="mkresult-facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>

      <button className="dsubmit mkresult-btn" data-to={action.to}>
        {action.icon} {action.t}
      </button>
      <button type="button" className="mkresult-quiet" data-to="Э14.7">В профиль</button>
      <div className="mkresult-note">{note}</div>
    </div>
  </RoleScreen>
);

export function Paid14_10() {
  return (
    <Result14
      ok
      title="Оплата прошла"
      lead="Годовой взнос 2026 оплачен — заявки на турниры со взносом теперь проходят."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Номер заказа', '100416'],
        ['Когда', '14.01.2026, 10:42'],
        ['Карта', '•••• 1234 · Halyk ePay'],
        ['Взнос действует', 'до 31.03.2027'],
      ]}
      action={{ t: 'К турнирам', to: 'Э14.2', icon: <Trophy size={15} /> }}
      note="Квитанцию присылает банк на почту. Отметка об оплате видна тренеру и в реестре — ставить её вручную никому не нужно."
    />
  );
}

const Paid14_10States = () => (
  <States>
    <Shot tone="info" title="Банк ещё подтверждает" text="Возврат пришёл раньше подтверждения — редко, но бывает.">
      <Rows>
        <Row nm="Платёж отправлен" sub="Halyk ePay · обрабатывается" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
      </Rows>
      <Alert>Страница сама обновится: держать её открытой не нужно.</Alert>
    </Shot>

    <Shot tone="success" title="Взнос уже был оплачен" text="Повторный платёж не проходит: система его не создаёт.">
      <Rows>
        <Row nm="Взнос 2026" sub="оплачен 14.01, картой •••• 1234" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
    </Shot>
  </States>
);

export function Declined14_11() {
  return (
    <Result14
      ok={false}
      title="Оплата не прошла"
      lead="Банк отклонил платёж: недостаточно средств на карте."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Номер заказа', '100416'],
        ['Когда', '14.01.2026, 10:44'],
        ['Деньги', 'не списаны'],
        ['Взнос', 'остался неоплаченным'],
      ]}
      action={{ t: 'Повторить оплату', to: 'Э14.8', icon: <CreditCard size={15} /> }}
      note="Причину пишет банк — мы её только показываем. Ни номера карты, ни кода из SMS у нас нет; можно повторить или заплатить другой картой."
    />
  );
}

/* ── Э14.12 · История платежей и квитанция ─────────────────────── */

/** Платежи спортсмена: за что и когда платил, чем закончилось.

    Взнос платят раз в год, но платёж бывает неудачным, повторным и возвращённым
    — и на вопрос «я же платил» отвечает не память, а эта страница. Квитанция
    лежит здесь же: банк присылает её на почту, а почту теряют. */
const PAYMENTS = [
  { nm: 'Годовой взнос 2026', at: '14.01.2026, 10:42', sum: '₸ 10 000', st: 'ОПЛАЧЕН', cls: 'live' as const, card: '•••• 1234', ok: true },
  { nm: 'Годовой взнос 2026 · попытка', at: '14.01.2026, 10:44', sum: '₸ 10 000', st: 'НЕ ПРОШЛА', cls: 'bad' as const, card: '•••• 7788', ok: false },
  { nm: 'Годовой взнос 2025', at: '09.02.2025, 18:05', sum: '₸ 8 000', st: 'ОПЛАЧЕН', cls: 'live' as const, card: '•••• 1234', ok: true },
  /* Оплата мимо системы: квитанции у строки нет — документ выдавала не она. */
  { nm: 'Годовой взнос 2024', at: '21.01.2024, 12:31', sum: '₸ 8 000', st: 'ОПЛАЧЕН', cls: 'live' as const, card: 'наличными · отметил экономист', ok: false },
];

export function History14_12() {
  return (
    <RoleScreen
      role={R14}
      nav="Профиль"
      title="История платежей"
      sub="Ким Георгий · взносы за все сезоны"
      back={{ label: 'Профиль', to: 'Э14.7' }}
    >
      <div className="mkcols">
        <Panel title="Платежи" extra={<span className="dcount">{PAYMENTS.length} записи</span>}>
          <Rows>
            {PAYMENTS.map((p) => (
              <div className="drow" key={p.at}>
                <div className="who">
                  <div className="nm">{p.nm}</div>
                  <div className="rl">{p.at} · {p.card}</div>
                </div>
                <div className="amt">{p.sum}</div>
                <P t={p.st} cls={p.cls} />
                {p.ok && (
                  <button className="dpickbtn">
                    <Receipt size={13} /> Квитанция
                  </button>
                )}
              </div>
            ))}
          </Rows>
          <div className="dcount" style={{ marginTop: 10 }}>
            Неудачные попытки тоже видны: по ним понятно, что деньги не списаны.
          </div>
        </Panel>

        {/* Квитанция — то, что человек несёт в бухгалтерию клуба или школы.
            Собираем её мы: у банка это письмо, а не документ федерации. */}
        <Panel title="Квитанция" extra={<P t="ГОДОВОЙ ВЗНОС 2026" cls="reg" />}>
          <Form>
            <Field label="Плательщик" value="Ким Георгий, 14.06.2003" />
            <Field label="Назначение" value="Годовой взнос 2026" />
            <Field label="Сумма" value="₸ 10 000" />
            <Field label="Получатель" value="ОЮЛ «Федерация настольного тенниса РК»" wide />
            <Field label="Номер заказа" value="100416" />
            <Field label="Когда" value="14.01.2026, 10:42" />
            <Field label="Способ" value="карта •••• 1234 · Halyk ePay" wide />
          </Form>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="dsubmit" style={{ padding: '11px 16px' }}>
              <Download size={15} /> Скачать PDF
            </button>
            <Ghost>Отправить на почту</Ghost>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const History14_12States = () => (
  <States>
    <Shot tone="info" title="Платежей ещё не было" text="Первый сезон: взнос не выставлялся или не оплачивался.">
      <Empty title="Платежей пока нет" text="Здесь появятся все взносы: когда, сколько и чем закончился платёж." />
    </Shot>

    <Shot tone="warning" title="Оплату отметил экономист" text="Платёж прошёл мимо системы — квитанции банка нет.">
      <Rows>
        <Row nm="Годовой взнос 2024" sub="наличными · отметил экономист, основание — квитанция № 4471" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
      <Alert>Кнопки «квитанция» у такой строки нет: документ выдавала не система.</Alert>
    </Shot>

    <Shot tone="danger" title="Возврат платежа ✳" text="Экономист снял отметку — в истории это отдельная строка.">
      <Rows>
        <Row nm="Годовой взнос 2026 · возврат" sub="снял Сериков Н., причина: «оплатил дважды» · 16.01" pill={{ t: 'ВОЗВРАТ', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

const Declined14_11States = () => (
  <States>
    <Shot tone="warning" title="Человек нажал «Отмена» у банка" text="Та же страница, причина другая — платёж не начинался.">
      <Rows>
        <Row nm="Оплата отменена" sub="возврат с платёжной страницы банка" pill={{ t: 'ОТМЕНЕНА', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="danger" title="Банк не отвечает ✳" text="Состояние неизвестно: проверяем сами, деньги не теряются.">
      <Rows>
        <Row nm="Ответа от банка нет" sub="проверим состояние платежа и обновим сами" pill={{ t: 'ПРОВЕРЯЕМ', cls: 'wait' }} />
      </Rows>
      <Alert>
        Если деньги списались, взнос станет оплаченным без участия человека — по сверке с банком.
      </Alert>
    </Shot>
  </States>
);

/* ── Э14.9 · Изменение данных ──────────────────────────────────── */

/** Телефон и почта — свои: человек меняет их сам. Клуб — утверждение о
    принадлежности к чужой организации, и подтверждает его администратор
    этого клуба (Э13.5): иначе в состав любого клуба вписался бы кто угодно. */
export function Edit14_9() {
  return (
    <RoleScreen
      role={R14}
      nav="Профиль"
      title="Изменение данных"
      sub="Ким Георгий · телефон, почта и клуб"
      back={{ label: 'Профиль', to: 'Э14.7' }}
    >
      <div className="mkcols">
        <Panel title="Контакты" extra={<P t="МЕНЯЮТСЯ СРАЗУ" cls="live" />}>
          <Form>
            <Input label="Телефон" value="+7 705 118 44 03" wide />
            <Input label="Почта" value="g.kim@mail.kz" wide />
          </Form>
          <div style={{ marginTop: 12 }}>
            <button className="dsubmit" style={{ width: '100%' }} data-to="Э14.7">
              <Check size={15} /> Сохранить контакты
            </button>
          </div>
        </Panel>

        <Panel title="Клуб" extra={<P t="ЧЕРЕЗ ПОДТВЕРЖДЕНИЕ КЛУБА" cls="wait" />}>
          <Form>
            <Field label="Сейчас" value="СКА · Астана" />
            <Select label="Новый клуб" options={['«Алатау» · Алматы', 'СКА · Астана', 'без клуба']} />
          </Form>
          <div style={{ marginTop: 12 }}>
            <button className="dsubmit" style={{ width: '100%' }} data-to="Э14.7">
              <Send size={15} /> Отправить в клуб
            </button>
          </div>
          <Alert>
            До подтверждения в профиле остаётся прежний клуб. Заявка уходит администратору клуба
            «Алатау» — принять в состав или отказать решает он.
          </Alert>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Edit14_9States = () => (
  <States>
    <Shot tone="info" title="Заявка уже отправлена" text="Выбор клуба заблокирован, есть «отозвать».">
      <Rows>
        <Row nm="«Алатау» · Алматы" sub="заявка отправлена 14.02, ждёт администратора клуба" pill={{ t: 'ЖДЁМ', cls: 'wait' }} action="Отозвать" />
      </Rows>
    </Shot>

    <Shot tone="success" title="Клуб подтвердил" text="Новый клуб в профиле, прежний — в истории.">
      <Rows>
        <Row nm="«Алатау» · Алматы" sub="принял Досжан М., 16.02" pill={{ t: 'МОЙ КЛУБ', cls: 'live' }} />
        <Row nm="СКА · Астана" sub="до 16.02.2026" pill={{ t: 'В ИСТОРИИ', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="danger" title="Клуб отказал" text="Прежний клуб остался, выбрать можно снова.">
      <Rows>
        <Row nm="«Алатау» · Алматы" sub="отказ: «не тренируется у нас» · 16.02" pill={{ t: 'ОТКАЗ', cls: 'bad' }} />
      </Rows>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.11 — прежний клуб"
      text="Нужно ли его согласие на уход и что с местом в заявках и составах — не решено."
      wide
    >
      <Alert>
        Рисуем только подтверждение принимающим клубом. Уходит ли спортсмен из уже поданных заявок
        и составов команд прежнего клуба сразу или доигрывает сезон — вопрос к федерации.
      </Alert>
    </Shot>
  </States>
);

/* ── Экраны роли ───────────────────────────────────────────────── */

/* ── Э14.8 · Оплата взноса картой ──────────────────────────────── */

/** Страница банка: наша оболочка сюда не приходит — человек ушёл на ePay.
    Форму рисует банк, поэтому макет условный: важно, что происходит до и
    после, а не как выглядят поля карты. */
const BankPage = ({ children }: { children: ReactNode }) => (
  <DeskFrame>
    <div className="mkpub">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--c-muted)' }}>
        <Lock size={14} /> epay.homebank.kz · защищённое соединение
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>Halyk Bank · ePay</span>
    </div>
    <div className="mkauth">
      <div className="mkauth-card">{children}</div>
    </div>
  </DeskFrame>
);

export function Pay14_8() {
  return (
    <BankPage>
      <div className="t">Оплата картой</div>
      <div className="s">Федерация настольного тенниса РК · годовой взнос 2026</div>

      <Rows>
        <Row nm="К оплате" sub="номер заказа 100416" val="₸ 10 000" />
      </Rows>

      <Form>
        <Input label="Номер карты" value="4400 43•• •••• 1234" wide />
        <Field label="Срок" value="09 / 28" />
        <Input label="CVC" value="•••" />
        <Input label="Держатель карты" value="GEORGIY KIM" wide />
      </Form>

      {/* Кнопка банка ведёт на нашу страницу возврата: успех — Э14.10,
          отказ и отмена — Э14.11. */}
      <button className="dsubmit" data-to="Э14.10">
        <CreditCard size={15} /> Оплатить ₸ 10 000
      </button>
      <div className="mkauth-row">
        <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>
          Форму и 3-D Secure показывает банк — номер карты в систему федерации не попадает
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)' }} data-to="Э14.11">
          Отмена
        </span>
      </div>
    </BankPage>
  );
}

const Pay14_8States = () => (
  <States>
    <Shot tone="info" title="3-D Secure" text="Поле кода от банка.">
      <Rows>
        <Row nm="Код из SMS банка" sub="отправлен на +7 705 •• •• 03" val="• • • •" pill={{ t: 'ЖДЁМ КОД', cls: 'wait' }} />
      </Rows>
      <Alert>Этот шаг тоже у банка: мы не видим ни кода, ни номера карты.</Alert>
    </Shot>

    <Shot tone="danger" title="Оплата отклонена" text="Причина от банка и «повторить».">
      <Rows>
        <Row nm="Платёж отклонён" sub="банк: недостаточно средств" pill={{ t: 'НЕ ПРОШЛА', cls: 'bad' }} action="Повторить" />
      </Rows>
    </Shot>

    <Shot
      tone="success"
      title="Человек закрыл вкладку ✳"
      text="Возврата не было, но взнос станет оплаченным по подтверждению банка."
      wide
    >
      <Rows>
        <Row nm="Взнос 2026" sub="подтверждение банка пришло на сервер · возврата в браузере не было" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
      <Alert tone="success">
        Состояние ставит серверное сообщение банка, а не возврат в приложение — держать
        вкладку открытой не нужно.
      </Alert>
    </Shot>
  </States>
);


/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': { cap: 'Вход', view: () => <Login0_1 />, next: '«Зарегистрироваться»' },
  'Э0.5': {
    cap: 'Регистрация спортсмена',
    view: () => (
      <>
        <SignUp0_5 />
        <SignUp0_5States />
      </>
    ),
    next: 'зарегистрировался — своя Главная',
  },
  'Э14.1': {
    cap: 'Главная',
    view: () => (
      <>
        <Home14_1 />
        <Home14_1States />
      </>
    ),
    next: 'пункт «Календарь»',
  },
  'Э14.2': {
    cap: 'Календарь',
    view: () => (
      <>
        <Calendar14_2 />
        <Also cap="Вкладка «Мои турниры» — куда меня заявили регион и клуб">
          <Calendar14_2 tab="Мои турниры · 3" />
        </Also>
        <Calendar14_2States />
      </>
    ),
    next: '«Заявиться» на ОРТ',
  },
  'Э14.3': {
    cap: 'Заявка на ОРТ',
    view: () => (
      <>
        <Apply14_3 />
        <Apply14_3States />
      </>
    ),
    next: '«Подать заявку»',
  },
  'Э14.4': {
    cap: 'Моя заявка',
    view: () => (
      <>
        <MyApp14_4 />
        <MyApp14_4States />
      </>
    ),
    next: 'заявка принята',
  },
  'Э14.5': {
    cap: 'Мой турнир и мой матч',
    /* Узел вкладки на карте открывает экран сразу на ней. «Группы» бывают не у
       каждого турнира, поэтому для них показываем турнир с групповым этапом —
       иначе вкладки, о которой спрашивают, на экране просто нет. */
    tabView: (tab) => <Match14_5 tab={tab} groups={tab === 'Группы'} />,
    view: () => (
      <>
        <Match14_5 />
        <Also cap="Вкладка «Участники» — весь состав турнира">
          <Match14_5 tab="Участники" />
        </Also>
        <Also cap="Вкладка «Сетка» — на весь экран, тот же компонент, что на фронте">
          <Match14_5 tab="Сетка" />
        </Also>
        <Also cap="Формат «группы + плей-офф»: появляется вкладка «Группы», а «Сетка» — это плей-офф">
          <Match14_5 tab="Группы" groups />
        </Also>
        <Match14_5States />
      </>
    ),
    next: 'пункт «Аналитика»',
  },
  'Э14.6': {
    cap: 'Аналитика',
    view: () => (
      <>
        <Stats14_6 />
        <Stats14_6States />
      </>
    ),
    next: 'пункт «Профиль»',
  },
  'Э14.7': {
    cap: 'Профиль и взнос',
    view: () => (
      <>
        <Profile14_7 />
        <Profile14_7States />
      </>
    ),
    next: '«Оплатить картой»',
  },
  'Э14.8': {
    cap: 'Оплата взноса картой',
    view: () => (
      <>
        <Pay14_8 />
        <Pay14_8States />
      </>
    ),
    next: 'банк вернул человека к нам',
  },
  'Э14.10': {
    cap: 'Взнос оплачен',
    view: () => (
      <>
        <Paid14_10 />
        <Paid14_10States />
      </>
    ),
  },
  'Э14.11': {
    cap: 'Оплата не прошла',
    view: () => (
      <>
        <Declined14_11 />
        <Declined14_11States />
      </>
    ),
  },
  'Э14.12': {
    cap: 'История платежей и квитанция',
    view: () => (
      <>
        <History14_12 />
        <History14_12States />
      </>
    ),
  },
  'Э14.9': {
    cap: 'Изменение данных',
    view: () => (
      <>
        <Edit14_9 />
        <Edit14_9States />
      </>
    ),
  },
};

export function Role14Board() {
  return <Board role={R14} screens={SCREENS} />;
}
