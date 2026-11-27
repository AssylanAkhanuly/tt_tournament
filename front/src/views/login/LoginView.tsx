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
import { type ReactNode, useState, type FormEvent } from 'react';

import { afterSignIn, useKnownAccounts, useSession, type KnownAccount } from '@/entities/session';
import { AuthScreen, FullScreen, TextInput } from '@/shared/kit/app';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[\p{L}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Сохранённый аккаунт строкой ✳ (19.11.2026): компактно — инициалы, имя,
 *  почта мелко; список из нескольких не отодвигает форму вниз. */
function AccountRow({ account, onPress }: { account: KnownAccount; onPress: () => void }) {
  return (
    <button
      type="button"
      data-testid="account-card"
      data-account={account.email}
      onClick={onPress}
      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50/50"
    >
      <Avatar size="sm">
        <Avatar.Fallback className="text-[11px]">{initials(account.name)}</Avatar.Fallback>
      </Avatar>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13.5px] font-semibold">{account.name}</span>
        <span className="block truncate text-[11.5px] text-neutral-500">{account.email}</span>
      </span>
      <ChevronRight size={15} className="shrink-0 text-neutral-400" />
    </button>
  );
}

function AccountList({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {children}
    </div>
  );
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  // Возврат только внутрь сайта: адрес из строки запроса мог прийти из чужой
  // ссылки, и уводить по нему после входа на внешний сайт нельзя.
  // Без адреса возврата — в кабинет роли ✳ (28.10.2026): администратора
  // федерации в `/federation`, остальных в рейтинг (`homeFor`).
  const raw = params.get('next');
  const asked = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;

  const { user, loading, signIn, signOut, switchTo: switchSession } = useSession();
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
      const signedIn = await signIn(email.trim(), password);
      router.push(afterSignIn(signedIn, asked));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Другой аккаунт устройства ✳ (19.11.2026): без пароля, пока жива его
   *  сессия (30 дней); иначе — форма с подставленной почтой. */
  async function switchTo(account: KnownAccount) {
    setError(null);
    if (account.id) {
      setBusy(true);
      const switched = await switchSession(account.id);
      setBusy(false);
      if (switched) {
        router.push(afterSignIn(switched, asked));
        return;
      }
    }
    // Сессии этого аккаунта на устройстве нет — почта в форме и слово об этом,
    // иначе щелчок выглядит так, будто ничего не произошло.
    setEmail(account.email);
    setPassword('');
    setError('Сессия «' + account.name + '» закончилась — введите пароль');
  }

  const current: KnownAccount | null = user ? { email: user.email ?? '', name: user.name } : null;
  const others = known.filter((a) => a.email !== current?.email && a.email !== email);

  return (
    <FullScreen>
      <AuthScreen>
        {/* Знак — на синей половине экрана ✳ (19.11.2026), у формы — только заголовок. */}
        <div className="mb-6">
          <div className="text-center text-2xl font-semibold tracking-tight">Вход в систему</div>
        </div>

        {/* Форма входа видна всегда ✳ (23.11.2026, решение владельца продукта):
            над ней — аккаунты устройства (открытая сессия первой), кнопки
            «Другой аккаунт» нет. */}
        <div className="flex flex-col gap-3">
          {!loading && (current || others.length > 0) && (
            <div className="flex flex-col gap-2" data-testid={current ? 'already-in' : undefined}>
              <AccountList>
                {current && <AccountRow account={current} onPress={() => router.push(afterSignIn(user, asked))} />}
                {others.map((a) => (
                  <AccountRow key={a.email} account={a} onPress={() => void switchTo(a)} />
                ))}
              </AccountList>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <TextInput label="Эл. почта" type="email" autoComplete="email" value={email} onChange={setEmail} />
            <TextInput
              label="Пароль"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
            />
            {error && (
              <div role="alert" data-testid="login-error" className="text-center text-xs leading-snug text-red-600">
                {error}
              </div>
            )}
            {/* Углы как у кнопок приложения (`rounded-xl`), а не «таблетка». */}
            <Button type="submit" className="mt-1 w-full rounded-xl" variant="primary" isDisabled={busy}>
              <LogIn size={15} /> {busy ? 'Входим…' : 'Войти'}
            </Button>
          </form>
          {!loading && current && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="self-center text-[12.5px] font-semibold text-neutral-500 hover:underline"
            >
              Выйти
            </button>
          )}
        </div>
      </AuthScreen>
    </FullScreen>
  );
}
