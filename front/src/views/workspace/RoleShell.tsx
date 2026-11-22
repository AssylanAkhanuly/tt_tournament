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
  back,
  profileHref,
  bleed,
  context,
  home,
  sub,
  actions,
  sections,
  section,
  children,
}: {
  /** Вид роли (`Role.kind` на сервере), без которой в кабинет не пускаем;
      списком — пускаем с любой из них (кабинет сборной: главный тренер,
      консультант, тренер сборной). */
  kind: string | string[];
  /** Название роли — первая строка меню человека. */
  title: string;
  /** Разделы кабинета; пусто — кабинет без разделов. */
  nav: RoleNavItem[];
  active?: string;
  pageTitle?: string;
  /** «Назад» перед заголовком страницы. */
  back?: { label: string; onPress: () => void };
  /** «Профиль» в меню человека — страница, а не окно. */
  profileHref?: string;
  bleed?: boolean;
  /** Шапка сайдбара над разделами. */
  context?: ReactNode;
  /** Куда ведёт знак в шапке; нет — кабинет этой роли. */
  home?: string;
  /** Подпункты активного раздела (вид экрана: «Месяц», «Таблица») ✳ 30.10.2026. */
  sub?: ShellSubItem[];
  /** Полоса внизу рабочей области. */
  actions?: ReactNode;
  /** Разделы страницы (турнир, сезон, лига, тур) — вкладками под заголовком,
   *  а сайдбар остаётся разделами кабинета ✳ (21.11.2026, образец Aligno).
   *  `sub` тогда — виды выбранной вкладки. */
  sections?: RoleNavItem[];
  /** Выбранная вкладка. */
  section?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const path = usePathname() || '/';
  const { user, loading, hasRole, signOut } = useSession();
  const allowed = (Array.isArray(kind) ? kind : [kind]).some((k) => hasRole(k));

  useEffect(() => {
    if (!loading && !allowed) router.replace('/login?next=' + encodeURIComponent(path));
  }, [loading, allowed, router, path]);

  if (loading || !user || !allowed) return null;

  return (
    <AppShell
      role={{ title }}
      roles={workspacesOf(user)}
      person={{ name: user.name, email: user.email }}
      nav={sub && !sections ? nav.map((n) => (n.label === active ? { ...n, children: sub } : n)) : nav}
      tabs={sections?.map((s) => ({
        label: s.label,
        href: s.href,
        icon: s.icon,
        active: s.label === section,
        views: s.label === section ? (sub ?? s.children) : undefined,
      }))}
      active={active}
      title={pageTitle}
      back={back}
      profileHref={profileHref}
      bleed={bleed}
      actions={actions}
      context={context}
      home={home ?? workspacesOf(user).find((w) => w.kind === kind)?.to}
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
