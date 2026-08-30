/* UI-кит присланного спортивного приложения ✳ (30.08.2026) — собран с нуля.

   ПОЧЕМУ ОТДЕЛЬНО. Первый заход добавил значок идущего матча в существующую
   библиотеку ФНТ (`src/ui/domain.tsx`), и он сел на её тёмно-синее поле с
   орнаментом, её скругления и её типографику — на референс это не походило
   вовсе. Замечание справедливое: кит новый, значит и собирать его надо своим
   набором, со своим полем и своими скруглениями, а не пристраивать к старому.

   Здесь — только кит. Со старой библиотекой он не смешивается: у неё прямые
   углы и палитра знака ФНТ, у кита скругления и палитра референса (`--k-*`).
   Какой из двух наборов станет основным — решение не принято, и пока они
   живут в разных разделах Storybook.

   Кит светлый: референс тёмный, но продукт светлый — из референса взяты формы
   и акценты, а не тёмная тема.

   Первый компонент — значок идущего матча, в двух его формах из референса. */

import type { ReactNode } from 'react';
import { ChevronRight, ChevronUp, RadioTower } from 'lucide-react';
import './kit.css';

/** Поле кита. Каждая история оборачивается в него: без своего поля компоненты
    садятся на фон Storybook и перестают быть похожими на референс. */
export function KitCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="k">
      <div className="k-wrap">{children}</div>
    </div>
  );
}

/* ── Вкладки ────────────────────────────────────────────────────── */

/** Вкладки раздела. В присланном ките активная выделена не заливкой, а
    подчёркиванием — и это единственное её отличие: подпись та же, кегль тот
    же. Приём тихий и не спорит с содержимым под вкладками.

    Два вида: `plain` — на светлом поле кита, подчёркивание синее;
    `header` — на цветной шапке, как в референсе: подписи светлые,
    подчёркивание жёлтое, потому что синее на синем не видно. */
export function Tabs({
  items,
  active,
  variant = 'plain',
}: {
  items: string[];
  active: string;
  variant?: 'plain' | 'header';
}) {
  return (
    <div className={'k-tabs ' + variant}>
      {items.map((t) => (
        <button type="button" className={t === active ? 'on' : ''} key={t}>
          {t}
        </button>
      ))}
    </div>
  );
}

/* ── Группа ─────────────────────────────────────────────────────── */

export type GroupRow = {
  nm: string;
  av: string;
  /** Сыграно, выиграно, проиграно. */
  p: number;
  w: number;
  l: number;
  /** Партии: выигранные и проигранные. */
  sets: [number, number];
  /** Очки. */
  pts: number;
};

/** Таблица группы — как «Group H» в референсе: подпись группы плашкой,
    шапка колонок, строки с фото и числами, внизу ссылка «подробнее».

    Колонки переведены на настольный теннис: у футбола ничьи есть, у нас нет —
    столбца D (ничьи) не будет, вместо него партии. Разницу партий считать
    отдельной колонкой не стали: она выводится из партий и только удлиняет
    таблицу на телефоне. */
export function GroupTable({
  title,
  rows,
  more = 'Подробнее о группе',
}: {
  title: string;
  rows: GroupRow[];
  more?: string;
}) {
  return (
    <div className="k-card k-group">
      <div className="k-group-cap">{title}</div>
      <div className="k-group-head">
        <span />
        <span>И</span>
        <span>В</span>
        <span>П</span>
        <span>Партии</span>
        <span>О</span>
      </div>
      {rows.map((r) => (
        <div className="k-group-row" key={r.nm}>
          <span className="who">
            <img src={r.av} alt="" />
            {r.nm}
          </span>
          <span>{r.p}</span>
          <span>{r.w}</span>
          <span>{r.l}</span>
          <span className="sets">
            {r.sets[0]}–{r.sets[1]}
          </span>
          <span className="pts">{r.pts}</span>
        </div>
      ))}
      <button type="button" className="k-group-more">
        <ChevronUp size={16} />
        {more}
      </button>
    </div>
  );
}

/** Матч группы — карточка из референса: подпись группы сверху, соперники по
    краям, счёт плашкой посередине, снизу ссылка на сам матч.

    В референсе внизу «смотреть нарезку». У федерации записей матчей нет, и
    выдумывать их нельзя — ссылка ведёт на сам матч (Э14.5). */
export function GroupMatch({
  group,
  home,
  away,
  score,
  link = 'Открыть матч',
}: {
  group: string;
  home: { nm: string; av: string };
  away: { nm: string; av: string };
  score: string;
  link?: string;
}) {
  return (
    <div className="k-gm">
      <div className="k-gm-cap">{group}</div>
      <div className="k-gm-mid">
        <span className="side l">
          {home.nm}
          <img src={home.av} alt="" />
        </span>
        <span className="sc">{score}</span>
        <span className="side r">
          <img src={away.av} alt="" />
          {away.nm}
        </span>
      </div>
      <button type="button" className="k-gm-link">
        {link}
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

/* ── Кнопки ─────────────────────────────────────────────────────── */

/** Кнопка кита. Четыре вида — ровно те, что в присланном ките:

      primary  — синяя заливка: главное действие на экране, одно;
      grey     — серая заливка: равноправное действие рядом с главным;
      outline  — синий контур: действие, от которого можно отказаться;
      ghost    — только текст: третьестепенное, не должно спорить с полем.

    Размеры: `md` — рост 44 px, палец попадает не глядя; `sm` — компактная
    пилюля для плотных мест (фильтры, строка поиска).

    `block` растягивает во всю ширину — в ките кнопки формы именно такие. */
export function Button({
  variant = 'primary',
  size = 'md',
  block,
  disabled,
  icon,
  children,
}: {
  variant?: 'primary' | 'grey' | 'outline' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
  disabled?: boolean;
  /** Иконка слева от подписи. */
  icon?: ReactNode;
  children: ReactNode;
}) {
  const cls = ['k-btn', variant, size === 'sm' && 'sm', block && 'block']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
}

/** Кнопка-иконка: квадратная со скруглением, рядом с полем поиска в ките.
    Подпись обязательна — читалке нужно знать, что это за кнопка. */
export function IconButton({
  label,
  variant = 'grey',
  children,
}: {
  label: string;
  variant?: 'primary' | 'grey' | 'outline';
  children: ReactNode;
}) {
  return (
    <button type="button" className={'k-icon-btn ' + variant} aria-label={label}>
      {children}
    </button>
  );
}

/** Заголовок раздела со счётчиком — «Live match 14» в референсе.

    Красная иконка эфира, подпись и число в красной плашке. Красный здесь не
    тревога, а «прямо сейчас»: в ките это его значение. */
export function LiveHeader({
  label = 'Идут матчи',
  count,
}: {
  label?: ReactNode;
  /** Сколько матчей идёт. Не задано — плашки с числом нет. */
  count?: number;
}) {
  return (
    <div className="k-live-head">
      <span className="ic">
        <RadioTower size={17} />
      </span>
      <span className="lb">{label}</span>
      {count != null && <span className="cnt">{count}</span>}
    </div>
  );
}

/** Язычок «Идёт» — трапеция в верху карточки, как в референсе. Лежит целиком
    внутри карточки и светлее её: подложка отделяет язычок от её поля.

    Ставится внутрь карточки, у которой есть `position: relative` и запас
    сверху под язычок. */
export function LiveTab({ label = 'Идёт' }: { label?: ReactNode }) {
  return (
    <span className="k-live-tab">
      <i className="k-dot" aria-hidden />
      {label}
    </span>
  );
}

/** Карточка матча — пока в ките нужна как подложка под язычок: показать
    значок в отрыве от карточки нельзя, он про её верх.

    Верхний слот у карточки один, и что в нём стоит, зависит от состояния:

      идёт      — язычок «Идёт»; ход матча (партия, стол) уходит вниз, потому
                  что он меняется по ходу игры и его читают последним;
      не идёт   — ДАТА. У сыгранного и у предстоящего матча вопрос первый —
                  «когда», а не «чем кончилось»: снизу дату приходилось
                  искать. Нижней строки у таких карточек нет вовсе.

    Слот всегда занимает своё место, даже пустой, — иначе карточки в списке
    разъезжаются по высоте. */
export function MatchCard({
  tour,
  home,
  away,
  score,
  note,
  when,
  live,
}: {
  tour: string;
  home: { nm: string; av: string };
  away: { nm: string; av: string };
  score: string;
  /** Ход матча: партия и стол. Показывается только у идущего, снизу. */
  note?: string;
  /** Когда матч был или будет. Показывается только у НЕидущего, сверху. */
  when?: string;
  live?: boolean;
}) {
  return (
    <div className="k-card">
      {live ? <LiveTab /> : when && <span className="k-when">{when}</span>}
      <div className="tour">{tour}</div>
      <div className="mid">
        <span className="side">
          <img src={home.av} alt="" />
          <span className="nm">{home.nm}</span>
        </span>
        <span className="sc">{score}</span>
        <span className="side">
          <img src={away.av} alt="" />
          <span className="nm">{away.nm}</span>
        </span>
      </div>
      {live && note && <div className="set">{note}</div>}
    </div>
  );
}
