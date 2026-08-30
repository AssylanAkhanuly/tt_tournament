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
import { RadioTower } from 'lucide-react';
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
    значок в отрыве от карточки нельзя, он про её верхнюю грань. */
export function MatchCard({
  tour,
  home,
  away,
  score,
  note,
  live,
}: {
  tour: string;
  home: { nm: string; av: string };
  away: { nm: string; av: string };
  score: string;
  note?: string;
  live?: boolean;
}) {
  return (
    <div className="k-card">
      {live && <LiveTab />}
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
      {note && <div className="set">{note}</div>}
    </div>
  );
}
