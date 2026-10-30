/* Сведения о турнире строками со значками — как у события в Google Календаре.
   Одни и те же в карточке календаря и на странице турнира. HeroUI + Tailwind. */

import { AlignLeft, Building2, CalendarDays, Cake, Flag, MapPin, Network, Trophy, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { FORMAT_LABEL, LEVEL_LABEL, STATUS_LABEL, type TournamentSummary } from './api';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** «Среда, 28 октября 2026». */
export const tournamentDate = (d: Date) =>
  capital(
    d
      .toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .replace(' г.', ''),
  );

/** «12–18 лет», «от 40 лет», «до 14 лет»; без границ — null. */
export function ageRange(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) return min === max ? min + ' лет' : min + '–' + max + ' лет';
  if (min !== null) return 'от ' + min + ' лет';
  if (max !== null) return 'до ' + max + ' лет';
  return null;
}

const day = (iso: string) => iso.split('-').reverse().join('.');

export function TournamentFacts({ t, withDate = false }: { t: TournamentSummary; withDate?: boolean }) {
  const rows: [ReactNode, string][] = [];
  if (withDate) rows.push([<CalendarDays key="d" size={18} />, t.startsAt ? tournamentDate(t.startsAt) : 'Без даты']);
  // Окончание — если турнир не однодневный.
  if (t.endsAt && (!t.startsAt || t.endsAt !== t.startsAt.toLocaleDateString('sv-SE')))
    rows.push([<CalendarDays key="e" size={18} />, 'До ' + day(t.endsAt)]);
  const where = [t.city, t.venue].filter(Boolean).join(', ');
  if (where) rows.push([<MapPin key="w" size={18} />, where]);
  const ages = ageRange(t.ageMin, t.ageMax);
  if (ages) rows.push([<Cake key="a" size={18} />, 'Возраст: ' + ages]);
  rows.push(
    [<Flag key="s" size={18} />, STATUS_LABEL[t.status]],
    [<Network key="f" size={18} />, (FORMAT_LABEL[t.format] ?? t.format) + ', матч до ' + t.gamesToWin + ' побед'],
    [<Users key="p" size={18} />, 'Участников: ' + t.participants],
    [<Trophy key="l" size={18} />, LEVEL_LABEL[t.level] + (t.isRating ? '' : ', без рейтинга')],
  );
  if (t.clubName) rows.push([<Building2 key="c" size={18} />, t.clubName]);
  if (t.description) rows.push([<AlignLeft key="a" size={18} />, t.description]);

  return (
    // `m-0 list-none p-0` — глобального сброса нет, у списка браузерный отступ.
    <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[14px]" data-testid="tournament-facts">
      {rows.map(([icon, text], n) => (
        <li key={n} className="flex items-start gap-4">
          <span className="shrink-0 text-neutral-500">{icon}</span>
          <span className="min-w-0 whitespace-pre-line">{text}</span>
        </li>
      ))}
    </ul>
  );
}
