import type { ReactNode } from 'react';
import { CalendarDays, Trophy, Scale, Users, Wallet, Bell } from 'lucide-react';
import { Frame } from './PlayerApp';
import { MiniTabBar } from './respShell';
import fntLogo from './assets/fnt-emblem.png';

/* Общее для веб-флоу Федерации: роль, навигация десктопа/сайдбара, мини-таб-бар
   и телефонная обёртка. Чтобы новые флоу (Взносы, Рейтинг, Судьи, Турнир) не
   дублировали одно и то же. */

export const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
export const AW = (n: number) => `https://randomuser.me/api/portraits/women/${n}.jpg`;

export const FED = { nm: 'Абаева Д.', rl: 'Федерация · исполком', av: AW(44) };

export const FED_NAV: [ReactNode, string][] = [
  [<CalendarDays size={18} />, 'Календарь'],
  [<Trophy size={18} />, 'Турниры'],
  [<Scale size={18} />, 'Судьи'],
  [<Users size={18} />, 'Игроки'],
  [<Wallet size={18} />, 'Взносы'],
];

export const FED_TABS: [ReactNode, string][] = [
  [<CalendarDays size={20} />, 'Календарь'],
  [<Scale size={20} />, 'Судьи'],
  [<Users size={20} />, 'Игроки'],
  [<Wallet size={20} />, 'Взносы'],
];

// телефон (веб) для федерации: шапка ФНТ + мини-таб-бар роли
export function FedPhone({ title, active, center, children }: { title: string; active: string; center?: boolean; children: ReactNode }) {
  return (
    <Frame>
      <div className="nav">
        <div className="brand"><img src={fntLogo} alt="ФНТ РК" /> Федерация</div>
        <button className="iconbtn dot"><Bell size={17} /></button>
      </div>
      <div className="body" style={center ? { justifyContent: 'center' } : undefined}>
        {!center && <div className="title">{title}</div>}
        {children}
      </div>
      <MiniTabBar items={FED_TABS} active={active} />
    </Frame>
  );
}
