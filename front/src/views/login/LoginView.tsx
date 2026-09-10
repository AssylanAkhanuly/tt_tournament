'use client';

/* Вход — по макету Э0.1 из Storybook ✳ (10.09.2026): та же титульная
   страница (`AuthScreen` из кита — синий фон, белая карточка, знак ФНТ), та же
   кнопка во всю ширину. Отличаются только поля: вместо ИИН и кода — почта и
   пароль.

   Вход по паролю временный (ТЗ §2): личность должен подтверждать Smart Bridge
   по ИИН, и паролей система хранить не будет. Пока он не подключён, так входит
   председатель ГСК — сервер пускает по паролю только тех, у кого есть роль.
   Экран говорит об этом прямо, иначе выглядел бы как постоянный вход для всех. */

import { Button } from '@heroui/react';
import { LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useSession } from '@/entities/session';
import { AuthScreen, FullScreen, TextInput } from '@/shared/kit/app';
import { Brand } from '@/shared/kit/brand';

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
    <FullScreen>
      <AuthScreen>
        <div className="mb-5 flex flex-col items-center gap-4 text-center">
          <Brand size="lg" />
          <div>
            <div className="text-xl font-semibold tracking-tight">Вход в систему</div>
            <div className="mt-1 text-[12.5px] text-neutral-500">Председатель ГСК — по почте и паролю</div>
          </div>
        </div>

        {!loading && user ? (
          <div className="flex flex-col gap-3 text-center" data-testid="already-in">
            <p className="text-[13.5px]">
              Вы вошли как <b>{user.name}</b>
              {isGskChairman && ' — председатель ГСК'}.
            </p>
            <Button className="w-full" variant="primary" onPress={() => router.push(next)}>
              Продолжить
            </Button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-[12.5px] font-semibold text-neutral-500 hover:underline"
            >
              Выйти
            </button>
          </div>
        ) : (
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
        )}

        <div className="mt-4 border-t border-neutral-100 pt-4 text-center text-[12px] leading-snug text-neutral-500">
          Вход по паролю временный: по техническому заданию личность подтверждается через Smart Bridge по ИИН
          и одноразовому коду. Пока он не подключён, так входит только председатель ГСК.
        </div>
      </AuthScreen>
    </FullScreen>
  );
}
