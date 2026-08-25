/* Э14.2 · Календарь — вариант в языке Google Календаря (25.08.2026).

   Первый заход рисовал календарь списком с колонкой месяца слева. Замечание
   федерации: на телефоне календарь должен читаться как привычный календарь,
   то есть как «Расписание» в Google Календаре. Что оттуда взято дословно:

     · шапка — месяц и год словами, поиск и «сегодня» справа;
     · неделя полосой: семь дней, сегодняшний кружком, дни с событиями —
       точкой под числом. Проведя пальцем, листаешь недели;
     · дальше ЛЕНТА ПО ДНЯМ, а не по турнирам: слева колонка с числом и днём
       недели, справа события этого дня. Пустых дней в ленте нет — Google их
       тоже пропускает, иначе половина экрана уходит на пустоту;
     · событие — строка с цветной меткой слева, названием и временем справа;
     · день, который идёт сейчас, помечен акцентом и в полосе, и в ленте.

   Что НЕ взято и почему: сетка месяца квадратами (у нас в месяце два-три
   события — квадраты будут пустыми), цветные календари-источники и кнопка
   «создать событие» (спортсмен турниры не создаёт).

   Своё, чего у Google нет: у турнира два разных времени — когда он идёт и до
   какого числа приём заявок. Срок приёма и есть то, ради чего сюда заходят,
   поэтому он вынесен в строку события акцентом, а не спрятан внутрь. */

import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Chrome, NAV } from './role14mobile';
import './role14mobile5.css';
import './role14mobile9.css';

/* Полоса недели: семь дней вокруг сегодняшнего. Точка под числом — в этот
   день что-то есть. */
const WEEK = [
  { d: 8, w: 'пн' },
  { d: 9, w: 'вт' },
  { d: 10, w: 'ср' },
  { d: 11, w: 'чт', dot: true },
  { d: 12, w: 'пт', dot: true, today: true },
  { d: 13, w: 'сб', dot: true },
  { d: 14, w: 'вс', dot: true },
];

/* Лента по дням. `kind` — что за событие: игра, приём заявок, взнос.
   Цвет метки берётся из правила цвета роли, а не заводится заново. */
const DAYS = [
  {
    d: 12,
    w: 'пт',
    today: true,
    items: [
      { kind: 'live', nm: 'Кубок Алматы 2026', at: '10:00', sub: 'ОРТ · Алматы · 1/8 финала, стол 5' },
    ],
  },
  {
    d: 13,
    w: 'сб',
    items: [{ kind: 'live', nm: 'Кубок Алматы 2026', at: '10:00', sub: 'ОРТ · Алматы · второй день' }],
  },
  {
    d: 14,
    w: 'вс',
    items: [{ kind: 'live', nm: 'Кубок Алматы 2026', at: '11:00', sub: 'ОРТ · Алматы · финалы' }],
  },
  {
    d: 18,
    w: 'чт',
    items: [
      { kind: 'other', nm: 'Чемпионат Республики', at: '09:00', sub: 'Главный старт · Астана · заявляет регион' },
    ],
  },
  {
    d: 20,
    w: 'сб',
    items: [{ kind: 'open', nm: 'Кубок Астаны 2026', at: 'до 23:59', sub: 'Закрывается приём заявок' }],
  },
  {
    d: 26,
    w: 'сб',
    items: [{ kind: 'live', nm: 'Кубок Астаны 2026', at: '10:00', sub: 'ОРТ · Астана · одиночный, парный' }],
  },
];

const OCT = [
  {
    d: 3,
    w: 'пт',
    items: [{ kind: 'open', nm: 'Осенний турнир Шымкента', at: 'до 23:59', sub: 'Закрывается приём заявок' }],
  },
  {
    d: 10,
    w: 'пт',
    items: [{ kind: 'live', nm: 'Осенний турнир Шымкента', at: '10:00', sub: 'ОРТ · Шымкент · одиночный' }],
  },
];

function Day({ day }: { day: (typeof DAYS)[number] }) {
  return (
    <div className={'m9-day' + (day.today ? ' today' : '')}>
      {/* Колонка дня: число крупно, день недели мелко — как в «Расписании». */}
      <div className="m9-date">
        <span className="w">{day.w}</span>
        <span className="d o14-disp">{day.d}</span>
      </div>
      <div className="m9-events">
        {day.items.map((e) => (
          <div className={'m9-ev ' + e.kind} key={e.nm + e.at} data-to="Э14.3">
            <span className="bar" />
            <span className="tx">
              <span className="nm">{e.nm}</span>
              <span className="ss">{e.sub}</span>
            </span>
            <span className="at">{e.at}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MobCalendarGoogle() {
  return (
    <div className="mb-wrap m5 m9">
      <Frame>
        <Chrome>
          <div className="mb-body m5-body">
            {/* Шапка календаря: месяц словами и два действия — как у Google. */}
            <div className="m9-top">
              <button type="button" className="m9-month">
                Сентябрь 2026 <ChevronRight size={16} />
              </button>
              <div className="m9-acts">
                <button type="button" aria-label="Поиск">
                  <Search size={18} />
                </button>
                <button type="button" aria-label="Сегодня">
                  <CalendarDays size={18} />
                </button>
              </div>
            </div>

            {/* Полоса недели. Листается вбок; сегодняшний день — кружок. */}
            <div className="m9-week">
              <button type="button" className="nav" aria-label="Прошлая неделя">
                <ChevronLeft size={16} />
              </button>
              {WEEK.map((x) => (
                <div className={'m9-wd' + (x.today ? ' today' : '')} key={x.d}>
                  <span className="w">{x.w}</span>
                  <span className="d">{x.d}</span>
                  {x.dot && <i />}
                </div>
              ))}
              <button type="button" className="nav" aria-label="Следующая неделя">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Лента по дням. Пустые дни пропущены. */}
            <div className="m9-band">Сентябрь</div>
            {DAYS.map((d) => (
              <Day key={d.d} day={d} />
            ))}

            <div className="m9-band">Октябрь</div>
            {OCT.map((d) => (
              <Day key={d.d} day={d} />
            ))}
          </div>
        </Chrome>
        <MiniTabBar items={NAV} active="Календарь" />
      </Frame>
    </div>
  );
}
