import type { ReactNode } from 'react';
import fntLogo from './assets/fnt-emblem.png';
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
  title, sub, badge = 'ИДЁТ', center, children,
}: { title: string; sub: string; badge?: string; center?: boolean; children: ReactNode }) {
  return (
    <div className="tabframe"><div className="tabscreen">
      <div className="ttop">
        <div className="brand"><img src={fntLogo} alt="ФНТ РК" /> ФНТ РК</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{sub}</div>
        </div>
        <span className="livebadge"><span className="d" />{badge}</span>
      </div>
      <div className={'tbody' + (center ? ' center' : '')}>{children}</div>
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
