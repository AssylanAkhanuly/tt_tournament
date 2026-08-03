/* Навигация: вкладки, боковое меню, хлебные крошки, страницы, шаги мастера. */

import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import './nav.css';

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

export type TabItem = { id: string; label: string; icon?: ReactNode; count?: number };

export function Tabs({ items, active, className, style }: { items: TabItem[]; active?: string; className?: string; style?: CSSProperties }) {
  const [cur, setCur] = useState(active ?? items[0]?.id);
  return (
    <div className={cx('ui-tabs', className)} style={style}>
      {items.map((t) => (
        <button key={t.id} type="button" className={t.id === cur ? 'on' : undefined} onClick={() => setCur(t.id)}>
          {t.icon}
          {t.label}
          {t.count != null && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function NavItem({
  icon,
  badge,
  active,
  className,
  children,
}: {
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={cx('ui-navitem', active && 'on', className)}>
      {icon}
      <span className="grow">{children}</span>
      {badge != null && <span className="badge">{badge}</span>}
    </button>
  );
}

export function Nav({ children, className }: { children: ReactNode; className?: string }) {
  return <nav className={cx('ui-nav', className)}>{children}</nav>;
}

export function Breadcrumbs({ items, className }: { items: string[]; className?: string }) {
  return (
    <div className={cx('ui-crumbs', className)}>
      {items.map((it, i) => (
        <span key={it} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {i > 0 && (
            <span className="sep">
              <ChevronRight size={13} />
            </span>
          )}
          <span className={i === items.length - 1 ? 'last' : undefined}>{it}</span>
        </span>
      ))}
    </div>
  );
}

export function Pagination({ page = 1, total = 7, className }: { page?: number; total?: number; className?: string }) {
  const [cur, setCur] = useState(page);
  // показываем первую, последнюю и соседей текущей — как в длинных реестрах игроков
  const nums = [...new Set([1, cur - 1, cur, cur + 1, total])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: ReactNode[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - (nums[i - 1] as number) > 1) out.push(<span className="gap" key={`g${n}`}>…</span>);
    out.push(
      <button key={n} type="button" className={n === cur ? 'on' : undefined} onClick={() => setCur(n)}>
        {n}
      </button>,
    );
  });
  return (
    <div className={cx('ui-pages', className)}>
      <button type="button" className={cur === 1 ? 'off' : undefined} onClick={() => setCur((v) => Math.max(1, v - 1))}>
        <ChevronLeft size={15} />
      </button>
      {out}
      <button type="button" className={cur === total ? 'off' : undefined} onClick={() => setCur((v) => Math.min(total, v + 1))}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

export function Steps({ items, current = 1, className }: { items: string[]; current?: number; className?: string }) {
  return (
    <div className={cx('ui-steps', className)}>
      {items.map((it, i) => {
        const state = i + 1 < current ? 'done' : i + 1 === current ? 'now' : '';
        return (
          <div className={cx('step', state)} key={it}>
            <span className="dot">{state === 'done' ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
            <span className="lbl">{it}</span>
          </div>
        );
      })}
    </div>
  );
}
