/* Показ данных: таблица, строка реестра, ключ-значение, пустое состояние,
   прогресс, скелет, спиннер, разделитель, лента событий, подсказка. */

import type { CSSProperties, ReactNode } from 'react';
import './data.css';

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

/* ── Таблица ────────────────────────────────────────────────── */

export type Column = { key: string; title: ReactNode; num?: boolean };

export function Table({
  columns,
  rows,
  className,
  style,
}: {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <table className={cx('ui-table', className)} style={style}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={c.num ? 'num' : undefined}>
              {c.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key} className={c.num ? 'num' : undefined}>
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Строка реестра ─────────────────────────────────────────── */

export function RowItem({
  media,
  title,
  subtitle,
  right,
  selected,
  className,
  style,
}: {
  media?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx('ui-row-item', selected && 'sel', className)} style={style}>
      {media}
      <span className="who">
        <div className="nm">{title}</div>
        {subtitle && <div className="mt">{subtitle}</div>}
      </span>
      {right && <span className="rt">{right}</span>}
    </div>
  );
}

/* ── Ключ — значение ────────────────────────────────────────── */

export function KeyValue({
  items,
  columns = 2,
  className,
  style,
}: {
  items: [ReactNode, ReactNode][];
  columns?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx('ui-kv', className)} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, ...style }}>
      {items.map(([k, v], i) => (
        <div key={i}>
          <div className="k">{k}</div>
          <div className="v">{v}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Пустое состояние ───────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('ui-empty', className)}>
      {icon && <span className="ic">{icon}</span>}
      <div className="t">{title}</div>
      {text && <div className="s">{text}</div>}
      {action}
    </div>
  );
}

/* ── Прогресс ───────────────────────────────────────────────── */

export function Progress({
  value,
  label,
  tone = 'accent',
  className,
}: {
  value: number;
  label?: ReactNode;
  tone?: 'accent' | 'g' | 'a';
  className?: string;
}) {
  return (
    <div className={cx('ui-prog', tone !== 'accent' && tone, className)}>
      {label && (
        <div className="lbl">
          <span>{label}</span>
          <b>{value}%</b>
        </div>
      )}
      <div className="bar">
        <div className="fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

/* ── Скелет, спиннер, разделитель ───────────────────────────── */

export function Skeleton({ width = '100%', height = 14, radius }: { width?: number | string; height?: number | string; radius?: number }) {
  return <span className="ui-skel" style={{ display: 'block', width, height, borderRadius: radius }} />;
}

export function Spinner({ size = 20 }: { size?: number }) {
  return <span className="ui-spin" style={{ width: size, height: size }} />;
}

export function Divider({ label, className }: { label?: ReactNode; className?: string }) {
  if (!label) return <hr className={cx('ui-div', className)} />;
  return <div className={cx('ui-div', 'lbl', className)}>{label}</div>;
}

/* ── Лента событий ──────────────────────────────────────────── */

export type TimelineEvent = { icon?: ReactNode; title: ReactNode; text?: ReactNode; tone?: 'on' | 'ok' };

export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  return (
    <div className={cx('ui-time', className)}>
      {events.map((e, i) => (
        <div className={cx('ev', e.tone)} key={i}>
          <span className="pt">{e.icon}</span>
          <span>
            <div className="t">{e.title}</div>
            {e.text && <div className="s">{e.text}</div>}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Подсказка ──────────────────────────────────────────────── */

export function Tooltip({ text, children }: { text: ReactNode; children: ReactNode }) {
  return (
    <span className="ui-tip">
      {children}
      <span className="tip">{text}</span>
    </span>
  );
}
