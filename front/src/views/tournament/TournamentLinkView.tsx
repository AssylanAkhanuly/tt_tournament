'use client';

/* Ссылка «поделиться» на турнир — `/tournaments/<id>` ✳ (30.10.2026). Своей
   страницы у неё нет: страница турнира живёт в кабинете роли (адрес говорит, в
   какой роли смотрят — `entities/tournament/href.ts`). Ссылка только ведёт в
   кабинет того, кто открыл, — старшей из его ролей со страницей турнира;
   раздел сохраняется, где он есть (у судьи разделов нет). Без такой роли — на
   вход. */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/entities/session';
import { cabinetFor, tournamentHref, type TournamentSectionSlug } from '@/entities/tournament';

export function TournamentLinkView({ id, section }: { id: string; section?: TournamentSectionSlug }) {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    const cabinet = cabinetFor(user?.roles ?? [], id);
    router.replace(
      cabinet === null
        ? '/login?next=' + encodeURIComponent('/tournaments/' + id + (section ? '/' + section : ''))
        : tournamentHref(
            cabinet,
            id,
            // У судьи разделов нет; у главного судьи нет «Судей».
            cabinet === 'referee' ? undefined : cabinet === 'chief' && section === 'referees' ? 'info' : (section ?? 'info'),
          ),
    );
  }, [loading, user, router, id, section]);

  return null;
}
