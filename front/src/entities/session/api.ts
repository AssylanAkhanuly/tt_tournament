/* Сессия: кто вошёл и какие у него роли. Единственное место, где фронт ходит в
   `/api/auth/`.

   Вход по почте и паролю — временный ✳ (10.09.2026): по ТЗ §2 личность
   подтверждает Smart Bridge по ИИН, и паролей система не хранит. Пока он не
   подключён, так входит председатель ГСК — сервер пускает по паролю только тех,
   у кого есть роль. Токены живут в httpOnly-куках первой стороны, поэтому здесь
   нет ни одного токена: браузер отправляет куки сам. */

export const ROLE_GSK_CHAIRMAN = 'gsk_chairman';
/** Администратор федерации, роль 1 ✳ (28.10.2026). Кабинет — `/dashboard`. */
export const ROLE_FEDERATION_ADMIN = 'federation_admin';
/** Спортсмен и судья ✳ (28.10.2026): кабинеты пока пустые. */
export const ROLE_PLAYER = 'player';
export const ROLE_REFEREE = 'referee';
/** Главный судья турнира ✳ (30.10.2026) — роль с областью «турнир»: свой
 *  кабинет `/chief` с турнирами, где он главный (`chiefTournamentIds`). */
export const ROLE_CHIEF_REFEREE = 'chief_referee';

/** Рабочие места ролей, у которых в приложении есть кабинет: короткое
 *  название (полное с сервера длинное для меню) и адрес. Порядок — старшинство:
 *  первая подходящая роль решает, куда вести после входа. Новая роль с
 *  кабинетом — строка здесь. */
const WORKSPACES: { kind: string; title: string; to: string }[] = [
  { kind: ROLE_FEDERATION_ADMIN, title: 'Администратор федерации', to: '/dashboard' },
  { kind: ROLE_GSK_CHAIRMAN, title: 'Председатель ГСК', to: '/rating' },
  { kind: ROLE_REFEREE, title: 'Судья', to: '/referee' },
  // После судьи: главный судья — роль одного турнира, а судья входит в свой
  // кабинет; в кабинет главного судьи — из меню «Работать как».
  { kind: ROLE_CHIEF_REFEREE, title: 'Главный судья', to: '/chief' },
  { kind: ROLE_PLAYER, title: 'Спортсмен', to: '/player' },
];

/** Роли человека, между которыми можно переключаться в меню профиля. */
export function workspacesOf(user: SessionUser | null): { title: string; to: string }[] {
  return WORKSPACES.filter((w) => user?.roles.some((r) => r.kind === w.kind)).map(({ title, to }) => ({
    title,
    to,
  }));
}

/** Куда вести после входа, если адрес возврата не задан: в кабинет старшей
 *  роли, без роли с кабинетом — в рейтинг. */
export function homeFor(user: SessionUser | null): string {
  return workspacesOf(user)[0]?.to ?? '/rating';
}

/** Роль человека; у ролей турнира `scope_id` — какого. */
export type SessionRole = { kind: string; label: string; scope: string; scope_id?: string | null };

/** Турниры, где человек — главный судья. */
export const chiefTournamentIds = (user: SessionUser | null): string[] =>
  (user?.roles ?? []).filter((r) => r.kind === ROLE_CHIEF_REFEREE && r.scope_id).map((r) => r.scope_id!);

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
