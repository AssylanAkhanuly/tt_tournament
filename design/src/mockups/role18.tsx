/* Роль 18 · Врач соревнований — макеты по флоу. Источник —
   `flows/18-vrach-sorevnovaniy.md`.

   Роль заведена совещанием федерации 04.11.2026 вместо заместителя главного
   судьи по медицинской части: медицинский допуск даёт врач, главный судья
   справок не проверяет. Врач отвечает за то, что приложена нужная справка, а
   не за её подлинность.

   Что макеты обязаны передать:
   1. отметку врач ставит на каждого и сам — массового «допустить всех» нет;
   2. справка из DamuMed и справка, приложенная вручную, различаются сразу,
      в строке списка: вручную приложенные и надо открывать;
   3. область роли — один турнир на время его проведения: в шапке турнир, а
      не сезон.

   Устройство — десктоп и телефон ✳ (наше): разбор заявок за три дня до старта
   — с компьютера, в день старта врач в зале с телефоном. */

import { useState, type ReactNode } from 'react';
import {
  Check, ChevronLeft, ChevronRight, ClipboardCheck, FileText, Send, Stethoscope, X,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  ActionBar,
  AuthScreen,
  DataTable,
  FileDrop,
  FormGrid,
  KV,
  Laptop,
  Panel,
  Phone,
  PhoneRoleApp,
  PickField,
  Pill,
  Row,
  Rows,
  ScreenScope,
  SearchInput,
  Segmented,
  StatTiles,
  TextInput,
  WebApp,
  type RoleUI,
} from '@/shared/kit/app';
import { Brand } from '../ui';
import { Board, States, Shot, type ScreenMap } from './shell';
import { Login0_1, LoginPhone0_1 } from './role00';

/* ── Роль ───────────────────────────────────────────────────────── */

/** Область роли — турнир, поэтому в шапке турнир и его состояние. */
const R18: RoleUI = {
  num: '18',
  title: 'Врач соревнований',
  person: { nm: 'Жаксылыкова Г.', rl: 'Врач соревнований', av: AW(58) },
  brandName: 'Чемпионат Казахстана 2026',
  brandSub: 'Одиночный · олимпийская · г. Астана',
  badge: 'ДОПУСК',
  nav: [
    [<Stethoscope size={16} key="t" />, 'Мои турниры'],
    [<ClipboardCheck size={16} key="d" />, 'Допуск участников'],
  ],
  roles: ['Врач соревнований', 'Спортсмен'],
};

type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const Pl = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;

const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/* ── Данные: заявки турнира глазами врача ───────────────────────── */

type Src = 'damu' | 'file' | 'none';
type Mark = 'ok' | 'no' | 'wait';
type Person = {
  av: string; nm: string; born: string; reg: string; club: string;
  src: Src; issued?: string; mark: Mark; why?: string;
};

const PEOPLE: Person[] = [
  { av: AW(12), nm: 'Ахметова Дана', born: '14.02.2009', reg: 'Астана', club: '«Барыс»', src: 'file', issued: '02.05.2026', mark: 'wait' },
  { av: A(51), nm: 'Токаев Марат', born: '03.07.2006', reg: 'Астана', club: '«Барыс»', src: 'damu', issued: '20.01.2026', mark: 'wait' },
  { av: AW(23), nm: 'Ким Виктория', born: '28.10.2008', reg: 'Караганда', club: '«Шахтёр»', src: 'none', mark: 'wait' },
  { av: AW(35), nm: 'Нурланова Айгерим', born: '09.04.2010', reg: 'Актобе', club: '«Актобе»', src: 'file', issued: '05.05.2026', mark: 'wait' },
  { av: A(32), nm: 'Смагулов Алан', born: '17.06.2007', reg: 'Алматы', club: '«Алатау»', src: 'damu', issued: '12.03.2026', mark: 'ok' },
  { av: A(44), nm: 'Цой Даниил', born: '22.01.2007', reg: 'Шымкент', club: '«Ордабасы»', src: 'damu', issued: '15.02.2026', mark: 'ok' },
  { av: A(60), nm: 'Байжанов Ерлан', born: '30.09.2005', reg: 'Павлодар', club: '«Иртыш»', src: 'file', issued: '28.04.2026', mark: 'no', why: 'не та форма справки' },
];

const SRC: Record<Src, { t: string; cls: Cls }> = {
  damu: { t: 'DAMUMED', cls: 'live' },
  file: { t: 'ВРУЧНУЮ', cls: 'wait' },
  none: { t: 'НЕТ СПРАВКИ', cls: 'bad' },
};
const MARK: Record<Mark, { t: string; cls: Cls }> = {
  ok: { t: 'ДОПУЩЕН', cls: 'live' },
  no: { t: 'НЕ ДОПУЩЕН', cls: 'bad' },
  wait: { t: 'ЖДЁТ', cls: 'reg' },
};

/** Вкладки допуска: подпись со счётчиком по всему составу турнира. */
const TABS: { t: string; n: number; pick: (p: Person) => boolean }[] = [
  { t: 'Ждут', n: 37, pick: (p) => p.mark === 'wait' },
  { t: 'Вручную', n: 12, pick: (p) => p.src === 'file' },
  { t: 'Допущены', n: 84, pick: (p) => p.mark === 'ok' },
  { t: 'Не допущены', n: 7, pick: (p) => p.mark === 'no' },
  { t: 'Все', n: 128, pick: () => true },
];
const tabLabel = (t: (typeof TABS)[number]) => `${t.t} · ${t.n}`;

const Who = ({ av, nm, sub }: { av: string; nm: string; sub?: string }) => (
  <span className="flex min-w-0 items-center gap-2.5">
    <Avatar size="sm">
      <Avatar.Image alt={nm} src={av} />
      <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
    </Avatar>
    <span className="min-w-0 leading-tight">
      <span className="block truncate font-medium">{nm}</span>
      {sub && <span className="block truncate text-xs text-neutral-500">{sub}</span>}
    </span>
  </span>
);

/* ── Э18.1 · Регистрация врача ──────────────────────────────────── */

const RegForm = () => (
  <FormGrid>
    <PickField label="Договор с" value="Федерация настольного тенниса РК" wide />
    <TextInput label="Номер договора" value="27/26-М" />
    <TextInput label="Дата договора" value="02.11.2026" />
    <FileDrop label="Договор" hint="" />
    <FileDrop label="Документ об образовании" hint="" />
    <FileDrop label="Удостоверение личности" hint="" />
  </FormGrid>
);

const RegHead = () => (
  <>
    <div className="mb-5 flex flex-col items-center gap-4 text-center">
      <Brand size="lg" />
      <div className="text-xl font-semibold tracking-tight">Регистрация врача соревнований</div>
    </div>
    <div className="mb-4">
      <KV
        items={[
          ['ИИН', '850412450318'],
          ['Фамилия, имя, отчество', 'Жаксылыкова Гульнара Ериковна'],
          ['Телефон', '+7 701 555 18 40'],
        ]}
      />
    </div>
  </>
);

export function SignUp18_1() {
  return (
    <Laptop>
      <AuthScreen wide>
        <RegHead />
        <RegForm />
        <Button className="mt-5 w-full" variant="primary">
          <Send size={15} /> Отправить на подтверждение
        </Button>
      </AuthScreen>
    </Laptop>
  );
}

const SignUp18_1Phone = () => (
  <Phone>
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 pb-4 pt-3">
      <RegHead />
      <div className="[&>div]:grid-cols-1">
        <RegForm />
      </div>
      <Button className="mt-5 w-full" variant="primary">
        <Send size={15} /> Отправить на подтверждение
      </Button>
    </div>
  </Phone>
);

const SignUp18_1States = () => (
  <States>
    <Shot tone="warning" title="На подтверждении" text="Документы ушли; вход откроется после согласования.">
      <Frag>
        <Rows>
          <Row nm="Договор 27/26-М · ФНТ РК" sub="отправлено 03.11.2026, 10:15" pill={{ t: 'НА ПОДТВЕРЖДЕНИИ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
    <Shot tone="success" title="Подтверждено" text="Роль врача появляется в переключателе ролей.">
      <Frag>
        <Rows>
          <Row nm="Врач соревнований" sub="подтвердила ФНТ РК · 04.11.2026" pill={{ t: 'РОЛЬ ВЫДАНА', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>
    <Shot tone="danger" title="Отклонено" text="Причина и повторная подача.">
      <Frag>
        <Rows>
          <Row nm="Документ об образовании" sub="«скан не читается» · 04.11.2026" pill={{ t: 'ОТКЛОНЕНО', cls: 'bad' }} action="Подать снова" />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э18.2 · Мои турниры ────────────────────────────────────────── */

type Tour = { nm: string; sub: string; val?: string; p: string; cls: Cls; to?: string };

const TOURS: Tour[] = [
  { nm: 'Чемпионат Казахстана 2026', sub: 'г. Астана · 18–20 мая · допуск с 15.05', val: 'ждут 37 из 128', p: 'ДОПУСК ИДЁТ', cls: 'wait', to: 'Э18.3' },
  { nm: 'Первенство РК до 15 лет', sub: 'г. Актобе · 21–24 мая', val: 'заявок 96', p: 'ДОПУСК С 18.05', cls: 'reg' },
];
const PAST: Tour[] = [
  { nm: 'Кубок Казахстана 2026', sub: 'г. Павлодар · 18–22 февраля', val: 'допущено 104 · не допущено 3', p: 'ЗАВЕРШЁН', cls: 'done' },
];

const TourRows = ({ items }: { items: Tour[] }) => (
  <div className="divide-y divide-neutral-100">
    {items.map((t) => (
      <Row key={t.nm} nm={t.nm} sub={t.sub} val={t.val} pill={{ t: t.p, cls: t.cls }} to={t.to} />
    ))}
  </div>
);

const TILES18_2 = [
  { v: '128', k: 'Заявок на Чемпионат' },
  { v: '84', k: 'Допущено', tone: 'g' as const },
  { v: '7', k: 'Не допущено', tone: 'b' as const },
  { v: '37', k: 'Ждут отметки', tone: 'a' as const, to: 'Э18.3' },
];

export function Tours18_2() {
  return (
    <WebApp role={{ ...R18, badge: false }} nav="Мои турниры" title="Мои турниры">
      <StatTiles items={TILES18_2} />
      <Panel title="По договору" flush>
        <TourRows items={TOURS} />
      </Panel>
      <Panel title="Прошедшие" flush>
        <TourRows items={PAST} />
      </Panel>
    </WebApp>
  );
}

const Tours18_2Phone = () => (
  <PhoneRoleApp role={{ ...R18, badge: false }} nav="Мои турниры" title="Мои турниры">
    <Panel title="По договору" flush>
      <TourRows items={TOURS} />
    </Panel>
    <Panel title="Прошедшие" flush>
      <TourRows items={PAST} />
    </Panel>
  </PhoneRoleApp>
);

const Tours18_2States = () => (
  <States>
    <Shot tone="info" title="Допуск ещё не открыт" text="Строка на чтение, стоит дата открытия.">
      <Frag>
        <Rows>
          <Row nm="Первенство РК до 15 лет" sub="г. Актобе · 21–24 мая" val="заявок 96" pill={{ t: 'ДОПУСК С 18.05', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>
    <Shot tone="info" title="Допуск закрыт" text="Турнир начался — отметки на чтение.">
      <Frag>
        <Rows>
          <Row nm="Чемпионат Казахстана 2026" sub="старт 18.05, 10:00" val="допущено 121 · не допущено 7" pill={{ t: 'ДОПУСК ЗАКРЫТ', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э18.3 · Допуск участников ──────────────────────────────────── */

const GRID18_3 = '2.2fr 1fr 1.4fr 1.3fr';

function Admit18_3Body({ phone }: { phone?: boolean }) {
  const [tab, setTab] = useState(tabLabel(TABS[0]));
  const [q, setQ] = useState('');
  const cur = TABS.find((t) => tabLabel(t) === tab) ?? TABS[0];
  const rows = PEOPLE.filter(cur.pick).filter((p) => p.nm.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className={phone ? '-mx-4 mb-3 overflow-x-auto px-4 **:data-seg:flex-nowrap' : 'mb-3 flex items-center justify-between gap-3'}>
        <Segmented items={TABS.map(tabLabel)} value={tab} onPick={setTab} ariaLabel="Отбор заявок" />
        {!phone && <SearchInput value={q} onChange={setQ} placeholder="Фамилия" />}
      </div>
      {phone ? (
        <Panel flush>
          <div className="divide-y divide-neutral-100">
            {rows.map((p) => (
              <Row
                key={p.nm}
                av={p.av}
                nm={p.nm}
                sub={`${p.reg} · ${SRC[p.src].t.toLowerCase()}`}
                pill={MARK[p.mark]}
                to="Э18.4"
              />
            ))}
          </div>
        </Panel>
      ) : (
        <DataTable
          cols={['Спортсмен', 'Регион', 'Справка', 'Отметка']}
          grid={GRID18_3}
          rows={rows.map((p) => ({
            key: p.nm,
            to: 'Э18.4',
            cells: [
              <Who key="w" av={p.av} nm={p.nm} sub={`${p.born.slice(-4)} г. р.`} />,
              p.reg,
              <span key="s" className="flex items-center gap-2">
                <Pl t={SRC[p.src].t} cls={SRC[p.src].cls} />
                {p.issued && <span className="text-xs text-neutral-500">{p.issued}</span>}
              </span>,
              <Pl key="m" t={MARK[p.mark].t} cls={MARK[p.mark].cls} />,
            ],
          }))}
        />
      )}
    </>
  );
}

export function Admit18_3() {
  return (
    <WebApp role={R18} nav="Допуск участников" title="Допуск участников" sub="Старт 18.05 · допуск до 10:00">
      <Admit18_3Body />
    </WebApp>
  );
}

const Admit18_3Phone = () => (
  <PhoneRoleApp role={R18} nav="Допуск участников" title="Допуск участников" sub="Старт 18.05 · ждут 37">
    <Admit18_3Body phone />
  </PhoneRoleApp>
);

const Admit18_3States = () => (
  <States>
    <Shot tone="success" title="Все разобраны" text="«Ждут» пусто.">
      <Frag>
        <Rows>
          <Row nm="Ждут отметки" val="0 из 128" pill={{ t: 'РАЗОБРАНО', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>
    <Shot tone="danger" title="У спортсмена нет справки" text="Строка помечена; отметки «допущен» для неё нет.">
      <Frag>
        <Rows>
          <Row av={AW(23)} nm="Ким Виктория" sub="Караганда · справка не приложена" pill={{ t: 'НЕТ СПРАВКИ', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э18.4 · Карточка участника ─────────────────────────────────── */

const REASONS = ['Справка не приложена', 'Не та форма справки', 'Медицинские противопоказания', 'Другое'];

function Card18_4Body({ phone }: { phone?: boolean }) {
  const p = PEOPLE[0];
  const [mark, setMark] = useState<Mark>(p.mark);
  const [ask, setAsk] = useState(false);
  const [why, setWhy] = useState(REASONS[1]);
  return (
    <>
      <Panel title="Спортсмен" flush>
        <div className="px-4 py-3">
          <Who av={p.av} nm={p.nm} sub={`${p.reg} · клуб ${p.club}`} />
        </div>
        <div className="px-4 pb-2">
          <KV
            items={[
              ['Дата рождения', p.born],
              ['Турнир', 'Чемпионат Казахстана 2026 · девушки'],
            ]}
          />
        </div>
      </Panel>

      <Panel title="Справка" extra={<Pl t="ПРИЛОЖЕНА ВРУЧНУЮ" cls="wait" />}>
        <KV
          items={[
            ['Требуемая форма', '027/у'],
            ['Дата выдачи', p.issued ?? '—'],
            ['Загружена', '06.05.2026, 21:14 · спортсменом'],
          ]}
        />
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            <FileText size={16} className="text-neutral-500" /> spravka_027u_akhmetova.pdf
          </span>
          <Button size="sm" variant="outline">Открыть</Button>
        </div>
      </Panel>

      <Panel title="Отметка врача" extra={<Pl t={MARK[mark].t} cls={MARK[mark].cls} />}>
        {mark === 'wait' ? (
          ask ? (
            <div className="flex flex-col gap-3">
              <Segmented items={REASONS} value={why} onPick={setWhy} ariaLabel="Причина" wide={phone} />
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" onPress={() => { setMark('no'); setAsk(false); }}>
                  <X size={15} /> Не допустить
                </Button>
                <Button variant="outline" onPress={() => setAsk(false)}>Отмена</Button>
              </div>
            </div>
          ) : (
            <span className="text-[13px] text-neutral-500">Отметки ещё нет</span>
          )
        ) : (
          <KV
            items={[
              ['Отметка', mark === 'ok' ? 'Допущен' : `Не допущен · ${why.toLowerCase()}`],
              ['Поставила', 'Жаксылыкова Г. · 15.05.2026, 11:02'],
            ]}
          />
        )}
      </Panel>

      <ActionBar>
        {mark === 'wait' && !ask && (
          <>
            <Button variant="primary" className={phone ? 'w-full' : undefined} onPress={() => setMark('ok')}>
              <Check size={15} /> Допущен
            </Button>
            <Button variant="outline" className={phone ? 'w-full' : undefined} onPress={() => setAsk(true)}>
              <X size={15} /> Не допущен
            </Button>
          </>
        )}
        {mark !== 'wait' && (
          <Button variant="outline" onPress={() => setMark('wait')}>Изменить отметку</Button>
        )}
        {!phone && (
          <span className="ml-auto flex gap-2">
            <Button variant="ghost" data-to="Э18.3">
              <ChevronLeft size={15} /> К списку
            </Button>
            <Button variant="ghost">
              Следующий <ChevronRight size={15} />
            </Button>
          </span>
        )}
      </ActionBar>
    </>
  );
}

export function Card18_4() {
  return (
    <WebApp role={R18} nav="Допуск участников" title="Ахметова Дана" back={{ label: 'Допуск участников', to: 'Э18.3' }}>
      <Card18_4Body />
    </WebApp>
  );
}

const Card18_4Phone = () => (
  <PhoneRoleApp role={R18} nav="Допуск участников" title="Ахметова Дана" back={{ label: 'Допуск участников', to: 'Э18.3' }}>
    <Card18_4Body phone />
  </PhoneRoleApp>
);

const Card18_4States = () => (
  <States>
    <Shot tone="success" title="Справка из DamuMed" text="Данные пришли сами.">
      <Frag>
        <Panel title="Справка" extra={<Pl t="DAMUMED" cls="live" />}>
          <KV
            items={[
              ['Форма', '027/у'],
              ['Номер', '027-2026-1184520'],
              ['Дата выдачи', '20.01.2026'],
              ['Кем выдана', 'ГП № 4, г. Астана'],
            ]}
          />
        </Panel>
      </Frag>
    </Shot>
    <Shot tone="danger" title="Справки нет" text="«Допущен» недоступен, остаётся «Не допущен».">
      <Frag>
        <Rows>
          <Row av={AW(23)} nm="Ким Виктория" sub="справка не приложена" pill={{ t: 'НЕТ СПРАВКИ', cls: 'bad' }} />
        </Rows>
        <ActionBar>
          <Button variant="outline">
            <X size={15} /> Не допущен
          </Button>
        </ActionBar>
      </Frag>
    </Shot>
    <Shot tone="info" title="Отметка поставлена" text="Кто и когда.">
      <Frag>
        <Rows>
          <Row av={A(32)} nm="Смагулов Алан" sub="Жаксылыкова Г. · 15.05.2026, 10:41" pill={{ t: 'ДОПУЩЕН', cls: 'live' }} />
          <Row av={A(60)} nm="Байжанов Ерлан" sub="не та форма справки · 15.05.2026, 10:48" pill={{ t: 'НЕ ДОПУЩЕН', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Карта экранов ──────────────────────────────────────────────── */

export const SCREENS: ScreenMap = {
  'Э18.1': {
    cap: 'Регистрация врача',
    view: () => (
      <>
        <SignUp18_1 />
        <SignUp18_1States />
      </>
    ),
    alt: () => <SignUp18_1Phone />,
    next: 'договор согласован',
  },
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э18.2': {
    cap: 'Мои турниры',
    view: () => (
      <>
        <Tours18_2 />
        <Tours18_2States />
      </>
    ),
    alt: () => <Tours18_2Phone />,
    next: 'строка турнира',
  },
  'Э18.3': {
    cap: 'Допуск участников',
    view: () => (
      <>
        <Admit18_3 />
        <Admit18_3States />
      </>
    ),
    alt: () => <Admit18_3Phone />,
    next: 'строка спортсмена',
  },
  'Э18.4': {
    cap: 'Карточка участника',
    view: () => (
      <>
        <Card18_4 />
        <Card18_4States />
      </>
    ),
    alt: () => <Card18_4Phone />,
  },
};

export function Role18Board() {
  return <Board role={R18} screens={SCREENS} />;
}
