/* Сезон Евразийской лиги строкой календаря ✳ (19.11.2026, решение владельца
   продукта: Лига стоит в «Месяце» и «Таблице» рядом с турнирами, а не
   отдельным разделом). Сезон — соревнование, как турнир: дата — первый тур
   сезона, окончание — последний, участники — команды всех лиг. Турнирные поля
   (формат, уровень, приём заявок) у него пустые — их не показывает никто:
   `TournamentFacts` и таблица смотрят на `league`. Сводит две сущности здесь,
   в виджете: entities друг друга не импортируют. */

import { CATEGORY_LABEL, type TournamentSummary } from '@/entities/tournament';
import { registrationLabel, type Season } from '@/entities/league';

const CLOSED = { open: false, until: null, active: false };

/** Полдень дня — чтобы часовой пояс не перенёс дату на соседний день. */
const noon = (iso: string) => new Date(iso + 'T12:00:00');

export function seasonRow(s: Season): TournamentSummary {
  const status = s.closed || (s.matches > 0 && s.finished === s.matches) ? 'finished' : s.finished > 0 ? 'in_progress' : 'open';
  return {
    id: s.id,
    name: CATEGORY_LABEL.league + ' · ' + s.name,
    startsAt: s.startsOn ? noon(s.startsOn) : null,
    endsAt: s.endsOn,
    status,
    clubName: null,
    participants: s.teamsCount,
    format: 'manual',
    description: '',
    refereeRecruitment: CLOSED,
    playerRecruitment: CLOSED,
    region: '',
    city: s.cities[0] ?? '',
    venue: '',
    ageMin: null,
    ageMax: null,
    level: 'top',
    gamesToWin: 0,
    isRating: false,
    groupSize: 0,
    kind: { code: 'eurasian_league', name: CATEGORY_LABEL.league },
    category: 'league',
    applicantKinds: [],
    participantLimit: null,
    regionQuota: null,
    canApplyAs: [],
    admissionLocked: true,
    sex: '',
    ratingMin: null,
    ratingMax: null,
    league: {
      leagues: s.leagues,
      registration: registrationLabel(s),
      teams: s.teamsCount,
      tours: s.toursCount,
      cities: s.cities,
      matches: s.matches,
      finished: s.finished,
    },
  };
}
