'use client';

/* Вход по почте и паролю — для председателя ГСК.

   Временный ✳ (10.09.2026, решение владельца продукта). По ТЗ §2 личность
   подтверждает Smart Bridge по ИИН и одноразовому коду, и паролей система не
   хранит; пока он не подключён, председателю ГСК нужно войти, чтобы править
   рейтинг. Экран так прямо и говорит — иначе он выглядел бы как постоянный
   способ входа для всех. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import '@/shared/kit/tailwind.css';
import { useSession } from '@/entities/session';

const FIELD =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] outline-none ' +
  'focus:border-blue-500';

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  // Возврат только внутрь сайта: адрес из строки запроса мог прийти из чужой
  // ссылки, и уводить по нему после входа на внешний сайт нельзя.
  const raw = params.get('next') || '/reyting';
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/reyting';

  const { user, loading, isGskChairman, signIn, signOut } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.push(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hero-scope min-h-screen bg-neutral-50 text-neutral-900" data-theme="light">
      <main className="mx-auto flex max-w-md flex-col px-6 pt-16 pb-10">
        <Link
          href="/reyting"
          className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 hover:underline"
        >
          ← Рейтинг игроков
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Вход</h1>
        <p className="mt-1.5 text-[13.5px] leading-snug text-neutral-600">
          Для председателя Главной судейской коллегии — по почте и паролю.
        </p>

        {!loading && user ? (
          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5" data-testid="already-in">
            <p className="text-[14px]">
              Вы вошли как <b>{user.name}</b>
              {isGskChairman && ' — председатель ГСК'}.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href={next}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-blue-700"
              >
                Продолжить
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Выйти
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-6 flex flex-col gap-3.5 rounded-xl border border-neutral-200 bg-white p-5"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Эл. почта</span>
              <input
                type="email"
                required
                autoComplete="username"
                aria-label="Эл. почта"
                className={FIELD}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Пароль</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                aria-label="Пароль"
                className={FIELD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <p role="alert" className="text-[13px] text-red-600" data-testid="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 rounded-lg bg-blue-600 px-3 py-2 text-[14px] font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Входим…' : 'Войти'}
            </button>
          </form>
        )}

        <p className="mt-4 text-[12px] leading-snug text-neutral-500">
          Вход по паролю временный: по техническому заданию личность подтверждается через Smart Bridge по
          ИИН и одноразовому коду, и паролей система хранить не будет. Пока Smart Bridge не подключён, так
          входит только председатель ГСК.
        </p>
      </main>
    </div>
  );
}
