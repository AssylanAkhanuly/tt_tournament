/* Формы дизайн-системы. Компоненты сознательно «полууправляемые»: значение
   можно задать пропом, а можно оставить внутреннее состояние — витрине этого
   достаточно, а во `front/` они станут контролируемыми. */

import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, ChevronDown, Minus, Plus, Search } from 'lucide-react';
import './forms.css';

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

type FieldWrap = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

function Wrap({ label, hint, error, className, style, children }: FieldWrap & { children: ReactNode }) {
  return (
    <div className={cx('ui-fld', className)} style={style}>
      {label && <label>{label}</label>}
      {children}
      {error ? <div className="ui-fld-err">{error}</div> : hint ? <div className="ui-fld-hint">{hint}</div> : null}
    </div>
  );
}

/* ── Поле ввода ─────────────────────────────────────────────── */

export function Input({
  value,
  placeholder,
  icon,
  suffix,
  size = 'md',
  focused,
  disabled,
  label,
  hint,
  error,
  className,
  style,
}: FieldWrap & {
  value?: string;
  placeholder?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  size?: 'sm' | 'md';
  focused?: boolean;
  disabled?: boolean;
}) {
  const [inner, setInner] = useState(value ?? '');
  return (
    <Wrap label={label} hint={hint} error={error} className={className} style={style}>
      <div
        className={cx(
          'ui-input',
          size === 'sm' && 'ui-input--sm',
          focused && 'ui-input--focus',
          error && 'ui-input--err',
          disabled && 'ui-input--off',
        )}
      >
        {icon && <span className="ui-input-ic">{icon}</span>}
        <input value={inner} placeholder={placeholder} disabled={disabled} onChange={(e) => setInner(e.target.value)} />
        {suffix && <span className="ui-input-suffix">{suffix}</span>}
      </div>
    </Wrap>
  );
}

export function SearchField(props: Parameters<typeof Input>[0]) {
  return <Input icon={<Search size={15} />} placeholder="Поиск игрока" {...props} />;
}

export function Textarea({
  value,
  placeholder,
  rows = 3,
  label,
  hint,
  error,
  className,
  style,
}: FieldWrap & { value?: string; placeholder?: string; rows?: number }) {
  const [inner, setInner] = useState(value ?? '');
  return (
    <Wrap label={label} hint={hint} error={error} className={className} style={style}>
      <div className={cx('ui-input', error && 'ui-input--err')}>
        <textarea rows={rows} value={inner} placeholder={placeholder} onChange={(e) => setInner(e.target.value)} />
      </div>
    </Wrap>
  );
}

/* ── Выпадающий список ──────────────────────────────────────── */

export function Select({
  options,
  value,
  label,
  hint,
  error,
  className,
  style,
}: FieldWrap & { options: string[]; value?: string }) {
  const [inner, setInner] = useState(value ?? options[0]);
  return (
    <Wrap label={label} hint={hint} error={error} className={className} style={style}>
      <div className="ui-select">
        <select value={inner} onChange={(e) => setInner(e.target.value)}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <span className="ui-select-ic">
          <ChevronDown size={16} />
        </span>
      </div>
    </Wrap>
  );
}

/* ── Флажок, переключатель, тумблер ─────────────────────────── */

export function Checkbox({
  label,
  sub,
  defaultChecked,
  disabled,
  className,
}: {
  label: ReactNode;
  sub?: ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cx('ui-check', disabled && 'off', className)}>
      <input type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      <span className="box">
        <Check size={13} strokeWidth={3} />
      </span>
      <span>
        {label}
        {sub && <span className="sub">{sub}</span>}
      </span>
    </label>
  );
}

export function Radio({
  label,
  name,
  defaultChecked,
  disabled,
  className,
}: {
  label: ReactNode;
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cx('ui-check', 'ui-radio', disabled && 'off', className)}>
      <input type="radio" name={name} defaultChecked={defaultChecked} disabled={disabled} />
      <span className="box">
        <span className="dot" />
      </span>
      <span>{label}</span>
    </label>
  );
}

export function RadioGroup({ name, items, value }: { name: string; items: string[]; value?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map((it) => (
        <Radio key={it} name={name} label={it} defaultChecked={it === (value ?? items[0])} />
      ))}
    </div>
  );
}

export function Switch({
  label,
  defaultChecked,
  disabled,
  className,
}: {
  label?: ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cx('ui-switch', disabled && 'off', className)}>
      <input type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      <span className="track" />
      {label && <span>{label}</span>}
    </label>
  );
}

/* ── Счётчик ────────────────────────────────────────────────── */

export function Stepper({ value = 0, min = 0, className }: { value?: number; min?: number; className?: string }) {
  const [n, setN] = useState(value);
  return (
    <span className={cx('ui-stepper', className)}>
      <button type="button" onClick={() => setN((v) => Math.max(min, v - 1))} aria-label="минус">
        <Minus size={15} />
      </button>
      <span className="val">{n}</span>
      <button type="button" className="plus" onClick={() => setN((v) => v + 1)} aria-label="плюс">
        <Plus size={15} />
      </button>
    </span>
  );
}
