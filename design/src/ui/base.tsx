/* Примитивы дизайн-системы ФНТ РК.

   Правила:
   • Цвет и форма — только токены (`src/theme/tokens.css`). В компонентах нет
     ни одного «сырого» цвета, поэтому смена темы перекрашивает их целиком.
   • Часть примитивов — типизированная обёртка над классами макетного слоя
     (`gen/frame.css`): `Card`, `Pill`, `Badge`, `Stat`, `Avatar`, `IconButton`,
     `SectionTitle`, `Panel`. Так у стиля один источник: экраны-макеты и
     компоненты рисуют одно и то же, а не две похожие реализации.
   • Новое (`Button`, `Segmented`, `Field`) живёт в `src/ui/ui.css`.

   Витрина — история «Дизайн-система → Компоненты». */

import type { CSSProperties, ReactNode } from 'react';
// Примитивы переиспользуют классы макетного слоя, поэтому тянем его явно:
// в продакшн-сборке Storybook у каждой истории свой CSS-чанк, и без этих
// импортов витрина компонентов открывалась бы без стилей.
import '../../gen/frame.css';
import '../../gen/desktop.css';
import './ui.css';

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

type Base = { className?: string; style?: CSSProperties; children?: ReactNode };

/* ── Кнопка ──────────────────────────────────────────────────── */

export type ButtonVariant = 'accent' | 'success' | 'broadcast' | 'ghost' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'accent',
  size = 'md',
  block,
  icon,
  className,
  style,
  children,
  onClick,
}: Base & { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; icon?: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={cx('ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, block && 'ui-btn--block', className)}
      style={style}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

/* ── Стеклянная карточка и панель ────────────────────────────── */

export function Card({ live, className, style, children }: Base & { live?: boolean }) {
  return (
    <div className={cx('card', live && 'live', className)} style={style}>
      {children}
    </div>
  );
}

export function Panel({ title, extra, className, style, children }: Base & { title?: ReactNode; extra?: ReactNode }) {
  return (
    <div className={cx('panel', className)} style={style}>
      {(title || extra) && (
        <div className="phead">
          <span className="t">{title}</span>
          {extra}
        </div>
      )}
      <div className="pbody">{children}</div>
    </div>
  );
}

/* ── Пилюля-статус ───────────────────────────────────────────── */

export type PillTone = 'live' | 'reg' | 'done' | 'wait' | 'bad' | 'up' | 'down';

export function Pill({ tone = 'reg', dot, className, style, children }: Base & { tone?: PillTone; dot?: boolean }) {
  return (
    <span className={cx('pill', tone, className)} style={style}>
      {dot && <i className="d" />}
      {children}
    </span>
  );
}

/* ── Значок победы/поражения ─────────────────────────────────── */

export function Badge({ tone = 'win', className, style, children }: Base & { tone?: 'win' | 'loss' }) {
  return (
    <span className={cx('badge', tone, className)} style={style}>
      {children ?? (tone === 'win' ? 'П' : 'О')}
    </span>
  );
}

/* ── Плитка со значением ─────────────────────────────────────── */

export type StatTone = 'ink' | 'g' | 'r' | 'b';

export function Stat({ value, label, tone = 'ink', className, style }: Base & { value: ReactNode; label: ReactNode; tone?: StatTone }) {
  return (
    <div className={cx('stat', tone !== 'ink' && tone, className)} style={style}>
      <div className="v">{value}</div>
      <div className="k">{label}</div>
    </div>
  );
}

export function Stats({ className, style, children }: Base) {
  return (
    <div className={cx('stats', className)} style={style}>
      {children}
    </div>
  );
}

/* ── Аватар ──────────────────────────────────────────────────── */

export function Avatar({ src, alt = '', size = 'md', className, style }: Omit<Base, 'children'> & { src: string; alt?: string; size?: 'md' | 'sm' }) {
  return <img className={cx('avatar', size === 'sm' && 'sm', className)} style={style} src={src} alt={alt} />;
}

export function AvatarStack({ srcs, className, style }: Omit<Base, 'children'> & { srcs: string[] }) {
  return (
    <span className={cx('qav', className)} style={style}>
      {srcs.map((src, i) => (
        <img key={i} src={src} alt="" />
      ))}
    </span>
  );
}

/* ── Кнопка-иконка ───────────────────────────────────────────── */

export function IconButton({ dot, className, style, children }: Base & { dot?: boolean }) {
  return (
    <button type="button" className={cx('iconbtn', dot && 'dot', className)} style={style}>
      {children}
    </button>
  );
}

/* ── Заголовок секции ────────────────────────────────────────── */

export function SectionTitle({ className, style, children }: Base) {
  return (
    <div className={cx('sect', className)} style={style}>
      {children}
    </div>
  );
}

/* ── Сегмент-контрол ─────────────────────────────────────────── */

export function Segmented({ items, active, className, style }: Omit<Base, 'children'> & { items: string[]; active: string }) {
  return (
    <span className={cx('ui-seg', className)} style={style}>
      {items.map((it) => (
        <button type="button" key={it} className={it === active ? 'on' : undefined}>
          {it}
        </button>
      ))}
    </span>
  );
}

/* ── Поле формы ──────────────────────────────────────────────── */

export function Field({ label, className, style, children }: Base & { label: ReactNode }) {
  return (
    <div className={cx('ui-field', className)} style={style}>
      <label>{label}</label>
      {typeof children === 'string' ? <div className="ui-field-value">{children}</div> : children}
    </div>
  );
}
