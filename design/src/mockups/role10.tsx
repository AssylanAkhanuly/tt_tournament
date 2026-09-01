/* Роль 10 · Инспектор / супервайзер — макеты по флоу на новом слое (HeroUI).
   Содержание, решения и переходы — прежние (см. `flows/10-inspektor.md`);
   меняется подача: оболочка WebApp и доменные компоненты `kit/hero/app`.

   Роль турниром НЕ управляет — смотрит со стороны, поэтому на макетах нет ни
   одной кнопки, меняющей турнир: нет «Вызвать пару», «Ввести счёт», «Исправить
   счёт», «Назначить судью». Там, где у главного судьи стоит кнопка вызова, у
   инспектора — серая подпись, а панели хода турнира и журнала помечены пилюлей
   «ТОЛЬКО ПРОСМОТР». Единственные кнопки на экранах — про собственные
   материалы инспектора: отметить эпизод, выгрузить, отправить заключение.

   Полный адаптив ✳ (решение владельца, 30.08.2026: «все экраны в обоих»): у
   каждого экрана есть второй формат — телефон, — врезкой под ноутбучным
   кадром (`alt` в `SCREENS`). Инспектор ходит между столами, и эпизод он
   отмечает там, где его увидел. Поведение у двух кадров общее (`useEpisodes10_2`,
   `useJournal10_3`, `useReport10_4`), меняется подача: карта столов в две
   колонки, таблицы судей и критериев — карточками. */

import { useState, type ReactNode } from 'react';
import { Bookmark, Download, Eye, FileText, Gavel, History, Paperclip, Send } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  Bar,
  EmptyBox,
  FieldView,
  FilterSeg,
  FormGrid,
  Panel,
  PhoneRoleApp,
  Pill,
  Row,
  Rows,
  ScreenScope,
  SearchInput,
  WebApp,
  type RoleUI,
  Sheet,
} from '@/shared/kit/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
import { Login0_1, LoginPhone0_1 } from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.

    Разделы открытого турнира ✳ (28.08.2026): пункт был один — «На контроле», —
    и это ломало флоу: инспектор заходил в турнир и оказывался в тупике. Пункты
    сайдбара — не разделы системы, а разделы того старта, который открыт;
    «На контроле» стоит первым и возвращает к списку. */
const R10: RoleUI = {
  num: '10',
  title: 'Инспектор / супервайзер',
  person: { nm: 'Каримов А.', rl: 'Инспектор', av: A(48) },
  brandName: 'Инспекция соревнований',
  brandSub: 'Контроль качества судейства',
  nav: [
    [<Eye size={16} key="c" />, 'На контроле'],
    [<Gavel size={16} key="j" />, 'Работа судей'],
    [<History size={16} key="h" />, 'Журнал правок'],
    [<FileText size={16} key="r" />, 'Заключение'],
  ],
  /* Должность в наряде держит человек с судейской квалификацией ✳: срок
     аттестации и рейтинг у него живут в кабинете судьи, и попадать туда он
     должен отсюда, а не вторым входом. */
  roles: ['Инспектор / супервайзер', { t: 'Судья · вне турнира', to: 'Э0.8' }],
};

/* ── данные экранов (перенесены из старого слоя как есть) ─────────── */

type Cls = 'live' | 'wait' | 'bad' | 'reg';

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    переносятся без переписывания. */
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent',
};
const P = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;

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

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Пилюля «только просмотр» в шапке панели — главный признак роли. */
const ReadOnly = () => (
  <Chip className="whitespace-nowrap" color="default" size="sm" variant="soft">
    <Eye size={11} className="mr-1" /> ТОЛЬКО ПРОСМОТР
  </Chip>
);

/** Полоса действий: слева состояние («что выбрано», «сколько выгружено»),
    справа кнопки. Кнопка без ответа читается как сломанная — эта полоса и
    есть место ответа.

    На телефоне ✳ (30.08.2026) ответ встаёт над кнопками, а кнопки идут в ряд с
    переносом: в 392 px четыре кнопки рядом с фразой сжимают её до двух слов, а
    именно она и говорит, что произошло. */
const ActionRow = ({ count, phone, children }: { count: ReactNode; phone?: boolean; children?: ReactNode }) => (
  <div className={'mb-3 gap-4 ' + (phone ? 'flex flex-col gap-2' : 'flex items-center justify-between')}>
    <span className="min-w-0 text-[12.5px] leading-snug text-neutral-500">{count}</span>
    {children && (
      <span className={phone ? 'flex flex-wrap items-center gap-2' : 'flex shrink-0 items-center gap-2'}>
        {children}
      </span>
    )}
  </div>
);

/** «Отметить эпизод» — единственное, что инспектор на этих экранах делает
    руками, и кнопка без выбранной строки не знает, что отмечать: сначала
    строка, потом кнопка — тем же приёмом, что заявки у главного судьи (Э6.2). */
const MarkBtn = ({ ready, onPress }: { ready: boolean; onPress: () => void }) => (
  <Button size="sm" variant="primary" isDisabled={!ready} onPress={onPress}>
    <Bookmark size={14} /> Отметить эпизод
  </Button>
);

/** Строка события: время, стол и матч, было → стало, кто исправил, причина.
    Рабочая там, где по ней отмечают эпизод.

    `narrow` — телефонный кадр ✳: время и значки уходят в отдельный ряд над
    текстом. В одну строку на 392 px значок вида события и «ЭПИЗОД» съедали всё
    место, а в этой строке главное — что именно исправили и почему. */
function NoteRow({ n, on, marked, narrow, onSelect }: {
  n: Note;
  on?: boolean;
  /** Уже отмечена эпизодом — попадёт в основания заключения. */
  marked?: boolean;
  narrow?: boolean;
  onSelect?: () => void;
}) {
  const cls =
    'w-full px-4 py-2.5 text-left ' +
    (on ? 'bg-blue-50/60' : onSelect ? 'cursor-pointer hover:bg-neutral-50' : '');
  if (narrow) {
    return (
      <div
        data-row
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        className={cls + ' flex flex-col gap-1.5'}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-medium tabular-nums text-neutral-500">{n.at}</span>
          <P t={n.st} cls={n.cls} />
          {marked && (
            <Chip className="whitespace-nowrap" color="accent" size="sm" variant="primary">
              <Bookmark size={11} className="mr-1" /> ЭПИЗОД
            </Chip>
          )}
        </span>
        <span className="leading-tight">
          <span className="block text-[13.5px] font-medium">{n.nm}</span>
          <span className="block text-xs text-neutral-500">{n.sub}</span>
        </span>
      </div>
    );
  }
  return (
    <div
      data-row
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      className={cls + ' flex items-center gap-3'}
    >
      <span className="w-11 shrink-0 text-[12.5px] font-medium tabular-nums text-neutral-500">{n.at}</span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13.5px] font-medium">{n.nm}</span>
        <span className="block text-xs text-neutral-500">{n.sub}</span>
      </span>
      {marked && (
        <Chip className="whitespace-nowrap" color="accent" size="sm" variant="primary">
          <Bookmark size={11} className="mr-1" /> ЭПИЗОД
        </Chip>
      )}
      <P t={n.st} cls={n.cls} />
    </div>
  );
}


/** Полоса переключателя шире экрана ✳ (30.08.2026): на телефоне её прокручивают
    вбок, а не переносят — перенесённый в два ряда переключатель перестаёт
    читаться одним движением глаза. `w-max` обязателен: сам `FilterSeg` свёрстан
    переносом и без него послушно свернулся бы в две строки. */
const SegScroll = ({ children }: { children: ReactNode }) => (
  <div className="-mx-4 overflow-x-auto px-4">
    <div className="w-max">{children}</div>
  </div>
);

/** Подзаголовок раздела внутри панели (материалы заключения). */
const Sec = ({ children }: { children: ReactNode }) => (
  <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 first:mt-0">
    {children}
  </div>
);

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/* ── Э10.1 · Соревнования на контроле ────────────────────────────── */

/** Строка старта на телефоне ✳: название с состоянием сверху, срок заключения
    и кнопка — рядом снизу. В один ряд на 392 px не помещаются четыре вещи
    сразу: название, подпись с городом и судьёй, значок и кнопка. Оба перехода
    сохранены — сама строка ведёт в «работу судей», кнопка в заключение. */
const TourRowPhone = ({ t }: { t: (typeof TOURS)[number] }) => (
  <div data-to="Э10.2" data-row className="flex cursor-pointer flex-col gap-2 px-4 py-3">
    <div className="flex items-start justify-between gap-2">
      <span className="min-w-0 leading-tight">
        <span className="block text-[13.5px] font-medium">{t.nm}</span>
        <span className="block text-xs text-neutral-500">{t.sub}</span>
      </span>
      <P t={t.st} cls={t.cls} />
    </div>
    {/* Кнопки в строке нет ✳ (31.08.2026): карточка ведёт в работу судей
        (Э10.2), а заключение пишут оттуда — второе действие в строке отбирало
        клик у первого и на списке в двадцать турниров читалось как главное. */}
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-neutral-500">{t.val}</span>
    </div>
  </div>
);

/** Пояснение под списком — одно на оба формата. */
const Tours10_1Bar = () => (
  <Bar>
    Строка открывает старт: дальше он живёт разделами меню — работа судей, журнал правок и
    заключение. «На контроле» возвращает к этому списку. Назначает инспектора на соревнование,
    вероятно, председатель ГСК — подтвердить ✳.
  </Bar>
);

/** Список стартов, назначенных инспектору. Проп `variant` старой адаптивной
    рамки сохранён ради истории «Адаптив»: у нового слоя своей планшетной
    рамки веба пока нет. */
export function Tours10_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  /* Выгрузка в макете не отдаёт файл, но и молчать ей нельзя: кнопка без
     ответа читается как сломанная. */
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <WebApp
      role={R10}
      nav="На контроле"
      title="Соревнования на контроле"
      sub="Сезон 2026 · назначения от председателя ГСК"
    >
      {/* Плиток-счётчиков над списком больше нет ✳ (30.08.2026): экран — реестр,
          и его содержание — сам список. Четыре плитки пересказывали то, что и
          так стоит в строках («черновик», «отправлено»), а список отжимали
          вниз. По данным роли (`flows/data/role10.ts`, Э10.1) у экрана одна
          зона — список стартов; числа остались короткой строкой фактов. */}
      <ActionRow
        count={saved ?? '5 соревнований · сезон 2026 · 1 черновик · 3 отправлено · всё только просмотр'}
      >
        <Button
          size="sm"
          variant="outline"
          onPress={() => setSaved(`Выгружено ${TOURS.length} соревнований · сезон 2026 · CSV`)}
        >
          <Download size={14} /> Выгрузить список
        </Button>
      </ActionRow>
      {/* Строка открывает турнир и приземляет на «Работу судей» — оттуда
          инспектор и начинает. Кнопка ведёт сразу в заключение: к нему
          возвращаются много раз, и каждый раз проходить через ход турнира
          незачем. */}
      <Rows>
        {TOURS.map((t) => (
          <Row
            to="Э10.2"
            key={t.nm}
            nm={t.nm}
            sub={t.sub}
            val={t.val}
            pill={{ t: t.st, cls: t.cls }}
            action="Заключение"
            actionTo="Э10.4"
          />
        ))}
      </Rows>
      <div className="mt-4">
        <Tours10_1Bar />
      </div>
    </WebApp>
  );
}

/** Э10.1 на телефоне ✳ (30.08.2026, «все экраны в обоих»): инспектор смотрит
    соревнования и в зале, и по дороге — реестр из пяти строк переносится
    целиком, меняется только строка. */
function Tours10_1Phone() {
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <PhoneRoleApp
      role={R10}
      nav="На контроле"
      title="Соревнования на контроле"
      sub="Сезон 2026 · назначения от председателя ГСК"
    >
      <ActionRow
        phone
        count={saved ?? '5 соревнований · 1 черновик · 3 отправлено · всё только просмотр'}
      >
        <Button
          size="sm"
          variant="outline"
          onPress={() => setSaved(`Выгружено ${TOURS.length} соревнований · сезон 2026 · CSV`)}
        >
          <Download size={14} /> Выгрузить список
        </Button>
      </ActionRow>
      <Rows>
        {TOURS.map((t) => <TourRowPhone key={t.nm} t={t} />)}
      </Rows>
      <div className="mt-4">
        <Tours10_1Bar />
      </div>
    </PhoneRoleApp>
  );
}

const Tours10_1States = () => (
  <States>
    <Shot tone="info" title="Назначений нет" text="Пустое состояние.">
      <Frag w={520}>
        <EmptyBox
          title="Назначений пока нет"
          text="Соревнование появится здесь, когда председатель ГСК назначит вас инспектором."
        />
      </Frag>
    </Shot>
  </States>
);

/* ── Э10.2 · Работа судей на столах ──────────────────────────────── */

/* Карта столов у инспектора — по судьям ✳ (замечание федерации, 09.2026).

   Раньше в клетке стоял счёт матча: экран был копией панели главного судьи.
   Инспектору счёт не решает ничего — он оценивает работу судьи, и в клетке
   должно стоять то, по чему эту работу видно: кто судит и что у него за день.
   Пустой стол и стол без судьи разведены: «судья не на месте» — это уже
   критерий 1 (TZ §7.3), а не свободный стол. */
type Duty = {
  /** Фамилия судьи; `null` — стол без судьи. */
  j: string | null;
  /** Правок счёта после подтверждения за день. */
  fix: number;
  /** Задержек «вызов → старт» дольше нормы. */
  late: number;
  /** Карточек, вынесенных на этом столе. */
  cards: number;
  /** Стол в игре. */
  busy: boolean;
};

const DUTY: Duty[] = [
  { j: 'Пак С.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Ерлан Б.', fix: 0, late: 1, cards: 1, busy: true },
  { j: 'Ахметов К.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Оралбай Е.', fix: 2, late: 0, cards: 0, busy: true },
  { j: 'Сейтқали А.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Абдрахманов Е.', fix: 0, late: 0, cards: 2, busy: true },
  { j: null, fix: 0, late: 1, cards: 0, busy: true },
  { j: 'Тұрсынов М.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Бектұров Р.', fix: 1, late: 0, cards: 0, busy: true },
  { j: 'Қалиев С.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Аманжол Н.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Дәулет Ж.', fix: 0, late: 2, cards: 0, busy: true },
  { j: 'Жақсылық Б.', fix: 0, late: 0, cards: 1, busy: true },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
];

/** Карта столов по судьям. ⚠ Похожа на `TableMap` роли 6, но там в клетке
    счёт — предмет другой, общего компонента из них не собрать.

    `narrow` — телефонный кадр ✳: двадцать столов в пять колонок на 392 px дают
    клетку в шестьдесят пикселей, где фамилия судьи не помещается вовсе. В две
    колонки карта становится длиннее, но остаётся картой. */
const DutyMap = ({ narrow }: { narrow?: boolean }) => (
  <div className={'mb-4 grid gap-2 ' + (narrow ? 'grid-cols-2' : 'grid-cols-5')}>
    {DUTY.map((d, i) => {
      const head = (dot: string, dim?: boolean) => (
        <div className={'flex items-center justify-between text-[11px] font-semibold ' + (dim ? 'text-neutral-400' : 'text-neutral-500')}>
          Стол {i + 1} <span className={'h-1.5 w-1.5 rounded-full ' + dot} />
        </div>
      );
      if (!d.busy) {
        return (
          <div key={i} className="rounded-lg border border-dashed border-neutral-300 px-3 py-2">
            {head('bg-neutral-300', true)}
            <div className="mt-0.5 text-[12px] font-medium text-neutral-300">свободен</div>
          </div>
        );
      }
      if (!d.j) {
        /* Стол в игре без судьи — уже нарушение критерия 1, а не пустая клетка. */
        return (
          <div key={i} className="rounded-lg border border-red-300 bg-red-50 px-3 py-2">
            {head('bg-red-500')}
            <div className="mt-0.5 text-[12px] font-semibold text-red-600">судьи нет</div>
            {d.late > 0 && <div className="text-[11px] text-amber-700">задержек {d.late}</div>}
          </div>
        );
      }
      return (
        <div key={i} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
          {head('bg-green-500')}
          {/* В клетке судья, а не счёт: инспектор смотрит, кто судит. */}
          <div className="mt-0.5 truncate text-[12.5px] font-semibold">{d.j}</div>
          {d.fix || d.late || d.cards ? (
            <div className="flex flex-wrap gap-x-2 text-[11px] font-medium">
              {d.fix > 0 && <span className="text-red-600">правок {d.fix}</span>}
              {d.late > 0 && <span className="text-amber-600">задержек {d.late}</span>}
              {d.cards > 0 && <span className="text-neutral-500">карточек {d.cards}</span>}
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400">без замечаний</div>
          )}
        </div>
      );
    })}
  </div>
);

/** Судья за день по тем критериям, которые система измеряет сама (TZ §7.3).
    Эти же цифры лягут в заключение рядом с оценкой — инспектор ставит ступень,
    глядя на число, а не вспоминая его. */
type JudgeDay = {
  nm: string;
  tables: string;
  /** Матчей отсужено за день. */
  m: number;
  /** Средняя задержка «вызов → старт», минут. */
  wait: number;
  /** Правок счёта после подтверждения. */
  fix: number;
  /** Расхождений при синхронизации. */
  sync: number;
  cards: number;
  /** Среднее время подтверждения результата, минут. */
  sign: number;
  /** Есть отмеченные инспектором эпизоды. */
  flag?: number;
};

const JUDGES: JudgeDay[] = [
  { nm: 'Оралбай Ержан', tables: 'столы 4, 9', m: 11, wait: 2, fix: 2, sync: 1, cards: 0, sign: 1, flag: 2 },
  { nm: 'Дәулет Жасұлан', tables: 'стол 13', m: 8, wait: 14, fix: 0, sync: 0, cards: 0, sign: 2, flag: 1 },
  { nm: 'Абдрахманов Ерлан', tables: 'стол 6', m: 9, wait: 3, fix: 0, sync: 0, cards: 2, sign: 1 },
  { nm: 'Пак Сергей', tables: 'стол 1', m: 10, wait: 2, fix: 0, sync: 0, cards: 0, sign: 1 },
  { nm: 'Бектұров Руслан', tables: 'стол 9', m: 7, wait: 4, fix: 1, sync: 0, cards: 0, sign: 3 },
];

const JDAY_GRID = '1.5fr 0.55fr 0.9fr 0.55fr 0.85fr 0.6fr 1fr 0.9fr';

/** Цифра красится сама, когда вышла за норму ✳: инспектор идёт по таблице
    глазами, и «14 мин» среди двоек должно останавливать взгляд без чтения. */
const Num = ({ bad, children }: { bad?: boolean; children: ReactNode }) => (
  <span className={'tabular-nums ' + (bad ? 'font-semibold text-red-600' : 'text-neutral-700')}>{children}</span>
);

/** Ключ записи журнала: время и матч — ими событие и опознают. */
const noteKey = (n: Note) => n.at + n.nm;

/** Что инспектор выбрал и что уже отметил эпизодом.

    Один хук на оба кадра экрана ✳ (30.08.2026): выбор строки и отметка эпизода
    — это поведение экрана, а не устройства, и две копии одного состояния
    разошлись бы на первой правке. */
function useEpisodes10_2() {
  /* Что выбрано для эпизода: строка судьи или замечание по технической части.
     Одна и та же кнопка отмечает и то, и другое — эпизод это «судья, стол,
     время», а не отдельный вид записи. */
  const [pick, setPick] = useState<{ k: string; label: string } | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  return {
    pick,
    marked,
    setSaved,
    mark: () => {
      if (!pick || marked.includes(pick.k)) return;
      setMarked([...marked, pick.k]);
    },
    sel: (k: string, label: string) => {
      setPick(pick?.k === k ? null : { k, label });
      setSaved(null);
    },
    /** Что написано в полосе действий: ответ на последнее действие или, если
        его не было, счётчики дня. */
    count: (fallback: string) =>
      saved ??
      (pick
        ? marked.includes(pick.k)
          ? `Отмечено эпизодом: ${pick.label}`
          : `Выбрано: ${pick.label} — «Отметить эпизод» положит это в основания заключения`
        : fallback),
  };
}

/** Судья за день на телефоне ✳: таблица из восьми колонок в 328 px не живёт —
    те же цифры идут подписями под фамилией, и «14 мин» так же краснеет. */
const JudgeCardPhone = ({ j, on, marked, onSelect }: {
  j: JudgeDay;
  on?: boolean;
  marked?: boolean;
  onSelect: () => void;
}) => (
  <div
    data-row
    role="button"
    tabIndex={0}
    onClick={onSelect}
    className={
      'flex cursor-pointer flex-col gap-1.5 px-4 py-3 ' + (on ? 'bg-blue-50/60' : 'hover:bg-neutral-50')
    }
  >
    <div className="flex items-start justify-between gap-2">
      <span className="min-w-0 leading-tight">
        <span className="block text-[13.5px] font-medium">{j.nm}</span>
        <span className="block text-xs text-neutral-500">{j.tables} · матчей {j.m}</span>
      </span>
      {(j.flag || marked) && <P t={`${(j.flag ?? 0) + (marked ? 1 : 0)} ОТМЕЧЕНО`} cls="wait" />}
    </div>
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-neutral-500">
      <span>вызов → старт <Num bad={j.wait >= 10}>{j.wait} мин</Num></span>
      <span>правок <Num bad={j.fix > 0}>{j.fix}</Num></span>
      <span>расхождений <Num bad={j.sync > 0}>{j.sync}</Num></span>
      <span>карточек <Num>{j.cards}</Num></span>
      <span>подтверждение <Num bad={j.sign >= 3}>{j.sign} мин</Num></span>
    </div>
  </div>
);

/** Что система не измеряет — сказано словами, а не пустой клеткой. Одна
    подпись на оба формата. */
const EyesOnly10_2 = () => (
  <div className="px-4 py-2.5 text-[12px] text-neutral-500">
    Работа с игроками, поведение в бригаде и внешний вид (критерии 6 и 8) система не измеряет —
    их инспектор проверяет глазами и ставит оценку в заключении
  </div>
);

export function Live10_2() {
  const ep = useEpisodes10_2();
  const { marked, pick, sel, mark, setSaved } = ep;
  const key = noteKey;
  return (
    <WebApp
      role={R10}
      nav="Работа судей"
      title="Работа судей на столах"
      sub="Чемпионат Казахстана 2026 · г. Астана · день 2, 13 марта"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      {/* Счётчики про судейство, а не про игру ✳: сколько столов без судьи,
          сколько правок и задержек — это и есть предмет инспекции. Куда отсюда
          идти, сказано на самом экране: отметил эпизод — он лёг в основания,
          дальше либо разбирать журнал, либо ставить оценки. */}
      <ActionRow
        count={ep.count(
          `13 судей · 1 стол без судьи · 4 правки · 4 задержки · отмечено эпизодов: ${marked.length}`,
        )}
      >
        <Button
          size="sm"
          variant="outline"
          onPress={() => setSaved('Выгружено: судьи и замечания дня 2 · CSV')}
        >
          <Download size={14} /> Выгрузить
        </Button>
        <Button size="sm" variant="outline" data-to="Э10.3">
          <History size={14} /> Журнал правок
        </Button>
        <Button size="sm" variant="outline" data-to="Э10.4">
          <FileText size={14} /> К заключению
        </Button>
        {/* Акцент — на работе инспектора, а не на переходах: без выбранной
            строки кнопка гаснет — отмечать нечего. */}
        <MarkBtn ready={!!pick && !marked.includes(pick.k)} onPress={mark} />
      </ActionRow>

      <DutyMap />

      <Panel
        title="Судьи на столах · день 2"
        sub="цифры, которые система измерила сама — критерии 1–5 и 7 (TZ §7.3)"
        extra={<ReadOnly />}
        flush
      >
        <Sheet
          grid={JDAY_GRID}
          cols={[
            'Судья',
            'Матчей',
            'Вызов → старт',
            'Правок',
            'Расхождений',
            'Карточек',
            'Подтверждение',
            'Эпизоды',
          ]}
        >
          {JUDGES.map((j) => (
            <div
              key={j.nm}
              role="button"
              tabIndex={0}
              onClick={() => sel(j.nm, `${j.nm} · ${j.tables}`)}
              data-on={pick?.k === j.nm ? '' : undefined}
              className="grid cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px]"
              style={{ gridTemplateColumns: JDAY_GRID }}
            >
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13.5px] font-medium">{j.nm}</span>
                <span className="block text-xs text-neutral-500">{j.tables}</span>
              </span>
              <Num>{j.m}</Num>
              <Num bad={j.wait >= 10}>{j.wait} мин</Num>
              <Num bad={j.fix > 0}>{j.fix}</Num>
              <Num bad={j.sync > 0}>{j.sync}</Num>
              <Num>{j.cards}</Num>
              <Num bad={j.sign >= 3}>{j.sign} мин</Num>
              <span>
                {j.flag || marked.includes(j.nm) ? (
                  <P t={`${(j.flag ?? 0) + (marked.includes(j.nm) ? 1 : 0)} ОТМЕЧЕНО`} cls="wait" />
                ) : (
                  <span className="text-xs text-neutral-400">нет</span>
                )}
              </span>
            </div>
          ))}
        </Sheet>
        <EyesOnly10_2 />
      </Panel>

      {/* Счёт матча — только там, где к технической части есть вопрос ✳.
          Вне замечаний его на экране нет: кто как сыграл, инспектору не
          решает ничего. */}
      <Panel
        title="Замечания по технической части"
        sub="здесь счёт нужен — и показан"
        extra={<ReadOnly />}
        flush
      >
        <div className="divide-y divide-neutral-100">
          {NOTES.map((n) => (
            <NoteRow
              key={key(n)}
              n={n}
              on={pick?.k === key(n)}
              marked={marked.includes(key(n))}
              onSelect={() => sel(key(n), n.nm)}
            />
          ))}
        </div>
      </Panel>
    </WebApp>
  );
}

/** Э10.2 на телефоне ✳ (30.08.2026, «все экраны в обоих»).

    Инспектор работает в зале и ходит между столами: отметить эпизод он должен
    там, где его увидел, а не вернувшись к ноутбуку. Поведение то же (тот же
    хук), меняется подача: карта столов в две колонки, таблица судей —
    карточками, строки журнала — в два ряда. */
function Live10_2Phone() {
  const ep = useEpisodes10_2();
  const { marked, pick, sel, mark, setSaved } = ep;
  return (
    <PhoneRoleApp
      role={R10}
      nav="Работа судей"
      title="Работа судей на столах"
      sub="Чемпионат Казахстана 2026 · день 2, 13 марта"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      <ActionRow
        phone
        count={ep.count(`13 судей · 1 стол без судьи · 4 правки · 4 задержки · эпизодов: ${marked.length}`)}
      >
        <Button size="sm" variant="outline" onPress={() => setSaved('Выгружено: судьи и замечания дня 2 · CSV')}>
          <Download size={14} /> Выгрузить
        </Button>
        <Button size="sm" variant="outline" data-to="Э10.3">
          <History size={14} /> Журнал правок
        </Button>
        <Button size="sm" variant="outline" data-to="Э10.4">
          <FileText size={14} /> К заключению
        </Button>
        <MarkBtn ready={!!pick && !marked.includes(pick.k)} onPress={mark} />
      </ActionRow>

      <DutyMap narrow />

      <Panel
        title="Судьи на столах · день 2"
        sub="цифры, которые система измерила сама — критерии 1–5 и 7 (TZ §7.3)"
        extra={<ReadOnly />}
        flush
      >
        <div className="divide-y divide-neutral-100">
          {JUDGES.map((j) => (
            <JudgeCardPhone
              key={j.nm}
              j={j}
              on={pick?.k === j.nm}
              marked={marked.includes(j.nm)}
              onSelect={() => sel(j.nm, `${j.nm} · ${j.tables}`)}
            />
          ))}
        </div>
        <EyesOnly10_2 />
      </Panel>

      <Panel title="Замечания по технической части" sub="здесь счёт нужен — и показан" extra={<ReadOnly />} flush>
        <div className="divide-y divide-neutral-100">
          {NOTES.map((n) => (
            <NoteRow
              key={noteKey(n)}
              n={n}
              narrow
              on={pick?.k === noteKey(n)}
              marked={marked.includes(noteKey(n))}
              onSelect={() => sel(noteKey(n), n.nm)}
            />
          ))}
        </div>
      </Panel>
    </PhoneRoleApp>
  );
}

const Live10_2States = () => (
  <States>
    <Shot
      tone="danger"
      title="Только просмотр"
      text="Кнопок вызова пары и ввода счёта нет — инспектор турниром не управляет."
      wide
    >
      <Frag>
        <Rows>
          <Row nm="Стол 4 · Смагулов — Ким" sub="2 : 1 · идёт" pill={{ t: 'ИДЁТ', cls: 'live' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="danger">
            У главного судьи в этой строке «Вызвать» и «Править счёт». У инспектора их нет вовсе —
            он наблюдает и пишет заключение.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э10.3 · Журнал правок и спорных ситуаций ────────────────────── */

const KINDS10_3 = ['Все события', 'Правки счёта', 'Неявки', 'Задержки'];
const KIND_ST: Record<string, string> = {
  'Правки счёта': 'ПРАВКА СЧЁТА',
  Неявки: 'НЕЯВКА',
  Задержки: 'ЗАДЕРЖКА',
};

/** Состояние журнала: срез, поиск, выбранная строка и отметки. Один хук на оба
    кадра экрана ✳ (30.08.2026) — фильтр и отметка работают одинаково, где бы
    инспектор ни смотрел. */
function useJournal10_3() {
  const [kind, setKind] = useState(KINDS10_3[0]);
  /* Поиск закрывает фильтры «по столу» и «по судье»: стол и фамилии стоят в
     самой записи, отдельные выпадающие списки были бы вторым способом сделать
     то же самое. */
  const [q, setQ] = useState('');
  /* Что выбрано и что уже отмечено эпизодом. Ключ строки — время и матч:
     событие в журнале ими и опознаётся. */
  const [pick, setPick] = useState<string | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  /* Выгрузка в макете не отдаёт файл, но и молчать ей нельзя ✳: отвечает
     строкой в полосе — сколько записей ушло и в каком срезе. */
  const [saved, setSaved] = useState<string | null>(null);
  const t = q.trim().toLowerCase();
  const rows = (kind === KINDS10_3[0] ? JOURNAL : JOURNAL.filter((n) => n.st === KIND_ST[kind]))
    .filter((n) => !t || n.nm.toLowerCase().includes(t) || n.sub.toLowerCase().includes(t));
  return {
    kind,
    q,
    rows,
    pick,
    marked,
    setQ,
    setSaved,
    pickKind: (v: string) => { setKind(v); setSaved(null); },
    toggle: (k: string) => { setPick(pick === k ? null : k); setSaved(null); },
    mark: () => {
      if (!pick || marked.includes(pick)) return;
      setMarked([...marked, pick]);
    },
    count: () =>
      saved ??
      (pick
        ? marked.includes(pick)
          ? 'Строка уже отмечена эпизодом — она в основаниях заключения'
          : 'Строка выбрана — «Отметить эпизод» положит её в основания заключения'
        : `${rows.length} записей на экране · фильтр: ${kind.toLowerCase()} · отмечено эпизодов: ${marked.length}`),
  };
}

/** Кнопки полосы действий журнала — одни на оба формата. */
const Journal10_3Acts = ({ j }: { j: ReturnType<typeof useJournal10_3> }) => (
  <>
    <Button
      size="sm"
      variant="outline"
      onPress={() => j.setSaved(`Выгружено ${j.rows.length} записей · срез «${j.kind.toLowerCase()}» · CSV`)}
    >
      <Download size={14} /> Выгрузить
    </Button>
    <Button size="sm" variant="outline" data-to="Э10.4">
      <FileText size={14} /> К заключению
    </Button>
    {/* Без выбранной строки кнопке нечего отмечать: она гаснет и говорит
        об этом в полосе, а не молчит в ответ на нажатие. */}
    <MarkBtn ready={!!j.pick && !j.marked.includes(j.pick)} onPress={j.mark} />
  </>
);

/** Пояснение под журналом — одно на оба формата. */
const Journal10_3Bar = () => (
  <Bar>
    Отмеченный эпизод уходит в основания заключения (Э10.4): оценка ниже «соответствует»
    без основания не отправляется — TZ §7.3.
  </Bar>
);

/** Список журнала. `narrow` — телефонный кадр: строка в два ряда. */
const Journal10_3List = ({ j, narrow }: { j: ReturnType<typeof useJournal10_3>; narrow?: boolean }) => (
  <Rows>
    {j.rows.length ? (
      j.rows.map((n) => (
        <NoteRow
          key={noteKey(n)}
          n={n}
          narrow={narrow}
          on={j.pick === noteKey(n)}
          marked={j.marked.includes(noteKey(n))}
          onSelect={() => j.toggle(noteKey(n))}
        />
      ))
    ) : (
      <div className="px-4 py-4 text-[12.5px] text-neutral-500">
        По запросу «{j.q}» в срезе «{j.kind.toLowerCase()}» записей нет.
      </div>
    )}
  </Rows>
);

export function Journal10_3() {
  const j = useJournal10_3();
  return (
    <WebApp
      role={R10}
      nav="Журнал правок"
      title="Журнал правок и спорных ситуаций"
      sub="Чемпионат Казахстана 2026 · день 2, 13 марта · было → стало, кто исправил, причина"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      <ActionRow count={j.count()}>
        <Journal10_3Acts j={j} />
      </ActionRow>

      {/* Фильтр рабочий: инспектор смотрит журнал по типу события — правки
          счёта и неявки разбираются по-разному. */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <FilterSeg items={KINDS10_3} active={j.kind} onPick={j.pickKind} />
        <SearchInput value={j.q} onChange={j.setQ} placeholder="Стол, судья или матч" className="w-64" />
        <ReadOnly />
      </div>

      <Journal10_3List j={j} />

      <div className="mt-4">
        <Journal10_3Bar />
      </div>
    </WebApp>
  );
}

/** Э10.3 на телефоне ✳: журнал инспектор открывает прямо у стола, когда спор
    ещё идёт. Фильтр из четырёх срезов в 360 px в строку не встаёт — он едет
    вбок в своей полосе, а поиск и значок «только просмотр» уходят под него. */
function Journal10_3Phone() {
  const j = useJournal10_3();
  return (
    <PhoneRoleApp
      role={R10}
      nav="Журнал правок"
      title="Журнал правок"
      sub="Чемпионат Казахстана 2026 · день 2 · было → стало, кто исправил"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      <ActionRow phone count={j.count()}>
        <Journal10_3Acts j={j} />
      </ActionRow>

      <div className="mb-3 flex flex-col gap-2">
        <SegScroll>
          <FilterSeg items={KINDS10_3} active={j.kind} onPick={j.pickKind} />
        </SegScroll>
        <div className="flex items-center gap-2">
          <SearchInput value={j.q} onChange={j.setQ} placeholder="Стол, судья или матч" className="min-w-0 flex-1" />
          <ReadOnly />
        </div>
      </div>

      <Journal10_3List j={j} narrow />

      <div className="mt-4">
        <Journal10_3Bar />
      </div>
    </PhoneRoleApp>
  );
}

/* ── Э10.4 · Заключение ──────────────────────────────────────────── */

/* Критерии оценки судьи — TZ §7.3 ✳ (замечание федерации, 09.2026: «нужно
   определить критерии и внести их»). Восемь пунктов; часть из них система
   измеряет сама и подставляет цифру, часть проверяется только глазами — и у
   них честно написано «только наблюдение», а не пустая клетка. */
const CRITERIA: { n: number; t: string; what: string; fact: string | null }[] = [
  { n: 1, t: 'Явка и работа по наряду', what: 'на своём столе по наряду, подмены согласованы', fact: 'столов без судьи: 1 · опозданий по вызову: 0' },
  { n: 2, t: 'Готовность стола к матчу', what: 'стол принят до вызова: инвентарь, сетка, счётчик', fact: 'вызов → старт: в среднем 2 мин' },
  { n: 3, t: 'Ведение счёта', what: 'счёт идёт вовремя, без расхождений и задним числом', fact: 'правок после подтверждения: 2 · расхождений: 1' },
  { n: 4, t: 'Соблюдение регламента матча', what: 'тайм-ауты, смена сторон, перерывы, время партий', fact: 'партий дольше регламента: 0' },
  { n: 5, t: 'Дисциплинарные решения', what: 'карточки вовремя и одинаково к обоим игрокам', fact: 'карточек: 0' },
  { n: 6, t: 'Работа с игроками и тренерами', what: 'корректность, разрешение споров, поведение при протесте', fact: null },
  { n: 7, t: 'Оформление результата', what: 'подтверждён вовремя, без запросов правки', fact: 'подтверждение: в среднем 1 мин · запросов правки: 1' },
  { n: 8, t: 'Внешний вид и субординация', what: 'форма, поведение в бригаде, работа с главным судьёй', fact: null },
];

type Grade = 'ok' | 'note' | 'bad';
const GRADES: { k: Grade; t: string }[] = [
  { k: 'ok', t: 'соответствует' },
  { k: 'note', t: 'замечание' },
  { k: 'bad', t: 'нарушение' },
];

/** Активная ступень красится по смыслу: зелёная · янтарная · красная. */
const GRADE_ON: Record<Grade, string> = {
  ok: 'bg-green-600 text-white',
  note: 'bg-amber-500 text-white',
  bad: 'bg-red-600 text-white',
};

const CRIT_GRID = '1.4fr 1.15fr 236px 1.2fr';

/** Заключение бывает двух видов ✳: по соревнованию целиком и по конкретному
    судье — они уходят разным адресатам. */
const KIND4 = ['По соревнованию', 'По конкретному судье'];

/** Итог заключения — из худшей оценки по критериям. */
const TOTAL: Record<Grade, { t: string; cls: Cls }> = {
  ok: { t: 'БЕЗ ЗАМЕЧАНИЙ', cls: 'live' },
  note: { t: 'С ЗАМЕЧАНИЯМИ', cls: 'wait' },
  bad: { t: 'НАРУШЕНИЯ', cls: 'bad' },
};

/** Состояние заключения: вид, оценки по критериям и основания под ними.

    Один хук на оба кадра экрана ✳ (30.08.2026): «замечание без основания не
    отправляется» — правило заключения, а не свойство ноутбука. */
function useReport10_4() {
  const [kind, setKind] = useState(KIND4[1]);
  /* Оценки по критериям и основания под ними. Замечание без основания
     отправить нельзя (§7.3) — макет показывает оба случая сразу: у критерия 3
     основание есть, у седьмого его ещё нет. */
  const [grade, setGrade] = useState<Record<number, Grade>>({
    1: 'ok', 2: 'ok', 3: 'note', 4: 'ok', 5: 'ok', 6: 'ok', 7: 'note', 8: 'ok',
  });
  const basis: Record<number, string> = {
    3: 'эпизод: стол 4, 14:52 — правка счёта после подтверждения',
  };
  /* Итог считается из худшей оценки и руками не задаётся: иначе он разъедется
     с критериями, по которым и собран. */
  const worst: Grade = Object.values(grade).includes('bad')
    ? 'bad'
    : Object.values(grade).includes('note')
      ? 'note'
      : 'ok';
  return {
    kind,
    setKind,
    grade,
    basis,
    worst,
    set: (n: number, g: Grade) => setGrade({ ...grade, [n]: g }),
    /* Чего не хватает для отправки: замечание без основания. */
    unbased: CRITERIA.filter((c) => grade[c.n] !== 'ok' && !basis[c.n]),
  };
}

/** Ступени оценки одной кнопкой-полосой. На телефоне те же три ступени, но
    выше ростом: по ним попадают пальцем. */
const GradeSeg = ({ cur, tall, onPick }: { cur: Grade; tall?: boolean; onPick: (g: Grade) => void }) => (
  <span className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white">
    {GRADES.map((g, i) => (
      <button
        type="button"
        key={g.k}
        onClick={() => onPick(g.k)}
        className={
          'flex-1 px-1.5 text-[11px] font-medium ' +
          (tall ? 'py-2 ' : 'py-1 ') +
          (cur === g.k ? GRADE_ON[g.k] : 'text-neutral-500 hover:bg-neutral-100') +
          (i > 0 ? ' border-l border-neutral-200' : '')
        }
      >
        {g.t}
      </button>
    ))}
  </span>
);

/** Основание под оценкой: эпизод, требование эпизода или прочерк.
    Замечание и нарушение требуют основания — оценка без причины в споре не
    стоит ничего. */
const Basis10_4 = ({ grade, basis }: { grade: Grade; basis?: string }) =>
  grade === 'ok' ? (
    <span className="text-neutral-400">—</span>
  ) : basis ? (
    <span className="flex items-start gap-1.5 font-medium text-green-700">
      <Bookmark size={13} className="mt-px shrink-0" /> {basis}
    </span>
  ) : (
    <span className="font-medium text-red-600">нужно основание — эпизод или комментарий</span>
  );

/** Шапка заключения: вид, поля и правило про итог. Одна на оба формата —
    поля на телефоне идут в одну колонку (`wide`). */
const Report10_4Head = ({ r, phone }: { r: ReturnType<typeof useReport10_4>; phone?: boolean }) => (
  <Panel title="Заключение" extra={<P t="ЧЕРНОВИК" cls="wait" />}>
    {/* Вид переключается, и от него меняется шапка формы: по судье —
        судья и его столы, по соревнованию — бригада целиком. */}
    {phone ? (
      <div className="mb-4">
        <SegScroll>
          <FilterSeg items={KIND4} active={r.kind} onPick={r.setKind} />
        </SegScroll>
      </div>
    ) : (
      <div className="mb-4">
        <FilterSeg items={KIND4} active={r.kind} onPick={r.setKind} />
      </div>
    )}
    <FormGrid>
      <FieldView label="Соревнование" value="Чемпионат Казахстана 2026" wide={phone} />
      <FieldView label="Период проверки" value="12–16 марта 2026" wide={phone} />
      {r.kind === KIND4[1] ? (
        <>
          <FieldView label="Судья" value="Оралбай Ержан · первая категория" wide={phone} />
          <FieldView label="Столы" value="4, 9 · 11 матчей" wide={phone} />
        </>
      ) : (
        <>
          <FieldView label="Судей в наряде" value="13 · столов 20" wide={phone} />
          <FieldView label="Отмечено эпизодов" value="9" wide={phone} />
        </>
      )}
    </FormGrid>
    <div className="mt-4">
      <Bar>
        Итог считается из худшей оценки и руками не задаётся: «с замечаниями» стоит потому,
        что замечание есть по критерию 3. На рейтинг судьи (TZ §7.2) заключение
        автоматически не влияет — что оно меняет, федерация не определила ⚠ 12.7.
      </Bar>
    </div>
  </Panel>
);

/** Материалы заключения: отмеченные эпизоды и приложенные файлы. Строки
    вертикальные по устройству и на 392 px не ломаются. */
const Report10_4Files = ({ phone }: { phone?: boolean }) => (
  <Panel title="Материалы" extra={<P t="4 ЭПИЗОДА · 3 ФАЙЛА" cls="reg" />}>
    {/* Кнопка стоит в теле, а не в шапке: в шапке она спорила бы за место
        с заголовком и бейджем. Полоса действий тут же говорит, когда
        прикладывать можно. */}
    <ActionRow phone={phone} count="Приложить можно, пока заключение — черновик">
      <Button size="sm" variant="outline">
        <Paperclip size={13} /> Приложить материалы
      </Button>
    </ActionRow>
    <Sec>Отмеченные эпизоды из хода турнира</Sec>
    <Rows>
      {EPISODES.slice(0, 2).map((e) => (
        <div key={e.nm} className="flex items-center gap-3 px-4 py-2.5">
          <Bookmark size={16} className="shrink-0 text-blue-600" />
          <span className="min-w-0 leading-tight">
            <span className="block text-[13.5px] font-medium">{e.nm}</span>
            <span className="block text-xs text-neutral-500">{e.sub}</span>
          </span>
        </div>
      ))}
    </Rows>
    <div className="mt-1.5 text-[11.5px] text-neutral-400">ещё 2 эпизода — все в основаниях</div>
    <Sec>Приложенные файлы</Sec>
    <Rows>
      {FILES.slice(0, 2).map((f) => (
        <div key={f.nm} className="flex items-center gap-3 px-4 py-2.5">
          <FileText size={16} className="shrink-0 text-neutral-400" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13.5px] font-medium">{f.nm}</span>
            <span className="block text-xs text-neutral-500">{f.sub}</span>
          </span>
          <Paperclip size={15} className="text-neutral-400" />
        </div>
      ))}
    </Rows>
    <div className="mt-1.5 text-[11.5px] text-neutral-400">ещё 1 файл</div>
  </Panel>
);

/** Полоса отправки: чего не хватает и сама кнопка. На телефоне кнопка встаёт
    под фразой во всю ширину — рядом с ней фраза о недостающем основании
    сжималась до двух слов. */
const Report10_4Send = ({ unbased, phone }: { unbased: typeof CRITERIA; phone?: boolean }) => (
  <div
    className={
      'gap-4 border-t border-neutral-100 bg-neutral-50 px-4 py-3 ' +
      (phone ? 'flex flex-col gap-2' : 'flex items-center justify-between')
    }
  >
    <span className="text-[12.5px] text-neutral-500">
      {unbased.length
        ? `Отправить нельзя: у ${unbased.length} ${unbased.length === 1 ? 'замечания' : 'замечаний'} нет основания (критерий ${unbased.map((c) => c.n).join(', ')})`
        : 'Все замечания обоснованы — заключение можно отправлять'}
    </span>
    <Button className={phone ? 'w-full' : undefined} variant="primary" isDisabled={unbased.length > 0}>
      <Send size={15} /> Отправить заключение
    </Button>
  </div>
);

/** Заголовок панели критериев. На телефоне остаётся один значок итога:
    пояснение «итог из худшей оценки» стоит в плашке выше и в шапке на 392 px
    только отжимало название панели. */
const CritExtra = ({ worst, phone }: { worst: Grade; phone?: boolean }) => (
  <span className="flex items-center gap-2">
    {!phone && <span className="text-xs text-neutral-500">итог из худшей оценки</span>}
    <P t={TOTAL[worst].t} cls={TOTAL[worst].cls} />
  </span>
);

/** Фон строки критерия по её оценке — один на оба формата. */
const critTone = (g: Grade) => (g === 'bad' ? 'bg-red-50/50' : g === 'note' ? 'bg-amber-50/50' : '');

export function Report10_4() {
  const r = useReport10_4();
  return (
    <WebApp
      role={R10}
      nav="Заключение"
      title="Заключение по судье"
      sub="Чемпионат Казахстана 2026 · Оралбай Ержан · черновик от 14.03.2026"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки
          «Заключение» и «Материалы» стояли в полуколонках — шапку панели туда
          не удавалось вписать без обёртки `min-w-0`, а списки эпизодов и файлов
          жались в узкую полосу. Панель сама держит отступ снизу, обёртка не
          нужна. */}
      <>
        <Report10_4Head r={r} />
        <Report10_4Files />
      </>

      {/* Форма — сами критерии, а не свободный текст ✳. Рядом с каждым стоит
          то, что система измерила сама: инспектор ставит ступень, глядя на
          цифру, а не вспоминая её. */}
      <Panel
        title="Оценка по критериям · TZ §7.3"
        sub={r.kind === KIND4[1] ? 'Оралбай Ержан · столы 4, 9' : 'бригада целиком · 13 судей'}
        extra={<CritExtra worst={r.worst} />}
        flush
      >
        <Sheet
          grid={CRIT_GRID}
          cols={['Критерий', 'Что измерила система', 'Оценка', 'Основание']}
        >
          {CRITERIA.map((c) => (
            <div
              key={c.n}
              className={'grid items-center gap-3 px-4 py-2.5 text-[13px] ' + critTone(r.grade[c.n])}
              style={{ gridTemplateColumns: CRIT_GRID }}
            >
              <span className="min-w-0 leading-tight">
                <span className="block text-[13.5px] font-medium">{c.n}. {c.t}</span>
                <span className="block text-xs text-neutral-500">{c.what}</span>
              </span>
              {/* Четыре критерия система не измеряет — так и написано, а не
                  пустая клетка: пустота читается как «не посчиталось». */}
              <span className={'text-xs ' + (c.fact ? 'text-neutral-600' : 'italic text-neutral-400')}>
                {c.fact ?? 'только наблюдение'}
              </span>
              <GradeSeg cur={r.grade[c.n]} onPick={(g) => r.set(c.n, g)} />
              <span className="min-w-0 text-xs leading-snug">
                <Basis10_4 grade={r.grade[c.n]} basis={r.basis[c.n]} />
              </span>
            </div>
          ))}
        </Sheet>

        <Report10_4Send unbased={r.unbased} />
      </Panel>
    </WebApp>
  );
}

/** Э10.4 на телефоне ✳ (30.08.2026, «все экраны в обоих»).

    Заключение пишут не в зале, а после — но правят его и с телефона: инспектор
    возвращается к черновику много раз. Таблица из четырёх колонок на 392 px не
    живёт, поэтому каждый критерий стал карточкой: название и что система
    измерила — сверху, ступени оценки — полосой во всю ширину, основание —
    строкой под ними. Порядок и правило те же: без основания не отправляется. */
function Report10_4Phone() {
  const r = useReport10_4();
  return (
    <PhoneRoleApp
      role={R10}
      nav="Заключение"
      title="Заключение по судье"
      sub="Оралбай Ержан · черновик от 14.03.2026"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      <Report10_4Head r={r} phone />
      <Report10_4Files phone />

      <Panel
        title="Оценка по критериям · §7.3"
        sub={r.kind === KIND4[1] ? 'Оралбай Ержан · столы 4, 9' : 'бригада целиком · 13 судей'}
        extra={<CritExtra worst={r.worst} phone />}
        flush
      >
        <div className="divide-y divide-neutral-100">
          {CRITERIA.map((c) => (
            <div key={c.n} className={'flex flex-col gap-2 px-4 py-3 ' + critTone(r.grade[c.n])}>
              <span className="leading-tight">
                <span className="block text-[13.5px] font-medium">{c.n}. {c.t}</span>
                <span className="block text-xs text-neutral-500">{c.what}</span>
              </span>
              <span className={'text-xs ' + (c.fact ? 'text-neutral-600' : 'italic text-neutral-400')}>
                {c.fact ?? 'только наблюдение'}
              </span>
              <GradeSeg cur={r.grade[c.n]} tall onPick={(g) => r.set(c.n, g)} />
              <span className="text-xs leading-snug">
                <Basis10_4 grade={r.grade[c.n]} basis={r.basis[c.n]} />
              </span>
            </div>
          ))}
        </div>
        <Report10_4Send unbased={r.unbased} phone />
      </Panel>
    </PhoneRoleApp>
  );
}

const Report10_4States = () => (
  <States>
    <Shot tone="success" title="Отправленное заключение" text="Только чтение.">
      <Frag w={520}>
        <Rows>
          <Row nm="Заключение по Кубку РК" sub="отправлено 21.05.2026, 18:40" pill={{ t: 'ОТПРАВЛЕНО', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>

    {/* Замечание без основания ✳ — состояние, в которое инспектор попадает
        чаще всего: оценку поставил, эпизод приложить забыл. */}
    <Shot
      tone="danger"
      title="Замечание без основания — отправить нельзя ✳"
      text="Оценка ниже «соответствует» требует эпизода или комментария (TZ §7.3): без причины она в споре не стоит ничего."
      wide
    >
      <Frag>
        <Rows>
          <Row nm="Критерий 3 · ведение счёта" sub="замечание · эпизод: стол 4, 14:52 — правка после подтверждения" pill={{ t: 'ОБОСНОВАНО', cls: 'live' }} />
          <Row nm="Критерий 7 · оформление результата" sub="замечание · основания нет" pill={{ t: 'НУЖНО ОСНОВАНИЕ', cls: 'bad' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Итог считается из худшей оценки и руками не задаётся: одно замечание делает заключение
            «с замечаниями», одно нарушение — «нарушения».
          </Bar>
        </div>
      </Frag>
    </Shot>

    {/* Перечень критериев — наш проект: в документах федерации его нет. */}
    <Shot
      tone="warning"
      title="Критерии ждут утверждения ✳"
      text="Восемь пунктов и три ступени внесены нами (TZ §7.3) — федерация их не присылала."
    >
      {/* Подписи укорочены до одной строки кадра: в узком фрагменте вопрос
          дочитывался до середины слова, а «утвердить или поправить» и так
          сказано заголовком кадра. */}
      <Frag w={520}>
        <Rows>
          <Row nm="Перечень и шкала" sub="нужна ли балльная шкала вместо трёх ступеней" pill={{ t: 'ВОПРОС 15.2', cls: 'bad' }} />
          <Row nm="Вес критериев" sub="все ли равны — или грубое нарушение решает итог само" pill={{ t: 'ВОПРОС 15.2', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Что меняет заключение — не определено"
      text="⚠ 12.7: кому уходит заключение и что оно меняет — рейтинг судьи, допуск, результат."
    >
      <Frag w={520}>
        <Rows>
          <Row nm="Рейтинг судьи" sub="влияет ли заключение" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
          <Row nm="Допуск к следующим турнирам" sub="влияет ли заключение" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── борд роли ───────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    /* Вход в телефоне уже нарисован у сквозных экранов — берём его, а не
       рисуем второй: вход один на сайт и приложение. */
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э10.1': {
    cap: 'Соревнования на контроле',
    view: () => (
      <>
        <Tours10_1 />
        <Tours10_1States />
      </>
    ),
    /* Состояния во втором формате не повторяются: они про поведение экрана, а
       не про устройство. */
    alt: () => <Tours10_1Phone />,
    next: 'строка турнира',
  },
  'Э10.2': {
    cap: 'Ход турнира глазами инспектора',
    view: () => (
      <>
        <Live10_2 />
        <Live10_2States />
      </>
    ),
    alt: () => <Live10_2Phone />,
    next: 'вкладка «журнал правок»',
  },
  'Э10.3': {
    cap: 'Журнал правок и спорных ситуаций',
    view: () => <Journal10_3 />,
    alt: () => <Journal10_3Phone />,
    next: 'эпизоды в заключение',
  },
  'Э10.4': {
    cap: 'Заключение',
    view: () => (
      <>
        <Report10_4 />
        <Report10_4States />
      </>
    ),
    alt: () => <Report10_4Phone />,
  },
};

export function Role10Board() {
  return <Board role={R10} screens={SCREENS} />;
}
