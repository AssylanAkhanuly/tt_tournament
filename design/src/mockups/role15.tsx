/* Роль 15 · Председатель судейской коллегии региона — макеты по флоу.
   Экраны Э15.1–Э15.4 (см. `flows/15-pred-sk-regiona.md`).

   Роль добавлена замечанием федерации (09.2026): «с судьями своих регионов
   работали они, дать им доступ на уровне их регионов, при этом доступ к их
   региону был и у ПГСК». Отсюда главная особенность макетов: везде видно, что
   это **свой регион**, а не вся страна, — счётчики региона, таблица только
   своих судей, ссылка в общий рейтинг отдельной строкой. */

import { useState } from 'react';
import { CalendarDays, GraduationCap, ListChecks, Send, UserPlus } from 'lucide-react';
import {
  A, AW, ActionBar, Alert, Arrow, Board, Chips, Empty, Hint, P, Panel, RoleScreen, Row, Rows, Screen,
  Shot, States,
} from './shell';
import type { ScreenMap } from './shell';
import { JudgeCard, type JudgeMe, type JudgeTour } from './judge';
import { R15 } from './roles';
import { Login0_1 } from './role00';

/* ── судьи региона ──────────────────────────────────────────────── */

type Reg = {
  nm: string;
  av: string;
  cat: string;
  /** Аттестация действует до; `null` — категория ещё не подтверждена. */
  att: string | null;
  /** Дней до конца срока; отрицательное — просрочена. */
  left: number | null;
  r: number;
  pl: number;
  /** Где сейчас: наряд или свободен. */
  duty: string;
};

const REGION: Reg[] = [
  { nm: 'Оралбай Ержан', av: A(39), cat: 'Первая категория', att: '14.11.2026', left: 78, r: 9, pl: 24, duty: 'Кубок РК · выезд' },
  { nm: 'Дәулет Жасұлан', av: A(75), cat: 'Национальная', att: '02.10.2026', left: 35, r: 14.5, pl: 11, duty: 'свободен' },
  { nm: 'Аманжол Нұрлан', av: A(53), cat: 'Первая категория', att: '19.09.2026', left: 22, r: 7, pl: 33, duty: 'Первенство Павлодара' },
  { nm: 'Жақсылық Бекзат', av: A(13), cat: 'Вторая категория', att: '30.08.2026', left: 2, r: 4, pl: 58, duty: 'свободен' },
  { nm: 'Сәрсенов Аян', av: A(23), cat: 'Вторая категория', att: '11.07.2026', left: -48, r: 3, pl: 71, duty: 'свободен' },
  { nm: 'Тлеуова Аружан', av: AW(21), cat: '—', att: null, left: null, r: 0, pl: 0, duty: 'свободен' },
];

const num = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/* ── Э15.1 · Судьи региона ──────────────────────────────────────── */

export function Judges15_1() {
  return (
    <RoleScreen
      role={R15}
      nav="Судьи региона"
      title="Судьи региона"
      sub="Павлодарская область · сезон 2026"
    >
      <Chips
        items={[
          { v: String(REGION.length), k: 'Судей в реестре региона', tone: 'b' },
          { v: '5', k: 'С действующей категорией' },
          { v: '2', k: 'Аттестация истекает или истекла', tone: 'a' },
          { v: '2', k: 'В наряде сейчас', tone: 'g' },
        ]}
      />

      <ActionBar count="Свой регион · чужие судьи видны в общем рейтинге, но не здесь">
        {/* Тихой кнопкой: акцент в полосе один, и это приглашение — то, ради
            чего председатель сюда и заходит. Общий рейтинг он смотрит редко. */}
        <button
          className="dpickbtn"
          style={{ background: 'var(--c-panel-2)', color: 'var(--c-ink)', boxShadow: 'inset 0 1px 0 var(--c-glass-hi)' }}
          data-to="Э0.12"
        >
          <ListChecks size={14} /> Рейтинг судей
        </button>
        <button className="dsubmit" style={{ padding: '10px 14px' }}>
          <UserPlus size={15} /> Пригласить судью
        </button>
      </ActionBar>

      <Panel
        title="Судьи Павлодарской области"
        extra={<span className="dcount">категорию проставляет коллегия — регион приглашает и ведёт</span>}
      >
        <div className="mktable mkjreg">
          <div className="mktable-h">
            <span>Судья</span>
            <span>Категория</span>
            <span>Аттестация до</span>
            <span className="num">R</span>
            <span className="num">Место</span>
            <span>Где сейчас</span>
            <span>Допуск</span>
          </div>
          <div className="mktable-b">
            {REGION.map((j) => {
              /* Просроченная аттестация подкрашена: такого судью в наряд не
                 ставят, и видно это должно быть до того, как его туда
                 поставили, а не после. */
              const over = j.left !== null && j.left < 0;
              const soon = j.left !== null && j.left >= 0 && j.left <= 30;
              const wait = j.att === null;
              return (
                <div className={'mktable-r' + (over || wait ? ' no' : '')} key={j.nm} data-to="Э15.2" role="button" tabIndex={0}>
                  <span className="nm">
                    <img src={j.av} alt="" />
                    <i>{j.nm}<em>{j.duty}</em></i>
                  </span>
                  <span>{j.cat}</span>
                  <span className={over ? 'fail' : soon ? 'soon' : undefined}>
                    {j.att ?? 'не подтверждена'}
                    {over && <em> просрочена</em>}
                    {soon && <em> осталось {j.left} дн.</em>}
                  </span>
                  <span className="num">{j.r ? num(j.r) : '—'}</span>
                  <span className="num">{j.pl ? '№' + j.pl : '—'}</span>
                  <span>{j.duty}</span>
                  <span className="mark">
                    <P
                      t={wait ? 'ЖДЁТ КАТЕГОРИИ' : over ? 'НЕ ДОПУЩЕН' : 'ДОПУЩЕН'}
                      cls={wait ? 'wait' : over ? 'bad' : 'live'}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="dcount" style={{ marginTop: 10 }}>
          Экран показывает свой срез, а не весь реестр: судей в стране больше, и они — в общем
          рейтинге (Э0.12)
        </div>
      </Panel>
    </RoleScreen>
  );
}

const Judges15_1States = () => (
  <States>
    <Shot
      tone="warning"
      title="У судьи истекает аттестация ✳"
      text="Строка подсвечена, действие ведёт на аттестацию — в наряд такого не ставят."
    >
      <Rows>
        <Row nm="Жақсылық Бекзат" sub="аттестация до 30.08.2026 — осталось 2 дня" pill={{ t: 'ИСТЕКАЕТ', cls: 'wait' }} action="На аттестацию" />
        <Row nm="Сәрсенов Аян" sub="аттестация просрочена 48 дней назад" pill={{ t: 'НЕ ДОПУЩЕН', cls: 'bad' }} action="На аттестацию" />
      </Rows>
    </Shot>

    <Shot tone="info" title="Регион пуст ✳" text="Приглашений ещё не было.">
      <Empty title="В реестре региона никого нет" text="Пригласите судью — категорию по удостоверению проставит коллегия." />
    </Shot>
  </States>
);

/* ── Э15.2 · Карточка судьи региона ─────────────────────────────── */

/* Та же карточка, что видят все (Э0.13), плюс полоса действий региона.
   Второй карточки на того же человека быть не должно: рейтинг, история
   судейства и категория считаются одинаково и разъедутся на первой же правке
   Положения. */
const CARD: JudgeMe = { nm: 'Дәулет Жасұлан', cat: 'Национальная категория', region: 'Павлодар', pl: 11, s1: 7.5, s2: 4, s3: 3, s4: 0 };
const CARD_TOURS: JudgeTour[] = [
  { nm: 'Первенство Павлодарской области', when: '18–19.05', city: 'Павлодар', kind: 'Региональные', post: 'Главный судья', base: 1, k: 1.5 },
  { nm: 'Кубок Казахстана 2026', when: '18–22.02', city: 'Астана', kind: 'Республиканские', post: 'Судья стола', base: 3, k: 1.5 },
  { nm: 'Первенство Павлодара', when: '25.01', city: 'Павлодар', kind: 'Региональные', post: 'Судья стола', base: 1, k: 1 },
];

export function Card15_2() {
  return (
    <RoleScreen
      role={R15}
      nav="Судьи региона"
      title="Карточка судьи региона"
      sub="Дәулет Жасұлан · национальная категория · Павлодар"
      back={{ label: 'Судьи региона', to: 'Э15.1' }}
    >
      {/* Полоса действий региона — над карточкой: карточка одна на всю систему,
          а действия по ней есть только у своего региона. */}
      <ActionBar count="Ваш судья: наряд, аттестация и документы — ваши; рейтинг считает система">
        <button className="dpickbtn" data-to="Э15.4">
          <Send size={14} /> Внести документ на S3 / S4
        </button>
        <button className="dpickbtn">
          <GraduationCap size={14} /> Отправить на аттестацию
        </button>
        <button className="dsubmit" style={{ padding: '10px 14px' }} data-to="Э15.3">
          <CalendarDays size={15} /> Поставить в наряд
        </button>
      </ActionBar>

      <JudgeCard me={CARD} tours={CARD_TOURS} />
    </RoleScreen>
  );
}

const Card15_2States = () => (
  <States>
    <Shot
      tone="info"
      title="Судья из чужого региона ✳"
      text="Карточка открыта — рейтинг-лист общий, — но действий нет: он не ваш."
    >
      <Rows>
        <Row nm="Пак Сергей · Шымкент" sub="карточка на чтение: наряд, аттестацию и документы ведёт его регион" pill={{ t: 'ЧУЖОЙ РЕГИОН', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot
      tone="warning"
      title="Категория ждёт подтверждения ✳"
      text="В наряд такой судья не ставится — сначала удостоверение и коллегия."
    >
      <Rows>
        <Row nm="Тлеуова Аружан" sub="удостоверение у коллегии (Э5.6) · S2 не начисляется" pill={{ t: 'ЖДЁТ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э15.3 · Наряды региона ─────────────────────────────────────── */

type Start = { nm: string; when: string; city: string; reg: boolean; need: number; got: number; who: string };

const STARTS: Start[] = [
  { nm: 'Первенство Павлодарской области', when: '12–14.09', city: 'Павлодар', reg: true, need: 8, got: 6, who: 'гл. судья Дәулет Ж. · секретарь Аманжол Н.' },
  { nm: 'Турнир памяти Мусина', when: '28.09', city: 'Экибастуз', reg: true, need: 4, got: 4, who: 'гл. судья Аманжол Н.' },
  { nm: 'Открытое первенство области до 15 лет', when: '19.10', city: 'Павлодар', reg: true, need: 6, got: 1, who: 'наряд не собран' },
  { nm: 'Кубок Казахстана 2026', when: '18–22.02', city: 'Астана', reg: false, need: 0, got: 0, who: 'наряд собирает председатель ГСК · от вас: Оралбай Е.' },
];

export function Duty15_3() {
  const [pick, setPick] = useState<string | null>(STARTS[2].nm);
  return (
    <RoleScreen
      role={R15}
      nav="Наряды региона"
      title="Наряды региона"
      sub="Павлодарская область · сезон 2026"
    >
      <ActionBar count={pick ? `Выбран старт: ${pick}` : 'Выберите старт, чтобы собрать наряд'}>
        <button className="dsubmit" style={{ padding: '10px 14px' }} data-to="Э15.1">
          <UserPlus size={15} /> Добавить судью в наряд
        </button>
      </ActionBar>

      <Panel title="Старты сезона" extra={<span className="dcount">республиканские — на чтение</span>}>
        <Rows>
          {STARTS.map((t) => (
            <Row
              key={t.nm}
              nm={t.nm}
              sub={`${t.when} · ${t.city} · ${t.who}`}
              val={t.reg ? `${t.got} / ${t.need}` : ''}
              pill={
                t.reg
                  ? t.got >= t.need
                    ? { t: 'НАРЯД СОБРАН', cls: 'live' }
                    : { t: 'НЕ СОБРАН', cls: 'bad' }
                  : { t: 'РЕСПУБЛИКАНСКИЙ', cls: 'done' }
              }
              on={pick === t.nm}
              onSelect={t.reg ? () => setPick(pick === t.nm ? null : t.nm) : undefined}
            />
          ))}
        </Rows>
        {/* Республиканские старты стоят здесь не для полноты списка ✳: от выезда
            судьи в чужой регион зависит коэффициент 1,5 (TZ §7.2), и
            председателю надо видеть, кто из его судей туда уехал. */}
        <div style={{ marginTop: 12 }}>
          <Hint>
            Республиканский наряд собирает председатель ГСК — здесь он только виден: от выезда
            судьи зависит коэффициент 1,5 в его рейтинге (TZ §7.2).
          </Hint>
        </div>
      </Panel>
    </RoleScreen>
  );
}

const Duty15_3States = () => (
  <States>
    <Shot tone="warning" title="Наряд не закрыт до старта ✳" text="Видно, сколько мест осталось и до какого числа.">
      <Rows>
        <Row nm="Открытое первенство области до 15 лет · 19.10" sub="закрыто 1 место из 6 · до старта 22 дня" val="1 / 6" pill={{ t: 'НЕ СОБРАН', cls: 'bad' }} />
      </Rows>
      <Alert tone="warning">Матч не стартует без судьи на столе (TZ §4.7) — незакрытый наряд это не формальность.</Alert>
    </Shot>

    <Shot tone="info" title="Судья уехал на республиканский старт ✳" text="Виден как занятый: его наряд собрал ГСК.">
      <Rows>
        <Row nm="Оралбай Ержан" sub="Кубок Казахстана, Астана · 18–22.02 · коэффициент 1,5 за выезд" pill={{ t: 'ЗАНЯТ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э15.4 · Начисления региона ─────────────────────────────────── */

const DOCS15: { t: string; sub: string; st: string; cls: 'live' | 'wait' | 'bad' | 'reg' }[] = [
  { t: 'Семинар судей области · Дәулет Ж.', sub: 'S3 · подан 12.06.2026 · Положение: 3 балла', st: 'ПРИНЯТ +3', cls: 'live' },
  { t: 'Работа в коллегии области, 6 месяцев · Аманжол Н.', sub: 'S4 · подан 01.07.2026 · у рейтинговой комиссии', st: 'НА ПРОВЕРКЕ', cls: 'wait' },
  { t: 'Благодарность акимата · Жақсылық Б.', sub: 'S4 · добавлен 18.08.2026 · ещё не подан', st: 'ЧЕРНОВИК', cls: 'reg' },
  { t: 'Протокол теста аттестации · Сәрсенов А.', sub: 'S3 · отклонён 27.02.2026 — «скан не читается»', st: 'ОТКЛОНЁН', cls: 'bad' },
];

export function Points15_4() {
  return (
    <RoleScreen
      role={R15}
      nav="Начисления"
      title="Начисления региона"
      sub="Павлодарская область · S3 и S4 по своим судьям"
    >
      <ActionBar count="Регион подаёт — подтверждает рейтинговая комиссия (председатель ГСК)">
        <button className="dsubmit" style={{ padding: '10px 14px' }}>
          <Send size={15} /> Подать документ
        </button>
      </ActionBar>

      <Panel title="Документы региона" extra={<span className="dcount">S1 и S2 система считает сама</span>}>
        <Rows>
          {DOCS15.map((d) => (
            <Row key={d.t} nm={d.t} sub={d.sub} pill={{ t: d.st, cls: d.cls }} action={d.cls === 'reg' ? 'Подать' : undefined} />
          ))}
        </Rows>
        {/* Начисляет не регион: он подаёт. Иначе рейтинг судьи стал бы вопросом
            того, в каком регионе он состоит. */}
        <div style={{ marginTop: 12 }}>
          <Hint>
            Начисляет не регион, а рейтинговая комиссия: регион подаёт документ, подтверждает
            председатель ГСК (TZ §7.2). Иначе балл судьи зависел бы от того, в каком регионе он
            состоит.
          </Hint>
        </div>
      </Panel>
    </RoleScreen>
  );
}

const Points15_4States = () => (
  <States>
    <Shot tone="warning" title="Документ отклонён с причиной ✳" text="Можно донести и подать снова.">
      <Rows>
        <Row nm="Протокол теста аттестации · Сәрсенов А." sub="«скан не читается» · 27.02.2026" pill={{ t: 'ОТКЛОНЁН', cls: 'bad' }} action="Подать снова" />
      </Rows>
    </Shot>

    <Shot
      tone="danger"
      title="Сколько баллов даёт сама работа председателя ⚠"
      text="В Положении о рейтинге такой строки нет — вопрос 15.5."
    >
      <Rows>
        <Row nm="Работа председателем региональной коллегии" sub="федерация назвала это «доп. баллами», числа не назвала" pill={{ t: 'ВОПРОС 15.5', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── борд роли ──────────────────────────────────────────────────── */

export const SCREENS: ScreenMap = {
  'Э0.1': { cap: 'Вход', view: () => <Login0_1 />, next: 'судьи своего региона' },
  'Э15.1': {
    cap: 'Судьи региона',
    view: () => (<><Judges15_1 /><Judges15_1States /></>),
    next: 'строка судьи',
  },
  'Э15.2': {
    cap: 'Карточка судьи региона',
    view: () => (<><Card15_2 /><Card15_2States /></>),
    next: 'поставить в наряд',
  },
  'Э15.3': {
    cap: 'Наряды региона',
    view: () => (<><Duty15_3 /><Duty15_3States /></>),
    next: 'документы на баллы',
  },
  'Э15.4': {
    cap: 'Начисления региона',
    view: () => (<><Points15_4 /><Points15_4States /></>),
  },
};

export function Role15Board() {
  return <Board role={R15} screens={SCREENS} />;
}
