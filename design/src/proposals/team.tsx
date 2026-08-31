/* Предложения 1, 2, 4, 5 — модуль «Национальная команда» ✳ (31.08.2026).

   Федерация предложила четыре вещи вокруг сборной: план подготовки в профиле
   (п. 1), медкарточку там же (п. 2), документооборот по командированию (п. 4)
   и — «как вариант» — всё это одним модулем (п. 5).

   Рисуем **вариантом 5**, и вот почему. Пункты 1, 2 и 4 по отдельности живут в
   трёх разных местах: план — в профиле спортсмена, медкарта — там же, рапорт —
   у тренеров. Но вопрос у главного тренера один: «в каком состоянии сборная».
   План без календаря подготовки не проверяем (выполнен — относительно чего?),
   рапорт без состава не собрать (кого командируем?), а медкарта без плана
   отвечает только «допущен», хотя нужна для «может ли выполнить нагрузку».
   Поэтому у сборной один раздел с четырьмя экранами, а не четыре добавки в
   чужие.

   Что здесь **наше предположение, а не слова федерации** ✳ — помечено на самих
   экранах: состав основной/расширенный как деление базы, шкала выполнения
   плана, круг лиц с доступом к медкарте. Федерация этого не называла. */

import { useState } from 'react';
import {
  Activity, CalendarDays, ClipboardCheck, FileText, HeartPulse, Plane, Plus, Users,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import {
  A, AW, Bar, Bars, ChartRow, Donut, EventTimeline, Facts, FilterBar, FilterSeg, KV, Panel,
  PageTabs, PhoneRoleApp, Pill, Row, Rows, SearchInput, Sheet, StatTiles, WebApp,
  type RoleUI,
} from '../kit/hero/app';
import type { ScreenMap } from '../mockups/shell';

/* ── Роль ─────────────────────────────────────────────────────────
   Модуль отдан главному тренеру сборной (роль 11): у него сейчас три экрана на
   чтение, и предложения федерации — ровно про то, чего ему не хватает. Разделы
   добавлены к существующим, а не заменяют их. */
const R: RoleUI = {
  num: '11',
  title: 'Главный тренер национальной команды',
  person: { nm: 'Ахметов С.', rl: 'Главный тренер сборной', av: A(52) },
  brandName: 'Национальная команда РК',
  brandSub: 'Состав · подготовка · командирование',
  badge: false,
  nav: [
    [<Users size={16} key="s" />, 'Состав сборной'],
    [<CalendarDays size={16} key="c" />, 'Календарь подготовки'],
    [<Plane size={16} key="r" />, 'Рапорты'],
    [<Activity size={16} key="k" />, 'Кандидаты'],
  ],
  roles: ['Главный тренер национальной команды', { t: 'Судья · вне турнира', to: 'Э0.8' }],
};

/* ── Данные ──────────────────────────────────────────────────────── */

type Squad = 'Основной' | 'Расширенный';
type Athlete = {
  av: string;
  nm: string;
  born: number;
  region: string;
  squad: Squad;
  age: string;
  coach: string;
  rating: number;
  /** Состояние плана подготовки: доля выполненного за текущий период. */
  plan: { done: number; total: number } | null;
  /** Медицинская карта: до какой даты действует допуск. */
  med: { till: string; warn?: boolean } | null;
};

const TEAM: Athlete[] = [
  { av: A(13), nm: 'Ким Георгий', born: 2003, region: 'Алматы', squad: 'Основной', age: 'Взрослые', coach: 'Ахметов С.', rating: 2456, plan: { done: 7, total: 9 }, med: { till: '14.02.2027' } },
  { av: A(76), nm: 'Токаев Марат', born: 2005, region: 'Астана', squad: 'Основной', age: 'До 21', coach: 'Ахметов С.', rating: 2350, plan: { done: 5, total: 9 }, med: { till: '30.09.2026', warn: true } },
  { av: AW(21), nm: 'Тлеуова Аружан', born: 2007, region: 'Шымкент', squad: 'Основной', age: 'До 19', coach: 'Смагулова Д.', rating: 2288, plan: { done: 9, total: 9 }, med: { till: '02.06.2027' } },
  { av: A(45), nm: 'Байжанов Асхат', born: 2004, region: 'Караганда', squad: 'Расширенный', age: 'Взрослые', coach: 'Ахметов С.', rating: 2180, plan: { done: 3, total: 8 }, med: { till: '18.11.2026' } },
  { av: AW(31), nm: 'Ким Лариса', born: 2008, region: 'Павлодар', squad: 'Расширенный', age: 'До 19', coach: 'Смагулова Д.', rating: 2104, plan: null, med: { till: '04.04.2027' } },
  { av: A(64), nm: 'Сейтқали Айдос', born: 2009, region: 'Тараз', squad: 'Расширенный', age: 'До 17', coach: 'Смагулова Д.', rating: 1980, plan: { done: 2, total: 6 }, med: null },
];

const SQUADS = ['Все составы', 'Основной', 'Расширенный'];
const AGES = ['Все возрасты', 'Взрослые', 'До 21', 'До 19', 'До 17'];
const COACHES = ['Все тренеры', 'Ахметов С.', 'Смагулова Д.'];

const filtered = (q: string, sq: string, age: string, coach: string) =>
  TEAM.filter((a) => {
    if (sq !== SQUADS[0] && a.squad !== sq) return false;
    if (age !== AGES[0] && a.age !== age) return false;
    if (coach !== COACHES[0] && a.coach !== coach) return false;
    const t = q.trim().toLowerCase();
    return !t || a.nm.toLowerCase().includes(t) || a.region.toLowerCase().includes(t);
  });

/** Значок плана: не «есть / нет», а сколько сделано. План, который нельзя
    проверить, — список пожеланий, и на экране это должно быть видно числом. */
const planPill = (a: Athlete) =>
  a.plan === null ? (
    <Pill t="ПЛАНА НЕТ" color="warning" />
  ) : a.plan.done === a.plan.total ? (
    <Pill t={`ВЫПОЛНЕН ${a.plan.done}/${a.plan.total}`} color="success" />
  ) : (
    <Pill t={`${a.plan.done} из ${a.plan.total}`} color="accent" />
  );

const medPill = (a: Athlete) =>
  a.med === null ? (
    <Pill t="НЕТ ДОПУСКА" color="danger" />
  ) : a.med.warn ? (
    <Pill t={`ДО ${a.med.till}`} color="warning" />
  ) : (
    <Pill t={`ДО ${a.med.till}`} color="success" />
  );

/* ── П1.1 · Состав сборной ───────────────────────────────────────── */

const TEAM_GRID = 'minmax(0,2.4fr) 100px 84px minmax(0,1.1fr) 70px 118px 142px';

export function Team1_1() {
  const [q, setQ] = useState('');
  const [sq, setSq] = useState(SQUADS[0]);
  const [age, setAge] = useState(AGES[0]);
  const [coach, setCoach] = useState(COACHES[0]);
  const rows = filtered(q, sq, age, coach);
  return (
    <WebApp
      role={R}
      nav="Состав сборной"
      title="Состав национальной команды"
      sub="Сезон 2026 · основной и расширенный составы"
      hint="Предложение 5 федерации: единая база членов сборной с распределением по составам, возрастным группам и тренерам."
    >
      <StatTiles
        items={[
          { v: '24', k: 'В сборной' },
          { v: '12', k: 'Основной состав' },
          { v: '12', k: 'Расширенный' },
          { v: '3', k: 'Плана подготовки нет', tone: 'a' },
          { v: '1', k: 'Медицинский допуск истёк', tone: 'b' },
          { v: '6', k: 'УТС в сезоне' },
        ]}
      />

      <FilterBar
        right={
          <Button size="sm" variant="outline">
            <Plus size={14} /> Внести в состав
          </Button>
        }
      >
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия или регион" className="w-72" />
        <FilterSeg items={SQUADS} active={sq} onPick={setSq} />
        <FilterSeg items={AGES} active={age} onPick={setAge} />
        <FilterSeg items={COACHES} active={coach} onPick={setCoach} />
      </FilterBar>

      <Panel
        title={`Члены сборной · ${rows.length}`}
        sub="Строка открывает карточку: план подготовки, медкарта, история"
        flush
      >
        <Sheet
          flush
          grid={TEAM_GRID}
          cols={['Спортсмен', 'Состав', 'Возраст', 'Тренер', 'Рейтинг', 'План периода', 'Медицинский допуск']}
        >
          {rows.map((a) => (
            <div
              key={a.nm}
              data-row
              data-to="П1.2"
              className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px]"
              style={{ gridTemplateColumns: TEAM_GRID }}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar size="sm">
                  <Avatar.Image alt={a.nm} src={a.av} />
                  <Avatar.Fallback>{a.nm.slice(0, 1)}</Avatar.Fallback>
                </Avatar>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-medium">{a.nm}</span>
                  <span className="block truncate text-xs text-neutral-500">
                    {a.born} г.р. · {a.region}
                  </span>
                </span>
              </span>
              <span className="text-neutral-600">{a.squad}</span>
              <span className="text-neutral-600">{a.age}</span>
              <span className="truncate text-neutral-600">{a.coach}</span>
              <span className="text-right tabular-nums">{a.rating}</span>
              <span>{planPill(a)}</span>
              <span>{medPill(a)}</span>
            </div>
          ))}
        </Sheet>
      </Panel>

      <Bar tone="warning">
        ✳ Наше предположение, а не слова федерации: деление на основной и расширенный составы
        федерация назвала, но не сказала, кто и по какому правилу переводит спортсмена между ними —
        главный тренер решением или отбор считается по рейтингу. Уточнить.
      </Bar>
    </WebApp>
  );
}

export const Team1_1Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Состав сборной"
    title="Состав сборной"
    sub="Сезон 2026 · 24 спортсмена"
  >
    <div className="mb-3">
      <FilterSeg items={SQUADS} active={SQUADS[1]} onPick={() => {}} />
    </div>
    <Rows>
      {TEAM.filter((a) => a.squad === 'Основной').map((a) => (
        <Row
          key={a.nm}
          av={a.av}
          nm={a.nm}
          sub={`${a.age} · ${a.region} · ${a.coach}`}
          val={String(a.rating)}
          to="П1.2"
          pill={a.med === null ? { t: 'НЕТ ДОПУСКА', cls: 'bad' } : a.plan === null ? { t: 'ПЛАНА НЕТ', cls: 'wait' } : { t: `${a.plan.done}/${a.plan.total}`, cls: 'live' }}
        />
      ))}
    </Rows>
    <div className="mt-3">
      <Bar>На телефоне колонки сведены в подпись: состав, возраст, тренер — строкой под фамилией.</Bar>
    </div>
  </PhoneRoleApp>
);

/* ── П1.2 · Карточка спортсмена сборной ──────────────────────────── */

const PLAN = [
  { t: 'Общая физическая подготовка', sub: 'январь–март · 3 раза в неделю', done: true },
  { t: 'Техника: приём короткой подачи', sub: 'февраль · с тренером региона', done: true },
  { t: 'УТС Алматы — базовый сбор', sub: '02–14.03 · 12 дней', done: true },
  { t: 'Чемпионат РК — выход в 1/4', sub: '12–14.03 · целевой результат', done: true },
  { t: 'Работа над игрой слева в атаке', sub: 'апрель–май · видеоразбор раз в неделю', done: true },
  { t: 'УТС Астана — предсоревновательный', sub: '05–18.05 · 14 дней', done: true },
  { t: 'Открытый турнир Караганды', sub: '24.05 · обкатка подачи', done: true },
  { t: 'УТС Шымкент — восстановительный', sub: '10–20.06 · 11 дней', done: false },
  { t: 'Международный старт — отбор', sub: 'июль · по решению штаба', done: false },
];

const MED = [
  { t: 'Медицинский допуск к соревнованиям', sub: 'выдан 14.02.2026 · действует до 14.02.2027', st: 'ДЕЙСТВУЕТ', cls: 'live' as const },
  { t: 'Углублённое медобследование (УМО)', sub: 'пройдено 20.01.2026 · Республиканский диспансер', st: 'ПРОЙДЕНО', cls: 'live' as const },
  { t: 'Травма: правое плечо, надостная мышца', sub: '18.04.2026 · нагрузка ограничена 3 недели · снято 09.05.2026', st: 'ЗАКРЫТА', cls: 'done' as const },
  { t: 'Аллергия: пыльца злаковых', sub: 'внесено врачом сборной · учитывать в мае–июне', st: 'ПОСТОЯННО', cls: 'wait' as const },
];

const HISTORY = [
  { t: 'УТС Астана — предсоревновательный', sub: '05–18.05.2026 · 14 дней · тренер Ахметов С.', val: 'явка полная' },
  { t: 'Открытый турнир Караганды', sub: '24.05.2026 · 1/2 финала · 4 победы, 1 поражение', val: '+8 рейтинга' },
  { t: 'Чемпионат РК 2026', sub: '12–14.03.2026 · 1/4 финала · цель плана выполнена', val: '+34 рейтинга' },
  { t: 'УТС Алматы — базовый сбор', sub: '02–14.03.2026 · 12 дней · тренер Ахметов С.', val: 'явка полная' },
];

/* Вкладки, а не фильтр ✳: вкладка меняет экран, фильтр отбирает строки. План,
   медкарта и история — три разных экрана под одной шапкой, поэтому здесь
   сегмент, а не выпадающий отбор. */
function CardTabs({ start = 'План подготовки' }: { start?: string }) {
  const done = PLAN.filter((p) => p.done).length;
  const plan = (
        <>
          <Panel
            title="Индивидуальный план подготовки · сезон 2026"
            sub="Составил и правит главный тренер сборной · последняя правка 12.06.2026"
            extra={
              <Button size="sm" variant="outline">
                <ClipboardCheck size={14} /> Внести правку
              </Button>
            }
          >
            <div className="mb-3">
              <Facts
                items={[
                  { k: 'пунктов плана', v: String(PLAN.length) },
                  { k: 'выполнено', v: `${done} из ${PLAN.length}` },
                  { k: 'период', v: 'январь — декабрь 2026' },
                  { k: 'правок за сезон', v: '4' },
                ]}
              />
            </div>
            <Rows>
              {PLAN.map((p) => (
                <div key={p.t} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={
                      'grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ' +
                      (p.done ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400')
                    }
                  >
                    {p.done ? '✓' : '—'}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className={'block truncate text-[13.5px] ' + (p.done ? 'font-medium' : 'font-medium text-neutral-500')}>
                      {p.t}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{p.sub}</span>
                  </span>
                  <Pill t={p.done ? 'ВЫПОЛНЕНО' : 'ВПЕРЕДИ'} color={p.done ? 'success' : 'default'} />
                </div>
              ))}
            </Rows>
          </Panel>

          <Bar tone="warning">
            ✳ Наше предположение: «контроль выполнения плана» федерация назвала, но чем считается
            выполнение — отметкой тренера, явкой на УТС или достигнутым результатом — не сказала.
            Здесь отметку ставит тренер, а явка и результат подтягиваются из истории.
          </Bar>
        </>
  );
  const med = (
        <>
          {/* Доступ — первое, что видно на медицинской вкладке ✳: это
              чувствительные данные, и правило должно быть на экране, а не в
              настройках, куда никто не заходит. */}
          <Bar tone="warning">
            Медицинские данные видят: <b>врач сборной</b> (вносит и правит),{' '}
            <b>главный тренер</b> (читает допуск и ограничения нагрузки),{' '}
            <b>сам спортсмен</b> (читает всё). Остальным ролям вкладка не видна вовсе. ✳ Круг лиц —
            наше предположение: федерация написала «с разграничением прав доступа», но кому что
            открыто, не назвала.
          </Bar>

          <Panel
            title="Медицинская карта"
            sub="Ким Георгий · 2003 г.р. · Алматы"
            extra={
              <Button size="sm" variant="outline">
                <Plus size={14} /> Добавить запись
              </Button>
            }
          >
            <div className="mb-3">
              <KV
                items={[
                  ['Допуск к соревнованиям', 'действует до 14.02.2027'],
                  ['Последнее УМО', '20.01.2026 · Республиканский диспансер'],
                  ['Группа крови', 'указана врачом сборной'],
                  ['Ограничения нагрузки', 'нет'],
                ]}
              />
            </div>
            <Rows>
              {MED.map((m) => (
                <Row key={m.t} nm={m.t} sub={m.sub} pill={{ t: m.st, cls: m.cls }} />
              ))}
            </Rows>
          </Panel>

          <Bar>
            Допуск на турнир система и так сверяет с системами Минздрава при заявке (TZ §8.2).
            Карта не заменяет эту проверку — она хранит то, чего в справке нет: травмы,
            ограничения, историю обследований.
          </Bar>
        </>
  );
  const history = (
        <>
          <Panel title="История подготовки · сезон 2026" sub="УТС, выезды и результаты — одной лентой" flush>
            <Rows>
              {HISTORY.map((h) => (
                <Row key={h.t} nm={h.t} sub={h.sub} val={h.val} />
              ))}
            </Rows>
          </Panel>
          <ChartRow>
            <Panel title="Из чего сложился сезон">
              <Donut
                label="Мероприятия сезона: сборы, соревнования, восстановление"
                total="14"
                totalNote="мероприятий"
                parts={[
                  { t: 'Учебно-тренировочные сборы', v: 6, note: '68 дней' },
                  { t: 'Соревнования', v: 5 },
                  { t: 'Плановые обследования', v: 3 },
                ]}
              />
            </Panel>
            <Panel title="Дней на сборах по месяцам">
              <Bars
                label="Дней на учебно-тренировочных сборах по месяцам"
                suffix="дней на сборах"
                items={[
                  { t: 'янв', v: 0 },
                  { t: 'фев', v: 0 },
                  { t: 'мар', v: 12 },
                  { t: 'апр', v: 0 },
                  { t: 'май', v: 14 },
                  { t: 'июн', v: 11, on: true },
                ]}
              />
            </Panel>
          </ChartRow>
        </>
  );
  return (
    <PageTabs
      active={start}
      items={[
        { t: 'План подготовки', view: plan },
        { t: 'Медицинская карта', view: med },
        { t: 'История подготовки', view: history },
      ]}
    />
  );
}

export const Team1_2 = () => (
  <WebApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав сборной', to: 'П1.1' }}
    title="Ким Георгий"
    sub="Основной состав · взрослые · 2003 г.р. · Алматы · рейтинг 2456 · тренер Ахметов С."
  >
    <CardTabs />
  </WebApp>
);

export const Team1_2Med = () => (
  <WebApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав сборной', to: 'П1.1' }}
    title="Ким Георгий"
    sub="Основной состав · взрослые · 2003 г.р. · Алматы · рейтинг 2456 · тренер Ахметов С."
  >
    <CardTabs start="Медицинская карта" />
  </WebApp>
);

export const Team1_2History = () => (
  <WebApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав сборной', to: 'П1.1' }}
    title="Ким Георгий"
    sub="Основной состав · взрослые · 2003 г.р. · Алматы · рейтинг 2456 · тренер Ахметов С."
  >
    <CardTabs start="История подготовки" />
  </WebApp>
);

export const Team1_2Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав', to: 'П1.1' }}
    title="Ким Георгий"
    sub="Основной состав · 2003 г.р. · рейтинг 2456"
  >
    <PageTabs
      items={[
        {
          t: 'План',
          view: (
            <Panel title="План подготовки · 7 из 9" flush>
              <Rows>
                {PLAN.slice(0, 5).map((p) => (
                  <Row key={p.t} nm={p.t} sub={p.sub} pill={{ t: p.done ? 'ВЫПОЛНЕНО' : 'ВПЕРЕДИ', cls: p.done ? 'live' : 'wait' }} />
                ))}
              </Rows>
            </Panel>
          ),
        },
        {
          t: 'Медкарта',
          view: (
            <>
              <Bar tone="warning">Видят: врач сборной, главный тренер, сам спортсмен.</Bar>
              <Panel title="Медицинская карта" flush>
                <Rows>
                  {MED.map((m) => (
                    <Row key={m.t} nm={m.t} sub={m.sub} pill={{ t: m.st, cls: m.cls }} />
                  ))}
                </Rows>
              </Panel>
            </>
          ),
        },
        {
          t: 'История',
          view: (
            <Panel title="История подготовки" flush>
              <Rows>
                {HISTORY.map((h) => (
                  <Row key={h.t} nm={h.t} sub={h.sub} val={h.val} />
                ))}
              </Rows>
            </Panel>
          ),
        },
      ]}
    />
  </PhoneRoleApp>
);

/* ── П1.3 · Календарь подготовки ─────────────────────────────────── */

const PREP = [
  { id: 'p1', from: '2026-03-02', till: '2026-03-14', nm: 'УТС Алматы — базовый сбор', sub: '12 дней · основной состав · тренер Ахметов С.', tone: 'accent' as const },
  { id: 'p2', from: '2026-03-12', till: '2026-03-14', nm: 'Чемпионат РК 2026', sub: 'Астана · целевой старт сезона', tone: 'warning' as const },
  { id: 'p3', from: '2026-05-05', till: '2026-05-18', nm: 'УТС Астана — предсоревновательный', sub: '14 дней · основной и расширенный', tone: 'accent' as const },
  { id: 'p4', from: '2026-05-24', nm: 'Открытый турнир Караганды', sub: 'обкатка подачи · четверо из расширенного', tone: 'warning' as const },
  { id: 'p5', from: '2026-06-10', till: '2026-06-20', nm: 'УТС Шымкент — восстановительный', sub: '11 дней · рапорт на согласовании', tone: 'neutral' as const },
  { id: 'p6', from: '2026-07-08', till: '2026-07-12', nm: 'Международный старт — отбор', sub: 'состав определяет штаб', tone: 'neutral' as const },
];

export const Team1_3 = () => (
  <WebApp
    role={R}
    nav="Календарь подготовки"
    title="Календарь подготовки сборной"
    sub="Сезон 2026 · сборы, выезды и целевые старты в одной ленте"
    hint="Предложение 5: единый календарь подготовки национальной команды с учётом УТС и выездов на соревнования."
    aside={
      <>
        <Panel title="Ближайшее" sub="10–20 июня · через 9 дней">
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">УТС Шымкент</div>
            <div className="mt-0.5 text-[12.5px] text-neutral-500">восстановительный · 11 дней</div>
          </div>
          <div className="mt-3">
            <KV
              items={[
                ['Состав', '8 спортсменов'],
                ['Тренеры', 'Ахметов С., Смагулова Д.'],
                ['Рапорт', 'на согласовании у меня'],
              ]}
            />
          </div>
          <div className="mt-3">
            <Button className="w-full" variant="primary" data-to="П1.4">
              <FileText size={15} /> Открыть рапорт
            </Button>
          </div>
        </Panel>
        <Panel title="Загрузка сезона">
          <Facts
            items={[
              { k: 'сборов', v: '6' },
              { k: 'дней на сборах', v: '68' },
              { k: 'выездов', v: '5' },
            ]}
          />
        </Panel>
      </>
    }
  >
    <Panel title="Сборы и старты · сезон 2026" sub="Серым — то, по чему рапорт ещё не согласован">
      <EventTimeline items={PREP} today="2026-06-01" />
    </Panel>
    <Bar>
      Календарь подготовки — не второй календарь соревнований: старты в нём те же, что в общем
      календаре федерации (§4.1), но показаны рядом со сборами, потому что план строится из тех и
      других вместе.
    </Bar>
  </WebApp>
);

/* ── П1.4 · Рапорты на командирование ────────────────────────────── */

type Report = {
  nm: string;
  sub: string;
  who: string;
  st: string;
  cls: 'live' | 'bad' | 'wait' | 'done';
};

const REPORTS: Report[] = [
  { nm: 'УТС Шымкент — восстановительный', sub: '10–20.06 · 8 спортсменов, 2 тренера · подал Смагулова Д.', who: 'Регион Шымкент', st: 'ЖДЁТ МЕНЯ', cls: 'wait' },
  { nm: 'Открытый турнир Караганды', sub: '24.05 · 4 спортсмена · подал Байтасов Р.', who: 'Регион Алматы', st: 'ЖДЁТ МЕНЯ', cls: 'wait' },
  { nm: 'УТС Астана — предсоревновательный', sub: '05–18.05 · 12 спортсменов, 3 тренера · подал Ахметов С.', who: 'Штаб сборной', st: 'СОГЛАСОВАН', cls: 'live' },
  { nm: 'Международный старт — отбор', sub: '08–12.07 · состав не приложен · подал Байтасов Р.', who: 'Регион Алматы', st: 'НА ДОРАБОТКЕ', cls: 'bad' },
  { nm: 'УТС Алматы — базовый сбор', sub: '02–14.03 · 14 спортсменов · подал Ахметов С.', who: 'Штаб сборной', st: 'В ФЕДЕРАЦИИ', cls: 'done' },
];

const TRACK = [
  { at: '09.06, 11:20', t: 'Подан на согласование', s: 'Смагулова Д. · старший тренер региона Шымкент', tone: 'flat' },
  { at: '09.06, 15:04', t: 'Возвращён на доработку', s: 'главный тренер: «приложите поимённый состав и сроки заезда»', tone: 'loss' },
  { at: '10.06, 09:12', t: 'Подан повторно', s: 'состав приложен · 8 спортсменов, 2 тренера', tone: 'flat' },
];

export function Team1_4() {
  const [pick, setPick] = useState(REPORTS[0].nm);
  const one = REPORTS.find((r) => r.nm === pick) ?? REPORTS[0];
  return (
    <WebApp
      role={R}
      nav="Рапорты"
      title="Рапорты на командирование"
      sub="Сборы и выезды · согласование главного тренера"
      hint="Предложение 4: рапорт подают тренеры штаба и старшие тренеры регионов; после согласования документ уходит в федерацию сам."
    >
      <StatTiles
        items={[
          { v: '2', k: 'Ждут моего решения', tone: 'a' },
          { v: '1', k: 'На доработке у автора' },
          { v: '1', k: 'Согласован сегодня', tone: 'g' },
          { v: '1', k: 'Ушёл в федерацию' },
        ]}
      />

      <Panel title="Очередь рапортов" sub="Строка открывает документ ниже" flush>
        <Rows>
          {REPORTS.map((r) => (
            <Row
              key={r.nm}
              nm={r.nm}
              sub={r.sub}
              pill={{ t: r.st, cls: r.cls }}
              on={r.nm === pick}
              onSelect={() => setPick(r.nm)}
            />
          ))}
        </Rows>
      </Panel>

      <Panel
        title={one.nm}
        sub={`${one.who} · рапорт № 14/2026`}
        extra={<Pill t={one.st} color={one.cls === 'live' ? 'success' : one.cls === 'bad' ? 'danger' : one.cls === 'wait' ? 'warning' : 'default'} />}
      >
        <KV
          items={[
            ['Мероприятие', 'Учебно-тренировочный сбор, Шымкент'],
            ['Сроки', '10–20 июня 2026 · 11 дней'],
            ['Состав', '8 спортсменов, 2 тренера — поимённо в приложении'],
            ['Основание', 'план подготовки сборной на 2026 год'],
            ['Приложение', 'рапорт-скан.pdf · 240 КБ'],
          ]}
        />

        {/* История согласования — не журнал ради журнала ✳: рапорт ходит между
            тремя людьми, и «почему вернули» должно читаться там же, где решают. */}
        <div className="mt-4">
          <Panel title="История согласования" flush>
            <Rows>
              {TRACK.map((t) => (
                <Row key={t.at} nm={t.t} sub={`${t.at} · ${t.s}`} />
              ))}
            </Rows>
          </Panel>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary">
            <ClipboardCheck size={15} /> Согласовать
          </Button>
          <Button variant="outline">Вернуть на доработку</Button>
          <Button variant="outline">Отклонить</Button>
          <span className="text-[12.5px] text-neutral-500">
            У «вернуть» и «отклонить» комментарий обязателен — иначе автор не знает, что править.
          </span>
        </div>
      </Panel>

      <Bar>
        Согласованный рапорт уходит в федерацию сам — отправлять его отдельно никто не должен.
        Дальше он живёт в документах федерации, а здесь остаётся строкой «в федерации» с датой.
      </Bar>
    </WebApp>
  );
}

export const Team1_4Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Рапорты"
    title="Рапорты"
    sub="2 ждут решения"
  >
    <Rows>
      {REPORTS.map((r) => (
        <Row key={r.nm} nm={r.nm} sub={r.sub} pill={{ t: r.st, cls: r.cls }} />
      ))}
    </Rows>
    <div className="mt-3">
      <Bar>Согласование с телефона — то же решение: согласовать, вернуть с комментарием, отклонить.</Bar>
    </div>
  </PhoneRoleApp>
);

/* ── Борд ────────────────────────────────────────────────────────── */

export const TEAM_SCREENS: ScreenMap = {
  'П1.1': {
    cap: 'Состав национальной команды',
    view: () => <Team1_1 />,
    alt: () => <Team1_1Phone />,
  },
  'П1.2': {
    cap: 'Карточка спортсмена сборной',
    view: () => <Team1_2 />,
    alt: () => <Team1_2Phone />,
    frames: [
      { t: 'Медицинская карта — вкладка с ограниченным доступом', view: () => <Team1_2Med /> },
      { t: 'История подготовки — УТС, старты и результаты', view: () => <Team1_2History /> },
    ],
  },
  'П1.3': {
    cap: 'Календарь подготовки',
    view: () => <Team1_3 />,
  },
  'П1.4': {
    cap: 'Рапорты на командирование',
    view: () => <Team1_4 />,
    alt: () => <Team1_4Phone />,
  },
};
