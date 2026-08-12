/* Каркас макетов по флоу: одна оболочка на все четырнадцать ролей.

   Экраны рисуем на существующей дизайн-системе: оболочка `Desk` (шапка +
   сайдбар + main) из `deskShell.tsx`, классы макетного слоя (`gen/desktop.css`,
   `gen/frame.css`) и примитивы `src/ui`. Ничего нового про цвет и форму здесь
   не заводится — только токены.

   Один экран флоу = одна колонка борда с кодом Э№.№ в подписи: по коду макет
   сходится со схемой роли (раздел «Флоу») и с текстом в корневом `flows/`. */

import type { ReactNode } from 'react';
import { ArrowRight, Bell } from 'lucide-react';
import { Desk, type DeskVariant } from '../deskShell';
import { Tab, MiniTabBar } from '../respShell';
import { Frame } from '../PlayerApp';
import { A, AW } from '../fedCommon';
import { Brand } from '../ui';
import { NodeSpec, useNodeSpec } from '../flows/nodeSpec';
import './mockups.css';

export { A, AW, Tab };

/** Кто «сидит» за экраном роли: подпись в правом верхнем углу оболочки. */
export type Person = { nm: string; rl: string; av: string };

/** Роль в макетах: как подписан продукт, кто пользователь, что в сайдбаре. */
export type RoleUI = {
  /** Номер и название — как в `flows/` и на схеме. */
  num: string;
  title: string;
  person: Person;
  /** Пункты сайдбара: иконка + подпись. */
  nav: [ReactNode, string][];
  /** Что показано в шапке продукта вместо турнира (у ролей вне турнира). */
  brandName?: string;
  brandSub?: string;
  /** Значок состояния в шапке: «ИДЁТ» уместен только внутри турнира. */
  badge?: string | false;
};

/* ── Оболочка экрана роли ───────────────────────────────────────── */

export function RoleScreen({
  role,
  nav,
  title,
  sub,
  hint,
  variant,
  children,
}: {
  role: RoleUI;
  /** Активный пункт сайдбара. */
  nav: string;
  title: string;
  sub: string;
  hint?: string;
  variant?: DeskVariant;
  children: ReactNode;
}) {
  return (
    <Desk
      variant={variant}
      brandName={role.brandName}
      brandSub={role.brandSub}
      badge={role.badge ?? false}
      title={title}
      sub={sub}
      nav={role.nav}
      activeNav={nav}
      role={role.person}
      hint={hint}
    >
      {children}
    </Desk>
  );
}

/** Планшет: роль судьи работает за столом, а не с десктопа (TZ §6). */
export function RoleTablet({ title, sub, badge, center, children }: {
  title: string;
  sub: string;
  badge?: string;
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <Tab title={title} sub={sub} badge={badge} center={center}>
      {children}
    </Tab>
  );
}

/** Телефон: спортсмен — единственная роль с приложением (TZ §10). */
export function RolePhone({ brand, tabs, active, center, children }: {
  brand: string;
  tabs: [ReactNode, string][];
  active: string;
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <Frame>
      <div className="nav">
        <Brand size="sm" sub={brand === 'ФНТ РК' ? undefined : brand} />
        <button className="iconbtn dot">
          <Bell size={17} />
        </button>
      </div>
      <div className="body" style={center ? { justifyContent: 'center' } : undefined}>{children}</div>
      <MiniTabBar items={tabs} active={active} />
    </Frame>
  );
}

/* ── Борд: экраны роли по порядку маршрута ──────────────────────── */

export function Board({ role, children }: { role: RoleUI; children: ReactNode }) {
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">
          {role.num} · {role.title.toUpperCase()} — МАКЕТЫ ПО ФЛОУ
        </div>
        <div className="board-tag">
          коды экранов Э№ — те же, что в схеме роли и в flows/
        </div>
      </div>
      <div className="row">{children}</div>
    </div>
  );
}

/** Колонка борда: код экрана и его название над макетом.

    Если борд обёрнут в `<Paired>` (раздел «Флоу»), под макетом встаёт карточка
    узла — требование к этому же экрану из данных роли. В разделе «Макеты»
    контекста нет, и колонка выглядит как раньше. */
export function Screen({ code, cap, children }: { code: string; cap: string; children: ReactNode }) {
  const spec = useNodeSpec(code);
  return (
    <div className="col">
      <div className="cap">
        <span className="mkcode">{code}</span> {cap}
      </div>
      {children}
      {spec && <NodeSpec screen={spec} />}
    </div>
  );
}

export function Arrow({ lbl }: { lbl: string }) {
  return (
    <div className="arrow">
      <div className="lbl">{lbl}</div>
      <div className="ln" />
    </div>
  );
}

/* ── Мелочи, которые повторяются на экранах ─────────────────────── */

/** Плитки-счётчики над рабочей областью: «заявок 128 · столов 12». */
export function Chips({ items }: { items: { v: string; k: string; tone?: 'g' | 'a' | 'b' }[] }) {
  return (
    <div className="dchips">
      {items.map((c) => (
        <div key={c.k} className={'dchip' + (c.tone ? ` ${c.tone}` : '')}>
          <div className="v">{c.v}</div>
          <div className="k">{c.k}</div>
        </div>
      ))}
    </div>
  );
}

/** Полоса над списком: сколько записей и главное действие экрана. */
export function ActionBar({ count, children }: { count: string; children?: ReactNode }) {
  return (
    <div className="dactionbar">
      <div className="dcount">{count}</div>
      {children}
    </div>
  );
}

/** Строка реестра: аватар, кто, справа — значение и состояние. */
export function Row({
  av,
  nm,
  sub,
  val,
  pill,
  action,
}: {
  av?: string;
  nm: string;
  sub: string;
  val?: string;
  pill?: { t: string; cls: 'live' | 'wait' | 'bad' | 'reg' };
  action?: string;
}) {
  return (
    <div className="drow">
      {av && <img src={av} alt="" />}
      <div className="who">
        <div className="nm">{nm}</div>
        <div className="rl">{sub}</div>
      </div>
      {val && <div className="amt">{val}</div>}
      {pill && <span className={'pill ' + pill.cls} style={{ margin: 0 }}>{pill.t}</span>}
      {action && <button className="dpickbtn">{action}</button>}
    </div>
  );
}

export const Rows = ({ children }: { children: ReactNode }) => <div className="drows">{children}</div>;

/** Панель с заголовком — основной блок рабочей области. */
export function Panel({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="phead">
        {title}
        {extra}
      </div>
      <div className="pbody">{children}</div>
    </div>
  );
}

/** Подсказка-плашка: правило, из-за которого экран выглядит так. */
export const Hint = ({ children }: { children: ReactNode }) => <div className="dhintbox">{children}</div>;

/** Главная кнопка экрана. */
export function Submit({ children }: { children: ReactNode }) {
  return (
    <button className="dsubmit">
      {children}
      <ArrowRight size={15} />
    </button>
  );
}

/** Поле формы (только вид — макет, не форма). */
export function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={'dfield' + (wide ? ' wide' : '')}>
      <div className="k">{label}</div>
      <div className="dval">{value}</div>
    </div>
  );
}

export const Form = ({ children }: { children: ReactNode }) => <div className="dform">{children}</div>;

/** Пустое состояние — оно тоже часть макета. */
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="mkempty">
      <div className="t">{title}</div>
      <div className="s">{text}</div>
    </div>
  );
}
