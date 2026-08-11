/* Показ поэкранных флоу: страница одного экрана, борд всей роли, обзор раздела.

   Содержание лежит в `data/roleNN.ts` (перенос корневых `flows/*.md`), здесь —
   только вёрстка. Рельс маршрута и карточки кликабельны: переход между
   историями через `addon-links`, поэтому по флоу можно ходить, а не только
   листать боковое меню. */

import { linkTo } from '@storybook/addon-links';
import { ArrowRight, ChevronRight, FileText, Info, TriangleAlert } from 'lucide-react';
import type { Action, Mark, RoleFlow, Screen, Zone } from './types';
import { roleTitle, screenName } from './types';
import './flows.css';

const MARK_TEXT: Record<Mark, string> = {
  ours: '✳ наше решение — подтвердить',
  open: '⚠ открытый вопрос',
};

/** Склонение при числе: «1 экран · 2 экрана · 5 экранов». */
function plural(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

const SCREENS: [string, string, string] = ['экран', 'экрана', 'экранов'];
const ZONES: [string, string, string] = ['зона', 'зоны', 'зон'];
const ACTIONS: [string, string, string] = ['действие', 'действия', 'действий'];
const STATES: [string, string, string] = ['состояние', 'состояния', 'состояний'];

function MarkTag({ mark }: { mark?: Mark }) {
  if (!mark) return null;
  return (
    <span className={`fs-mark fs-mark--${mark}`}>
      {mark === 'ours' ? <Info size={11} /> : <TriangleAlert size={11} />}
      {MARK_TEXT[mark]}
    </span>
  );
}

const goScreen = (role: RoleFlow, s: Screen) => linkTo(roleTitle(role), screenName(s));

/* ── Рельс маршрута ─────────────────────────────────────────────── */

function Rail({ role, current }: { role: RoleFlow; current?: string }) {
  return (
    <nav className="fs-rail" aria-label="Маршрут роли">
      {role.screens.map((s, i) => (
        <div key={s.id} style={{ display: 'contents' }}>
          {i > 0 && <ChevronRight className="fs-rail-arrow" size={14} />}
          <button
            type="button"
            className="fs-rail-item"
            aria-current={s.id === current}
            onClick={goScreen(role, s)}
          >
            <span className="c">{s.id}</span>
            <span className="t">{s.title}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}

/* ── Экран: зоны, действия, состояния ───────────────────────────── */

function ZoneCard({ zone }: { zone: Zone }) {
  return (
    <section className="fs-zone">
      <div className="fs-zone-h">
        <span className="t">{zone.title}</span>
        <MarkTag mark={zone.mark} />
      </div>
      <ul>
        {zone.items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
      {zone.note && <div className="n">{zone.note}</div>}
    </section>
  );
}

function Actions({ role, actions }: { role: RoleFlow; actions: Action[] }) {
  const byId = new Map(role.screens.map((s) => [s.id, s]));
  return (
    <table className="fs-acts">
      <thead>
        <tr>
          <th>Элемент</th>
          <th>Когда доступно</th>
          <th>Что происходит</th>
        </tr>
      </thead>
      <tbody>
        {actions.map((a) => {
          const target = a.to ? byId.get(a.to) : undefined;
          return (
            <tr key={a.el + a.effect}>
              <td className="el">
                {a.el} <MarkTag mark={a.mark} />
              </td>
              <td className="when">{a.when ?? '—'}</td>
              <td>
                {a.effect}
                {target && (
                  <button type="button" className="to" onClick={goScreen(role, target)}>
                    {target.id} · {target.title} <ArrowRight size={11} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ScreenSpec({ role, screen }: { role: RoleFlow; screen: Screen }) {
  return (
    <div className="fs">
      <div className="fs-wrap">
        <Rail role={role} current={screen.id} />

        <header className="fs-head">
          <div className="fs-crumb">
            <b>
              {role.num} · {role.title}
            </b>
            <span>·</span>
            <span>{role.device}</span>
            {role.scope && (
              <>
                <span>·</span>
                <span>область: {role.scope}</span>
              </>
            )}
          </div>
          <div className="fs-title">
            <span className="fs-code">{screen.id}</span>
            <h1 className="fs-h1">{screen.title}</h1>
            <MarkTag mark={screen.mark} />
          </div>
          {screen.note && <p className="fs-note">{screen.note}</p>}
          {role.hypothesis && (
            <div className="fs-lede">
              <b>Роль в документе федерации не заполнена.</b> {role.hypothesis}
            </div>
          )}
        </header>

        <section className="fs-sect">
          <h2 className="fs-sect-h">Как сюда попадает</h2>
          <ul className="fs-entry">
            {screen.entry.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>

        <section className="fs-sect">
          <h2 className="fs-sect-h">Что на экране</h2>
          <div className="fs-zones">
            {screen.zones.map((z) => (
              <ZoneCard key={z.title} zone={z} />
            ))}
          </div>
        </section>

        {screen.actions.length > 0 && (
          <section className="fs-sect">
            <h2 className="fs-sect-h">Действия</h2>
            <Actions role={role} actions={screen.actions} />
          </section>
        )}

        {screen.states.length > 0 && (
          <section className="fs-sect">
            <h2 className="fs-sect-h">Состояния экрана</h2>
            <div className="fs-states">
              {screen.states.map((st) => (
                <div key={st.title} className={`fs-state${st.tone ? ` fs-state--${st.tone}` : ''}`}>
                  <div className="t">{st.title}</div>
                  {st.text && <div className="s">{st.text}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="fs-src">
          <FileText size={12} /> Источник — <code>{role.source}</code>, раздел {screen.id}. Требования:{' '}
          <code>TZ.md</code>, сводка прав: <code>ROLES.md</code>, схема: <code>diagrams/out/flow-roles.svg</code>.
        </footer>
      </div>
    </div>
  );
}

/* ── Борд: весь флоу роли ───────────────────────────────────────── */

export function FlowBoard({ role }: { role: RoleFlow }) {
  return (
    <div className="fs">
      <div className="fs-wrap">
        <header className="fs-head">
          <div className="fs-crumb">
            <b>Роль {role.num}</b>
            <span>·</span>
            <span>{role.device}</span>
            {role.scope && (
              <>
                <span>·</span>
                <span>область: {role.scope}</span>
              </>
            )}
          </div>
          <div className="fs-title">
            <h1 className="fs-h1">{role.title}</h1>
          </div>
          <p className="fs-note">{role.duty}</p>
          <div className="fs-lede">
            <b>Маршрут.</b> {role.route}
          </div>
          {role.hypothesis && (
            <div className="fs-lede">
              <b>Роль в документе федерации не заполнена.</b> {role.hypothesis}
            </div>
          )}
        </header>

        <section className="fs-sect">
          <h2 className="fs-sect-h">Экраны — по порядку маршрута</h2>
          <div className="fs-board-row">
            {role.screens.map((s, i) => (
              <div key={s.id} style={{ display: 'contents' }}>
                {i > 0 && <ArrowRight className="fs-arrow" size={18} />}
                <button type="button" className="fs-card" onClick={goScreen(role, s)}>
                  <span className="code">{s.id}</span>
                  <span className="t">{s.title}</span>
                  <ul>
                    {s.zones.slice(0, 4).map((z) => (
                      <li key={z.title}>{z.title}</li>
                    ))}
                  </ul>
                  <span className="meta">
                    <span>{plural(s.zones.length, ZONES)}</span>
                    <span>{plural(s.actions.length, ACTIONS)}</span>
                    <span>{plural(s.states.length, STATES)}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="fs-cols">
          {role.cannot.length > 0 && (
            <section className="fs-sect">
              <h2 className="fs-sect-h">Чего роль не может</h2>
              <ul className="fs-list">
                {role.cannot.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}
          {role.questions.length > 0 && (
            <section className="fs-sect">
              <h2 className="fs-sect-h">Открытые вопросы</h2>
              <ul className="fs-list">
                {role.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="fs-src">
          <FileText size={12} /> Источник — <code>{role.source}</code>.
        </footer>
      </div>
    </div>
  );
}

/* ── Обзор раздела: все роли ────────────────────────────────────── */

export function RolesOverview({ roles }: { roles: RoleFlow[] }) {
  const screens = roles.reduce((n, r) => n + r.screens.length, 0);
  return (
    <div className="fs">
      <div className="fs-wrap">
        <header className="fs-head">
          <div className="fs-title">
            <h1 className="fs-h1">
              Флоу по ролям — {plural(roles.length, ['раздел', 'раздела', 'разделов'])},{' '}
              {plural(screens, SCREENS)}
            </h1>
          </div>
          <p className="fs-note">
            Маршрут каждой роли по документу федерации, где каждый узел флоу — отдельная страница:
            как сюда попадает, что на экране, что можно нажать и когда, как экран выглядит, когда
            данных нет. Коды <b>Э№.№</b> совпадают с корневым <code>flows/</code> и схемой{' '}
            <code>flow-roles.d2</code>.
          </p>
          <div className="fs-lede">
            <b>Контур — только документы федерации:</b> три категории календаря — восемь главных
            республиканских стартов (заявляет старший тренер региона), Евразийская лига в четыре
            тура (мужская Суперлига и 2–6 лиги, женская Суперлига и 2 лига — заявляет администратор
            клуба) и открытые республиканские турниры (спортсмен заявляется сам). Клубных турниров и
            хода без судей на столах здесь нет.
          </div>
        </header>

        <section className="fs-sect">
          <h2 className="fs-sect-h">Роли</h2>
          <div className="fs-roles">
            {roles.map((r) => (
              <button
                key={r.num}
                type="button"
                className="fs-role"
                onClick={linkTo(roleTitle(r), 'Весь флоу')}
              >
                <span className="n">РОЛЬ {r.num}</span>
                <span className="t">{r.title}</span>
                <span className="d">{r.duty}</span>
                <span className="m">
                  <span>{plural(r.screens.length, SCREENS)}</span>
                  <span>{r.device}</span>
                  {r.hypothesis && <span>⚠ гипотеза</span>}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
