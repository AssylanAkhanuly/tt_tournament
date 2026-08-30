/* 16 · Дисциплинарный комитет — макеты по флоу на новом слое (HeroUI) ✳ (30.08.2026).
   Содержание, коды экранов и переходы — прежние (см. `flows/16-disciplinarnyy-komitet.md`);
   меняется подача: оболочка WebApp и доменные компоненты `kit/hero/app` вместо
   старого макетного слоя.

   Комитет — орган, а не роль: человек входит в него поверх своей роли. Поэтому
   в файле две оболочки — спортсмена (Э16.1, он подаёт протест) и комитета
   (Э16.2–Э16.4, он его разбирает). Маршрут начинается у спортсмена намеренно:
   без формы подачи очередь дел неоткуда взять. */

import { useState, type ReactNode } from 'react';
import {
  BarChart3, CalendarDays, Download, FileText, History, LayoutDashboard, Newspaper, Scroll, Send,
  Timer, User,
} from 'lucide-react';
import { Button } from '@heroui/react';
import {
  A, AW, AreaInput, Bar, DataTable, DisabledAction, EmptyBox, Facts, FilterSeg, InlineDialog, KV,
  MatchCard, Panel, PickField, Pill, PrimaryAction, QuietAction, Row, Rows, ScreenScope,
  SearchInput, StatTiles, WebApp, type RoleUI,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';

/* ── Роли экранов: спортсмен и член комитета ────────────────────── */

/* ⚠ дупликация: сайдбар спортсмена повторён из `roles.tsx` (R14) локально —
   старый слой не импортируем, а слова пунктов обязаны совпадать с ролью 14:
   по ним сходится карта флоу. */
const R14L: RoleUI = {
  num: '14',
  title: 'Спортсмен',
  person: { nm: 'Ким Г.', rl: 'Спортсмен · рейтинг 2456', av: A(44) },
  brandName: 'Мой профиль',
  brandSub: 'Сайт и приложение',
  badge: false,
  nav: [
    [<LayoutDashboard size={16} key="d" />, 'Главная'],
    [<CalendarDays size={16} key="c" />, 'Календарь'],
    [<Timer size={16} key="t" />, 'Мой турнир'],
    [<BarChart3 size={16} key="a" />, 'Аналитика'],
    [<Newspaper size={16} key="n" />, 'Новости'],
    [<User size={16} key="u" />, 'Профиль'],
  ],
};

/** Член комитета. Разделов два — очередь протестов и лента нарушений: больше
    у органа дел нет, он разбирает и фиксирует, а не ведёт турниры. */
const RD: RoleUI = {
  num: '16',
  title: 'Дисциплинарный комитет',
  person: { nm: 'Мукашев Б.', rl: 'Член комитета · председатель ГСК', av: A(67) },
  brandName: 'Дисциплинарный комитет',
  brandSub: 'Протесты · нарушения · решения',
  badge: false,
  nav: [
    [<Scroll size={16} key="p" />, 'Протесты'],
    [<History size={16} key="h" />, 'История'],
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

/** Длинный текст на чтение с подписью: протест в деле показывается так, как
    его подал спортсмен, — комитет его не правит, поле ввода здесь врало бы. */
const ReadText = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-neutral-500">{label}</span>
    <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm leading-relaxed text-neutral-700">
      {children}
    </p>
  </div>
);

/* ── Дела ───────────────────────────────────────────────────────── */

type Case = {
  id: string;
  who: string;
  av: string;
  match: string;
  tour: string;
  at: string;
  st: 'подан' | 'на рассмотрении' | 'решение принято';
  by?: string;
};

/** Очередь уже отсортирована «новые сверху» ✳: у протеста есть срок, и порядок
    по дате подачи — не украшение, а правило экрана. */
const CASES: Case[] = [
  { id: 'Д-118', who: 'Ким Георгий', av: A(44), match: '1/8 · Ким Г. — Токаев М. · стол 4', tour: 'Чемпионат Казахстана 2026', at: '13.03, 19:20', st: 'подан' },
  { id: 'Д-117', who: 'Мұрат Ерлан', av: A(93), match: '1/16 · Гладун И. — Мұрат Е. · стол 2', tour: 'Чемпионат Казахстана 2026', at: '13.03, 15:04', st: 'на рассмотрении', by: 'Мукашев Б.' },
  { id: 'Д-116', who: 'Тлеуова Аружан', av: AW(21), match: '1/16 · Тлеуова А. — Абаева Д. · стол 11', tour: 'Чемпионат Казахстана 2026', at: '12.03, 20:41', st: 'решение принято', by: 'Мукашев Б.' },
  { id: 'Д-113', who: 'Байжанов Асхат', av: A(85), match: 'группа B · Байжанов А. — Досжан М. · стол 6', tour: 'Кубок Казахстана 2026', at: '22.02, 18:02', st: 'решение принято', by: 'Ахметов К.' },
];

/** Тона значков старого словаря сохранены: подан — ждёт (жёлтый), в работе —
    процесс (синий), решение — закрыто (зелёный). */
const ST_CLS: Record<Case['st'], 'wait' | 'reg' | 'live'> = {
  'подан': 'wait',
  'на рассмотрении': 'reg',
  'решение принято': 'live',
};

/* ── Э16.1 · Протест спортсмена ─────────────────────────────────── */

/** Экран роли 14: протест подаёт сам спортсмен. Материалы к нему прикладывает
    система — собирать их спортсмену не нужно и нельзя: он их не хранит.
    Это же закрывает половину замечания федерации — «чтобы все нарушения и
    карты фиксировались». */
export function Protest16_1() {
  return (
    <WebApp
      role={R14L}
      nav="Мой турнир"
      title="Протест по матчу"
      sub="Чемпионат Казахстана 2026 · 1/8 финала · 13 марта"
    >
      <div className="grid grid-cols-2 items-start gap-4">
        <div>
          <Panel title="Протест" extra={<Pill t="ЧЕРНОВИК" color="warning" />}>
            {/* Матч, по которому спор, — как на табло, а не строкой формы:
                соперник, счёт по партиям, стол и судья видны без слов. */}
            <MatchCard
              tour="1/8 финала · 13.03, 15:58"
              home={{ nm: 'Ким Георгий', av: A(44), sub: 'Астана · СКА' }}
              away={{ nm: 'Токаев Марат', av: A(51), sub: 'Шымкент · «Жетісу»' }}
              score="4 : 2"
              games={[[11, 9], [9, 11], [11, 7], [8, 11], [11, 6], [11, 4]]}
              note="стол 4 · судья Оралбай Е."
            />
            <div className="mt-3">
              <Facts items={[{ k: 'подаёт', v: 'Ким Георгий' }, { k: 'черновик сохранён', v: '13.03, 19:20' }]} />
            </div>

            {/* Два поля, а не одно ✳: комитет разбирает первое, а решает по
                второму — в одном абзаце они слипаются. */}
            <div className="mt-4 flex flex-col gap-3.5">
              {/* Четыре строки, не три, и текст короче: с rows={3} демо-текст
                  переносился на четвёртую строку и она резалась кромкой поля.
                  Теперь текст укладывается в три строки, четвёртая — запас. */}
              <AreaInput
                label="На что жалоба — что произошло"
                value={'В пятой партии счёт исправили после подтверждения партии, основание судья не объяснил. В шестой — жёлтая карточка без предупреждения.'}
                rows={4}
              />
              <AreaInput
                label="Что прошу — какого решения жду"
                value="Проверить правку счёта и обоснованность карточки."
                rows={2}
              />
            </div>

            <div className="mt-4">
              <Bar tone="warning">
                ⚠ Срок подачи протеста федерация не назвала — вопрос 15.4. Правило будет, числа
                пока нет.
              </Bar>
            </div>
            <div className="flex items-center justify-end gap-2">
              {/* Черновик — своей кнопкой ✳: протест пишут не на площадке, а вечером. */}
              <QuietAction>Сохранить черновик</QuietAction>
              <PrimaryAction to="Э16.2">Подать протест</PrimaryAction>
            </div>
          </Panel>
        </div>

        {/* Материалы не собираются спортсменом: система прикладывает их сама. */}
        <div>
          <Panel
            title="Материалы"
            sub="приложены системой — спортсмен их не собирает"
            extra={<Pill t="ПРИЛОЖЕНЫ" color="accent" />}
            flush
          >
            <div className="divide-y divide-neutral-100">
              <Row nm="Протокол матча" sub="счёт по партиям, судья, время · подтверждён 15:58" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
              <Row nm="История событий матча" sub="розыгрыши, тайм-ауты, смены сторон, отмены (TZ §6.5)" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
              <Row nm="Жёлтая карточка · Токаев М." sub="15:46 · вынес судья стола Оралбай Е." pill={{ t: 'ЕСТЬ', cls: 'live' }} />
              {/* Правка не меняет победителя партии: табло показывает уже
                  исправленные 11 : 6, итог 4 : 2 с ними сходится. */}
              <Row nm="Правка счёта после подтверждения" sub="партия 5: было 11 : 5 → стало 11 : 6 · исправил главный судья" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
            </div>
            <div className="px-4 pb-1 pt-3">
              <Bar>
                Собирать материалы спортсмену не нужно и нельзя: он их не хранит, а система хранит.
                Комитет получает их вместе с протестом и ничего не запрашивает у судьи.
              </Bar>
            </div>
          </Panel>
        </div>
      </div>
    </WebApp>
  );
}

const Protest16_1States = () => (
  <States>
    <Shot
      tone="info"
      title="Протест по этому матчу уже подан ✳"
      text="Второй по тому же матчу не подаётся — открывается поданный."
    >
      <Frag>
        <Rows>
          <Row
            nm="Д-118 · 1/8 · Ким Г. — Токаев М."
            sub="подан 13.03, 19:20 · состояние «подан»"
            pill={{ t: 'УЖЕ ПОДАН', cls: 'wait' }}
            action="Открыть"
          />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Срок подачи истёк ⚠" text="Правило есть, числа нет — вопрос 15.4.">
      <Frag>
        <Rows>
          <Row
            nm="Срок подачи протеста"
            sub="федерация не назвала, сколько дней даётся после матча"
            pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3"><DisabledAction>Подать протест</DisabledAction></div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э16.2 · Протесты ───────────────────────────────────────────── */

const FILTER_ST = ['Все', 'Подан', 'На рассмотрении', 'Решение принято'];
const FILTER_TOUR = ['Все турниры', 'Чемпионат РК', 'Кубок РК'];

/** Очередь дел комитета — первый экран члена комитета (пункт «Протесты»).
    Взять в работу можно только дело в состоянии «подан»: остальные либо уже
    ведутся, либо закрыты — кнопка это знает и говорит. */
export function Cases16_2() {
  const [fs, setFs] = useState(FILTER_ST[0]);
  const [ft, setFt] = useState(FILTER_TOUR[0]);
  const [pick, setPick] = useState<string | null>(null);
  const rows = CASES.filter((c) => {
    if (fs !== 'Все' && c.st !== fs.toLowerCase()) return false;
    if (ft === 'Чемпионат РК' && !c.tour.startsWith('Чемпионат')) return false;
    if (ft === 'Кубок РК' && !c.tour.startsWith('Кубок')) return false;
    return true;
  });
  const picked = CASES.find((c) => c.id === pick);
  /* Взятое дело переводится в «на рассмотрении», автор и время — в журнал. */
  const canTake = picked?.st === 'подан';

  return (
    <WebApp
      role={RD}
      nav="Протесты"
      title="Протесты"
      sub="Сезон 2026 · дела по всем соревнованиям"
    >
      <StatTiles
        items={[
          { v: '1', k: 'Подан — ждёт, кто возьмёт', tone: 'a' },
          { v: '1', k: 'На рассмотрении' },
          { v: '2', k: 'Решение принято', tone: 'g' },
          { v: '9', k: 'Карточек за сезон' },
        ]}
      />

      {/* Фильтр по состоянию и турниру ✳ — оба сужают список, а не меняют экран. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSeg items={FILTER_ST} active={fs} onPick={setFs} />
          <FilterSeg items={FILTER_TOUR} active={ft} onPick={setFt} />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" data-to="Э16.4">
            <History size={14} /> Дисциплинарная история
          </Button>
          {canTake ? (
            <PrimaryAction to="Э16.3">Взять в работу</PrimaryAction>
          ) : (
            <DisabledAction>Взять в работу</DisabledAction>
          )}
        </div>
      </div>
      <div className="mb-3 text-[12.5px] text-neutral-500">
        {picked
          ? canTake
            ? `Выбрано дело ${picked.id} — состояние станет «на рассмотрении», автор и время запишутся в журнал`
            : `Дело ${picked.id} уже ${picked.st === 'на рассмотрении' ? 'ведётся' : 'закрыто'} — взять в работу можно только дело в состоянии «подан»`
          : 'Новые сверху: у протеста есть срок ⚠ 15.4 · выберите дело, чтобы взять его в работу'}
      </div>

      <Panel
        title="Очередь дел"
        sub="новые сверху — сортировка по дате подачи"
        extra={<span className="text-xs text-neutral-500">кто подал · по какому матчу · состояние</span>}
        flush
      >
        {rows.length ? (
          <div className="divide-y divide-neutral-100">
            {rows.map((c) => (
              <Row
                key={c.id}
                av={c.av}
                to="Э16.3"
                nm={`${c.id} · ${c.who}`}
                sub={`${c.match} · ${c.tour} · подан ${c.at}${c.by ? ` · ведёт ${c.by}` : ''}`}
                pill={{ t: c.st.toUpperCase(), cls: ST_CLS[c.st] }}
                on={pick === c.id}
                onSelect={() => setPick(pick === c.id ? null : c.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyBox title="Под фильтр ничего не попало" text="Снимите фильтр состояния или турнира." />
          </div>
        )}
      </Panel>
    </WebApp>
  );
}

const Cases16_2States = () => (
  <States>
    <Shot tone="info" title="Протестов нет ✳" text="Пустое состояние, а не пустой список.">
      <Frag>
        <EmptyBox title="Протестов нет" text="Дела появляются, когда спортсмен подаёт протест по матчу." />
      </Frag>
    </Shot>

    <Shot tone="danger" title="Дело просрочено ⚠" text="Срок рассмотрения федерация не назвала — вопрос 15.4.">
      <Frag>
        <Rows>
          <Row
            nm="Д-117 · на рассмотрении 6 дней"
            sub="сколько дней даётся комитету — не определено"
            pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э16.3 · Дело ───────────────────────────────────────────────── */

/** Дело целиком: протест как его подал спортсмен, материалы, которые приехали
    вместе с результатом (TZ §6.5), участники со ссылками в их историю — и
    решение. Пояснение запрашивается диалогом поверх дела: комитет не уходит
    с экрана, на котором решает. */
export function Case16_3() {
  const [ask, setAsk] = useState(false);
  return (
    <WebApp
      role={RD}
      nav="Протесты"
      title="Дело Д-118"
      sub="Ким Георгий · 1/8 финала · Чемпионат Казахстана 2026"
      back={{ label: 'Протесты', to: 'Э16.2' }}
    >
      <div className="grid grid-cols-2 items-start gap-4">
        <div>
          <Panel title="Протест" extra={<Pill t="НА РАССМОТРЕНИИ" color="accent" />}>
            <KV
              items={[
                ['Подал', 'Ким Георгий · 13.03.2026, 19:20'],
                ['Матч', '1/8 · Ким Г. — Токаев М. · стол 4'],
                /* Автор и время взятия — из журнала: решение именное. */
                ['Взял в работу', 'Мукашев Б. · 14.03, 09:12'],
              ]}
            />
            {/* Протест показан как подан — на чтение: комитет разбирает первое
                поле, а решает по второму, и не правит ни то ни другое. */}
            <div className="mt-3 flex flex-col gap-3">
              <ReadText label="На что жалоба — что произошло">
                Счёт исправлен после подтверждения партии без объяснения основания; жёлтая карточка
                вынесена без предупреждения.
              </ReadText>
              <ReadText label="Что просит">
                Проверить правку счёта и обоснованность карточки.
              </ReadText>
            </div>
          </Panel>

          <Panel title="Решение" sub="текст решения и что оно меняет">
            {/* Санкции не перечислены: федерация их не назвала (15.4). Пока
                решение — свободная формулировка и фиксация, а не выбор из списка. */}
            <div className="flex flex-col gap-3.5">
              <AreaInput
                label="Текст решения"
                value={'Правка счёта партии 5 признана обоснованной: основание видно в истории событий. Жёлтая карточка оставлена в силе.'}
                rows={3}
              />
              <AreaInput
                label="Что оно меняет"
                value="Результат матча не меняется · карточка остаётся в дисциплинарной истории."
                rows={2}
              />
            </div>
            <div className="mt-4">
              <Bar tone="warning">
                ⚠ Перечень санкций не определён (вопрос 15.4): решение фиксируется текстом, система
                по нему ничего не пересчитывает — ни допуск, ни рейтинг судьи.
              </Bar>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="max-w-[46%] text-xs text-neutral-500">
                Решение уйдёт заявителю уведомлением и останется в истории участников
              </span>
              <span className="flex items-center gap-2">
                <QuietAction onPress={() => setAsk(true)}>
                  <FileText size={14} /> Запросить пояснение
                </QuietAction>
                <PrimaryAction>Принять решение</PrimaryAction>
              </span>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Материалы дела" sub="приехали вместе с результатом (TZ §6.5)" flush>
            <div className="divide-y divide-neutral-100">
              <Row nm="Протокол матча" sub="4 : 2 · подтверждён судьёй стола 15:58" pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
              <Row nm="История событий" sub="розыгрыши, тайм-ауты, карточки, правки (TZ §6.5)" pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
              <Row nm="Жёлтая карточка · Токаев М." sub="15:46 · судья стола Оралбай Е." pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
            </div>
            <div className="px-4 pb-1 pt-3">
              <Bar>Комитет не запрашивает материалы у судьи и не ждёт их — дело уже полное.</Bar>
            </div>
          </Panel>

          {/* У каждого участника — ссылка в его дисциплинарную историю. */}
          <Panel title="Участники дела" sub="строка ведёт в дисциплинарную историю" flush>
            <div className="divide-y divide-neutral-100">
              <Row av={A(44)} to="Э16.4" nm="Ким Георгий · заявитель" sub="дисциплинарная история" pill={{ t: 'СПОРТСМЕН', cls: 'reg' }} />
              <Row av={A(51)} to="Э16.4" nm="Токаев Марат · соперник" sub="дисциплинарная история" pill={{ t: 'СПОРТСМЕН', cls: 'reg' }} />
              <Row av={A(58)} to="Э16.4" nm="Оралбай Ержан · судья стола" sub="карточки и правки по его столам" pill={{ t: 'СУДЬЯ', cls: 'wait' }} />
              <Row av={A(76)} to="Э16.4" nm="Оспанов Талгат · главный судья" sub="кто исправлял счёт" pill={{ t: 'СУДЬЯ', cls: 'wait' }} />
            </div>
          </Panel>
        </div>
      </div>

      {/* Вопрос уходит судье или главному судье старта ✳ — диалог поверх дела,
          материалы остаются перед глазами. */}
      {ask && (
        <InlineDialog
          title="Запросить пояснение"
          sub="вопрос уходит судье или главному судье старта"
          to="Э16.3"
          foot={
            <>
              <span className="mr-auto text-xs text-neutral-500">
                Ответ придёт в это же дело
              </span>
              <QuietAction onPress={() => setAsk(false)}>Отмена</QuietAction>
              <Button variant="primary" onPress={() => setAsk(false)}>
                <Send size={15} /> Отправить вопрос
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3.5 pt-1">
            <PickField label="Кому" value="Оралбай Ержан · судья стола 4" />
            <AreaInput
              label="Вопрос"
              value="На каком основании исправлен счёт пятой партии после подтверждения?"
              rows={3}
            />
            <Bar>Ответ придёт в дело и останется в его журнале — переписки вне дела нет.</Bar>
          </div>
        </InlineDialog>
      )}
    </WebApp>
  );
}

const Case16_3States = () => (
  <States>
    <Shot tone="info" title="Решение принято — только чтение ✳" text="Дальше дело не правится.">
      <Frag>
        <Rows>
          <Row
            nm="Д-116 · решение принято 13.03"
            sub="решение ушло заявителю уведомлением"
            pill={{ t: 'ЗАКРЫТО', cls: 'live' }}
          />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Может ли комитет отменить результат матча ⚠"
      text="Федерация не сказала — вопрос 15.4."
      wide
    >
      <Frag w={680}>
        <Rows>
          <Row nm="Результат матча" sub="отменяет ли его комитет или решение касается только дисциплины" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
          <Row nm="Санкции и допуск" sub="какие возможны и влияют ли на допуск к следующим стартам" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э16.4 · Дисциплинарная история ─────────────────────────────── */

type Ev = {
  at: string;
  ev: string;
  who: string;
  tour: string;
  sub: string;
  kind: string;
  color: 'warning' | 'success' | 'accent' | 'danger';
};

/** Лента собирается автоматически ✳: карточки приходят с табло судьи вместе с
    результатом (TZ §6.5), комитет их не заводит руками. */
const HIST: Ev[] = [
  { at: '13.03', ev: 'Жёлтая карточка', who: 'Токаев Марат', tour: 'Чемпионат Казахстана 2026', sub: 'стол 4 · 1/8 финала · вынес судья Оралбай Е.', kind: 'КАРТОЧКА', color: 'warning' },
  { at: '13.03', ev: 'Решение комитета по делу Д-116', who: 'Тлеуова Аружан', tour: 'Чемпионат Казахстана 2026', sub: 'протест по снятию с матча', kind: 'РЕШЕНИЕ', color: 'success' },
  { at: '12.03', ev: 'Снятие по травме', who: 'Тлеуова Аружан', tour: 'Чемпионат Казахстана 2026', sub: 'стол 11 · подтверждено врачом соревнований', kind: 'СНЯТИЕ', color: 'accent' },
  { at: '12.03', ev: 'Техническое поражение', who: 'Гладун Игорь', tour: 'Чемпионат Казахстана 2026', sub: 'неявка на матч 1/16 · стол 2', kind: 'НЕЯВКА', color: 'danger' },
  { at: '22.02', ev: 'Красная карточка', who: 'Байжанов Асхат', tour: 'Кубок Казахстана 2026', sub: 'группа B · стол 6', kind: 'КАРТОЧКА', color: 'danger' },
];

/** Ключ для сортировки «новые сверху»: дата dd.mm → mmdd. */
const dk = (at: string) => at.split('.').reverse().join('');

const LENSES = ['По человеку', 'По турниру'];

/** Лента нарушений и решений: смотреть, фильтровать, выгружать — без права
    правки. Переключатель линзы честно перестраивает таблицу: тот же список
    читается по людям и по турнирам. */
export function History16_4() {
  const [lens, setLens] = useState(LENSES[0]);
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const found = HIST.filter(
    (e) => !t || e.who.toLowerCase().includes(t) || e.tour.toLowerCase().includes(t) || e.ev.toLowerCase().includes(t),
  );
  const byPerson = lens === LENSES[0];
  const rows = [...found].sort((a, b) =>
    byPerson
      ? a.who.localeCompare(b.who, 'ru') || dk(b.at).localeCompare(dk(a.at))
      : a.tour.localeCompare(b.tour, 'ru') || dk(b.at).localeCompare(dk(a.at)),
  );
  const eventCell = (e: Ev) => (
    <span className="leading-tight">
      <span className="block font-medium">{e.ev}</span>
      <span className="block text-xs text-neutral-500">{e.sub}</span>
    </span>
  );
  return (
    <WebApp
      role={RD}
      nav="История"
      title="Дисциплинарная история"
      sub="Сезон 2026 · карточки, снятия, технические поражения, решения"
      hint="Собирается автоматически: карточки приходят с табло судьи вместе с результатом матча (TZ §6.5) — комитет их не заводит руками."
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Лента по человеку и по турниру — одна, линза меняет чтение. */}
          <FilterSeg items={LENSES} active={lens} onPick={setLens} />
          <SearchInput value={q} onChange={setQ} placeholder="Фамилия, турнир или событие" className="w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Download size={14} /> Выгрузить
          </Button>
          <Button size="sm" variant="outline" data-to="Э16.2">
            <Scroll size={14} /> Протесты
          </Button>
        </div>
      </div>

      <Panel
        title="Лента нарушений"
        sub="только чтение и выгрузка"
        extra={<span className="text-xs text-neutral-500">заводить запись руками нельзя</span>}
        flush
      >
        {rows.length ? (
          <DataTable
            cols={byPerson ? ['Человек', 'Событие', 'Турнир', 'Когда', 'Вид'] : ['Турнир', 'Событие', 'Человек', 'Когда', 'Вид']}
            grid="1.1fr 1.9fr 1.3fr 64px 104px"
            rows={rows.map((e) => ({
              key: e.at + e.ev + e.who,
              cells: byPerson
                ? [
                  <span key="w" className="font-medium">{e.who}</span>,
                  eventCell(e),
                  <span key="t" className="text-neutral-500">{e.tour}</span>,
                  <span key="d" className="tabular-nums text-neutral-600">{e.at}</span>,
                  <Pill key="k" t={e.kind} color={e.color} />,
                ]
                : [
                  <span key="t" className="font-medium">{e.tour}</span>,
                  eventCell(e),
                  <span key="w" className="text-neutral-500">{e.who}</span>,
                  <span key="d" className="tabular-nums text-neutral-600">{e.at}</span>,
                  <Pill key="k" t={e.kind} color={e.color} />,
                ],
            }))}
          />
        ) : (
          <div className="p-4">
            <EmptyBox title="Ничего не нашлось" text={`По запросу «${q}» событий нет — проверьте написание.`} />
          </div>
        )}
        <div className="px-4 pb-1 pt-3">
          {/* Запись без события на столе — это уже не история, а мнение. */}
          <Bar>
            Комитет ленту не заполняет: карточки и снятия приходят с табло судьи вместе с
            результатом матча (TZ §6.5). Запись без события на столе — это уже не история, а мнение.
          </Bar>
        </div>
      </Panel>
    </WebApp>
  );
}

const History16_4States = () => (
  <States>
    <Shot tone="info" title="Нарушений нет ✳" text="Так и написано, а не пустая лента.">
      <Frag>
        <EmptyBox title="Нарушений нет" text="Карточки и снятия появляются здесь сами, когда судья выносит их на столе." />
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Влияют ли карточки на допуск и на рейтинг ⚠"
      text="Вопрос 15.4: до ответа система только фиксирует."
    >
      <Frag>
        <Rows>
          <Row nm="Допуск к следующим стартам" sub="закрывает ли красная карточка следующий турнир" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
          <Row nm="Рейтинг судьи" sub="влияет ли решение комитета на баллы (TZ §7.2)" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд ───────────────────────────────────────────────────────── */

/** Экраны роли по кодам: коды, подписи и порядок — те же, что были: по ним
    сходятся flows/, данные роли и Storybook. */
export const SCREENS: ScreenMap = {
  'Э16.1': {
    cap: 'Протест спортсмена',
    view: () => (<><Protest16_1 /><Protest16_1States /></>),
    next: 'дело уходит в комитет',
  },
  'Э16.2': {
    cap: 'Протесты',
    view: () => (<><Cases16_2 /><Cases16_2States /></>),
    next: 'взять в работу',
  },
  'Э16.3': {
    cap: 'Дело',
    view: () => (<><Case16_3 /><Case16_3States /></>),
    next: 'история участника',
  },
  'Э16.4': {
    cap: 'Дисциплинарная история',
    view: () => (<><History16_4 /><History16_4States /></>),
  },
};

export function Role16Board() {
  return <Board role={RD} screens={SCREENS} />;
}
