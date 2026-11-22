/* Меню кабинета спортсмена ✳ (22.11.2026): одно на профиль сборной и
   прочие страницы кабинета — отдельным файлом, чтобы виды не ссылались друг
   на друга по кругу. Своего профиля в меню нет — он открывается пунктом
   «Профиль» в меню человека (`PLAYER_PROFILE`, решение владельца продукта). */

import { CalendarDays } from 'lucide-react';

import type { RoleNavItem } from '@/views/workspace';

export const PLAYER_NAV: RoleNavItem[] = [{ label: 'Календарь', href: '/player/calendar', icon: <CalendarDays size={16} /> }];

/** Свой профиль — пункт «Профиль» в меню человека. */
export const PLAYER_PROFILE = '/player';
