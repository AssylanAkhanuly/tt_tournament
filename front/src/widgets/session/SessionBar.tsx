'use client';

/* Кто вошёл — в правом углу шапки. Гостю — ссылка «Войти» с возвратом на ту же
   страницу, председателю — имя, роль и «Выйти».

   Пока сессия не проверена, не показывается ничего: иначе на полсекунды
   мелькнуло бы «Войти» у того, кто уже вошёл. */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useSession } from '@/entities/session';

export function SessionBar() {
  const { user, loading, isGskChairman, signOut } = useSession();
  const path = usePathname() || '/reyting';

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href={'/vhod?next=' + encodeURIComponent(path)}
        data-testid="login-link"
        className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Войти
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3 text-[13px]" data-testid="session-user">
      <span className="leading-tight">
        <span className="block font-medium">{user.name}</span>
        {isGskChairman && <span className="block text-[11.5px] text-blue-700">председатель ГСК</span>}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Выйти
      </button>
    </div>
  );
}
