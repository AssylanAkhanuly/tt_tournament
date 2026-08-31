/* Справочник HeroUI 3 · группа «Приложение» ✳ (30.08.2026).

   Промежуточный слой между библиотекой и экранами ролей: оболочки устройств
   и доменные компоненты (строка сезона, очередь, реестр, счёт матча). Экраны
   раздела «Флоу» собираются из него — здесь слой показан сам по себе, чтобы
   было видно, из чего состоит каждый экран. */

import { CalendarDays, FileCheck2, Gauge, Landmark, Megaphone, Users } from 'lucide-react';
import { Button } from '@heroui/react';
import {
  A,
  AW,
  Attention,
  Bar,
  Calendar,
  DataTable,
  DayList,
  EventTimeline,
  MiniMonth,
  TimeGrid,
  DateInput,
  Derived,
  EmptyBox,
  Facts,
  FileDrop,
  FilterSeg,
  FormGrid,
  GameCells,
  InlineDialog,
  KV,
  MatchCard,
  PageTabs,
  Pager,
  Panel,
  PhoneApp,
  PickField,
  Pill,
  PrimaryAction,
  QuietAction,
  Row,
  Rows,
  SearchInput,
  SeasonTable,
  StatTiles,
  StatusChip,
  TextInput,
  WebApp,
  type RoleUI,
} from './index';
import { useState } from 'react';

export default {
  title: 'UI-кит/HeroUI/09 · Приложение',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

const DEMO_ROLE: RoleUI = {
  num: '5',
  title: 'Председатель ГСК',
  person: { nm: 'Абаева Д.', rl: 'Председатель ГСК', av: AW(44) },
  nav: [
    [<Gauge size={16} key="p" />, 'Панель'],
    [<CalendarDays size={16} key="c" />, 'Соревнования'],
    [<Users size={16} key="s" />, 'Судьи'],
    [<FileCheck2 size={16} key="d" />, 'Документы'],
    [<Megaphone size={16} key="pu" />, 'Публикация'],
  ],
  brandName: 'ФНТ РК · Судейская коллегия',
  brandSub: 'Сезон 2026',
  badge: false,
  roles: ['Председатель ГСК', 'Судья'],
};

/* ── Веб-оболочка с типовым наполнением ─────────────────────────── */
export const Web = {
  name: 'Веб-оболочка',
  render: () => (
    <div className="p-8">
      <WebApp
        role={DEMO_ROLE}
        nav="Панель"
        title="Панель ГСК"
        sub="Как идёт сезон и что решить сегодня"
      >
        <Attention
          items={[
            {
              n: '2',
              t: 'ждут назначения судьи',
              rows: [
                { nm: 'Кубок Алматы 2026', mt: 'Алматы · 12–15 марта', who: 'подано 6 заявок', why: 'до старта 9 дней', to: 'Э5.2' },
                { nm: 'Первенство Астаны', mt: 'Астана · 2–4 апреля', who: 'подано 3 заявки', why: 'до старта 29 дней', to: 'Э5.2' },
              ],
            },
            {
              n: '1',
              t: 'ждёт утверждения протокола',
              rows: [
                { nm: 'Открытый турнир Тараза', mt: 'сыгран 2 марта', who: 'гл. судья Оспанов Р.', why: 'ждёт 3 дня', cls: 'bad', to: 'Э5.4' },
              ],
            },
          ]}
        />
        <StatTiles
          items={[
            { v: '14', k: 'стартов в сезоне' },
            { v: '86', k: 'судей в реестре' },
            { v: '4', k: 'документа на проверке', tone: 'a' },
            { v: '1', k: 'протокол ждёт', tone: 'b' },
          ]}
        />
        <Panel title="Ближайшие старты" sub="Строка открывает карточку турнира" flush>
          <SeasonTable
            rows={[
              { key: '1', m: 3, nm: 'Кубок Алматы 2026', sub: 'открытый республиканский', when: '12–15 марта · Алматы', val: 'приём судей до 5.03', st: 'claim', tst: 'judges', to: 'Э5.10', wait: true },
              { key: '2', m: 4, nm: 'Первенство Астаны', sub: 'главный старт', when: '2–4 апреля · Астана', val: 'судья не назначен', st: 'wait', tst: 'judges', to: 'Э5.10' },
              { key: '3', m: 4, nm: 'Евразийская лига · тур 2', sub: 'лига', when: '18 апреля · Шымкент', val: 'состав собран', st: 'ready', tst: 'live', to: 'Э5.10' },
            ]}
          />
        </Panel>
      </WebApp>
    </div>
  ),
};

/* ── Реестр: поиск, фильтр, таблица, страницы ───────────────────── */
const Registry = () => {
  const [q, setQ] = useState('');
  const [f, setF] = useState('Все');
  const [p, setP] = useState(0);
  return (
    <div className="p-8">
      <WebApp role={DEMO_ROLE} nav="Судьи" title="Реестр судей" sub="Допуск и рейтинг сезона">
        <div className="mb-3 flex items-center justify-between gap-4">
          <FilterSeg items={['Все', 'В зачёте', 'Без зачёта']} active={f} onPick={setF} />
          <Facts items={[{ k: 'в реестре', v: '86' }, { k: 'ждут подтверждения', v: '3', hot: true }]} />
        </div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <SearchInput value={q} onChange={setQ} placeholder="Фамилия или категория" />
          <Button size="sm" variant="outline">Назначить в наряд</Button>
        </div>
        <DataTable
          cols={['Судья', 'Категория', 'Регион', 'Рейтинг R', 'Зачёт']}
          grid="2fr 1fr 1fr 0.8fr 1fr"
          rows={[
            { key: '1', to: 'Э5.12', cells: [<b key="n">Оспанов Руслан</b>, 'Национальная', 'Астана', <b key="r">412</b>, <StatusChip key="s" st="ready" />] },
            { key: '2', to: 'Э5.12', cells: [<b key="n">Ли Сергей</b>, 'I категория', 'Шымкент', <b key="r">376</b>, <StatusChip key="s" st="ready" />] },
            { key: '3', to: 'Э5.12', cells: [<b key="n">Ким Асель</b>, 'I категория', 'Астана', '—', <StatusChip key="s" st="wait" />] },
          ]}
        />
        <Pager page={p} pages={12} onPick={setP} />
        <div className="mt-4"><Rows>
          <Row av={A(12)} nm="Оспанов Руслан" sub="Национальная категория · Астана" val="R 412" pill={{ t: 'В ЗАЧЁТЕ', cls: 'live' }} action="В наряд" to="Э5.12" />
          <Row av={AW(28)} nm="Ким Асель" sub="Заведена сама · категории нет" pill={{ t: 'ЖДЁТ ПОДТВЕРЖДЕНИЯ', cls: 'wait' }} action="Проверить" to="Э5.6" />
        </Rows></div>
      </WebApp>
    </div>
  );
};
export const Registry_ = { name: 'Реестр: фильтр · поиск · таблица', render: () => <Registry /> };

/* ── Форма и диалог ─────────────────────────────────────────────── */
export const FormAndDialog = {
  name: 'Форма и диалог',
  render: () => (
    <div className="p-8">
      <WebApp
        role={DEMO_ROLE}
        nav="Соревнования"
        title="Завести соревнование"
        back={{ label: 'Соревнования сезона', to: 'Э5.3' }}
        hint="Полей ровно столько, сколько известно в день заведения: столы и формат появятся в карточке турнира."
      >
        <Panel>
          <FormGrid>
            <TextInput label="Название" placeholder="Кубок Алматы 2026" wide />
            <PickField label="Категория календаря" value="Открытый республиканский" />
            <PickField label="Город" value="Алматы" />
            <DateInput label="Начало" value="2026-03-12" />
            <DateInput label="Окончание" value="2026-03-15" />
            <Derived k="Кто назначает (из категории)" v="ФНТ РК" />
            <FileDrop label="Положение турнира" hint="PDF до 10 МБ — можно добавить позже" />
          </FormGrid>
          <div className="mt-5 flex items-center gap-2">
            <PrimaryAction to="Э5.10">Создать</PrimaryAction>
            <QuietAction to="Э5.3">Отмена</QuietAction>
          </div>
        </Panel>
        <InlineDialog
          title="Отказ с причиной"
          sub="Заявка судьи · Ли Сергей · Кубок Алматы 2026"
          to="Э5.2"
          foot={
            <>
              <QuietAction to="Э5.2">Закрыть</QuietAction>
              <Button variant="danger">Отклонить</Button>
            </>
          }
        >
          <Bar tone="warning">Причина уйдёт судье в уведомление и останется в журнале действий.</Bar>
          <FormGrid>
            <TextInput label="Причина отказа" placeholder="Например: нет допуска по категории" wide bad />
          </FormGrid>
        </InlineDialog>
      </WebApp>
    </div>
  ),
};

/* ── Вкладки, карточка, пустое состояние ────────────────────────── */
export const CardAndTabs = {
  name: 'Карточка · вкладки · пусто',
  render: () => (
    <div className="p-8">
      <WebApp
        role={DEMO_ROLE}
        nav="Соревнования"
        title="Кубок Алматы 2026"
        sub="Открытый республиканский · Алматы · 12–15 марта"
        back={{ label: 'Соревнования сезона', to: 'Э5.3' }}
      >
        <StatTiles
          items={[
            { v: '96', k: 'участников · 9 регионов' },
            { v: '4', k: 'разряда' },
            { v: '6 из 7', k: 'судей в наряде', tone: 'a' },
            { v: '12', k: 'столов в зале' },
          ]}
        />
        <PageTabs
          items={[
            {
              t: 'Регламент',
              view: (
                <Panel title="Регламент" sub="Читается, а не правится: роль утверждает">
                  <KV
                    items={[
                      ['Категория календаря', 'Открытый республиканский'],
                      ['Город и зал', 'Алматы · Дворец спорта'],
                      ['Окно дат', '12–15 марта 2026'],
                      ['Формат', 'уточняется'],
                      ['Столы', 'уточняется'],
                    ]}
                  />
                </Panel>
              ),
            },
            {
              t: 'Матчи',
              view: (
                <div className="grid max-w-xl gap-3">
                  <MatchCard
                    live
                    tour="1/4 финала · стол 3"
                    home={{ nm: 'Ким Георгий', av: A(44), sub: 'Алматы · МС' }}
                    away={{ nm: 'Оспанов Руслан', av: A(12), sub: 'Астана · КМС' }}
                    score="2:1"
                    games={[[11, 8], [9, 11], [11, 6]]}
                    note="4-я партия"
                  />
                  <MatchCard
                    tour="1/4 финала · сыгран"
                    home={{ nm: 'Ли Сергей', av: A(23) }}
                    away={{ nm: 'Ахметов Дастан', av: A(31) }}
                    score="3:0"
                  />
                </div>
              ),
            },
            {
              t: 'Сетка',
              view: <EmptyBox title="Сетки ещё нет" text="Сетку собирает главный судья после допуска составов — здесь она появится на чтение." />,
            },
          ]}
        />
      </WebApp>
    </div>
  ),
};

/* ── Телефон ─────────────────────────────────────────────────────
   Планшета в наборе нет ✳ (31.08.2026): форматов два — десктоп и телефон.
   Табло судьи, которое стояло здесь планшетом, живёт на своих экранах роли 9. */
export const Devices = {
  name: 'Телефон',
  render: () => (
    <div className="flex items-start gap-10 p-8">
      <PhoneApp
        tabs={[
          [<Landmark size={17} key="h" />, 'Главная'],
          [<CalendarDays size={17} key="t" />, 'Турниры'],
          [<Gauge size={17} key="r" />, 'Рейтинг'],
          [<Users size={17} key="p" />, 'Профиль'],
        ]}
        active="Главная"
      >
        <MatchCard
          live
          tour="Кубок Алматы 2026 · 1/8"
          home={{ nm: 'Ким Г.', av: A(44) }}
          away={{ nm: 'Оспанов Р.', av: A(12) }}
          score="2:1"
          note="стол 5"
        />
        <Panel title="Мой рейтинг">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tabular-nums">1 984</span>
            <span className="text-sm font-medium text-green-700">+8 за турнир</span>
          </div>
        </Panel>
        <Rows>
          <Row nm="Первенство Астаны" sub="2–4 апреля · приём заявок" pill={{ t: 'ПРИЁМ', cls: 'reg' }} to="Э14.3" />
          <Row nm="Евразийская лига" sub="18 апреля · Шымкент" pill={{ t: 'СКОРО', cls: 'done' }} to="Э14.3" />
        </Rows>
      </PhoneApp>
    </div>
  ),
};

/* ── Календарь ──────────────────────────────────────────────────── */

/* Сезон федерации: турниры идут по нескольку дней, поэтому событие — полоса
   через дни, а не точка в каждом. Данные — настоящий март 2026. */
const SEASON_EVENTS = [
  { id: 't1', nm: 'Кубок Алматы 2026', from: '2026-03-12', till: '2026-03-15', tone: 'accent' as const, sub: 'Алматы · открытый республиканский', to: 'Э5.10' },
  { id: 't2', nm: 'Приём заявок судей', from: '2026-03-02', till: '2026-03-05', tone: 'warning' as const, sub: 'Кубок Алматы 2026', to: 'Э5.2' },
  { id: 't3', nm: 'Первенство Астаны', from: '2026-03-20', till: '2026-03-22', tone: 'accent' as const, sub: 'Астана · главный старт', to: 'Э5.10' },
  { id: 't4', nm: 'Семинар судей', from: '2026-03-19', tone: 'success' as const, sub: 'Караганда', to: 'Э5.13' },
  { id: 't5', nm: 'Аттестация', from: '2026-03-26', till: '2026-03-27', tone: 'neutral' as const, sub: 'онлайн' },
  { id: 't6', nm: 'Евразийская лига · тур 2', from: '2026-03-28', till: '2026-04-01', tone: 'danger' as const, sub: 'Шымкент', to: 'Э5.10' },
];

/* Игровой день главного судьи: колонки — столы, блоки — матчи по кругам. */
const TABLES = [
  { key: 's1', t: 'Стол 1', sub: 'центральный' },
  { key: 's2', t: 'Стол 2' },
  { key: 's3', t: 'Стол 3' },
  { key: 's4', t: 'Стол 4' },
];
const DAY_SLOTS = [
  { id: 'm1', col: 's1', from: '10:00', till: '11:00', nm: '1/8 · Ким Г. — Пак С.', tone: 'neutral' as const, sub: 'сыгран 3:1' },
  { id: 'm2', col: 's1', from: '11:00', till: '12:00', nm: '1/8 · Оспанов Р. — Ли С.', tone: 'accent' as const, sub: 'идёт' },
  { id: 'm3', col: 's2', from: '10:00', till: '11:30', nm: '1/8 · Тлеу А. — Ахметов Д.', tone: 'neutral' as const },
  { id: 'm4', col: 's2', from: '12:00', till: '13:00', nm: '1/4 финала', tone: 'accent' as const },
  { id: 'm5', col: 's3', from: '10:30', till: '11:30', nm: 'Парный · 1/4', tone: 'accent' as const },
  { id: 'm6', col: 's3', from: '11:30', till: '12:30', nm: 'Парный · 1/4', tone: 'accent' as const },
  { id: 'm7', col: 's4', from: '10:00', till: '12:30', nm: 'Перерыв: стол не занят', tone: 'warning' as const, sub: 'судья не назначен' },
  { id: 'm8', col: 's4', from: '13:00', till: '14:00', nm: '1/2 финала', tone: 'success' as const },
];

export const CalendarMonth = {
  name: 'Календарь · месяц сезона',
  render: () => (
    <div className="p-8">
      <WebApp role={DEMO_ROLE} nav="Соревнования" title="Календарь сезона" sub="Март 2026 · 6 событий">
        <Calendar
          month="2026-03-01"
          today="2026-03-18"
          events={SEASON_EVENTS}
          cols={TABLES}
          slots={DAY_SLOTS}
          nowLine="11:20"
          hours={{ from: 9, till: 15 }}
          side={
            <div className="flex flex-col gap-3">
              <MiniMonth month="2026-03-01" today="2026-03-18" events={SEASON_EVENTS} />
              <DayList
                title="18 марта, среда"
                items={[
                  { id: 'a', t: '10:00', nm: 'Кубок Алматы 2026', sub: '1/8 финала · 12 столов', tone: 'accent', to: 'Э5.10' },
                  { id: 'b', t: 'весь день', nm: 'Приём заявок игроков', sub: 'Первенство Астаны', tone: 'warning' },
                ]}
              />
            </div>
          }
        />
      </WebApp>
    </div>
  ),
};

/* Лента событий: дата слева, карточка справа, даты нанизаны на линию.
   Отвечает на «что дальше по порядку» — в отличие от сетки месяца, которая
   отвечает на «что на что накладывается». */
export const CalendarTimeline = {
  name: 'Календарь · лента событий',
  render: () => (
    <div className="p-8">
      <WebApp
        role={DEMO_ROLE}
        nav="Соревнования"
        title="Что впереди"
        sub="Сезон 2026 · ближайшие события"
      >
        <Panel>
          <EventTimeline
            today="2026-03-18"
            items={[
              {
                id: 'e1',
                from: '2026-03-12',
                till: '2026-03-15',
                nm: 'Кубок Алматы 2026',
                sub: 'Алматы · открытый республиканский · 96 участников',
                tone: 'accent',
                to: 'Э5.10',
                right: <StatusChip tst="live" />,
                children: (
                  <Facts items={[{ k: 'судей в наряде', v: '6 из 7', hot: true }, { k: 'столов', v: '12' }]} />
                ),
              },
              {
                id: 'e2',
                from: '2026-03-19',
                nm: 'Семинар судей',
                sub: 'Караганда · повышение категории',
                tone: 'success',
                to: 'Э5.13',
                right: <Pill t="ЗАПИСЬ ОТКРЫТА" color="success" />,
              },
              {
                id: 'e3',
                from: '2026-03-20',
                till: '2026-03-22',
                nm: 'Первенство Астаны',
                sub: 'Астана · главный старт',
                tone: 'warning',
                to: 'Э5.10',
                right: <StatusChip tst="judges" />,
                children: <Bar tone="warning">Судья не назначен, а до старта два дня.</Bar>,
              },
              {
                id: 'e4',
                from: '2026-04-01',
                till: '2026-04-05',
                nm: 'Евразийская лига · тур 2',
                sub: 'Шымкент · командный',
                tone: 'danger',
                to: 'Э5.10',
                right: <StatusChip tst="draft" />,
              },
            ]}
          />
        </Panel>
      </WebApp>
    </div>
  ),
};

export const CalendarWeek = {
  name: 'Календарь · шкала времени',
  render: () => (
    <div className="p-8">
      <WebApp
        role={DEMO_ROLE}
        nav="Соревнования"
        title="Расписание игрового дня"
        sub="Кубок Алматы 2026 · день 2 из 4 · 4 стола"
        hint="Красная линия — текущее время. Два блока в одной колонке в одно время означают ошибку расписания: их видно, а не спрятано."
      >
        <TimeGrid cols={TABLES} events={DAY_SLOTS} from={9} till={15} nowLine="11:20" />
      </WebApp>
    </div>
  ),
};

/* Счёт по партиям отдельно: применяется и вне карточки матча. */
export const Score = {
  name: 'Счёт по партиям',
  render: () => (
    <div className="hero-scope inline-block bg-white p-8" data-theme="light">
      <GameCells games={[[11, 8], [9, 11], [11, 6], [12, 10]]} />
    </div>
  ),
};
