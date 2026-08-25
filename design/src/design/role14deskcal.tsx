/* Э14.2 · Календарь на десктопе — тот же язык, что на телефоне (25.08.2026).

   На телефоне выбран вид Google Календаря: месяц словами, полоса недели, лента
   по дням. На широком экране у Google другое умолчание — сетка месяца, и это
   правильно: место есть, а месяц целиком отвечает на «когда я свободен» одним
   взглядом. Поэтому десктоп повторяет не разметку телефона, а его язык:

     · слева колонка, как у Google: мини-месяц для перескока и переключатели
       «что показывать» — мои турниры, открытые приёмы, чужие заявки;
     · сверху строка управления: стрелки, «Сегодня», месяц и год, справа выбор
       вида (месяц или расписание);
     · в сетке дни месяца, сегодня — залитым кружком, соседние месяцы тише;
     · событие — плашка с цветной меткой: акцент значит «мои игры», зелёный —
       срок приёма заявок (то, ради чего в календарь и заходят), серый — старты,
       куда заявляет регион или клуб.

   Своё, чего у Google нет: у турнира два времени. Многодневный турнир идёт
   полосой через все свои дни, а дедлайн приёма стоит отдельной плашкой в свой
   день — иначе срок теряется внутри полосы. */

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import type { DeskVariant } from '../deskShell';
import './role14deskcal.css';

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/* Сетка сентября 2026: месяц начинается со вторника, поэтому первая клетка —
   31 августа. Данные выдуманные, но правдоподобные, как везде в макетах. */
type Cell = {
  d: number;
  /* Не этот месяц — тише. */
  off?: boolean;
  today?: boolean;
  events?: { kind: 'live' | 'open' | 'other'; nm: string; at?: string; span?: 'start' | 'mid' | 'end' }[];
};

const MONTH: Cell[] = [
  { d: 31, off: true },
  { d: 1 },
  { d: 2 },
  { d: 3 },
  { d: 4 },
  { d: 5, events: [{ kind: 'open', nm: 'Кубок Алматы · приём', at: 'до 23:59' }] },
  { d: 6 },

  { d: 7 },
  { d: 8 },
  { d: 9 },
  { d: 10 },
  { d: 11 },
  { d: 12, today: true, events: [{ kind: 'live', nm: 'Кубок Алматы 2026', at: '10:00', span: 'start' }] },
  { d: 13, events: [{ kind: 'live', nm: 'Кубок Алматы 2026', span: 'mid' }] },

  { d: 14, events: [{ kind: 'live', nm: 'Кубок Алматы 2026', span: 'end' }] },
  { d: 15 },
  { d: 16 },
  { d: 17 },
  { d: 18, events: [{ kind: 'other', nm: 'Чемпионат Республики', at: '09:00', span: 'start' }] },
  { d: 19, events: [{ kind: 'other', nm: 'Чемпионат Республики', span: 'mid' }] },
  { d: 20, events: [
      { kind: 'other', nm: 'Чемпионат Республики', span: 'mid' },
      { kind: 'open', nm: 'Кубок Астаны · приём', at: 'до 23:59' },
    ] },

  { d: 21, events: [{ kind: 'other', nm: 'Чемпионат Республики', span: 'mid' }] },
  { d: 22, events: [{ kind: 'other', nm: 'Чемпионат Республики', span: 'end' }] },
  { d: 23 },
  { d: 24 },
  { d: 25 },
  { d: 26, events: [{ kind: 'live', nm: 'Кубок Астаны 2026', at: '10:00', span: 'start' }] },
  { d: 27, events: [{ kind: 'live', nm: 'Кубок Астаны 2026', span: 'mid' }] },

  { d: 28, events: [{ kind: 'live', nm: 'Кубок Астаны 2026', span: 'end' }] },
  { d: 29 },
  { d: 30 },
  { d: 1, off: true },
  { d: 2, off: true },
  { d: 3, off: true, events: [{ kind: 'open', nm: 'Шымкент · приём', at: 'до 23:59' }] },
  { d: 4, off: true },
];

/* Мини-месяц слева: только числа, как у Google — по нему прыгают, а не читают. */
const MINI = Array.from({ length: 35 }, (_, i) => {
  const d = i - 1;
  return { d: d < 1 ? 31 + d : d > 30 ? d - 30 : d, off: d < 1 || d > 30, today: d === 12 };
});

export function CalendarDesk({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Календарь" sub="Сезон 2026">
      <div className="dcal o14-nohead">
        {/* ── Строка управления, как у Google: навигация слева, вид справа ── */}
        <div className="dcal-bar">
          <button type="button" className="today">
            <CalendarDays size={15} /> Сегодня
          </button>
          <button type="button" className="nav" aria-label="Прошлый месяц">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="nav" aria-label="Следующий месяц">
            <ChevronRight size={18} />
          </button>
          <span className="ttl o14-disp">Сентябрь 2026</span>
          <span className="sp" />
          <div className="views">
            <span className="on">Месяц</span>
            <span data-to="Э14.2">Расписание</span>
          </div>
        </div>

        <div className="dcal-body">
          {/* ── Левая колонка: мини-месяц и что показывать ── */}
          <aside className="dcal-side">
            <div className="mini">
              <div className="mini-top">
                <span>Сентябрь 2026</span>
                <span className="mini-nav">
                  <ChevronLeft size={14} />
                  <ChevronRight size={14} />
                </span>
              </div>
              <div className="mini-week">
                {WEEKDAYS.map((w) => (
                  <span key={w}>{w[0]}</span>
                ))}
              </div>
              <div className="mini-grid">
                {MINI.map((c, i) => (
                  <span
                    key={i}
                    className={(c.off ? 'off ' : '') + (c.today ? 'today' : '')}
                  >
                    {c.d}
                  </span>
                ))}
              </div>
            </div>

            {/* Переключатели — та же роль, что «мои календари» у Google. */}
            <div className="dcal-filters">
              <div className="cap">Показывать</div>
              {[
                { k: 'live', t: 'Мои турниры', n: 2 },
                { k: 'open', t: 'Открытые приёмы', n: 3 },
                { k: 'other', t: 'Заявляет регион или клуб', n: 1 },
              ].map((f) => (
                <label className={'flt ' + f.k} key={f.k}>
                  <i />
                  <span>{f.t}</span>
                  <b>{f.n}</b>
                </label>
              ))}
            </div>
          </aside>

          {/* ── Сетка месяца ── */}
          <div className="dcal-grid">
            <div className="dcal-head">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="dcal-cells">
              {MONTH.map((c, i) => (
                <div className={'dcal-cell' + (c.off ? ' off' : '') + (c.today ? ' today' : '')} key={i}>
                  <span className="d">{c.d}</span>
                  {c.events?.map((e) => (
                    <div
                      className={['ev', e.kind, e.span ? 'sp-' + e.span : ''].filter(Boolean).join(' ')}
                      key={e.nm + (e.at ?? '')}
                      data-to="Э14.3"
                    >
                      {e.at && <span className="at">{e.at}</span>}
                      <span className="nm">{e.nm}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}
