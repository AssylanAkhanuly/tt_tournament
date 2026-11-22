/* Национальная команда — транспорт и модель ✳ (19.11.2026, NATIONAL.md).
   Единственное место, где фронт ходит в `/api/national/`. Права решает
   сервер и сообщает их в ответе (`access`, `can*`): экраны показывают кнопки
   по ним, а не повторяют правила у себя. */

export { useLoad } from '@/shared/lib/useLoad';

export type Squad = 'main' | 'extended';
export type AgeGroup = 'cadet' | 'junior' | 'adult';
export type ClearanceStatus = 'ok' | 'expired' | 'none';
export type MedicalKind = 'clearance' | 'umo' | 'illness' | 'injury' | 'restriction';
export type PlanItemKind = 'work' | 'camp' | 'start';
export type PlanStatus = 'draft' | 'submitted' | 'approved' | 'returned';
export type EventKind = 'camp' | 'start';
export type ReportStatus = 'submitted' | 'returned' | 'rejected' | 'approved';
export type ReportActionKind = 'submitted' | 'resubmitted' | 'returned' | 'rejected' | 'approved';

export const SQUAD_LABEL: Record<Squad, string> = { main: 'Основной', extended: 'Расширенный' };
export const AGE_GROUP_LABEL: Record<AgeGroup, string> = { cadet: 'Кадеты', junior: 'Юноши', adult: 'Взрослые' };
export const MEDICAL_KIND_LABEL: Record<MedicalKind, string> = {
  clearance: 'Медицинский допуск',
  umo: 'УМО',
  illness: 'Болезнь',
  injury: 'Травма',
  restriction: 'Постоянное ограничение',
};
export const PLAN_ITEM_LABEL: Record<PlanItemKind, string> = { work: 'Работа', camp: 'Сбор', start: 'Старт' };
export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: 'Черновик',
  submitted: 'На согласовании',
  approved: 'Согласован',
  returned: 'Возвращён',
};
export const EVENT_KIND_LABEL: Record<EventKind, string> = { camp: 'Сбор', start: 'Старт' };
export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  submitted: 'Ждёт решения',
  returned: 'На доработке',
  rejected: 'Отклонён',
  approved: 'Ушёл в федерацию',
};
export const REPORT_ACTION_LABEL: Record<ReportActionKind, string> = {
  submitted: 'Подан',
  resubmitted: 'Подан повторно',
  returned: 'Возвращён на доработку',
  rejected: 'Отклонён',
  approved: 'Согласован, ушёл в федерацию',
};

export type NationalPerson = { id: string; name: string; region: string; birthYear: number | null; rating: string | null; sex: 'm' | 'f' | '' };
export type Clearance = { status: ClearanceStatus; until: string | null };
export type MemberAccess = {
  roster: boolean;
  plans: boolean;
  planAuthor: boolean;
  medical: 'full' | 'summary' | null;
  sport: boolean;
  /** Вкладки УМО в медкарте: врачу и штабу ✳ (22.11.2026). */
  umo: boolean;
};

export type NationalMember = {
  id: string;
  person: NationalPerson;
  squad: Squad;
  ageGroup: AgeGroup;
  /** Фото спортсмена ✳ (22.11.2026): карточки состава. */
  avatar: string | null;
  /** Место в рейтинг-листе — только в списке состава ✳ (22.11.2026). */
  place?: number | null;
  /** Снимок по пояс для баннера карточки и профиля ✳ (22.11.2026). */
  figure: string | null;
  personalCoach: { id: string; name: string } | null;
  clearance: Clearance;
  /** Сколько действует ограничений нагрузки. */
  limits: number;
  access: MemberAccess;
  /** Тем, кто видит планы: «N из M» текущего плана. */
  plan?: { planId: string; done: number; total: number; status: PlanStatus } | null;
  /** Только в ответе карточки ✳ (22.11.2026): фото, контакты, дата рождения,
   *  с какого дня в сборной. */
  profile?: MemberProfileData;
};

export type MemberProfileData = { avatar: string | null; email: string; phone: string; birthDate: string | null; joined: string };

export type MedicalRecord = {
  id: string;
  kind: MedicalKind;
  date: string;
  title: string;
  note: string;
  loadLimit: string;
  until: string | null;
  createdBy: string;
};

export type MedicalCard =
  | { full: true; clearance: Clearance; records: MedicalRecord[] }
  | { full: false; clearance: Clearance; limits: { loadLimit: string; until: string | null }[]; umo: boolean };

export type SportRecord = { id: string; date: string; text: string; createdBy: string };

export type PlanItem = {
  id: string;
  kind: PlanItemKind;
  title: string;
  startsOn: string | null;
  due: string | null;
  done: boolean;
  eventId: string | null;
  /** Где пункт во времени и его состояние — считает сервер, как у доски. */
  period: { from: string; to: string } | null;
  state: BoardItemState;
  /** Город мероприятия (сбор, старт); у работы — пусто. */
  city: string;
};
export type TrainingPlan = {
  id: string;
  startsOn: string;
  endsOn: string;
  goal: string;
  status: PlanStatus;
  reviewComment: string;
  reviewedBy: string;
  items: PlanItem[];
  done: number;
  total: number;
  canEdit: boolean;
  canMark: boolean;
  canSubmit: boolean;
  canReview: boolean;
};

export type TrainingEvent = {
  id: string;
  kind: EventKind;
  title: string;
  city: string;
  startsOn: string;
  endsOn: string;
  ageGroup: AgeGroup | '';
  tournament: { id: string; name: string } | null;
};

export type TravelReport = {
  id: string;
  event: TrainingEvent;
  ageGroup: AgeGroup;
  status: ReportStatus;
  author: { id: string; name: string };
  athletes: NationalPerson[];
  text: string;
  fileName: string | null;
  createdAt: string;
  history: { action: ReportActionKind; by: string; comment: string; at: string }[];
  canDecide: boolean;
  canResubmit: boolean;
};

export type HistoryRow = {
  kind: 'camp' | 'start' | 'tournament';
  date: string;
  endsOn: string | null;
  title: string;
  city: string;
  delta: string | null;
  wins?: number;
  losses?: number;
};

export type NationalMe = {
  headStaff: boolean;
  teamCoachGroups: AgeGroup[];
  personalCoach: boolean;
  doctor: boolean;
  psychologist: boolean;
  calendar: boolean;
  reports: boolean;
};

type Raw = Record<string, unknown>;

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const res = await fetch(url, {
    credentials: 'include',
    headers: init?.body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as Raw;
  if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Ошибка (' + res.status + ')');
  return body as T;
}

/** Запрос с телом — JSON или FormData; общий для частей транспорта сборной. */
export const send = <T>(method: string, url: string, data?: unknown) =>
  request<T>(url, {
    method,
    body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data),
  });

const person = (p: Raw): NationalPerson => ({
  id: String(p.id),
  name: String(p.name),
  region: String(p.region ?? ''),
  birthYear: (p.birth_year as number | null) ?? null,
  sex: p.sex === 'm' || p.sex === 'f' ? p.sex : '',
  rating: (p.rating as string | null) ?? null,
});

const member = (m: Raw): NationalMember => {
  const plan = m.plan as Raw | null | undefined;
  return {
    id: String(m.id),
    person: person(m.person as Raw),
    squad: m.squad as Squad,
    ageGroup: m.age_group as AgeGroup,
    avatar: (m.avatar as string | null | undefined) ?? null,
    place: (m.place as number | null | undefined) ?? undefined,
    figure: (m.figure as string | null | undefined) ?? null,
    personalCoach: (m.personal_coach as NationalMember['personalCoach']) ?? null,
    clearance: m.clearance as Clearance,
    limits: Number(m.limits ?? 0),
    access: (({ plan_author, umo, ...a }) => ({ ...a, planAuthor: Boolean(plan_author), umo: Boolean(umo) }))(m.access as Raw & MemberAccess) as MemberAccess,
    plan:
      plan === undefined
        ? undefined
        : plan && { planId: String(plan.plan_id), done: Number(plan.done), total: Number(plan.total), status: plan.status as PlanStatus },
    profile: m.profile
      ? (({ avatar, email, phone, birth_date, joined }: Raw) => ({
          avatar: (avatar as string | null) ?? null,
          email: String(email ?? ''),
          phone: String(phone ?? ''),
          birthDate: (birth_date as string | null) ?? null,
          joined: String(joined),
        }))(m.profile as Raw)
      : undefined,
  };
};

const record = (r: Raw): MedicalRecord => ({
  id: String(r.id),
  kind: r.kind as MedicalKind,
  date: String(r.date),
  title: String(r.title ?? ''),
  note: String(r.note ?? ''),
  loadLimit: String(r.load_limit ?? ''),
  until: (r.until as string | null) ?? null,
  createdBy: String(r.created_by ?? ''),
});

const plan = (p: Raw): TrainingPlan => ({
  id: String(p.id),
  startsOn: String(p.starts_on),
  endsOn: String(p.ends_on),
  goal: String(p.goal ?? ''),
  status: p.status as PlanStatus,
  reviewComment: String(p.review_comment ?? ''),
  reviewedBy: String(p.reviewed_by ?? ''),
  items: (p.items as Raw[]).map((i) => ({
    id: String(i.id),
    kind: i.kind as PlanItemKind,
    title: String(i.title),
    startsOn: (i.starts_on as string | null) ?? null,
    due: (i.due as string | null) ?? null,
    done: Boolean(i.done),
    eventId: (i.event_id as string | null) ?? null,
    period: (i.period as { from: string; to: string } | null) ?? null,
    state: (i.state as BoardItemState) ?? 'planned',
    city: String(i.city ?? ''),
  })),
  done: Number(p.done),
  total: Number(p.total),
  canEdit: Boolean(p.can_edit),
  canMark: Boolean(p.can_mark),
  canSubmit: Boolean(p.can_submit),
  canReview: Boolean(p.can_review),
});

const event = (e: Raw): TrainingEvent => ({
  id: String(e.id),
  kind: e.kind as EventKind,
  title: String(e.title),
  city: String(e.city ?? ''),
  startsOn: String(e.starts_on),
  endsOn: String(e.ends_on),
  ageGroup: (e.age_group as AgeGroup | '') ?? '',
  tournament: (e.tournament as TrainingEvent['tournament']) ?? null,
});

const report = (r: Raw): TravelReport => ({
  id: String(r.id),
  event: event(r.event as Raw),
  ageGroup: r.age_group as AgeGroup,
  status: r.status as ReportStatus,
  author: r.author as TravelReport['author'],
  athletes: (r.athletes as Raw[]).map(person),
  text: String(r.text ?? ''),
  fileName: (r.file_name as string | null) ?? null,
  createdAt: String(r.created_at),
  history: (r.history as Raw[]).map((h) => ({
    action: h.action as ReportActionKind,
    by: String(h.by ?? ''),
    comment: String(h.comment ?? ''),
    at: String(h.at),
  })),
  canDecide: Boolean(r.can_decide),
  canResubmit: Boolean(r.can_resubmit),
});

// ── Кто я в сборной ─────────────────────────────────────────────────────────

export async function fetchNationalMe(): Promise<NationalMe> {
  const m = await request<Raw>('/api/national/me/');
  return {
    headStaff: Boolean(m.head_staff),
    teamCoachGroups: (m.team_coach_groups as AgeGroup[]) ?? [],
    personalCoach: Boolean(m.personal_coach),
    doctor: Boolean(m.doctor),
    psychologist: Boolean(m.psychologist),
    calendar: Boolean(m.calendar),
    reports: Boolean(m.reports),
  };
}

// ── Состав ──────────────────────────────────────────────────────────────────

export const fetchMembers = async () => (await request<Raw[]>('/api/national/members/')).map(member);
export const fetchMember = async (id: string) => member(await request<Raw>(`/api/national/members/${id}/`));
export const fetchMemberCandidates = async (q: string) =>
  (await request<Raw[]>(`/api/national/members/candidates/?q=${encodeURIComponent(q)}`)).map(person);
export const fetchPersonalCoaches = async () =>
  (await request<Raw[]>('/api/national/members/personal-coaches/')).map((c) => ({ id: String(c.id), name: String(c.name) }));
export const addMember = async (userId: string, squad: Squad, ageGroup: AgeGroup) =>
  member(await send<Raw>('POST', '/api/national/members/', { user_id: userId, squad, age_group: ageGroup }));
export const updateMember = async (id: string, patch: { squad?: Squad; ageGroup?: AgeGroup; personalCoachId?: string | null }) =>
  member(
    await send<Raw>('PATCH', `/api/national/members/${id}/`, {
      ...(patch.squad && { squad: patch.squad }),
      ...(patch.ageGroup && { age_group: patch.ageGroup }),
      ...(patch.personalCoachId !== undefined && { personal_coach_id: patch.personalCoachId }),
    }),
  );
export const removeMember = (id: string) => send('DELETE', `/api/national/members/${id}/`);

// ── Медкарта, спортивная карточка, история ──────────────────────────────────

export async function fetchMedical(memberId: string): Promise<MedicalCard> {
  const m = await request<Raw>(`/api/national/members/${memberId}/medical/`);
  const clearance = m.clearance as Clearance;
  if (m.full) return { full: true, clearance, records: (m.records as Raw[]).map(record) };
  return {
    full: false,
    clearance,
    limits: (m.limits as Raw[]).map((l) => ({ loadLimit: String(l.load_limit), until: (l.until as string | null) ?? null })),
    umo: Boolean(m.umo),
  };
}

export type MedicalInput = { kind: MedicalKind; date: string; until: string; title: string; note: string; loadLimit: string };
export const addMedical = async (memberId: string, d: MedicalInput) =>
  record(
    await send<Raw>('POST', `/api/national/members/${memberId}/medical/`, {
      kind: d.kind,
      date: d.date,
      until: d.until || null,
      title: d.title,
      note: d.note,
      load_limit: d.loadLimit,
    }),
  );
export const deleteMedical = (id: string) => send('DELETE', `/api/national/medical/${id}/`);

export const fetchSport = async (memberId: string): Promise<SportRecord[]> =>
  (await request<Raw[]>(`/api/national/members/${memberId}/sport/`)).map((r) => ({
    id: String(r.id),
    date: String(r.date),
    text: String(r.text),
    createdBy: String(r.created_by ?? ''),
  }));
export const addSport = (memberId: string, d: { date: string; text: string }) => send('POST', `/api/national/members/${memberId}/sport/`, d);
export const deleteSport = (id: string) => send('DELETE', `/api/national/sport/${id}/`);

export const fetchHistory = async (memberId: string): Promise<HistoryRow[]> =>
  (await request<Raw[]>(`/api/national/members/${memberId}/history/`)).map((h) => ({
    kind: h.kind as HistoryRow['kind'],
    date: String(h.date),
    endsOn: (h.ends_on as string | null) ?? null,
    title: String(h.title),
    city: String(h.city ?? ''),
    delta: (h.delta as string | null) ?? null,
    wins: h.wins as number | undefined,
    losses: h.losses as number | undefined,
  }));

// ── Планы подготовки ────────────────────────────────────────────────────────

export const fetchPlans = async (memberId: string) =>
  (await request<Raw[]>(`/api/national/members/${memberId}/plans/`)).map(plan);
export const createPlan = async (memberId: string, d: { startsOn: string; endsOn: string; goal: string }) =>
  plan(await send<Raw>('POST', `/api/national/members/${memberId}/plans/`, { starts_on: d.startsOn, ends_on: d.endsOn, goal: d.goal }));
export const deletePlan = (id: string) => send('DELETE', `/api/national/plans/${id}/`);
export const submitPlan = (id: string) => send('POST', `/api/national/plans/${id}/submit/`);
export const reviewPlan = (id: string, approve: boolean, comment = '') =>
  send('POST', `/api/national/plans/${id}/review/`, { approve, comment });
export const addPlanItem = (planId: string, d: { kind: PlanItemKind; title: string; due: string; startsOn?: string | null; eventId?: string | null }) =>
  send('POST', `/api/national/plans/${planId}/items/`, {
    kind: d.kind,
    title: d.title,
    due: d.due || null,
    starts_on: d.startsOn || null,
    event_id: d.eventId ?? null,
  });
// ── Доска планов ✳ (21.11.2026, NATIONAL.md «Доска планов») ──────────────────

/** Состояние пункта на доске — считает сервер (`national/board.py`). */
export type BoardItemState = 'done' | 'live' | 'planned' | 'overdue';
export type BoardItem = {
  id: string;
  title: string;
  kind: PlanItemKind;
  startsOn: string;
  endsOn: string;
  state: BoardItemState;
  planStatus: PlanStatus;
  city: string;
  /** Растянуть и сдвинуть на доске — работа плана, который правит этот человек (сервер). */
  canMove: boolean;
};
export type BoardRow = {
  member: { id: string; person: NationalPerson; squad: Squad; ageGroup: AgeGroup; avatar: string | null };
  plan: { id: string; status: PlanStatus; startsOn: string; endsOn: string; goal: string; done: number; total: number } | null;
  items: BoardItem[];
  canMark: boolean;
  /** Добавить пункт с доски — план правит этот человек сейчас (сервер). */
  canAdd: boolean;
  /** Завести план с доски — штаб и личный тренер спортсмена (сервер). */
  canCreatePlan: boolean;
};
export type PlanBoardData = { from: string; to: string; today: string; rows: BoardRow[] };

export async function fetchPlanBoard(from: string, to: string): Promise<PlanBoardData> {
  const r = await request<Raw>(`/api/national/plans/board/?from=${from}&to=${to}`);
  return {
    from: String(r.from),
    to: String(r.to),
    today: String(r.today),
    rows: (r.rows as Raw[]).map((x) => {
      const m = x.member as Raw;
      const p = x.plan as Raw | null;
      return {
        member: {
          id: String(m.id),
          person: person(m.person as Raw),
          squad: m.squad as Squad,
          ageGroup: m.age_group as AgeGroup,
          avatar: (m.avatar as string | null | undefined) ?? null,
        },
        plan: p
          ? {
              id: String(p.id),
              status: p.status as PlanStatus,
              startsOn: String(p.starts_on),
              endsOn: String(p.ends_on),
              goal: String(p.goal ?? ''),
              done: Number(p.done),
              total: Number(p.total),
            }
          : null,
        items: (x.items as Raw[]).map((i) => ({
          id: String(i.id),
          title: String(i.title),
          kind: i.kind as PlanItemKind,
          startsOn: String(i.starts_on),
          endsOn: String(i.ends_on),
          state: i.state as BoardItemState,
          planStatus: i.plan_status as PlanStatus,
          city: String(i.city ?? ''),
          canMove: Boolean(i.can_move),
        })),
        canMark: Boolean(x.can_mark),
        canAdd: Boolean(x.can_add),
        canCreatePlan: Boolean(x.can_create_plan),
      };
    }),
  };
}

export const setPlanItemDone = (id: string, done: boolean) => send('PATCH', `/api/national/plan-items/${id}/`, { done });
/** Новые даты работы — растягивание на доске ✳ (22.11.2026). Начало, равное
 *  сроку, сервер не хранит. */
export const movePlanItem = (id: string, startsOn: string, due: string) =>
  send('PATCH', `/api/national/plan-items/${id}/`, { starts_on: startsOn, due });
export const deletePlanItem = (id: string) => send('DELETE', `/api/national/plan-items/${id}/`);

// ── Календарь подготовки ────────────────────────────────────────────────────

export async function fetchEvents(): Promise<{ canEdit: boolean; events: TrainingEvent[] }> {
  const r = await request<Raw>('/api/national/events/');
  return { canEdit: Boolean(r.can_edit), events: (r.events as Raw[]).map(event) };
}
export type EventInput = { kind: EventKind; title: string; city: string; startsOn: string; endsOn: string; ageGroup: AgeGroup | '' };
const eventBody = (d: EventInput) => ({
  kind: d.kind,
  title: d.title,
  city: d.city,
  starts_on: d.startsOn,
  ends_on: d.endsOn,
  age_group: d.ageGroup,
});
export const createEvent = (d: EventInput) => send('POST', '/api/national/events/', eventBody(d));
export const updateEvent = (id: string, d: EventInput) => send('PATCH', `/api/national/events/${id}/`, eventBody(d));
export const deleteEvent = (id: string) => send('DELETE', `/api/national/events/${id}/`);

// ── Рапорты ─────────────────────────────────────────────────────────────────

export const fetchReports = async () => (await request<Raw[]>('/api/national/reports/')).map(report);
export const fetchReportCandidates = async (q: string) =>
  (await request<Raw[]>(`/api/national/reports/candidates/?q=${encodeURIComponent(q)}`)).map(person);

function reportForm(d: { eventId?: string; ageGroup?: AgeGroup; text: string; athleteIds: string[]; file: File | null; comment?: string }) {
  const f = new FormData();
  if (d.eventId) f.append('event_id', d.eventId);
  if (d.ageGroup) f.append('age_group', d.ageGroup);
  f.append('text', d.text);
  d.athleteIds.forEach((id) => f.append('athlete_ids', id));
  if (d.file) f.append('file', d.file);
  if (d.comment) f.append('comment', d.comment);
  return f;
}
export const createReport = async (d: { eventId: string; ageGroup: AgeGroup; text: string; athleteIds: string[]; file: File | null }) =>
  report(await send<Raw>('POST', '/api/national/reports/', reportForm(d)));
export const resubmitReport = async (id: string, d: { text: string; athleteIds: string[]; file: File | null }) =>
  report(await send<Raw>('PATCH', `/api/national/reports/${id}/`, reportForm(d)));
export const decideReport = async (id: string, decision: 'approve' | 'return' | 'reject', comment = '') =>
  report(await send<Raw>('POST', `/api/national/reports/${id}/decide/`, { decision, comment }));
export const reportFileUrl = (id: string) => `/api/national/reports/${id}/file/`;

/** «2026-11-19» → «19.11.2026». */
export const dmy = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('.') : '—');

/** Снимки члена сборной ✳ (22.11.2026): аватар (лицо) и фигура по пояс для
 *  баннера. Меняет штаб сборной; `null` — снять. */
export type MemberImageKind = 'avatar' | 'figure';
export async function setMemberImage(memberId: string, kind: MemberImageKind, file: File | null) {
  const url = `/api/national/members/${memberId}/images/${kind}/`;
  if (!file) return member(await send<Raw>('DELETE', url));
  const f = new FormData();
  f.append('file', file);
  return member(await send<Raw>('POST', url, f));
}
