'use client';

/* Сведения о турнире для судьи ✳ (01.11.2026, решение владельца продукта:
   платформа официальная — строго, без украшений): название и таблица
   «поле — значение», как в документе. Заявка — полоса внизу
   (`features/referee-application`). HeroUI + Tailwind. */

import { Card } from '@heroui/react';
import type { ReactNode } from 'react';

import {
  ageRange,
  FORMAT_LABEL,
  LEVEL_LABEL,
  placeLabel,
  STATUS_LABEL,
  tournamentDate,
  type TournamentSummary,
} from '@/entities/tournament';

export function TournamentOverview({ t }: { t: TournamentSummary }) {
  const ends = t.endsAt && t.endsAt !== t.startsAt?.toLocaleDateString('sv-SE') ? t.endsAt.split('-').reverse().join('.') : null;
  const where = [placeLabel(t), t.venue].filter(Boolean).join(', ');
  const ages = ageRange(t.ageMin, t.ageMax);

  const rows: [string, ReactNode][] = [
    ['Дата начала', t.startsAt ? tournamentDate(t.startsAt) : 'Без даты'],
    ...(ends ? ([['Дата окончания', ends]] as [string, ReactNode][]) : []),
    ...(where ? ([['Место проведения', where]] as [string, ReactNode][]) : []),
    ['Состояние', STATUS_LABEL[t.status]],
    ['Уровень', LEVEL_LABEL[t.level] + (t.isRating ? '' : ', без рейтинга')],
    ['Система проведения', FORMAT_LABEL[t.format] ?? t.format],
    ...(t.format === 'group_playoff' ? ([['Игроков в группе', t.groupSize]] as [string, ReactNode][]) : []),
    ['Матч', 'до ' + t.gamesToWin + ' побед'],
    ['Участников', t.participants],
    ...(ages ? ([['Возраст', ages]] as [string, ReactNode][]) : []),
    ...(t.clubName ? ([['Клуб', t.clubName]] as [string, ReactNode][]) : []),
    ...(t.description ? ([['Описание', t.description]] as [string, ReactNode][]) : []),
  ];

  return (
    <Card className="w-full max-w-4xl rounded-xl" data-testid="tournament-about">
      <Card.Header className="border-b border-neutral-200 pb-4">
        <Card.Title className="text-xl font-semibold [overflow-wrap:anywhere]">{t.name}</Card.Title>
      </Card.Header>
      <Card.Content>
        {/* `m-0` — глобального сброса нет, у `dl`/`dd` браузерные отступы. */}
        <dl className="m-0 text-[14px]" data-testid="tournament-facts">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 border-b border-neutral-200 py-3 last:border-b-0 sm:grid-cols-[14rem_1fr] sm:gap-4"
              data-testid="tournament-fact"
            >
              <dt className="text-neutral-500">{label}</dt>
              <dd className="m-0 min-w-0 whitespace-pre-line">{value}</dd>
            </div>
          ))}
        </dl>
      </Card.Content>
    </Card>
  );
}
