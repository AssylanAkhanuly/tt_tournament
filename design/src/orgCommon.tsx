import type { ReactNode } from 'react';
import { LayoutDashboard, Network, Users, Grid2x2, Settings, Bell } from 'lucide-react';
import { Frame } from './PlayerApp';
import { MiniTabBar } from './respShell';
import { Brand } from './ui';

/* Общее для веб-флоу главного судьи (организатора): роль, навигация, телефон.
   Флоу: Обзор (дашборд), Сетка (посев/жеребьёвка), Игроки (участники), Столы. */

export const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;

export const JUDGE = { nm: 'Оспанов Т.', rl: 'Главный судья', av: A(76) };

export const ORG_NAV: [ReactNode, string][] = [
  [<LayoutDashboard size={18} />, 'Обзор'],
  [<Network size={18} />, 'Сетка'],
  [<Users size={18} />, 'Игроки'],
  [<Grid2x2 size={18} />, 'Столы'],
  [<Settings size={18} />, 'Настройки'],
];

export const ORG_TABS: [ReactNode, string][] = [
  [<LayoutDashboard size={20} />, 'Обзор'],
  [<Network size={20} />, 'Сетка'],
  [<Users size={20} />, 'Игроки'],
  [<Grid2x2 size={20} />, 'Столы'],
];

export function OrgPhone({
  title, active, onNavigate, children,
}: { title: string; active: string; onNavigate?: (item: string) => void; children: ReactNode }) {
  return (
    <Frame>
      <div className="nav">
        <Brand size="sm" sub="Судья" />
        <button className="iconbtn dot"><Bell size={17} /></button>
      </div>
      <div className="body">
        <div className="title">{title}</div>
        {children}
      </div>
      <MiniTabBar items={ORG_TABS} active={active} onSelect={onNavigate} />
    </Frame>
  );
}
