/* Значок вида соревнования ✳ (19.11.2026, ADMISSION.md): категория календаря
   ФНТ РК — «Главный старт», «Евразийская лига», «Открытый». Только показ:
   поведение турнира задают его условия допуска, а не значок. HeroUI. */

import { Chip } from '@heroui/react';

import { CATEGORY_LABEL, type TournamentCategory } from './api';

const COLOR: Record<TournamentCategory, 'accent' | 'warning' | 'default'> = {
  main: 'accent',
  league: 'warning',
  open: 'default',
};

export function KindBadge({ category }: { category: TournamentCategory | null }) {
  if (!category) return null;
  return (
    <Chip size="sm" variant="soft" color={COLOR[category]} data-testid="tournament-kind" data-category={category}>
      {CATEGORY_LABEL[category]}
    </Chip>
  );
}
