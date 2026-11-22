/* УМО — динамика углублённого медицинского осмотра ✳ (22.11.2026,
   NATIONAL.md «Медкарта: УМО»). Транспорт: каталог, расчёты и статусы
   приходят с сервера (`national/umo.py`), экран их только рисует. Только
   врачу сборной. */

import { request, send } from './api';

type Raw = Record<string, unknown>;

export type UmoStatus = 'low' | 'high' | 'ok' | null;
export type UmoValue = number | string | null;

export type UmoParam = {
  code: string;
  name: string;
  unit: string;
  kind: 'num' | 'text';
  key: boolean;
  calc: boolean;
  refMin: number | null;
  refMax: number | null;
  reflects: string;
  signal: string;
  values: UmoValue[];
  statuses: UmoStatus[];
  last: UmoValue;
  deltaBasePct: number | null;
  deltaPrev: number | null;
  status: UmoStatus;
};

export type UmoBlock = {
  code: string;
  n: number;
  title: string;
  about: string;
  impact: string;
  control: boolean;
  params: UmoParam[];
  summary: { numeric: number; low: number; high: number };
};

export type UmoExam = {
  id: string;
  date: string;
  heightCm: number | null;
  stage: string;
  loadNote: string;
  illnesses: string;
  conditions: string;
  supplements: string;
  note: string;
  createdBy: string;
  values: Record<string, string>;
};

export type Umo = { sex: '' | 'm' | 'f'; nextPlanned: string | null; exams: UmoExam[]; blocks: UmoBlock[] };

export type UmoContext = Pick<UmoExam, 'date' | 'stage' | 'loadNote' | 'illnesses' | 'conditions' | 'supplements' | 'note'> & { heightCm: string };

const param = (p: Raw): UmoParam => ({
  code: String(p.code),
  name: String(p.name),
  unit: String(p.unit ?? ''),
  kind: p.kind === 'text' ? 'text' : 'num',
  key: Boolean(p.key),
  calc: Boolean(p.calc),
  refMin: (p.ref_min as number | null) ?? null,
  refMax: (p.ref_max as number | null) ?? null,
  reflects: String(p.reflects ?? ''),
  signal: String(p.signal ?? ''),
  values: (p.values as UmoValue[]) ?? [],
  statuses: (p.statuses as UmoStatus[]) ?? [],
  last: (p.last as UmoValue) ?? null,
  deltaBasePct: (p.delta_base_pct as number | null) ?? null,
  deltaPrev: (p.delta_prev as number | null) ?? null,
  status: (p.status as UmoStatus) ?? null,
});

const umo = (d: Raw): Umo => ({
  sex: (d.sex as Umo['sex']) ?? '',
  nextPlanned: (d.next_planned as string | null) ?? null,
  exams: ((d.exams as Raw[]) ?? []).map((e) => ({
    id: String(e.id),
    date: String(e.date),
    heightCm: (e.height_cm as number | null) ?? null,
    stage: String(e.stage ?? ''),
    loadNote: String(e.load_note ?? ''),
    illnesses: String(e.illnesses ?? ''),
    conditions: String(e.conditions ?? ''),
    supplements: String(e.supplements ?? ''),
    note: String(e.note ?? ''),
    createdBy: String(e.created_by ?? ''),
    values: (e.values as Record<string, string>) ?? {},
  })),
  blocks: ((d.blocks as Raw[]) ?? []).map((b) => ({
    code: String(b.code),
    n: Number(b.n),
    title: String(b.title),
    about: String(b.about ?? ''),
    impact: String(b.impact ?? ''),
    control: Boolean(b.control),
    params: ((b.params as Raw[]) ?? []).map(param),
    summary: b.summary as UmoBlock['summary'],
  })),
});

const context = (c: Partial<UmoContext>) => ({
  ...(c.date !== undefined ? { date: c.date } : {}),
  ...(c.heightCm !== undefined ? { height_cm: c.heightCm } : {}),
  ...(c.stage !== undefined ? { stage: c.stage } : {}),
  ...(c.loadNote !== undefined ? { load_note: c.loadNote } : {}),
  ...(c.illnesses !== undefined ? { illnesses: c.illnesses } : {}),
  ...(c.conditions !== undefined ? { conditions: c.conditions } : {}),
  ...(c.supplements !== undefined ? { supplements: c.supplements } : {}),
  ...(c.note !== undefined ? { note: c.note } : {}),
});

export const fetchUmo = async (memberId: string) => umo(await request<Raw>(`/api/national/members/${memberId}/umo/`));
export const addUmoExam = async (memberId: string, c: UmoContext) => umo(await send<Raw>('POST', `/api/national/members/${memberId}/umo/`, context(c)));
export const updateUmoExam = async (examId: string, c: Partial<UmoContext>, values?: Record<string, string>) =>
  umo(await send<Raw>('PATCH', `/api/national/umo/${examId}/`, { ...context(c), ...(values ? { values } : {}) }));
export const deleteUmoExam = async (examId: string) => umo(await send<Raw>('DELETE', `/api/national/umo/${examId}/`));
