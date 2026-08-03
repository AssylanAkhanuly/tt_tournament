import type { ReactNode } from 'react';
import { Bell, Search } from 'lucide-react';
import fntLogo from './assets/fnt-emblem.png';

/* Общая десктоп-оболочка (верхняя панель + сайдбар + main) для флоу веба.
   variant='land' — тот же layout в горизонтальной планшетной рамке (веб на планшете
   лёжа ≈ компактный десктоп). Навигация, роль и заголовок — параметрами. */

export type DeskVariant = 'desktop' | 'land';

// рамка: десктоп (ноутбук 1200x760) либо планшет-альбом (1024x720)
export function DeskFrame({ variant = 'desktop', children }: { variant?: DeskVariant; children: ReactNode }) {
  if (variant === 'land') return <div className="tabframe land"><div className="deskland">{children}</div></div>;
  return <div className="dwrap"><div className="laptop">{children}</div></div>;
}

export function Desk({
  variant = 'desktop', brandName, brandSub, title, sub, nav, activeNav, role, hint, children,
}: {
  variant?: DeskVariant;
  brandName?: string;
  brandSub?: string;
  title: string;
  sub: string;
  nav: [ReactNode, string][];
  activeNav: string;
  role: { nm: string; rl: string; av: string };
  hint?: string;
  children: ReactNode;
}) {
  return (
    <DeskFrame variant={variant}>
      <div className="dtop">
        <img className="logo" src={fntLogo} alt="ФНТ РК" />
        <div><div className="bname">ФНТ РК</div></div>
        <div style={{ width: 1, height: 26, background: 'var(--c-glass-line)' }} />
        <div>
          <div className="bname" style={{ fontSize: 14 }}>{brandName ?? 'Чемпионат Казахстана 2026'}</div>
          <div className="tname">{brandSub ?? 'Одиночный · олимпийская · г. Астана'}</div>
        </div>
        <span className="live"><span className="d" />ИДЁТ</span>
        <div className="sp" />
        <button className="iconbtn"><Search size={16} /></button>
        <button className="iconbtn dot"><Bell size={16} /></button>
        <div className="me"><img src={role.av} alt="" /><div><div className="nm">{role.nm}</div><div className="rl">{role.rl}</div></div></div>
      </div>
      <div className="dgrid">
        <aside className="dside">
          {nav.map(([ic, t]) => <div key={t} className={'dni' + (t === activeNav ? ' on' : '')}>{ic}{t}</div>)}
          <div className="grow" />
          {hint && <div className="hint">{hint}</div>}
        </aside>
        <main className="dmain">
          <div className="dtitle"><h2>{title}</h2><p>{sub}</p></div>
          {children}
        </main>
      </div>
    </DeskFrame>
  );
}
