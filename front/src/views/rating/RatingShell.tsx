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
   экранами — пустые пункты сейчас вели бы в никуда.

   Ни пояснений под заголовком, ни плашек, ни ссылки «назад» ✳ (10.09.2026,
   решение владельца продукта): между разделами ведут меню роли и шапка сайта. */

import { Button } from '@heroui/react';
import { BarChart3, LogIn, Newspaper, Scale, ScrollText, SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { useSession } from '@/entities/session';
import { AppChrome, FullScreen, SiteHeader, type RoleUI } from '@/shared/kit/app';

/** Разделы кабинета председателя, которые уже есть в приложении. Порядок —
    поток рейтинга: лист → выпуск → апелляции на выпуск → журнал всех правок
    → коэффициенты. */
const NAV: [string, string, ReactNode][] = [
  ['Рейтинг игроков', '/rating', <BarChart3 size={16} key="r" />],
  ['Выпуски', '/rating/editions', <Newspaper size={16} key="e" />],
  ['Апелляции', '/rating/appeals', <Scale size={16} key="a" />],
  ['Журнал', '/rating/journal', <ScrollText size={16} key="j" />],
  ['Калибровка', '/rating/calibration', <SlidersHorizontal size={16} key="k" />],
];

/** Разделы публичного сайта, которые уже есть. Календарь и новости — позже. */
const SITE: [string, string][] = [
  ['Главная', '/'],
  ['Рейтинги', '/rating'],
];

export function RatingShell({
  title,
  active = 'Рейтинг игроков',
  actions,
  children,
}: {
  /** Заголовок — только когда он и есть содержание (имя спортсмена). */
  title?: string;
  /** Активный раздел в меню председателя. */
  active?: string;
  /** Главные кнопки экрана — полоса внизу рабочей области (только председателю). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = usePathname() || '/rating';
  const { user, loading, isGskChairman, signOut } = useSession();

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
          actions={actions}
          bell={false}
          onNavigate={(label) => {
            const href = NAV.find(([l]) => l === label)?.[1];
            if (href) router.push(href);
          }}
          onSignOut={() => void signOut()}
        >
          {children}
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
        {title ? (
          <h1 className="pb-4 pt-5 text-xl font-semibold tracking-tight">{title}</h1>
        ) : (
          <div className="pt-5" />
        )}
        {children}
      </div>
    </FullScreen>
  );
}
