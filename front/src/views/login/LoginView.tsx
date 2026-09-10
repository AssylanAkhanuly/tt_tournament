'use client';

/* Вход — по макету Э0.1 из Storybook ✳ (10.09.2026): та же титульная
   страница (`AuthScreen` из кита — синий фон, белая карточка, знак ФНТ), та же
   кнопка во всю ширину. Отличаются только поля: вместо ИИН и кода — почта и
   пароль.

   Вход по паролю временный (ТЗ §2): личность должен подтверждать Smart Bridge
   по ИИН, и паролей система хранить не будет. Пока он не подключён, так входит
   председатель ГСК — сервер пускает по паролю только тех, у кого есть роль.

   Выбор аккаунта ✳ (11.09.2026, решение владельца продукта): вместо «Вы вошли
   как …» и «Продолжить» — карточки аккаунтов этого устройства (аватар, имя).
   Карточка открытой сессии входит по клику; другая — подставляет почту, пароль
   вводится как обычно. Корень сайта ведёт сюда же. */

import { Avatar, Button } from '@heroui/react';
import { ChevronRight, LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useKnownAccounts, useSession, type KnownAccount } from '@/entities/session';
import { AuthScreen, FullScreen, TextInput } from '@/shared/kit/app';
import { Brand } from '@/shared/kit/brand';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[\p{L}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

function AccountCard({ account, onPress }: { account: KnownAccount; onPress: () => void }) {
  return (
    <button
      type="button"
      data-testid="account-card"
      data-account={account.email}
      onClick={onPress}
      className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left hover:border-blue-300 hover:bg-blue-50/40"
    >
      <Avatar size="md">
        <Avatar.Fallback>{initials(account.name)}</Avatar.Fallback>
      </Avatar>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[14px] font-semibold">{account.name}</span>
        <span className="block truncate text-[12px] text-neutral-500">{account.email}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-neutral-400" />
    </button>
  );
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  // Возврат только внутрь сайта: адрес из строки запроса мог прийти из чужой
  // ссылки, и уводить по нему после входа на внешний сайт нельзя.
  const raw = params.get('next') || '/rating';
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/rating';

  const { user, loading, signIn, signOut } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Аккаунты устройства; на сервере список пуст — разметка до гидратации та же.
  const known = useKnownAccounts();

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

  /** Другой аккаунт: сессия закрывается, почта подставляется в форму. */
  async function switchTo(account: KnownAccount) {
    if (user) await signOut();
    setEmail(account.email);
    setPassword('');
    setError(null);
  }

  const current: KnownAccount | null = user ? { email: user.email ?? '', name: user.name } : null;
  const others = known.filter((a) => a.email !== current?.email && a.email !== email);

  return (
    <FullScreen>
      <AuthScreen>
        <div className="mb-5 flex flex-col items-center gap-4 text-center">
          <Brand size="lg" />
          <div className="text-xl font-semibold tracking-tight">Вход в систему</div>
        </div>

        {!loading && current ? (
          <div className="flex flex-col gap-2" data-testid="already-in">
            <AccountCard account={current} onPress={() => router.push(next)} />
            {others.map((a) => (
              <AccountCard key={a.email} account={a} onPress={() => void switchTo(a)} />
            ))}
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-1 text-[12.5px] font-semibold text-neutral-500 hover:underline"
            >
              Выйти
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!loading && others.length > 0 && (
              <div className="flex flex-col gap-2">
                {others.map((a) => (
                  <AccountCard key={a.email} account={a} onPress={() => void switchTo(a)} />
                ))}
              </div>
            )}
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <TextInput label="Эл. почта" type="email" value={email} onChange={setEmail} />
              <TextInput label="Пароль" type="password" value={password} onChange={setPassword} />
              {error && (
                <div role="alert" data-testid="login-error" className="text-center text-xs leading-snug text-red-600">
                  {error}
                </div>
              )}
              <Button type="submit" className="mt-1 w-full" variant="primary" isDisabled={busy}>
                <LogIn size={15} /> {busy ? 'Входим…' : 'Войти'}
              </Button>
            </form>
          </div>
        )}
      </AuthScreen>
    </FullScreen>
  );
}
