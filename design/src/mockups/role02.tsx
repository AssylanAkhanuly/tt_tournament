/* Роль 2 · Экономист / бухгалтер — макеты по флоу на новом слое (HeroUI) ✳ (30.08.2026).
   Содержание, экраны и переходы — прежние (см. `flows/02-ekonomist.md` и
   `flows/data/role02.ts`); меняется подача: оболочка WebApp и доменные
   компоненты `kit/hero/app` вместо старого макетного слоя.

   Главное про роль: обычно бухгалтер не участвует — спортсмен платит картой, и
   строка становится «оплачен» по подтверждению банка (TZ §9.2). Экраны нужны
   для сверки и исключений, поэтому отметка вручную (Э2.3) и снятие отметки
   (Э2.4) — диалоги поверх карточки взноса, с обязательным основанием. */

import { useState, type ReactNode } from 'react';
import {
  Banknote, Download, FileSpreadsheet, FileWarning, RefreshCw, Undo2, Wallet,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import {
  A, AW, Attention, Bar, DataTable, DisabledAction, EmptyBox, Facts, FieldView,
  FilterSeg, FormGrid, InlineDialog, KV, Panel, PickField, Pill, QuietAction, Row, Rows,
  ScreenScope, SearchInput, StatTiles, TextInput, WebApp,
  type AttnItem, type RoleUI,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки,
   полки состояний и «ещё один кадр». Сами экраны собраны новым слоем. */
import { Also, Board, States, Shot, type ScreenMap } from './shell';
import { Login0_1 } from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    `badge: false` — роль вне турнира, значка состояния в шапке нет. */
const R02: RoleUI = {
  num: '2',
  title: 'Экономист / бухгалтер',
  person: { nm: 'Сериков Н.', rl: 'Экономист ФНТ РК', av: A(60) },
  brandName: 'Взносы 2026',
  brandSub: 'Годовой членский взнос федерации',
  badge: false,
  nav: [
    [<Wallet size={16} key="w" />, 'Взносы'],
    [<FileSpreadsheet size={16} key="f" />, 'Выгрузки'],
  ],
};

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/** Человек в строке таблицы: фото и две строки. ⚠ Дупликация с role05 — когда
    таких мест станет три, `Who` должен переехать в `kit/hero/app`. */
const Who = ({ av, nm, sub }: { av: string; nm: string; sub?: ReactNode }) => (
  <span className="flex min-w-0 items-center gap-2.5">
    <Avatar size="sm">
      <Avatar.Image alt={nm} src={av} />
      <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
    </Avatar>
    <span className="min-w-0 leading-tight">
      <span className="block truncate text-[13.5px] font-medium">{nm}</span>
      {sub && <span className="block truncate text-xs text-neutral-500">{sub}</span>}
    </span>
  </span>
);

/* ── Данные экранов ─────────────────────────────────────────────── */

/** Состояние взноса — цвета из флоу: оплачен зелёный, не оплачен серый,
    просрочен красный. Серый, а не янтарный: «не оплачен» — массовое рабочее
    состояние начала года, тревожить им нельзя; горит только просрочка. */
type FeeSt = 'paid' | 'unpaid' | 'late';
const FST: Record<FeeSt, { t: string; color: 'success' | 'default' | 'danger' }> = {
  paid: { t: 'ОПЛАЧЕН', color: 'success' },
  unpaid: { t: 'НЕ ОПЛАЧЕН', color: 'default' },
  late: { t: 'ПРОСРОЧЕН', color: 'danger' },
};

type Fee = {
  av: string;
  nm: string;
  reg: string;
  club: string;
  born: string;
  st: FeeSt;
  /** Дата оплаты; у просроченных — с какого числа горит. */
  when: string;
  /** Как оплачен: картой через ePay либо отметка вручную — с автором. */
  how: string;
};

const FEES: Fee[] = [
  { av: A(32), nm: 'Смагулов Алан', reg: 'Алматы', club: '«Алатау»', born: '2004', st: 'paid', when: '14.01', how: 'картой · Halyk ePay' },
  { av: A(44), nm: 'Ким Георгий', reg: 'Астана', club: 'СКА', born: '2003', st: 'paid', when: '09.01', how: 'картой · Halyk ePay' },
  { av: A(22), nm: 'Жумабеков Расул', reg: 'Караганда', club: '«Шахтёр»', born: '2007', st: 'unpaid', when: '—', how: '—' },
  { av: AW(21), nm: 'Тлеуова Аружан', reg: 'Шымкент', club: '«Достык»', born: '2009', st: 'unpaid', when: '—', how: '—' },
  { av: A(56), nm: 'Гладун Игорь', reg: 'Тараз', club: 'без клуба', born: '2001', st: 'late', when: 'срок вышел 31.03', how: '—' },
  { av: A(13), nm: 'Пак Сергей', reg: 'Павлодар', club: '«Иртыш»', born: '2005', st: 'paid', when: '22.02', how: 'вручную · Сериков Н.' },
];

/** Полоса сверки: платежи, по которым банк не прислал подтверждение и система
    добирает статус опросом. Тем же компонентом очереди, что у остальных ролей:
    вопрос один — «что от меня ждут», в колонке решения — что делать. */
const SVERKA: AttnItem[] = [
  {
    n: '7',
    t: 'платежей без подтверждения банка',
    rows: [
      {
        nm: 'Оралбай Ержан',
        mt: 'Астана · карта списана 27.08, 19:30',
        why: 'ждёт со вчерашнего дня',
        who: 'проверить в банке — разовый запрос в ePay',
        to: 'Э2.2',
        cls: 'bad',
      },
      {
        nm: 'Абишев Санжар',
        mt: 'Актобе · карта списана 28.08, 14:02',
        why: 'подтверждение не пришло 40 минут',
        who: 'проверить в банке — разовый запрос в ePay',
        to: 'Э2.2',
      },
      {
        nm: 'Цой Виктор',
        mt: 'Караганда · карта списана 28.08, 13:47',
        why: 'подтверждение не пришло 55 минут',
        who: 'проверить в банке — разовый запрос в ePay',
        to: 'Э2.2',
      },
    ],
  },
];

/* ── Э2.1 · Взносы за сезон ────────────────────────────────────── */

/** Срез таблицы по состоянию взноса — фильтр из флоу. */
const FSEG = ['Все', 'Оплачен', 'Не оплачен', 'Просрочен'];
const FMAP: Record<string, FeeSt | undefined> = {
  Оплачен: 'paid',
  'Не оплачен': 'unpaid',
  Просрочен: 'late',
};

const FEE_GRID = '1.5fr 0.8fr 0.9fr 122px 118px 1.1fr 138px';

/** Взносы за сезон: сверка первой, счётчики года, фильтры и таблица.

    Проп `variant` старой адаптивной рамки сохранён ради истории «Адаптив»
    (`Fees2_1Tablet`): у нового слоя своей планшетной рамки веба пока нет. */
export function Fees2_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  const [f, setF] = useState(FSEG[0]);
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const want = FMAP[f];
  const rows = FEES.filter(
    (r) => (!want || r.st === want) && (!t || r.nm.toLowerCase().includes(t)),
  );
  return (
    <WebApp
      role={R02}
      nav="Взносы"
      title="Взносы за сезон"
      sub="2026 год · ₸ 10 000"
      hint="⚠ Вопрос 6.2: взнос считается за календарный год или за сезон — не решено; пока показываем календарный год."
    >
      {/* Сверка первой: единственное, что действительно ждёт бухгалтера.
          Строка ведёт в карточку взноса — там кнопка «Проверить в банке». */}
      <Attention items={SVERKA} />
      <div className="-mt-2 mb-4 text-[12px] text-neutral-500">
        Рабочее состояние, а не ошибка: сообщение банка могло потеряться в сети — система добирает
        статус опросом.
      </div>

      <StatTiles
        items={[
          { v: '412 / 526', k: 'Оплатили взнос', tone: 'g' },
          { v: '₸ 4,12 млн', k: 'Поступило за период · 78%' },
          { v: '96', k: 'Не оплачено' },
          /* Просрочка — единственное горящее число ряда. */
          { v: '18', k: 'Просрочено', tone: 'b' },
        ]}
      />

      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <FilterSeg items={FSEG} active={f} onPick={setF} />
          <Facts
            items={[
              { k: 'взнос', v: '₸ 10 000' },
              { k: 'срок уплаты до', v: '31.03', hot: true },
            ]}
          />
        </div>
        {/* Реестр оплат по текущему фильтру за период — файлом, в «Выгрузки». */}
        <Button variant="outline">
          <Download size={15} /> Выгрузить список
        </Button>
      </div>

      {/* Год и срезы — статичный выбор (PickField, без портала): живой список
          без данных под ним врал бы. Год первым — ⚠ 6.2: год или сезон. */}
      <div className="mb-3 grid grid-cols-[120px_1fr_1fr_1fr_1.4fr] items-end gap-3">
        <PickField label="Год взноса" value="2026" />
        <PickField label="Регион" value="Все регионы" />
        <PickField label="Клуб" value="Все клубы" />
        <PickField label="Год рождения" value="Все годы" />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500">Поиск по ФИО</span>
          <SearchInput value={q} onChange={setQ} placeholder="Фамилия спортсмена" className="w-full" />
        </label>
      </div>

      {rows.length ? (
        <DataTable
          cols={['Спортсмен', 'Регион', 'Клуб', 'Состояние', 'Дата оплаты', 'Как оплачен', '']}
          grid={FEE_GRID}
          rows={rows.map((r) => ({
            key: r.nm,
            to: 'Э2.2',
            cells: [
              <Who key="w" av={r.av} nm={r.nm} sub={`${r.born} г.р.`} />,
              <span key="r" className="text-neutral-600">{r.reg}</span>,
              <span key="c" className="text-neutral-600">{r.club}</span>,
              <Pill key="s" t={FST[r.st].t} color={FST[r.st].color} />,
              <span
                key="d"
                className={r.st === 'late' ? 'font-medium text-red-600' : 'tabular-nums text-neutral-600'}
              >
                {r.when}
              </span>,
              <span key="h" className="text-neutral-500">{r.how}</span>,
              /* Исключение, а не обычный ход: отметить вручную можно только
                 неоплаченный взнос, и диалог потребует основания. */
              r.st === 'paid' ? (
                <span key="a" />
              ) : (
                <Button key="a" size="sm" variant="outline" data-to="Э2.3">
                  Отметить вручную
                </Button>
              ),
            ],
          }))}
        />
      ) : (
        <EmptyBox title="Никого не нашлось" text="Проверьте написание фамилии или снимите фильтр." />
      )}

      <div className="mt-3 text-[12.5px] text-neutral-500">
        {rows.length === FEES.length ? '526 спортсменов · взнос 2026' : `показано ${rows.length} из 526`}
      </div>

      {/* Подсказка о допуске — почему серый бейдж всё-таки важен (TZ §9.2). */}
      <div className="mt-3">
        <Bar>
          У «не оплачен» есть последствие: на турнирах с флагом взноса заявка такого спортсмена не
          пройдёт (TZ §9.2). Обычно спортсмен платит картой сам — экран нужен для сверки и исключений.
        </Bar>
      </div>
    </WebApp>
  );
}

const Fees2_1States = () => (
  <States>
    <Shot
      tone="info"
      title="Начало года — все «не оплачен»"
      text="Массовое состояние, а не ошибка: показываем подсказку о сроке уплаты."
      wide
    >
      <Frag w={620}>
        <StatTiles
          items={[
            { v: '0 / 526', k: 'Оплатили взнос' },
            { v: '₸ 0', k: 'Поступило за период' },
          ]}
        />
        <Rows>
          <Row av={A(32)} nm="Смагулов Алан" sub="Алматы · «Алатау»" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'done' }} />
          <Row av={A(44)} nm="Ким Георгий" sub="Астана · СКА" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'done' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">Срок уплаты — до 31 марта. После него состояние становится «просрочен».</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="success"
      title="Обычный ход — бухгалтер не участвует"
      text="Спортсмен платит картой сам, строка становится «оплачен» по подтверждению банка."
    >
      <Frag>
        <Rows>
          <Row
            av={A(44)}
            nm="Ким Георгий"
            sub="оплатил картой сам · Halyk ePay"
            val="09.01, 21:14"
            pill={{ t: 'ОПЛАЧЕН', cls: 'live' }}
          />
        </Rows>
        <div className="mt-3">
          <EmptyBox title="Отметок вручную за неделю нет" text="Экран нужен для сверки и исключений." />
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э2.2 · Карточка взноса ────────────────────────────────────── */

export function Fee2_2() {
  return (
    <WebApp
      role={R02}
      nav="Взносы"
      title="Карточка взноса"
      sub="Пак Сергей · Павлодар · «Иртыш»"
      back={{ label: 'Взносы за сезон', to: 'Э2.1' }}
    >
      <div className="grid grid-cols-2 items-start gap-4">
        <Panel title="Взнос за 2026 год" extra={<Pill t="ОПЛАЧЕН ВРУЧНУЮ" color="success" />}>
          <KV
            items={[
              ['Год', '2026'],
              ['Сумма', '₸ 10 000'],
              ['Дата оплаты', '22.02.2026'],
              /* Как оплачен: у ручной отметки виден автор — система именная. */
              ['Как оплачен', 'отметка вручную · Сериков Н.'],
              ['Основание', 'квитанция № 4471 от 22.02.2026'],
            ]}
          />

          {/* Зона документа — заглушка намеренно: храним ли платёжку, не
              решено (QUESTIONS), и «Приложить документ» не проектируем. */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
            <span className="leading-tight">
              <span className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                <FileWarning size={15} /> Платёжка не приложена
              </span>
              <span className="mt-0.5 block text-xs text-amber-700">
                ⚠ нужно ли хранить платёжку — не решено
              </span>
            </span>
            <Button size="sm" variant="outline" isDisabled>
              Приложить документ
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-500">Состояние видят спортсмен и его тренер</span>
            {/* Снять можно только ручную отметку — банковский платёж не снимается. */}
            <Button variant="outline" data-to="Э2.4">
              <Undo2 size={14} /> Снять отметку
            </Button>
          </div>
        </Panel>

        <div>
          <Panel title="Спортсмен" flush>
            <Row
              av={A(13)}
              nm="Пак Сергей"
              sub="Павлодар · «Иртыш» · 2005 г.р."
              action="Открыть профиль"
            />
            <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-1.5 text-[11px] text-neutral-400">
              Профиль — только чтение: реестр правит администратор
            </div>
          </Panel>

          <Panel title="История по взносу" flush>
            <div className="divide-y divide-neutral-100">
              <Row
                nm="Отметил оплату вручную"
                sub="Сериков Н. · 22.02.2026, 10:42 · квитанция № 4471"
                pill={{ t: 'ОПЛАЧЕН', cls: 'live' }}
              />
              <Row nm="Взнос выставлен" sub="система · 01.01.2026" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'done' }} />
            </div>
            <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-1.5 text-[11px] text-neutral-400">
              Из журнала действий — отметки и снятия с причинами и авторами
            </div>
          </Panel>
        </div>
      </div>
    </WebApp>
  );
}

/** Та же карточка, когда платёж висит без подтверждения: не состояние из
    данных роли, а второй кадр экрана — сюда ведёт полоса сверки с Э2.1. */
const Fee2_2Sverka = () => (
  <Also cap="Та же карточка при сверке: платёж без подтверждения банка">
    <Frag>
      <Rows>
        <Row
          nm="Halyk ePay · платёж 4172-8831"
          sub="карта списана 28.08, 14:02 · подтверждение банка не пришло"
          pill={{ t: 'ЖДЁТ БАНКА', cls: 'wait' }}
        />
      </Rows>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-500">Система добирает статус опросом</span>
        <Button variant="outline">
          <RefreshCw size={14} /> Проверить в банке
        </Button>
      </div>
      <div className="mt-3">
        <Bar>Сообщение банка могло потеряться в сети — разовый запрос статуса в ePay, а не ошибка.</Bar>
      </div>
    </Frag>
  </Also>
);

const Fee2_2States = () => (
  <States>
    <Shot
      tone="success"
      title="Оплачено картой"
      text="Кнопок отметки нет, показан номер платежа: подтверждённый банком платёж снять нельзя."
    >
      <Frag w={520}>
        <FormGrid>
          <FieldView label="Как оплачен" value="картой · Halyk ePay" />
          <FieldView label="Платёж в банке" value="4172-8830" />
        </FormGrid>
        <div className="mt-3">
          <Bar tone="success">Подтверждение банка пришло 14.01.2026, 10:42 — состояние выставила система.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Документ не приложен"
      text="Зона документа остаётся заглушкой, пока не решено, храним ли платёжку."
    >
      <Frag w={480}>
        <EmptyBox title="Платёжка не приложена" text="⚠ Решение о хранении документов не принято." />
      </Frag>
    </Shot>
  </States>
);

/* ── Э2.3 · Отметка оплаты вручную ─────────────────────────────── */

/** Чем платёж подтверждается — выбор рабочий: от него зависит, что писать в
    основание. Значения — из флоу, слово в слово. */
const PROOFS = ['Квитанция', 'Перевод на счёт федерации', 'Оплата на месте'];

export function Mark2_3() {
  const [proof, setProof] = useState(PROOFS[0]);
  return (
    <WebApp
      role={R02}
      nav="Взносы"
      title="Карточка взноса"
      sub="Жумабеков Расул · Караганда · «Шахтёр»"
      back={{ label: 'Взносы за сезон', to: 'Э2.1' }}
    >
      {/* Родительский экран — карточка неоплаченного взноса: видно, откуда
          диалог открыт и почему кнопка на нём называется так же. */}
      <Panel title="Взнос за 2026 год" extra={<Pill t="НЕ ОПЛАЧЕН" />}>
        <KV
          items={[
            ['Год', '2026'],
            ['Сумма', '₸ 10 000'],
            ['Дата оплаты', '—'],
          ]}
        />
        <div className="mt-4 flex items-center justify-end">
          <Button variant="primary">
            <Banknote size={15} /> Отметить оплату вручную
          </Button>
        </div>
      </Panel>

      <InlineDialog
        title="Отметить оплату вручную"
        sub="Жумабеков Расул · взнос 2026 · ₸ 10 000"
        to="Э2.2"
        wide
        foot={
          <>
            <span className="mr-auto text-xs text-neutral-500">
              Отметка уйдёт в журнал с автором и временем
            </span>
            <QuietAction to="Э2.2">Закрыть</QuietAction>
            <Button variant="primary" data-to="Э2.2">
              <Banknote size={15} /> Отметить оплачен
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500">Чем платёж подтверждается</span>
          <div>
            <FilterSeg items={PROOFS} active={proof} onPick={setProof} />
          </div>
        </div>
        <FormGrid>
          <TextInput label="Основание ✳" value="квитанция № 4471" />
          {/* Дата — текстом в русском формате: нативный `input type="date"`
              (DateInput кита) рисуется в локали браузера и на снимке выдавал
              американское «02/22/2026» рядом с «22.02.2026» остального экрана. */}
          <TextInput label="Дата платежа" value="22.02.2026" />
        </FormGrid>
        <div className="mt-3">
          <Bar>
            Обычно спортсмен платит картой, и строка становится «оплачен» сама (TZ §9.2). Ручная
            отметка — исключение: платёж пришёл мимо системы. Состояние увидят спортсмен и его тренер.
          </Bar>
        </div>
      </InlineDialog>
    </WebApp>
  );
}

const Mark2_3States = () => (
  <States>
    <Shot tone="danger" title="Основание не заполнено" text="Кнопка неактивна, с пояснением.">
      <Frag w={440}>
        <FormGrid>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Основание ✳</span>
            <span className="w-full rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
              — не заполнено
            </span>
          </div>
        </FormGrid>
        <div className="mt-3">
          <DisabledAction>Отметить оплачен</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Платёж уже подтверждён банком"
      text="Отметка не нужна: диалог не открывается, в карточке показан номер платежа."
    >
      <Frag>
        <Rows>
          <Row
            nm="Halyk ePay · платёж 4172-8830"
            sub="подтверждение банка 14.01.2026"
            pill={{ t: 'ОПЛАЧЕН', cls: 'live' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э2.4 · Снятие отметки ─────────────────────────────────────── */

export function Unmark2_4() {
  return (
    <WebApp
      role={R02}
      nav="Взносы"
      title="Карточка взноса"
      sub="Пак Сергей · Павлодар · «Иртыш»"
      back={{ label: 'Взносы за сезон', to: 'Э2.1' }}
    >
      <Panel title="Взнос за 2026 год" extra={<Pill t="ОПЛАЧЕН ВРУЧНУЮ" color="success" />}>
        <KV
          items={[
            ['Как оплачен', 'отметка вручную · Сериков Н.'],
            ['Основание', 'квитанция № 4471'],
          ]}
        />
      </Panel>

      <InlineDialog
        title="Снять отметку об оплате"
        sub="Пак Сергей · взнос 2026 · отметил Сериков Н., 22.02.2026"
        to="Э2.2"
        foot={
          <>
            <span className="mr-auto text-xs text-neutral-500">
              Причина уйдёт в журнал и в историю по взносу
            </span>
            <QuietAction to="Э2.2">Закрыть</QuietAction>
            {/* Красная, а не синяя: действие отбирает у спортсмена допуск. */}
            <Button variant="danger" data-to="Э2.2">
              <Undo2 size={15} /> Снять отметку
            </Button>
          </>
        }
      >
        {/* Что именно снимаем: решение видно до причины. */}
        <FormGrid>
          <FieldView label="Кто и когда отметил" value="Сериков Н. · 22.02.2026, 10:42" />
          <FieldView label="Основание отметки" value="квитанция № 4471" />
          <TextInput label="Причина ✳" value="квитанция не подтвердилась в банке" wide />
        </FormGrid>
        <div className="mt-3">
          <Bar tone="danger">
            После снятия состояние — «не оплачен»: заявки спортсмена на турниры с флагом взноса
            перестанут проходить (TZ §9.2).
          </Bar>
        </div>
      </InlineDialog>
    </WebApp>
  );
}

const Unmark2_4States = () => (
  <States>
    <Shot
      tone="info"
      title="Платёж подтверждён банком"
      text="Снять нельзя: кнопки нет, показан номер платежа."
    >
      <Frag>
        <Rows>
          <Row
            nm="Halyk ePay · платёж 4172-8830"
            sub="подтверждение банка 14.01.2026"
            pill={{ t: 'ОПЛАЧЕН', cls: 'live' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="success">Снимается только ручная отметка — банковский платёж не трогаем.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Причина не заполнена" text="«Снять отметку» неактивна.">
      <Frag w={440}>
        <FormGrid>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Причина ✳</span>
            <span className="w-full rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
              — не заполнена
            </span>
          </div>
        </FormGrid>
        <div className="mt-3">
          {/* Та же опасная кнопка диалога, но неактивная: тон danger сохраняем,
              чтобы выключенная не читалась как другая, «обычная» кнопка
              (общий DisabledAction кита — синий). */}
          <Button variant="danger" isDisabled>
            <Undo2 size={15} /> Снять отметку
          </Button>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Сверка с банком: то же на планшете ────────────────────────── */

export const Fees2_1Tablet = () => <Fees2_1 variant="land" />;

/* ── Экраны роли ───────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э2.1': {
    cap: 'Взносы за сезон',
    view: () => (
      <>
        <Fees2_1 />
        <Fees2_1States />
      </>
    ),
    next: 'строка спортсмена',
  },
  'Э2.2': {
    cap: 'Карточка взноса',
    view: () => (
      <>
        <Fee2_2 />
        <Fee2_2Sverka />
        <Fee2_2States />
      </>
    ),
    next: '«Отметить оплату вручную»',
  },
  'Э2.3': {
    cap: 'Отметка оплаты вручную',
    view: () => (
      <>
        <Mark2_3 />
        <Mark2_3States />
      </>
    ),
    next: '«Снять отметку»',
  },
  'Э2.4': {
    cap: 'Снятие отметки',
    view: () => (
      <>
        <Unmark2_4 />
        <Unmark2_4States />
      </>
    ),
  },
};

export function Role02Board() {
  return <Board role={R02} screens={SCREENS} />;
}
