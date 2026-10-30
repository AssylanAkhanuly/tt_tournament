'use client';

/* Оболочка экранов рейтинга — из кита, а не своя ✳ (10.09.2026, решение
   владельца продукта: дизайн брать из Storybook).

   Две оболочки, как в макетах:
   - гость — публичный сайт (Э0.4): шапка с разделами и «Войти», без бокового
     меню. Роли нет — это отсутствие роли (ТЗ §3);
   - председатель ГСК после входа — на десктопе `AppShell` ✳ (28.10.2026,
     HeroUI + Tailwind, общая с кабинетом администратора), на телефоне —
     `PhoneChrome` из кита. Сверху меню — роль, снизу —
     человек и «Выйти», главные кнопки экрана прилипают к низу.

   В меню председателя только те разделы, что есть в приложении. Разделы его
   кабинета из макета (панель, соревнования, судьи…) появятся вместе с
   экранами — пустые пункты сейчас вели бы в никуда.

   Ни пояснений под заголовком, ни плашек, ни ссылки «назад» ✳ (10.09.2026,
   решение владельца продукта): между разделами ведут меню роли и шапка сайта. */

import { Button } from '@heroui/react';
import { BarChart3, CalendarDays, LogIn } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { useSession, workspacesOf } from '@/entities/session';
import { FullScreen, PhoneChrome, SiteHeader, useNarrow, type RoleUI } from '@/shared/kit/app';
import { AppShell, type ShellSubItem } from '@/widgets/app-shell';

/** Разделы кабинета председателя. «Выпуски», «Апелляции», «Журнал» и
    «Калибровка» сняты ✳ (11.09.2026), «Турниры» — ✳ (28.10.2026): решения
    владельца продукта. */
/** Раздел меню: подпись, адрес, значок и — по желанию — подпункты (`ShellSubItem`). */
export type RatingNavItem = [string, string, ReactNode, ShellSubItem[]?];

const NAV: RatingNavItem[] = [
  ['Рейтинг игроков', '/rating', <BarChart3 size={16} key="r" />],
  // Тот же раздел, что главная у администратора федерации ✳ (28.10.2026).
  ['Календарь', '/calendar', <CalendarDays size={16} key="c" />],
];

/** Разделы публичного сайта, которые уже есть. Главной нет ✳ (11.09.2026):
    корень ведёт на вход. Календарь и новости — позже. */
const SITE: [string, string][] = [['Рейтинги', '/rating']];

export function RatingShell({
  title,
  active = 'Рейтинг игроков',
  actions,
  bleed,
  nav = NAV,
  sub,
  context,
  children,
}: {
  /** Заголовок — только когда он и есть содержание (имя спортсмена). */
  title?: string;
  /** Активный раздел в меню председателя. */
  active?: string;
  /** Главные кнопки экрана — полоса внизу рабочей области (только председателю). */
  actions?: ReactNode;
  /** Содержимое на всю рабочую область (календарь) — только на десктопе. */
  bleed?: boolean;
  /** Свои разделы вместо разделов кабинета — внутри турнира: [подпись, адрес, значок]. */
  nav?: RatingNavItem[];
  /** Подпункты активного раздела (вид экрана: «Месяц», «Таблица») ✳ 30.10.2026. */
  sub?: ShellSubItem[];
  /** Шапка сайдбара над разделами (страница турнира). */
  context?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = usePathname() || '/rating';
  const { user, loading, isGskChairman, signOut } = useSession();
  // Телефон ✳ (11.09.2026): оболочка роли как `PhoneRoleApp` в Storybook —
  // шапка, заголовок, кнопки внизу, вкладки разделов. Десктопная с боковым
  // меню на узком экране сжимала рабочую область до полоски.
  const narrow = useNarrow();

  // Пока сессия не известна — никакой оболочки ✳ (11.09.2026). Иначе председатель
  // сначала видел шапку сайта, потом страница пересобиралась в его оболочку, и
  // всё, что он успел открыть (выпадающий список, диалог), закрывалось: дерево под
  // оболочкой монтировалось заново. Ответ сессии быстрый, пустой кадр короче
  // вспышки чужой шапки.
  if (loading) return <FullScreen>{null}</FullScreen>;

  if (user && isGskChairman) {
    const onNavigate = (label: string) => {
      const href = nav.find(([l]) => l === label)?.[1];
      if (href) router.push(href);
    };

    // Десктоп — оболочка на HeroUI ✳ (28.10.2026): та же, что у кабинета
    // администратора, с меню человека и сменой роли. Телефон пока на ките.
    if (!narrow) {
      return (
        <AppShell
          role={{ title: 'Председатель ГСК' }}
          roles={workspacesOf(user)}
          person={{ name: user.name, email: user.email }}
          nav={nav.map(([label, , icon, children]) => ({ label, icon, children: label === active && sub ? sub : children }))}
          active={active}
          title={title}
          actions={actions}
          bleed={bleed}
          context={context}
          onNavigate={onNavigate}
          onOpen={(href) => router.push(href)}
          onSwitchRole={(to) => router.push(to)}
          onSignOut={() => void signOut()}
        >
          {children}
        </AppShell>
      );
    }

    const role: RoleUI = {
      num: '5',
      title: 'Председатель ГСК',
      person: { nm: user.name, rl: 'Председатель ГСК', av: '', email: user.email ?? undefined },
      brandName: 'Национальный рейтинг',
      badge: false,
      nav: nav.map(([label, , icon]) => [icon, label]),
    };
    return (
      <FullScreen>
        <PhoneChrome
          role={role}
          nav={active}
          title={title}
          actions={actions}
          bell={false}
          onNavigate={onNavigate}
          onSignOut={() => void signOut()}
        >
          {children}
        </PhoneChrome>
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
      <div className="min-h-0 flex-1 overflow-auto bg-neutral-50 px-4 pb-6 md:px-6 [&>*]:shrink-0">
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
