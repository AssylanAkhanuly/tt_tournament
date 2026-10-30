'use client';

/* Оболочка кабинета роли ✳ (28.10.2026): проверка роли и `AppShell` с
   разделами. Кабинет роли — это вызов `RoleShell` со своей ролью и меню, а не
   копия проверки и шапки: так собраны администратор федерации, судья и
   спортсмен.

   Только тем, у кого роль есть: остальных уводим на вход. Права проверяет
   сервер. */

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useSession, workspacesOf } from '@/entities/session';
import { AppShell, type ShellNavItem, type ShellSubItem } from '@/widgets/app-shell';

export type RoleNavItem = ShellNavItem & { href: string };

export function RoleShell({
  kind,
  title,
  nav,
  active,
  pageTitle,
  bleed,
  context,
  sub,
  children,
}: {
  /** Вид роли (`Role.kind` на сервере), без которой в кабинет не пускаем. */
  kind: string;
  /** Название роли — первая строка меню человека. */
  title: string;
  /** Разделы кабинета; пусто — кабинет без разделов. */
  nav: RoleNavItem[];
  active?: string;
  pageTitle?: string;
  bleed?: boolean;
  /** Шапка сайдбара над разделами (страница турнира). */
  context?: ReactNode;
  /** Подпункты активного раздела (вид экрана: «Месяц», «Таблица») ✳ 30.10.2026. */
  sub?: ShellSubItem[];
  children?: ReactNode;
}) {
  const router = useRouter();
  const path = usePathname() || '/';
  const { user, loading, hasRole, signOut } = useSession();
  const allowed = hasRole(kind);

  useEffect(() => {
    if (!loading && !allowed) router.replace('/login?next=' + encodeURIComponent(path));
  }, [loading, allowed, router, path]);

  if (loading || !user || !allowed) return null;

  return (
    <AppShell
      role={{ title }}
      roles={workspacesOf(user)}
      person={{ name: user.name, email: user.email }}
      nav={sub ? nav.map((n) => (n.label === active ? { ...n, children: sub } : n)) : nav}
      active={active}
      title={pageTitle}
      bleed={bleed}
      context={context}
      onNavigate={(label) => {
        const href = nav.find((n) => n.label === label)?.href;
        if (href) router.push(href);
      }}
      onOpen={(href) => router.push(href)}
      onSwitchRole={(to) => router.push(to)}
      onSignOut={() => void signOut()}
    >
      {children}
    </AppShell>
  );
}
