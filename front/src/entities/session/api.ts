/* Сессия: кто вошёл и какие у него роли. Единственное место, где фронт ходит в
   `/api/auth/`.

   Вход по почте и паролю — временный ✳ (10.09.2026): по ТЗ §2 личность
   подтверждает Smart Bridge по ИИН, и паролей система не хранит. Пока он не
   подключён, так входит председатель ГСК — сервер пускает по паролю только тех,
   у кого есть роль. Токены живут в httpOnly-куках первой стороны, поэтому здесь
   нет ни одного токена: браузер отправляет куки сам. */

export const ROLE_GSK_CHAIRMAN = 'gsk_chairman';

export type SessionRole = { kind: string; label: string; scope: string };

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  roles: SessionRole[];
};

export class SessionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

type RawRole = { kind?: unknown; label?: unknown; scope?: unknown };

const toUser = (raw: Record<string, unknown>): SessionUser => ({
  id: String(raw.id ?? ''),
  name: String(raw.name ?? ''),
  email: (raw.email as string | null) ?? null,
  roles: ((raw.roles as RawRole[] | undefined) ?? []).map((r) => ({
    kind: String(r.kind ?? ''),
    label: String(r.label ?? ''),
    scope: String(r.scope ?? ''),
  })),
});

/** Кто вошёл. `null` — никто: это не ошибка, а обычное состояние гостя. */
export async function fetchMe(): Promise<SessionUser | null> {
  let res: Response;
  try {
    res = await fetch('/api/auth/me/', { credentials: 'same-origin' });
  } catch {
    throw new SessionError('Сервис входа недоступен', 0);
  }
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new SessionError('Сервис входа недоступен: ошибка ' + res.status, res.status);
  return toUser(await res.json());
}

export async function loginByEmail(email: string, password: string): Promise<SessionUser> {
  let res: Response;
  try {
    res = await fetch('/api/auth/login/email/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new SessionError('Сервис входа недоступен', 0);
  }
  // Сервер отвечает одинаково на любую неудачу — неверная почта, пароль или
  // нет роли. Экран повторяет его: подсказка «такой почты нет» помогла бы
  // перебирать, какие почты заведены.
  if (res.status === 401) throw new SessionError('Неверная почта или пароль', 401);
  if (!res.ok) throw new SessionError('Вход не удался: ошибка ' + res.status, res.status);
  return toUser(await res.json());
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout/', { method: 'POST', credentials: 'same-origin' });
}
