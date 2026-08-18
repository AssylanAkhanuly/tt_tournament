import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from './ui';
import '../gen/frame.css';
import '../gen/desktop.css';
import './tournament.css';

/* Общие обёртки для адаптивных веб-флоу: борд (ряд экранов со стрелками),
   планшетный экран-рамка и мини-таб-бар для веб-версии на телефоне.
   Правило «веб = десктоп/таблет/мобилка» — см. design/README.md. */

export const Arrow = ({ lbl }: { lbl: string }) => (
  <div className="arrow"><div className="lbl">{lbl}</div><div className="ln" /></div>
);

export const Col = ({ cap, children }: { cap: string; children: ReactNode }) => (
  <div className="col"><div className="cap">{cap}</div>{children}</div>
);

export function Board({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">{title}</div>
        <div className="board-tag">{tag}</div>
      </div>
      <div className="row">{children}</div>
    </div>
  );
}

// планшетный экран: устройство-рамка + стеклянная шапка; center — для итоговых шагов
export function Tab({
  title, sub, badge = 'ИДЁТ', back, center, children,
}: {
  title: string;
  /** Подпись под названием. Не задана — строки нет вовсе: пустая подпись
      оставляла бы под заголовком дырку. */
  sub?: string;
  badge?: string;
  /** Возврат над рабочей областью: подпись и экран, куда ведёт. Не задан —
      кнопки нет. Нужен экранам, на которые приходят из списка: планшет у судьи
      за столом, и уйти обратно ему больше нечем — сайдбара тут нет. */
  back?: { label: string; to?: string; onClick?: () => void };
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="tabframe"><div className="tabscreen">
      <div className="ttop">
        <Brand />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
        <span className="livebadge"><span className="d" />{badge}</span>
      </div>
      <div className={'tbody' + (center ? ' center' : '')}>
        {back && (
          <button type="button" className="dback" data-to={back.to} onClick={back.onClick}>
            <ArrowLeft size={14} /> {back.label}
          </button>
        )}
        {children}
      </div>
    </div></div>
  );
}

// мини-таб-бар для веб-флоу на телефоне (не нативное приложение — своя навигация роли)
export function MiniTabBar({
  items, active, onSelect,
}: { items: [ReactNode, string][]; active: string; onSelect?: (item: string) => void }) {
  return (
    <div className="tabbar">
      {items.map(([ic, t]) => (
        <button
          key={t}
          type="button"
          className={'tab' + (t === active ? ' on' : '')}
          onClick={onSelect ? () => onSelect(t) : undefined}
        >
          {ic}{t}
        </button>
      ))}
    </div>
  );
}
