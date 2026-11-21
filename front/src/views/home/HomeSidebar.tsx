'use client';

/* Сайдбар главной по образцу ✳ (21.11.2026): знак, поиск, «Main», «Today»,
   настройки, человек и тема. Пункты пока никуда не ведут — заменяются по
   частям. */

import {
  Brain,
  Calendar,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  File,
  History,
  ListChecks,
  Monitor,
  Moon,
  PanelLeft,
  Search,
  Settings,
  SquarePen,
  Sun,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { TODAY } from './data';

const MAIN: { label: string; icon: ReactNode; badge?: number }[] = [
  { label: 'Chat', icon: <SquarePen size={15} /> },
  { label: 'Goals', icon: <History size={15} /> },
  { label: 'Calendar', icon: <Calendar size={15} />, badge: 6 },
  { label: 'Tasks', icon: <ListChecks size={15} />, badge: 2 },
  { label: 'Memory', icon: <Brain size={15} /> },
  { label: 'Files', icon: <File size={15} /> },
];

const THEMES = [
  { id: 'light', label: 'Light', icon: <Sun size={12} /> },
  { id: 'dark', label: 'Dark', icon: <Moon size={12} /> },
  { id: 'system', label: 'System', icon: <Monitor size={12} /> },
];

export function HomeSidebar() {
  const [active, setActive] = useState('Goals');
  const [todayOpen, setTodayOpen] = useState(true);
  const [theme, setTheme] = useState('light');

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 max-md:hidden" data-testid="home-sidebar">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <span className="grid size-9 place-items-center rounded-lg bg-neutral-950 text-[20px] font-bold text-white">*</span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold text-neutral-950">Hearth</span>
          <span className="text-[10px] text-neutral-500">Life OS</span>
        </span>
        <PanelLeft size={15} className="ml-auto text-neutral-300" />
      </div>

      <div className="px-4">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-[12px] text-neutral-400">
          <Search size={14} />
          <input placeholder="Search..." className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[12px] text-neutral-800 outline-none placeholder:text-neutral-400" />
          <kbd className="rounded border border-neutral-200 px-1.5 text-[10px] text-neutral-500">F⌘</kbd>
        </label>
      </div>

      <p className="px-4 pt-5 pb-1.5 text-[10px] text-neutral-400">Main</p>
      <nav className="flex flex-col gap-0.5 px-3">
        {MAIN.map((m) => {
          const on = m.label === active;
          return (
            <button
              key={m.label}
              type="button"
              onClick={() => setActive(m.label)}
              className={
                'flex h-9 items-center gap-2.5 rounded-lg px-3 text-left text-[12.5px] ' +
                (on ? 'bg-neutral-950 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100')
              }
              data-testid="home-nav"
            >
              {m.icon}
              <span className="flex-1">{m.label}</span>
              {m.badge !== undefined && (
                <span className={'rounded px-1.5 text-[10px] ' + (on ? 'bg-white/20' : 'bg-neutral-200 text-neutral-500')}>{m.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-neutral-200 px-4 pt-4">
        <button type="button" onClick={() => setTodayOpen((v) => !v)} className="flex w-full items-center justify-between text-[12.5px] font-semibold text-neutral-900">
          Today
          <ChevronDown size={14} className={'text-neutral-400 transition-transform ' + (todayOpen ? '' : '-rotate-90')} />
        </button>
        {todayOpen && (
          <ul className="mt-3 ml-1.5 flex flex-col gap-2 border-l border-neutral-200 pl-3.5">
            {TODAY.map((t) => (
              <li key={t} className="truncate text-[10.5px] text-neutral-600">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-1 border-t border-neutral-200 px-4 pt-4 pb-4">
        {[
          { label: 'Setting', icon: <Settings size={14} /> },
          { label: 'Help Center', icon: <CircleHelp size={14} /> },
        ].map((r) => (
          <button key={r.label} type="button" className="flex h-8 items-center gap-2.5 text-[12px] text-neutral-600">
            {r.icon}
            <span className="flex-1 text-left">{r.label}</span>
            <ChevronDown size={14} className="text-neutral-400" />
          </button>
        ))}

        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
          <span className="grid size-7 place-items-center rounded-md bg-neutral-800 text-[11px] font-semibold text-white">R</span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="text-[11.5px] font-semibold text-neutral-900">RahMan</span>
            <span className="truncate text-[9.5px] text-neutral-500">uirahman92.gmail.com</span>
          </span>
          <ChevronsUpDown size={13} className="text-neutral-400" />
        </div>

        <div className="mt-2 flex gap-1 rounded-lg border border-neutral-200 bg-white p-1" role="radiogroup" aria-label="Тема">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={theme === t.id}
              onClick={() => setTheme(t.id)}
              className={
                'flex h-7 flex-1 items-center justify-center gap-1 rounded-md text-[10px] ' +
                (theme === t.id ? 'bg-neutral-950 text-white' : 'text-neutral-500')
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
