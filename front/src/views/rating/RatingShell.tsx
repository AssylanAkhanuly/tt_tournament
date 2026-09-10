'use client';

/* Оболочка экранов рейтинга — из кита, а не своя ✳ (10.09.2026, решение
   владельца продукта: дизайн брать из Storybook).

   Две оболочки, как в макетах:
   - гость — публичный сайт (Э0.4): шапка с разделами и «Войти», без бокового
     меню. Роли нет — это отсутствие роли (ТЗ §3);
   - председатель ГСК после входа — оболочка роли `AppChrome`: та же, что
     `WebApp` в макетах, только без рамки ноутбука. Сверху меню — роль, снизу —
     человек и «Выйти», главные кнопки экрана прилипают к низу.

   В меню председателя только те разделы, что есть в приложении. Разделы его
   кабинета из макета (панель, соревнования, судьи…) появятся вместе с
   экранами — пустые пункты сейчас вели бы в никуда. */

import { Button } from '@heroui/react';
import { BarChart3, LogIn, SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { useSession } from '@/entities/session';
import { AppChrome, BackLink, FullScreen, SiteHeader, type RoleUI } from '@/shared/kit/app';

/** Разделы кабинета председателя, которые уже есть в приложении. */
const NAV: [string, string, ReactNode][] = [
  ['Рейтинг игроков', '/rating', <BarChart3 size={16} key="r" />],
  ['Калибровка', '/rating/calibration', <SlidersHorizontal size={16} key="k" />],
];

/** Разделы публичного сайта, которые уже есть. Календарь и новости — позже. */
const SITE: [string, string][] = [
  ['Главная', '/'],
  ['Рейтинги', '/rating'],
];

export function RatingShell({
  title,
  lead,
  back,
  note,
  active = 'Рейтинг игроков',
  actions,
  children,
}: {
  title: string;
  lead?: ReactNode;
  /** Возврат наверх раздела: подпись и адрес. */
  back?: { href: string; label: string };
  /** Предупреждение над содержимым — например, что числа условны. */
  note?: ReactNode;
  /** Активный раздел в меню председателя. */
  active?: string;
  /** Главные кнопки экрана — полоса внизу рабочей области (только председателю). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = usePathname() || '/rating';
  const { user, loading, isGskChairman, signOut } = useSession();

  const body = (
    <>
      {lead && <p className="-mt-2 mb-4 max-w-3xl text-[13px] leading-snug text-neutral-600">{lead}</p>}
      {note && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-900">
          {note}
        </div>
      )}
      {children}
    </>
  );

  if (!loading && user && isGskChairman) {
    const role: RoleUI = {
      num: '5',
      title: 'Председатель ГСК',
      person: { nm: user.name, rl: 'Председатель ГСК', av: '', email: user.email ?? undefined },
      brandName: 'Национальный рейтинг',
      badge: false,
      nav: NAV.map(([label, , icon]) => [icon, label]),
    };
    return (
      <FullScreen>
        <AppChrome
          role={role}
          nav={active}
          title={title}
          back={back ? { label: back.label, onPress: () => router.push(back.href) } : undefined}
          actions={actions}
          bell={false}
          onNavigate={(label) => {
            const href = NAV.find(([l]) => l === label)?.[1];
            if (href) router.push(href);
          }}
          onSignOut={() => void signOut()}
        >
          {body}
        </AppChrome>
      </FullScreen>
    );
  }

  return (
    <FullScreen>
      <SiteHeader
        items={SITE.map(([t, href]) => ({ t, onPick: () => router.push(href) }))}
        active="Рейтинги"
        right={
          loading ? null : (
            <Button
              size="sm"
              variant="primary"
              data-testid="login-link"
              onPress={() => router.push('/login?next=' + encodeURIComponent(path))}
            >
              <LogIn size={14} /> Войти
            </Button>
          )
        }
      />
      <div className="min-h-0 flex-1 overflow-auto bg-neutral-50 px-6 pb-6 [&>*]:shrink-0">
        <div className="pb-4 pt-5">
          {back && <BackLink label={back.label} onPress={() => router.push(back.href)} />}
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>
        {body}
      </div>
    </FullScreen>
  );
}
