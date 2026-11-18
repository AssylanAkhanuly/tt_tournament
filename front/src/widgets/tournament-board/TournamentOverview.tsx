'use client';

/* Сведения о турнире для судьи ✳ (01.11.2026, решение владельца продукта:
   платформа официальная — строго, без украшений): название и таблица
   «поле — значение», как в документе. Заявка — полоса внизу
   (`features/referee-application`). HeroUI + Tailwind.

   Общая для кабинетов без правки ✳ (19.11.2026): судья и старший тренер
   региона. Переехала из `views/referee` в виджет — кабинет кабинет не
   импортирует. Строки допуска (вид, кто подаёт, квота, предел) — из условий
   допуска турнира; подписи заявителей — из реестра сервера.

   Без обёрток ✳ (19.11.2026, решение владельца продукта: «не делать
   обёрточных полей»): ни карточки, ни поля вокруг — название и строки идут от
   края до края рабочей области, отступ только внутри строки. Экран ставит
   оболочку с `bleed`. */

import type { ReactNode } from 'react';

import { num2 } from '@/entities/rating/lib/format';
import {
  ageRange,
  SEX_LABEL,
  useApplicantKinds,
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
  const kinds = useApplicantKinds();
  const cutoff = [t.ratingMin !== null ? 'от ' + num2(t.ratingMin) : '', t.ratingMax !== null ? 'до ' + num2(t.ratingMax) : '']
    .filter(Boolean)
    .join(' ');
  const applicants = t.applicantKinds
    .map((k) => kinds.data?.find((a) => a.key === k)?.label)
    .filter(Boolean)
    .join(', ');

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
    ...(t.kind ? ([['Вид соревнования', t.kind.name]] as [string, ReactNode][]) : []),
    ...(applicants ? ([['Заявку подаёт', applicants]] as [string, ReactNode][]) : []),
    ...(t.regionQuota !== null ? ([['Квота региона', t.regionQuota]] as [string, ReactNode][]) : []),
    ...(t.participantLimit !== null ? ([['Предел участников', t.participantLimit]] as [string, ReactNode][]) : []),
    ...(t.sex ? ([['Пол', SEX_LABEL[t.sex]]] as [string, ReactNode][]) : []),
    ...(cutoff ? ([['Ценз по рейтингу', cutoff]] as [string, ReactNode][]) : []),
    ...(t.clubName ? ([['Клуб', t.clubName]] as [string, ReactNode][]) : []),
    ...(t.description ? ([['Описание', t.description]] as [string, ReactNode][]) : []),
  ];

  return (
    <section className="w-full bg-white" data-testid="tournament-about">
      <h1 className="m-0 border-b border-neutral-200 px-6 py-4 text-xl font-semibold [overflow-wrap:anywhere]">
        {t.name}
      </h1>
      {/* `m-0` — глобального сброса нет, у `dl`/`dd` браузерные отступы. */}
      <dl className="m-0 text-[14px]" data-testid="tournament-facts">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid gap-1 border-b border-neutral-200 px-6 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4"
            data-testid="tournament-fact"
          >
            <dt className="text-neutral-500">{label}</dt>
            <dd className="m-0 min-w-0 whitespace-pre-line">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
