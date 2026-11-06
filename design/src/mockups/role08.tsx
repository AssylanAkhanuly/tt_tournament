/* Роль 8 · Заместитель главного судьи — макеты по флоу на новом слое (HeroUI).
   Источник — `flows/08-zam-glavnogo-sudi.md`.

   Права роли — по передаче полномочий главного судьи (решение совещания
   04.11.2026): главный судья передаёт их кнопкой заместителю или главному
   секретарю и возвращает той же кнопкой; пока они переданы, главный судья
   только смотрит — **править одновременно может один**. Переходит ход турнира
   (ввод и исправление счёта, вызов судей и спортсменов на стол), итоговый
   протокол — нет.

   Отсюда весь дизайн роли: заместитель видит те же блоки, что главный судья
   (они импортируются из `role06.tsx` — это не копия, а тот же экран), а поверх
   них живёт ПОЛОСА ПОЛНОМОЧИЙ — у кого они сейчас. Без полномочий кнопок
   действий нет вовсе.

   Прежние ✳ 28.08.2026 «работают оба одновременно», «запросить доступ» и
   «доступ выдаёт председатель ГСК» сняты тем же совещанием.

   Ход турнира по передаче полномочий один и у заместителя, и у главного
   секретаря (Э7.6): `DelegatedLive` экспортируется и рисует оба экрана — две
   реализации разъехались бы на первой правке. */

import { useState, type ReactNode } from 'react';
import {
  ArrowRightLeft, Ban, Clock, LayoutDashboard, Lock, Megaphone, Pencil, Shield, SquarePen, Timer,
  Undo2,
} from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  ActionBar,
  Facts,
  PageTabs,
  Panel,
  PhoneRoleApp,
  Pill,
  PrimaryAction,
  QuietAction,
  Row,
  Rows,
  ScreenScope,
  StatTiles,
  WebApp,
  type RoleUI,
} from '@/shared/kit/app';
import { Board, States, Shot, type ScreenMap } from './shell';
/* Блоки главного судьи — из его же файла, а не копией. */
import { LiveCards, NeedRow, QueuePanel, Stages, TableMap, type Need } from './role06';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { roundTitle, type Match } from '@/entities/bracket/model';
import { makeBigBracket } from '../bigBracket';
import { Login0_1, LoginPhone0_1, SignUpJudge0_7, SignUpJudge0_7States } from './role00';
import { SignUpJudgePhone0_7 } from './role09';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

const R08: RoleUI = {
  num: '8',
  title: 'Заместитель главного судьи',
  person: { nm: 'Сагинтаев Д.', rl: 'Заместитель главного судьи', av: A(37) },
  brandName: 'Чемпионат Казахстана 2026',
  brandSub: 'Одиночный · олимпийская · г. Астана',
  badge: 'ИДЁТ',
  nav: [
    [<LayoutDashboard size={16} key="t" />, 'Мой турнир'],
    [<Timer size={16} key="l" />, 'Ход турнира'],
  ],
  roles: ['Заместитель главного судьи', { t: 'Судья · вне турнира', to: 'Э0.8' }],
};

const CHIEF = A(76); // Оспанов Талғат — главный судья турнира (роль 6)
const DEP = A(37); // Сагинтаев Дархан — заместитель, пользователь этих экранов
const SEC = AW(31); // Ким Лаура — главный секретарь (роль 7)

/* ── Мелочи ─────────────────────────────────────────────────────── */

type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const Pl = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;

const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/* ── Э8.1 · Мой турнир — режим замещения ────────────────────────── */

const NEEDS: Need[] = [
  {
    ic: <Megaphone size={16} />, t: '3 пары ждут стола дольше 20 минут',
    s: 'вызвать на освободившиеся столы', p: 'СРОЧНО', cls: 'bad',
  },
  {
    ic: <Shield size={16} />, t: 'На столе 7 нет судьи',
    s: 'матч не стартует, пока стол без судьи', p: 'БЛОКИРУЕТ', cls: 'wait',
  },
  {
    ic: <Clock size={16} />, t: 'Стол 11 — задержка старта 12 минут',
    s: 'карта столов', p: 'ПРОВЕРИТЬ', cls: 'wait',
  },
];

const TILES8_1: { v: string; k: string; tone?: 'g' | 'a' | 'b' }[] = [
  { v: '112', k: 'Участников в составе' },
  { v: '20', k: 'Столов в зале' },
  { v: '14', k: 'Судей в наряде' },
  { v: '60 / 127', k: 'Матчей сыграно', tone: 'g' },
  { v: '8', k: 'Пар ждут стола', tone: 'a' },
];

const NeedRowPhone = ({ n }: { n: Need }) => (
  <div className="flex flex-col gap-1.5 px-4 py-3">
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        {n.ic}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13.5px] font-medium">{n.t}</span>
        <span className="block text-xs text-neutral-500">{n.s}</span>
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-2 pl-11">
      <Pl t={n.p} cls={n.cls} />
    </div>
  </div>
);

const NeedsPanel = ({ phone }: { phone?: boolean }) => (
  <Panel
    title="Что сейчас требуется"
    extra={
      <Chip className="whitespace-nowrap" color="accent" size="sm" variant="primary">
        <Lock size={10} className="mr-1" /> ТОЛЬКО ПРОСМОТР
      </Chip>
    }
    flush
  >
    <div className="divide-y divide-neutral-100">
      {NEEDS.map((n) => (phone ? <NeedRowPhone key={n.t} n={n} /> : <NeedRow key={n.t} n={n} read />))}
    </div>
  </Panel>
);

/** У кого полномочия главного судьи — одна панель на оба формата. */
type Holder = 'chief' | 'me' | 'sec';

const PowersPanel = ({ holder }: { holder: Holder }) => (
  <Panel
    title="Полномочия"
    extra={
      holder === 'me'
        ? <Pl t="У ВАС" cls="live" />
        : <Pl t={holder === 'chief' ? 'У ГЛАВНОГО СУДЬИ' : 'У ГЛАВНОГО СЕКРЕТАРЯ'} cls="reg" />
    }
    flush
  >
    <div className="divide-y divide-neutral-100">
      <Row
        av={CHIEF}
        nm="Оспанов Талғат"
        sub={holder === 'chief' ? 'Главный судья · ведёт с 09:00' : 'Главный судья · передал в 14:20 · смотрит'}
        pill={holder === 'chief' ? { t: 'ВЕДЁТ', cls: 'live' } : { t: 'ПРОСМОТР', cls: 'done' }}
      />
      <Row
        av={DEP}
        nm="Сагинтаев Дархан — это вы"
        sub="Заместитель главного судьи"
        pill={holder === 'me' ? { t: 'ВЕДЁТ', cls: 'live' } : { t: 'ПРОСМОТР', cls: 'done' }}
      />
      <Row
        av={SEC}
        nm="Ким Лаура"
        sub="Главный секретарь"
        pill={holder === 'sec' ? { t: 'ВЕДЁТ', cls: 'live' } : { t: 'ПРОСМОТР', cls: 'done' }}
      />
    </div>
  </Panel>
);

export function Shift8_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <WebApp role={R08} nav="Мой турнир" title="Мой турнир" sub="Полномочия у главного судьи">
      <Stages cur="Идёт" />
      <StatTiles items={TILES8_1} />
      <NeedsPanel />
      <PowersPanel holder="chief" />
    </WebApp>
  );
}

function Shift8_1Phone() {
  return (
    <PhoneRoleApp role={R08} nav="Мой турнир" title="Мой турнир" sub="Полномочия у главного судьи">
      <Stages cur="Идёт" />
      <div className="mb-4">
        <Facts items={TILES8_1.map((t) => ({ k: t.k, v: t.v, hot: t.tone === 'a' }))} />
      </div>
      <NeedsPanel phone />
      <PowersPanel holder="chief" />
    </PhoneRoleApp>
  );
}

/* ── Ход турнира по передаче полномочий — заместитель (Э8.2) и секретарь (Э7.6) ── */

export type DelegAct = { ic: ReactNode; t: string; log: string };

/** Что переходит с полномочиями (решение совещания 04.11.2026): ход турнира.
    Итогового протокола в наборе нет — его не передают. */
export const DELEG_ACTS: DelegAct[] = [
  { ic: <Shield size={13} />, t: 'Назначить судью на стол', log: 'Оралбай Е. назначен на стол 7' },
  { ic: <Megaphone size={13} />, t: 'Вызвать пару', log: 'Смагулов А. — Цой Д. вызваны на стол 7' },
  { ic: <SquarePen size={13} />, t: 'Ввести счёт', log: '1/8 · Байжанов — Досжан · 4 : 1' },
  { ic: <Pencil size={13} />, t: 'Исправить счёт', log: '1/8 · Ким — Пак · 3 : 1 → 3 : 2' },
];

/** Техническая победа — у заместителя, по нашему чтению «остальные моменты
    переходят» ✳. */
const DEP_ACTS: DelegAct[] = [
  ...DELEG_ACTS,
  { ic: <Ban size={13} />, t: 'Техническая победа', log: '1/4 · Токаев — Гладун · техпобеда, неявка' },
];

const bracket8 = { ...makeBigBracket(5), title: 'Чемпионат Казахстана 2026 · плей-офф' };

const BracketTab = () => (
  <div className="relative h-[430px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
    <div className="absolute inset-0 [&>div]:h-full!">
      <BracketFlow bracket={bracket8} minZoom={0.1} fitPadding={0.04} tone="light" />
    </div>
  </div>
);

const BracketListTab = () => {
  const total = Math.max(...bracket8.matches.map((m) => m.round)) + 1;
  const byRound: Match[][] = Array.from({ length: total }, () => []);
  for (const m of bracket8.matches) byRound[m.round].push(m);
  return (
    <>
      {Array.from({ length: total }, (_, i) => total - 1 - i).map((r) => {
        const ms = [...byRound[r]].sort((x, y) => x.slot - y.slot);
        return (
          <Panel key={r} title={roundTitle(r, total)} extra={<Pl t={`${ms.length} ПАР`} cls="reg" />} flush>
            <div className="divide-y divide-neutral-100">
              {ms.slice(0, 4).map((m) => (
                <Row
                  key={m.id}
                  nm={`${m.a?.name ?? '—'} — ${m.b?.name ?? '—'}`}
                  sub={m.status === 'live' ? 'идёт сейчас' : 'сыграно'}
                  val={`${m.scoreA ?? 0} : ${m.scoreB ?? 0}`}
                  pill={m.status === 'live' ? { t: 'ИДЁТ', cls: 'live' } : undefined}
                />
              ))}
            </div>
            {ms.length > 4 && (
              <div className="px-4 pb-3 pt-2 text-[11.5px] text-neutral-400">ещё {ms.length - 4} пар в круге</div>
            )}
          </Panel>
        );
      })}
    </>
  );
};

/** Полоса полномочий: с неё экран и читается — веду я или смотрю. */
const PowersStrip = ({ on, who, onReturn }: { on: boolean; who: string; onReturn: () => void }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
    <span className="flex items-center gap-2 text-[13px] text-neutral-600">
      <ArrowRightLeft size={14} className="shrink-0 text-neutral-400" />
      {on ? 'Полномочия переданы вам в 14:20 · передал Оспанов Т., главный судья' : 'Полномочия у главного судьи · Оспанов Т.'}
    </span>
    <span className="flex shrink-0 items-center gap-2.5">
      <Pl t={on ? `ВЕДЁТ ${who}` : 'ПРОСМОТР'} cls={on ? 'live' : 'done'} />
      {on && (
        <Button size="sm" variant="outline" onPress={onReturn}>
          <Undo2 size={13} /> Вернуть полномочия
        </Button>
      )}
    </span>
  </div>
);

const ActsPanel = ({ acts, onAct }: { acts: DelegAct[]; onAct: (log: string) => void }) => (
  <Panel title="Ход турнира">
    <div className="flex flex-wrap gap-2">
      {acts.map((a) => (
        <Button key={a.t} size="sm" variant="outline" onPress={() => onAct(a.log)}>
          {a.ic}
          {a.t}
        </Button>
      ))}
    </div>
  </Panel>
);

const LogPanel = ({ log, author }: { log: { t: string; at: string }[]; author: string }) =>
  log.length > 0 ? (
    <Panel title="Журнал" extra={<Pl t={`${log.length} ЗАПИС.`} cls="reg" />} flush>
      <div className="divide-y divide-neutral-100">
        {log.map((l) => (
          <Row key={l.at + l.t} nm={l.t} sub={`${l.at} · ${author}`} />
        ))}
      </div>
    </Panel>
  ) : null;

/** Ход турнира того, кому переданы полномочия главного судьи. Один экран на
    заместителя (Э8.2) и главного секретаря (Э7.6): у них отличаются оболочка,
    подпись автора в журнале и набор действий. */
export function DelegatedLive({
  role,
  author,
  who,
  acts = DELEG_ACTS,
  phone,
}: {
  role: RoleUI;
  /** Подпись автора в журнале: «Ким Л., главный секретарь». */
  author: string;
  /** Кто ведёт — в значке полосы: «ЗАМЕСТИТЕЛЬ», «СЕКРЕТАРЬ». */
  who: string;
  acts?: DelegAct[];
  phone?: boolean;
}) {
  const [on, setOn] = useState(true);
  const [log, setLog] = useState<{ t: string; at: string }[]>([]);
  const add = (t: string) =>
    setLog((l) => [{ t, at: `14:${String(22 + l.length * 3).padStart(2, '0')}` }, ...l].slice(0, 6));
  const body = (
    <>
      <PowersStrip on={on} who={who} onReturn={() => setOn(false)} />
      {on && <ActsPanel acts={acts} onAct={add} />}
    </>
  );
  if (phone) {
    return (
      <PhoneRoleApp role={role} nav="Ход турнира" title="Ход турнира" sub="12 столов в игре · 8 пар ждут стола">
        {body}
        <Panel title="Идут сейчас" extra={<Pl t="12 СТОЛОВ В ИГРЕ" cls="live" />}>
          <LiveCards />
        </Panel>
        <QueuePanel />
        <PageTabs
          items={[
            { t: 'Столы', view: <div className="[&>div]:grid-cols-2"><TableMap /></div> },
            { t: 'Сетка', view: <BracketListTab /> },
          ]}
        />
        <LogPanel log={log} author={author} />
      </PhoneRoleApp>
    );
  }
  return (
    <WebApp
      role={role}
      nav="Ход турнира"
      title="Ход турнира"
      aside={
        <>
          <Panel title="Идут сейчас" extra={<Pl t="12 СТОЛОВ В ИГРЕ" cls="live" />}>
            <LiveCards />
          </Panel>
          <QueuePanel />
        </>
      }
    >
      {body}
      <PageTabs
        items={[
          { t: 'Столы', view: <TableMap /> },
          { t: 'Сетка', view: <BracketTab /> },
        ]}
      />
      <LogPanel log={log} author={author} />
    </WebApp>
  );
}

/** Состояния хода турнира по передаче — одни у заместителя и у секретаря. */
export const DelegatedStates = ({ other }: { other: { gen: string; nm: string } }) => (
  <States>
    <Shot tone="info" title="Полномочия у главного судьи" text="Только просмотр: кнопок действий нет вовсе.">
      <Frag>
        <Rows>
          <Row av={CHIEF} nm="Оспанов Талғат · главный судья" sub="ведёт с 09:00" pill={{ t: 'ВЕДЁТ', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>
    <Shot tone="info" title={`Полномочия у ${other.gen}`} text="Только просмотр; в полосе видно, у кого они.">
      <Frag>
        <Rows>
          <Row nm="Оспанов Талғат · главный судья" sub="передал в 14:20 · смотрит" pill={{ t: 'ПРОСМОТР', cls: 'done' }} />
          <Row nm={other.nm} sub="ведёт с 14:20" pill={{ t: 'ВЕДЁТ', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>
    <Shot tone="warning" title="Полномочия вернули" text="Уведомление, экран снова на просмотр.">
      <Frag>
        <Rows>
          <Row nm="Полномочия вернулись главному судье" sub="16:05 · Оспанов Т." pill={{ t: 'ПРОСМОТР', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Состояния Э8.1 ─────────────────────────────────────────────── */

const Shift8_1States = () => (
  <States>
    {/* Счастливый путь: главный судья передал полномочия — отсюда переход на
        ход турнира. */}
    <Shot tone="success" title="Полномочия переданы вам" text="Пришло уведомление; ход турнира открыт." wide>
      <Frag>
        <Rows>
          <Row
            av={DEP}
            nm="Сагинтаев Дархан — это вы"
            sub="передал Оспанов Т., главный судья · 14:20"
            pill={{ t: 'ВЕДЁТЕ', cls: 'live' }}
          />
        </Rows>
        <ActionBar>
          <PrimaryAction to="Э8.2">К ходу турнира</PrimaryAction>
          <QuietAction>
            <Undo2 size={13} /> Вернуть полномочия
          </QuietAction>
        </ActionBar>
      </Frag>
    </Shot>
    <Shot tone="info" title="Полномочия у главного секретаря" text="На чтение; в панели видно, у кого они.">
      <Frag>
        <PowersPanel holder="sec" />
      </Frag>
    </Shot>
    <Shot tone="warning" title="Полномочия вернули" text="Снова на чтение, уведомление о возврате.">
      <Frag>
        <Rows>
          <Row nm="Главный судья вернул полномочия" sub="16:05 · Оспанов Т." pill={{ t: 'ПРОСМОТР', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд роли ──────────────────────────────────────────────────── */

const DEP_AUTHOR = 'Сагинтаев Д., заместитель главного судьи';

export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э0.7': {
    cap: 'Регистрация судьи',
    view: () => (
      <>
        <SignUpJudge0_7 />
        <SignUpJudge0_7States />
      </>
    ),
    alt: () => <SignUpJudgePhone0_7 />,
    next: 'вход под своей ролью',
  },
  'Э8.1': {
    cap: 'Мой турнир — режим замещения',
    view: () => (
      <>
        <Shift8_1 />
        <Shift8_1States />
      </>
    ),
    alt: () => <Shift8_1Phone />,
    next: 'полномочия переданы',
  },
  'Э8.2': {
    cap: 'Ход турнира — когда замещает',
    view: () => (
      <>
        <DelegatedLive role={R08} author={DEP_AUTHOR} who="ЗАМЕСТИТЕЛЬ" acts={DEP_ACTS} />
        <DelegatedStates other={{ gen: 'главного секретаря', nm: 'Ким Лаура · главный секретарь' }} />
      </>
    ),
    alt: () => <DelegatedLive role={R08} author={DEP_AUTHOR} who="ЗАМЕСТИТЕЛЬ" acts={DEP_ACTS} phone />,
    next: 'ветка роли',
  },
};

export function Role08Board() {
  return <Board role={R08} screens={SCREENS} />;
}
