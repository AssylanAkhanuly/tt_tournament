/* Дивизион Евразийской лиги строкой календаря ✳ (19.11.2026, решение владельца
   продукта: Лига стоит в «Месяце» и «Таблице» рядом с турнирами, а не отдельным
   разделом). Дивизион — соревнование сезона, как турнир: дата — первый тур,
   окончание — последний, участники — команды. Турнирные поля (формат, уровень,
   приём заявок) у него пустые — их не показывает никто: `TournamentFacts` и
   таблица смотрят на `league`. Сводит две сущности здесь, в виджете: entities
   друг друга не импортируют. */

import { GENDER_LABEL, type DivisionListItem } from '@/entities/league';
import type { TournamentSummary } from '@/entities/tournament';

const CLOSED = { open: false, until: null, active: false };

/** Полдень дня — чтобы часовой пояс не перенёс дату на соседний день. */
const noon = (iso: string) => new Date(iso + 'T12:00:00');

export function divisionRow(d: DivisionListItem): TournamentSummary {
  const status = d.matches > 0 && d.finished === d.matches ? 'finished' : d.finished > 0 ? 'in_progress' : 'open';
  return {
    id: d.id,
    name: d.name + ' · ' + GENDER_LABEL[d.gender].toLowerCase(),
    startsAt: d.startsOn ? noon(d.startsOn) : null,
    endsAt: d.endsOn,
    status,
    clubName: null,
    participants: d.teamsCount,
    format: 'manual',
    description: '',
    refereeRecruitment: CLOSED,
    playerRecruitment: CLOSED,
    region: '',
    city: d.cities[0] ?? '',
    venue: '',
    ageMin: null,
    ageMax: null,
    level: 'top',
    gamesToWin: 0,
    isRating: false,
    groupSize: 0,
    kind: { code: 'eurasian_league', name: 'Евразийская лига' },
    category: 'league',
    applicantKinds: [],
    participantLimit: null,
    regionQuota: null,
    canApplyAs: [],
    admissionLocked: true,
    sex: d.gender,
    ratingMin: null,
    ratingMax: null,
    league: {
      gender: GENDER_LABEL[d.gender],
      season: d.season,
      teams: d.teamsCount,
      tours: d.toursCount,
      cities: d.cities,
      matches: d.matches,
      finished: d.finished,
    },
  };
}
