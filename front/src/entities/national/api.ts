/* Национальная команда — транспорт и модель ✳ (19.11.2026, NATIONAL.md).
   Единственное место, где фронт ходит в `/api/national/`. Права решает
   сервер: врачу медкарта приходит целиком, главному тренеру — допуск и
   ограничения нагрузки (`MedicalCard.full`). */

export { useLoad } from '@/shared/lib/useLoad';

export type Squad = 'main' | 'extended';
export type AgeGroup = 'cadet' | 'junior' | 'adult';
export type ClearanceStatus = 'ok' | 'expired' | 'none';
export type MedicalKind = 'clearance' | 'umo' | 'illness' | 'injury' | 'restriction';
export type PlanItemKind = 'work' | 'camp' | 'start';

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

export type NationalPerson = { id: string; name: string; region: string; birthYear: number | null; rating: string | null };
export type Clearance = { status: ClearanceStatus; until: string | null };

export type NationalMember = {
  id: string;
  person: NationalPerson;
  squad: Squad;
  ageGroup: AgeGroup;
  clearance: Clearance;
  /** Сколько действует ограничений нагрузки. */
  limits: number;
  /** Только главному тренеру: «N из M» текущего плана. */
  plan?: { planId: string; done: number; total: number } | null;
};

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
  | { full: false; clearance: Clearance; limits: { loadLimit: string; until: string | null }[] };

export type PlanItem = { id: string; kind: PlanItemKind; title: string; due: string | null; done: boolean };
export type TrainingPlan = {
  id: string;
  startsOn: string;
  endsOn: string;
  goal: string;
  items: PlanItem[];
  done: number;
  total: number;
};

type Raw = Record<string, unknown>;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as Raw;
  if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Ошибка (' + res.status + ')');
  return body as T;
}

const send = <T>(method: string, url: string, data?: unknown) =>
  request<T>(url, { method, body: data === undefined ? undefined : JSON.stringify(data) });

const person = (p: Raw): NationalPerson => ({
  id: String(p.id),
  name: String(p.name),
  region: String(p.region ?? ''),
  birthYear: (p.birth_year as number | null) ?? null,
  rating: (p.rating as string | null) ?? null,
});

const member = (m: Raw): NationalMember => {
  const plan = m.plan as Raw | null | undefined;
  return {
    id: String(m.id),
    person: person(m.person as Raw),
    squad: m.squad as Squad,
    ageGroup: m.age_group as AgeGroup,
    clearance: m.clearance as Clearance,
    limits: Number(m.limits ?? 0),
    plan: plan === undefined ? undefined : plan && { planId: String(plan.plan_id), done: Number(plan.done), total: Number(plan.total) },
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
  items: (p.items as Raw[]).map((i) => ({
    id: String(i.id),
    kind: i.kind as PlanItemKind,
    title: String(i.title),
    due: (i.due as string | null) ?? null,
    done: Boolean(i.done),
  })),
  done: Number(p.done),
  total: Number(p.total),
});

// ── Состав ──────────────────────────────────────────────────────────────────

export const fetchMembers = async () => (await request<Raw[]>('/api/national/members/')).map(member);
export const fetchMember = async (id: string) => member(await request<Raw>(`/api/national/members/${id}/`));
export const fetchMemberCandidates = async (q: string) =>
  (await request<Raw[]>(`/api/national/members/candidates/?q=${encodeURIComponent(q)}`)).map(person);
export const addMember = async (userId: string, squad: Squad, ageGroup: AgeGroup) =>
  member(await send<Raw>('POST', '/api/national/members/', { user_id: userId, squad, age_group: ageGroup }));
export const updateMember = async (id: string, patch: { squad?: Squad; ageGroup?: AgeGroup }) =>
  member(
    await send<Raw>('PATCH', `/api/national/members/${id}/`, {
      ...(patch.squad && { squad: patch.squad }),
      ...(patch.ageGroup && { age_group: patch.ageGroup }),
    }),
  );
export const removeMember = (id: string) => send('DELETE', `/api/national/members/${id}/`);

// ── Медкарта ────────────────────────────────────────────────────────────────

export async function fetchMedical(memberId: string): Promise<MedicalCard> {
  const m = await request<Raw>(`/api/national/members/${memberId}/medical/`);
  const clearance = m.clearance as Clearance;
  if (m.full) return { full: true, clearance, records: (m.records as Raw[]).map(record) };
  return {
    full: false,
    clearance,
    limits: (m.limits as Raw[]).map((l) => ({ loadLimit: String(l.load_limit), until: (l.until as string | null) ?? null })),
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

// ── Планы подготовки ────────────────────────────────────────────────────────

export const fetchPlans = async (memberId: string) =>
  (await request<Raw[]>(`/api/national/members/${memberId}/plans/`)).map(plan);
export const createPlan = async (memberId: string, d: { startsOn: string; endsOn: string; goal: string }) =>
  plan(await send<Raw>('POST', `/api/national/members/${memberId}/plans/`, { starts_on: d.startsOn, ends_on: d.endsOn, goal: d.goal }));
export const deletePlan = (id: string) => send('DELETE', `/api/national/plans/${id}/`);
export const addPlanItem = (planId: string, d: { kind: PlanItemKind; title: string; due: string }) =>
  send('POST', `/api/national/plans/${planId}/items/`, { kind: d.kind, title: d.title, due: d.due || null });
export const setPlanItemDone = (id: string, done: boolean) => send('PATCH', `/api/national/plan-items/${id}/`, { done });
export const deletePlanItem = (id: string) => send('DELETE', `/api/national/plan-items/${id}/`);

/** «2026-11-19» → «19.11.2026». */
export const dmy = (iso: string | null) => (iso ? iso.split('-').reverse().join('.') : '—');
