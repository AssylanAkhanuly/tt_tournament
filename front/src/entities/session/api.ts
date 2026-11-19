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
/** Старший тренер региона ✳ (19.11.2026, роль 12) — роль с областью «регион»:
 *  кабинет `/coach`, заявка на главные старты за спортсменов своего региона. */
export const ROLE_REGIONAL_HEAD_COACH = 'regional_head_coach';
/** Национальная команда ✳ (19.11.2026, NATIONAL.md): главный тренер (роль 11) —
 *  кабинет `/national`, состав и планы подготовки; врач сборной (роль 21) —
 *  кабинет `/doctor`, медицинская карта. */
export const ROLE_NATIONAL_HEAD_COACH = 'national_head_coach';
export const ROLE_NATIONAL_DOCTOR = 'national_doctor';
/** Штаб сборной ✳ (19.11.2026): консультант (19) и тренер сборной (20) —
 *  в том же кабинете `/national`; психолог (22) — `/psychologist`; личный
 *  тренер — `/personal-coach`. */
export const ROLE_NATIONAL_CONSULTANT = 'national_consultant';
export const ROLE_NATIONAL_TEAM_COACH = 'national_team_coach';
export const ROLE_NATIONAL_PSYCHOLOGIST = 'national_psychologist';
export const ROLE_PERSONAL_COACH = 'personal_coach';
// Администратор клуба ✳ (19.11.2026, роль 13): заявка команды клуба в Евразийскую лигу.
export const ROLE_CLUB_ADMIN = 'club_admin';

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
  { kind: ROLE_REGIONAL_HEAD_COACH, title: 'Старший тренер региона', to: '/coach' },
  { kind: ROLE_CLUB_ADMIN, title: 'Администратор клуба', to: '/club' },
  { kind: ROLE_NATIONAL_HEAD_COACH, title: 'Главный тренер сборной', to: '/national' },
  { kind: ROLE_NATIONAL_CONSULTANT, title: 'Тренер-консультант', to: '/national' },
  { kind: ROLE_NATIONAL_TEAM_COACH, title: 'Тренер сборной', to: '/national' },
  { kind: ROLE_PERSONAL_COACH, title: 'Личный тренер', to: '/personal-coach' },
  { kind: ROLE_NATIONAL_DOCTOR, title: 'Врач сборной', to: '/doctor' },
  { kind: ROLE_NATIONAL_PSYCHOLOGIST, title: 'Психолог сборной', to: '/psychologist' },
  { kind: ROLE_PLAYER, title: 'Спортсмен', to: '/player' },
];

/** Роли человека, между которыми можно переключаться в меню профиля. */
export function workspacesOf(user: SessionUser | null): { kind: string; title: string; to: string }[] {
  return WORKSPACES.filter((w) => user?.roles.some((r) => r.kind === w.kind)).map(({ kind, title, to }) => ({
    kind,
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

/** Перейти в другой аккаунт этого устройства без пароля ✳ (19.11.2026): сервер
 *  берёт его сессию из httpOnly-куки. Нет живой сессии — `null`, нужен пароль. */
export async function switchAccount(userId: string): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/switch/', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) return null;
  return toUser((await res.json()) as Record<string, unknown>);
}
