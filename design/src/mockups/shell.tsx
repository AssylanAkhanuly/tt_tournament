/* Каркас макетов по флоу: одна оболочка на все четырнадцать ролей.

   Экраны рисуем на существующей дизайн-системе: оболочка `Desk` (шапка +
   сайдбар + main) из `deskShell.tsx`, классы макетного слоя (`gen/desktop.css`,
   `gen/frame.css`) и примитивы `src/ui`. Ничего нового про цвет и форму здесь
   не заводится — только токены.

   Один экран флоу = одна колонка борда с кодом Э№.№ в подписи: по коду макет
   сходится со схемой роли (раздел «Флоу») и с текстом в корневом `flows/`. */

import { Fragment, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Bell, Check, ChevronDown, ChevronRight, X } from 'lucide-react';
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
  /** Роли этого человека, если их несколько: переключаются в меню профиля. */
  roles?: string[];
};

/* ── Оболочка экрана роли ───────────────────────────────────────── */

export function RoleScreen({
  role,
  nav,
  title,
  sub,
  back,
  hint,
  variant,
  children,
}: {
  role: RoleUI;
  /** Активный пункт сайдбара. */
  nav: string;
  title: string;
  /** Не задан — строки под заголовком нет вовсе. */
  sub?: string;
  /** Возврат над заголовком — у экранов, куда приходят из списка. */
  back?: { label: string; to?: string; onClick?: () => void };
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
      back={back}
      nav={role.nav}
      activeNav={nav}
      role={role.person}
      roles={role.roles}
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

/** Один экран роли: макет, подпись колонки и подпись стрелки к следующему.

    Раньше борд был написан руками — колонка за колонкой, и код экрана жил
    только в разметке. Теперь роль отдаёт карту «код → экран», и из неё
    собирается и борд, и узлы карты флоу: по клику на узел мы знаем, что
    рисовать, а разъехаться этим двум видам больше нечем. */
export type ScreenEntry = {
  /** Подпись колонки рядом с кодом. */
  cap: string;
  /** Макет экрана вместе с его состояниями — то, что видно в колонке борда. */
  view: () => ReactNode;
  /** Подпись стрелки к следующей колонке: чем человек туда переходит. */
  next?: string;
  /** Экран, открытый на конкретной вкладке: карта флоу показывает его, когда
      выбран узел вкладки. Нужен там, где вкладка бывает не у каждого турнира
      (у «Групп» другой турнир — с групповым этапом), и одним переключателем в
      основном макете её не показать. */
  tabView?: (tab: string) => ReactNode;
};

/** Экраны роли по кодам Э№.№, в порядке маршрута (порядок ключей значим). */
export type ScreenMap = Record<string, ScreenEntry>;

export function Board({ role, screens }: { role: RoleUI; screens: ScreenMap }) {
  const items = Object.entries(screens);
  const root = useRef<HTMLDivElement>(null);
  /* Переходы работают и на борде, а не только на карте флоу: клик по элементу
     с `data-to` подкручивает борд к нужной колонке. Без этого «← Календарь
     сезона» выглядел кнопкой, но не делал ничего — а на борде переход и есть
     соседняя колонка, до неё достаточно доехать. */
  const go = (e: React.MouseEvent) => {
    const to = (e.target as HTMLElement).closest<HTMLElement>('[data-to]')?.dataset.to;
    if (!to) return;
    root.current
      ?.querySelector<HTMLElement>(`[data-code="${to}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };
  return (
    <div className="board" ref={root} onClickCapture={go}>
      <div className="board-h">
        <div className="board-title">
          {role.num} · {role.title.toUpperCase()} — МАКЕТЫ ПО ФЛОУ
        </div>
        <div className="board-tag">
          коды экранов Э№ — те же, что на карте флоу и в flows/
        </div>
      </div>
      <div className="row">
        {items.map(([code, s], i) => (
          <Fragment key={code}>
            <Screen code={code} cap={s.cap}>
              {s.view()}
            </Screen>
            {i < items.length - 1 && <Arrow lbl={s.next ?? ''} />}
          </Fragment>
        ))}
      </div>
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
    <div className="col" data-code={code}>
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
export function Chips({
  items,
  to,
}: {
  items: { v: string; k: string; tone?: 'g' | 'a' | 'b'; to?: string }[];
  /** Куда ведут все плитки сразу; у отдельной плитки `to` перебивает общий. */
  to?: string;
}) {
  return (
    <div className="dchips">
      {items.map((c) => (
        <div key={c.k} className={'dchip' + (c.tone ? ` ${c.tone}` : '')} data-to={c.to ?? to}>
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
  onAction,
  actionTo,
  on,
  onSelect,
  to,
}: {
  av?: string;
  nm: string;
  sub: string;
  val?: string;
  /** Тон значка — из макетного слоя: `gen/frame.css` + `src/ui/ui.css`. */
  pill?: { t: string; cls: 'live' | 'wait' | 'bad' | 'reg' | 'done' };
  action?: string;
  /** Что делает кнопка строки. Не передан — кнопка только нарисована. */
  onAction?: () => void;
  /** Куда ведёт кнопка строки, если это не туда же, куда сама строка. */
  actionTo?: string;
  /** Выбор строки в паре «список — карточка»: строка выбрана / выбирается.
      Кнопка действия при этом не выбирает — у неё своё дело. */
  on?: boolean;
  onSelect?: () => void;
  /** Куда ведёт строка (`Э1.12`): на карте флоу по ней можно кликнуть и уйти
      на этот экран. У кнопок переход находится по подписи, а у строки подпись —
      имя человека или турнира, поэтому её задаём явно. */
  to?: string;
}) {
  return (
    <div className={'drow' + (on ? ' pick' : '')} data-to={to} onClick={onSelect}>
      {av && <img src={av} alt="" />}
      <div className="who">
        <div className="nm">{nm}</div>
        <div className="rl">{sub}</div>
      </div>
      {val && <div className="amt">{val}</div>}
      {pill && <span className={'pill ' + pill.cls} style={{ margin: 0 }}>{pill.t}</span>}
      {action && (
        /* Кнопка не выбирает строку: у неё своё дело, и клик по ней не должен
           заодно переключать карточку справа. Переход у неё тоже свой: строка
           ведёт в одно место, кнопка — в другое, и без `actionTo` карта флоу
           уводила бы обе в адрес строки. */
        <button
          type="button"
          className="dpickbtn"
          data-to={actionTo}
          onClick={(e) => { e.stopPropagation(); onAction?.(); }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

export const Rows = ({ children }: { children: ReactNode }) => <div className="drows">{children}</div>;

/* ── Вкладки и фильтры ─────────────────────────────────────────── */

/** Вкладка: подпись и то, что под ней показывается. */
export type TabItem = { t: string; view: ReactNode };

/** Вкладки экрана: полоса переключателей и содержимое активной вкладки.

    Переключатель обязан переключать: макет, где вкладка только подсвечивается,
    врёт про интерфейс. Поэтому содержимое живёт здесь же, рядом с подписью, а
    не в трёх отдельных компонентах.

    Каждая вкладка описана во флоу роли (`flows/*.md`, зона «Вкладки») — иначе
    в макете появляется экран, которого нет в сценарии. */
export function Tabs({ items, active }: { items: TabItem[]; active?: string }) {
  const [cur, setCur] = useState(active ?? items[0].t);
  const hit = items.find((i) => i.t === cur) ?? items[0];
  return (
    <>
      <div className="dseg2">
        {items.map((i) => (
          <button
            key={i.t}
            type="button"
            className={i.t === cur ? 'on' : undefined}
            aria-selected={i.t === cur}
            onClick={() => setCur(i.t)}
          >
            {i.t}
          </button>
        ))}
      </div>
      {hit.view}
    </>
  );
}

/** Панель с вкладками: переключатель стоит в её заголовке, меняется тело. */
export function TabPanel({
  title,
  items,
  active,
  body,
}: {
  title: string;
  items: TabItem[];
  active?: string;
  body?: string;
}) {
  const [cur, setCur] = useState(active ?? items[0].t);
  const hit = items.find((i) => i.t === cur) ?? items[0];
  return (
    <Panel
      title={title}
      body={body}
      extra={
        <span className="seg">
          {items.map((i) => (
            <button
              key={i.t}
              type="button"
              className={i.t === cur ? 'on' : undefined}
              aria-selected={i.t === cur}
              onClick={() => setCur(i.t)}
            >
              {i.t}
            </button>
          ))}
        </span>
      }
    >
      {hit.view}
    </Panel>
  );
}

/** Поиск по списку: поле управляется снаружи — от него зависит, что показано,
    и внутреннее состояние тут только мешало бы. */
export function Search({
  value,
  onChange,
  placeholder,
  wide,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <div className={'dfield' + (wide ? ' wide' : '')}>
      <label className="k">
        Поиск
        <input
          className="dinput"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

/** Страницы длинного списка: назад, номера, вперёд. Без них в списке на сотню
    строк человек ищет глазами, а это единственное, чего он делать не должен. */
export function Pager({
  page,
  pages,
  onPick,
}: {
  page: number;
  pages: number;
  onPick: (p: number) => void;
}) {
  return (
    <div className="mkpager">
      <button type="button" disabled={page === 0} onClick={() => onPick(page - 1)}>
        Назад
      </button>
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          type="button"
          className={i === page ? 'on' : undefined}
          onClick={() => onPick(i)}
        >
          {i + 1}
        </button>
      ))}
      <button type="button" disabled={page >= pages - 1} onClick={() => onPick(page + 1)}>
        Вперёд
      </button>
    </div>
  );
}

/** Фильтр списка: те же кнопки, но выбор не меняет экран, а сужает список.
    `onPick` обязателен — фильтр без реакции на клик тоже врёт. */
export function Filter({
  items,
  active,
  onPick,
}: {
  items: string[];
  active: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="dseg2">
      {items.map((i) => (
        <button
          key={i}
          type="button"
          className={i === active ? 'on' : undefined}
          aria-pressed={i === active}
          onClick={() => onPick(i)}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

/** Панель с заголовком — основной блок рабочей области.
    `body` — класс на тело панели: нужен там, где содержимому задаётся своя
    высота (холст сетки), а не обычный поток. */
export function Panel({
  title,
  extra,
  body,
  children,
}: {
  title: string;
  extra?: ReactNode;
  body?: string;
  children: ReactNode;
}) {
  return (
    <div className="panel">
      <div className="phead">
        {title}
        {extra}
      </div>
      <div className={body ? `pbody ${body}` : 'pbody'}>{children}</div>
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

/** Тихая кнопка рядом с главной: «Закрыть», «Сохранить черновик», «Это разные
    люди». Отличается от `dpickbtn` тем, что не спорит с главным действием за
    внимание — акцент в полосе действий должен быть один. */
export function Ghost({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dpickbtn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--c-panel-2)',
        color: 'var(--c-ink)',
        boxShadow: 'inset 0 1px 0 var(--c-glass-hi)',
      }}
    >
      {children}
    </button>
  );
}

/** Поле формы — только вид: значение уже задано и не правится.
    Для полей, куда человек печатает, есть `Input`. */
export function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={'dfield' + (wide ? ' wide' : '')}>
      <div className="k">{label}</div>
      <div className="dval">{value}</div>
    </div>
  );
}

/** Поле ввода: в него можно печатать.

    Отличать его от `Field` пришлось, когда форма заведения аккаунта стала
    рабочей: одинаково нарисованное «значение» и «то, что вводят» — враньё,
    по макету не видно, где вообще можно поставить курсор. */
export function Input({
  label,
  value = '',
  placeholder,
  wide,
  tone,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  wide?: boolean;
  /** `bad` — поле не проходит проверку: подсветка и та же рамка. */
  tone?: 'bad';
}) {
  const [v, setV] = useState(value);
  return (
    <div className={'dfield' + (wide ? ' wide' : '')}>
      <label className="k">
        {label}
        <input
          className={'dinput' + (tone ? ` ${tone}` : '')}
          value={v}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
        />
      </label>
    </div>
  );
}

/** Выведенное значение: подпись слева, значение справа, одной строкой.

    Не поле и не выбор — то, что система посчитала сама (срок роли от последнего
    дня турнира). Рамки нет намеренно: рядом стоят обведённые селекторы, и
    отсутствие рамки само говорит, что здесь не выбирают. Раньше на это уходила
    плашка с текстом «срок здесь не выбирают» — форма объясняла словами то, что
    может показать формой. */
export function Derived({ k, v }: { k: string; v: string }) {
  return (
    <div className="dderived">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}

/** Многострочное поле: лид и текст материала не влезают в строку, а растягивать
    однострочный `Input` нельзя — по нему не видно, что текста может быть много.
    `rows` держит высоту явной: поле не должно занимать пол-экрана. */
export function Area({
  label,
  value = '',
  rows = 3,
  wide,
}: {
  label: string;
  value?: string;
  rows?: number;
  wide?: boolean;
}) {
  const [v, setV] = useState(value);
  return (
    <div className={'dfield' + (wide ? ' wide' : '')}>
      <label className="k">
        {label}
        <textarea className="dinput darea" rows={rows} value={v} onChange={(e) => setV(e.target.value)} />
      </label>
    </div>
  );
}

/** Дата: календарь браузера, а не строка. Дату вписывают руками с опечатками и
    в разных форматах; выбранная из календаря всегда одна и та же дата. */
export function DateField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  const [v, setV] = useState(value);
  return (
    <div className={'dfield' + (wide ? ' wide' : '')}>
      <label className="k">
        {label}
        <input type="date" className="dinput" value={v} onChange={(e) => setV(e.target.value)} />
      </label>
    </div>
  );
}

/** Загрузка файла: что кладут, в каком формате и каким должен быть размер —
    сказано до выбора, а не в ошибке после. */
export function FilePick({ label, hint, accept }: { label: string; hint: string; accept: string }) {
  return (
    <label className="dfile">
      <input type="file" accept={accept} />
      <span className="t">{label}</span>
      <span className="s">{hint}</span>
      <span className="dpickbtn">Выбрать файл</span>
    </label>
  );
}

/** Выбор из списка — свой, а не нативный `<select>`.

    Нативный список рисует система, и кегль в нём не подчиняется CSS: рядом с
    полем на 14 пикселей выпадал список системным размером, вдвое крупнее. Свой
    список набран тем же кеглем, что поле, и живёт в том же языке, что остальные
    элементы формы. */
export function Select({
  label,
  items,
  value,
  onChange,
  wide,
}: {
  label?: string;
  items: string[];
  /** Выбранное значение. Не передано — селектор помнит выбор сам: в макете это
      чаще и нужно, а снаружи значение держат те экраны, где от него что-то
      зависит (область у выдачи роли, категория в календаре). */
  value?: string;
  onChange?: (v: string) => void;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState(value ?? items[0]);
  const cur = value ?? own;
  const pick = (i: string) => {
    setOwn(i);
    onChange?.(i);
    setOpen(false);
  };
  return (
    <div className={'dfield' + (wide ? ' wide' : '')}>
      {label && <span className="k">{label}</span>}
      <div className="dsel">
        <button
          type="button"
          className={'dselect' + (open ? ' on' : '')}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {cur}
          <ChevronDown size={15} />
        </button>
        {open && (
          <div className="dsel-list">
            {items.map((i) => (
              <button
                key={i}
                type="button"
                className={'dsel-i' + (i === cur ? ' on' : '')}
                onClick={() => pick(i)}
              >
                {i === cur && <Check size={13} />}
                {i}
              </button>
            ))}
          </div>
        )}
      </div>
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

/* ── Состояния экрана ───────────────────────────────────────────── */

/* Раньше состояния («пусто», «поле не заполнено», «действие запрещено») жили
   только текстом в карточке узла: нарисован был один — удачный — кадр экрана.
   Но именно в состояниях и решается дизайн: как выглядит запрет, чем пустой
   список отличается от загрузки, что человек читает вместо данных.

   Полка состояний стоит между макетом и карточкой требования, и в ней тот же
   экран показан в другой ситуации — фрагментом, а не целой оболочкой: важно то
   место, которое меняется. Подписи кадров повторяют `states[]` данных роли. */

/** Тон состояния — тот же, что в данных роли (`State.tone`). */
export type Tone = 'info' | 'success' | 'warning' | 'danger';

export function States({ children }: { children: ReactNode }) {
  return (
    <div className="mkstates">
      <div className="mkstates-h">Состояния экрана — тот же экран в другой ситуации</div>
      <div className="mkstates-g">{children}</div>
    </div>
  );
}

/** Кадр состояния: подпись из данных роли и фрагмент экрана в этом состоянии. */
export function Shot({
  tone = 'info',
  title,
  text,
  wide,
  children,
}: {
  tone?: Tone;
  title: string;
  /** Пояснение из данных роли — почему экран выглядит так. */
  text?: string;
  /** Кадр во всю ширину колонки: когда фрагмент — не панель, а полоса. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={'mkshot' + (wide ? ' wide' : '')}>
      <div className={'mkshot-h ' + tone}>
        <b>{title}</b>
        {text && <span>{text}</span>}
      </div>
      <div className="mkshot-b">{children}</div>
    </div>
  );
}

/** Значок состояния: тона из макетного слоя (`pill live|wait|bad|reg|done`). */
export const P = ({ t, cls }: { t: string; cls: string }) => (
  <span className={'pill ' + cls} style={{ margin: 0, whiteSpace: 'nowrap' }}>{t}</span>
);

/* ── Сезон одной таблицей: общий словарь состояний и сам список ──── */

/** Что происходит со строкой сезона. Один словарь на все роли, которые смотрят
    календарь своими глазами: клуб (Э13.6) и старший тренер региона (Э12.2).

    У каждой роли был свой набор слов, и половина говорила об одном и том же
    разными: «окно открыто» у клуба и «приём заявок» у региона — одно состояние,
    «сыгран» и «завершён» — тоже, а «приём не открыт» отличался от «приёма» лишь
    датой, которая и так стоит в соседней колонке. Таблицу из семи разных слов
    не читают: глаз ищет знакомое, а находит новое.

    Порядок здесь — порядок жизни заявки: ждут → решают → приняли → играем →
    сыграно, и отказ сбоку. */
export const ST = {
  /** Заявку или состав ещё ждут. Открыт приём или нет — видно по сроку рядом. */
  claim: { t: 'ПРИЁМ ЗАЯВОК', cls: 'reg' as const },
  /** Подано, решают: команду допускает федерация, состав региона — главный судья. */
  wait: { t: 'ЖДЁТ ДОПУСКА', cls: 'wait' as const },
  /** Не приняли: причина видна на самой заявке, и пока приём открыт её правят. */
  no: { t: 'ОТКЛОНЕНА', cls: 'bad' as const },
  /** Заявка принята, играть будем этим составом. */
  ready: { t: 'СОСТАВ ПОДТВЕРЖДЁН', cls: 'live' as const },
  /** То же принятое решение, но про человека: судью поставили в наряд. */
  assigned: { t: 'НАЗНАЧЕН', cls: 'live' as const },
  /** Идёт прямо сейчас — единственное, что требует смотреть сегодня. */
  live: { t: 'ИДЁТ', cls: 'live' as const },
  /** Сыграно: строка открывает результаты. */
  done: { t: 'ЗАВЕРШЁН', cls: 'done' as const },
};

export type St = keyof typeof ST;

/** Строка сезона: событие, когда и где, срок или итог, состояние.

    Раньше у каждой роли это были два списка на двух экранах: календарь отвечал
    «что впереди», список заявок — «что от нас ждут и когда», и один и тот же
    старт стоял в обоих. Строка одна, а разное показывает переход. */
export type SeasonRow = {
  key: string;
  /** Месяц — им список сортируется по времени. */
  m: number;
  nm: string;
  /** Второй строкой под названием: соревнование или категория календаря. */
  sub: string;
  when: string;
  /** Колонка «Срок или итог»: либо строку ещё ждут, либо она уже случилась. */
  val: string;
  st: St;
  to: string;
  /** Срок горит: действие за ролью и время на него ограничено. */
  wait?: boolean;
};

/** Список сезона таблицей: четыре колонки и стрелка перехода.

    Таблицей, а не строками реестра: у половины строк главное — срок, и колонкой
    он читается сверху вниз, а в строке терялся среди дат и городов. Кнопок в
    строке нет — действие открывается самим переходом. */
export const SeasonTable = ({ rows }: { rows: SeasonRow[] }) => (
  <div className="mktable mkseason">
    <div className="mktable-h">
      <span>Соревнование</span>
      <span>Когда и где</span>
      <span>Срок или итог</span>
      <span>Состояние</span>
      <span />
    </div>
    <div className="mktable-b">
      {rows.map((r) => (
        <div className="mktable-r" key={r.key} data-to={r.to}>
          <span className="nm">
            {r.nm}
            <em>{r.sub}</em>
          </span>
          <span>{r.when}</span>
          <span className={r.wait ? 'due' : undefined}>{r.val}</span>
          <span>
            <P t={ST[r.st].t} cls={ST[r.st].cls} />
          </span>
          <span className="go">
            <ChevronRight size={14} />
          </span>
        </div>
      ))}
    </div>
  </div>
);

/** Рабочая очередь строкой: счётчики дел под плитками показателей.

    Плитка отвечает на «как идёт сезон», очередь — на «что от меня ждут».
    Смешивать их в одном ряду нельзя: долги вытесняют показатели. */
export function Queue({
  items,
}: {
  items: { n: string; t: string; to?: string }[];
}) {
  return (
    <div className="mkattn">
      <span className="mkattn-h">Требует внимания</span>
      {items.map((i) => (
        <span className="mkattn-i" key={i.t} data-to={i.to}>
          <b>{i.n}</b> {i.t}
        </span>
      ))}
    </div>
  );
}

/* ── Рабочая очередь с разбором ──────────────────────────────────── */

/** Строка внутри счётчика: одно дело очереди.

    Счётчик сам по себе — только тревога. «5 регламентов» не говорит, каких и
    чего в них не хватает, и с панели всё равно приходится идти в список и
    искать глазами. Поэтому в строке сразу написано, чего не хватает (`why`) и
    что с этим делать или кто это снимает (`who`). */
export type AttnRow = {
  nm: string;
  mt: string;
  /** Почему дело в очереди: чего не хватает и сколько ждёт. */
  why: string;
  /** Что решить или кто снимает — не всегда сама роль. */
  who: string;
  /** Экран, где дело снимается. */
  to?: string;
  /** `bad` — срок уже вышел, дело блокирует следующий шаг. */
  cls?: 'bad';
};

export type AttnItem = {
  n: string;
  t: string;
  rows: AttnRow[];
};

const AttnList = ({ item, act, max }: { item: AttnItem; act: boolean; max?: number }) => (
  <div className="mkattn-d">
    <div className="mkattn-d-b">
      {item.rows.slice(0, max ?? item.rows.length).map((r) => (
        <div className="mkattn-r" key={r.nm} data-to={act ? r.to : undefined}>
          <div>
            <div className="nm">{r.nm}</div>
            <div className="mt">{r.mt}</div>
          </div>
          <div className="who">{r.who}</div>
          <div className={'why' + (r.cls ? ` ${r.cls}` : '')}>{r.why}</div>
        </div>
      ))}
    </div>
    <div className="mkattn-d-f">
      <span>
        {act ? 'Строка ведёт туда, где дело снимается' : 'Только просмотр: переходов и действий у роли нет'}
        {max && max < item.rows.length && ` · показаны ${max} из ${item.n}`}
      </span>
    </div>
  </div>
);

/** Очередь дел: в каждый счётчик можно провалиться и увидеть, что в нём.

    Одна на все роли: очередь у председателя ГСК и у администратора федерации
    отвечает на один вопрос — «что от меня ждут», — и двумя реализациями она бы
    разъехалась. Различаются только данные.

    Раскрытым по умолчанию стоит первый счётчик: макет должен показывать сам
    разбор, а не прятать его за клик. */
export function Attention({
  items,
  act = true,
  action,
  max,
}: {
  items: AttnItem[];
  /** У наблюдателей (роли 3 и 4) переходов и кнопок нет вовсе. */
  act?: boolean;
  /** Главная кнопка экрана — в одном ряду со счётчиками. */
  action?: ReactNode;
  /** Сколько строк показывать в раскрытом счётчике. */
  max?: number;
}) {
  const [open, setOpen] = useState<string | null>(items[0].t);
  const cur = items.find((a) => a.t === open);
  return (
    <div className="mkattn-w">
      <div className="mkattn-top">
        <div className="mkattn">
          <span className="mkattn-h">Требует внимания</span>
          {items.map((a) => (
            <button
              type="button"
              className={'mkattn-i' + (a.t === open ? ' on' : '')}
              key={a.t}
              aria-expanded={a.t === open}
              onClick={() => setOpen(a.t === open ? null : a.t)}
            >
              <b>{a.n}</b> {a.t}
              <ChevronDown size={13} />
            </button>
          ))}
        </div>
        {action}
      </div>
      {cur && <AttnList item={cur} act={act} max={max} />}
    </div>
  );
}

/** Ещё один кадр того же экрана: следующий шаг или другое устройство.
    Не состояние — поэтому стоит отдельной полкой, а не в `States`. */
export function Also({ cap, children }: { cap: string; children: ReactNode }) {
  return (
    <div className="mkalso">
      <div className="mkalso-h">{cap}</div>
      {children}
    </div>
  );
}

/** Неактивная главная кнопка: действие видно, но пока запрещено. */
export function Off({ children }: { children: ReactNode }) {
  return (
    <button
      className="dsubmit"
      style={{ padding: '12px 18px', background: 'var(--c-panel-3)', color: 'var(--c-dim)', boxShadow: 'none' }}
    >
      {children}
    </button>
  );
}

const ALERT_INK = {
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  success: 'var(--c-success)',
} as const;

/** Плашка с тоном: то же место, что у подсказки, но говорит о запрете или риске. */
export const Alert = ({
  tone = 'warning',
  children,
}: {
  tone?: keyof typeof ALERT_INK;
  children: ReactNode;
}) => <div className="dhintbox" style={{ color: ALERT_INK[tone] }}>{children}</div>;

/* ── Диалог поверх экрана ───────────────────────────────────────── */

/** Диалог: рабочая область родительского экрана видна и притушена под ним.

    Так нарисованы экраны-действия (отмена турнира, выдача роли): человек не
    уходит со своего места, а решает поверх него — и в макете видно, откуда он
    пришёл. */
export function Modal({
  title,
  sub,
  foot,
  onClose,
  to,
  children,
}: {
  title: string;
  sub: string;
  /** Полоса решений внизу диалога: главное действие и отказ. */
  foot?: ReactNode;
  /** Закрыть диалог. Передан — крестик работает. */
  onClose?: () => void;
  /** Экран, на котором человек оказывается, закрыв диалог: по нему переход
      находит карта флоу. Диалог всегда открыт поверх чего-то, и «закрыть» — это
      возврат туда, а не в пустоту. */
  to?: string;
  children: ReactNode;
}) {
  return (
    <div className="mkoverlay">
      <div className="mkdialog">
        <div className="mkdialog-h">
          <div>
            <div className="t">{title}</div>
            <div className="s">{sub}</div>
          </div>
          <button type="button" className="mkdialog-x" onClick={onClose} data-to={to}>
            <X size={16} />
          </button>
        </div>
        <div className="mkdialog-b">{children}</div>
        {foot && <div className="mkdialog-f">{foot}</div>}
      </div>
    </div>
  );
}
