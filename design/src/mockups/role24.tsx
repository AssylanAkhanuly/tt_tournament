/* Роль 24 · Тренер клуба / главный тренер клуба — макеты по флоу. Источник —
   `flows/24-trener-kluba.md`.

   Роль заведена решением владельца продукта 16.11.2026 по документу Тимура
   «Роли и права доступа — ЕЛНТ» и отменяет решение 17.08.2026 «клубного
   тренера как роли нет».

   Что макеты обязаны передать:
   1. тренер собирает состав, но не подаёт его: главная кнопка — «Передать на
      подачу», а не «Подать»;
   2. взнос и медицинский допуск видны в строке игрока — без них состав не
      уйдёт;
   3. второй формат — телефон ✳: в зале тренер смотрит карточку игрока с него. */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  ActionBar,
  DataTable,
  KV,
  Panel,
  PhoneRoleApp,
  Pill,
  Row,
  Rows,
  StatTiles,
  WebApp,
} from '@/shared/kit/app';
import { R24 } from './roles';
import { Board, States, Shot, type ScreenMap } from './shell';
import { Login0_1, LoginPhone0_1 } from './role00';

/* ── Э24.1 · Мои команды ─────────────────────────────────────────── */

const TEAMS = [
  { nm: 'Номад-1', league: 'Суперлига · мужчины', tour: '2 тур · Шымкент, 05–07.12', till: 'до 28.11', st: 'черновик тренера' },
  { nm: 'Номад-2', league: '3 лига · мужчины', tour: '2 тур · Караганда, 12–14.12', till: 'до 05.12', st: 'не начат' },
];

export const Teams24_1 = () => (
  <WebApp role={R24} nav="Мои команды" title="Мои команды">
    <Panel flush>
      <DataTable
        cols={['Команда', 'Лига', 'Ближайший тур', 'Окно состава', 'Состав']}
        grid="1.1fr 1.5fr 1.8fr 1fr 1.3fr"
        rows={TEAMS.map((t) => ({
          key: t.nm,
          to: 'Э24.2',
          cells: [
            t.nm,
            t.league,
            t.tour,
            t.till,
            <Pill key="s" t={t.st} color={t.st === 'не начат' ? 'default' : 'accent'} />,
          ],
        }))}
      />
    </Panel>
  </WebApp>
);

const Teams24_1Phone = () => (
  <PhoneRoleApp role={R24} nav="Мои команды" title="Мои команды">
    <Panel flush>
      <Rows>
        {TEAMS.map((t) => (
          <Row key={t.nm} nm={t.nm} sub={`${t.tour} · состав ${t.till}`} pill={{ t: t.st.toUpperCase(), cls: 'reg' }} to="Э24.2" />
        ))}
      </Rows>
    </Panel>
  </PhoneRoleApp>
);

const Teams24_1States = () => (
  <States>
    <Shot tone="info" title="Нет ни одной команды" text="Руководитель организации ещё не дал доступ к командам.">
      <Panel>
        <div className="text-sm text-neutral-500">Команд нет</div>
      </Panel>
    </Shot>
  </States>
);

/* ── Э24.2 · Состав на тур ───────────────────────────────────────── */

type P = { av: string; nm: string; y: string; r: string; fee: boolean; med: boolean };
const PLAYERS: P[] = [
  { av: A(14), nm: 'Абдрахманов Е.', y: '2004', r: '61.20', fee: true, med: true },
  { av: A(27), nm: 'Жунусов Т.', y: '2006', r: '55.85', fee: true, med: true },
  { av: A(33), nm: 'Ли Д.', y: '2001', r: '54.10', fee: false, med: true },
  { av: A(40), nm: 'Серикбаев А.', y: '2007', r: '49.30', fee: true, med: false },
  { av: A(48), nm: 'Оспанов Р.', y: '2005', r: '47.75', fee: true, med: true },
  { av: A(56), nm: 'Тулегенов Н.', y: '2008', r: '41.00', fee: true, med: true },
];

function Squad24_2Body() {
  const [on, setOn] = useState<string[]>(['Абдрахманов Е.', 'Жунусов Т.', 'Оспанов Р.']);
  const flip = (nm: string) => setOn((x) => (x.includes(nm) ? x.filter((n) => n !== nm) : [...x, nm]));
  return (
    <>
      <StatTiles
        items={[
          { v: `${on.length} из 4`, k: 'Отмечено' },
          { v: '28.11', k: 'Окно состава', tone: 'a' },
          { v: '1', k: 'Без взноса', tone: 'b' },
        ]}
      />
      <Panel flush>
        <DataTable
          cols={['', 'Спортсмен', 'Рейтинг', 'Взнос', 'Допуск']}
          grid="0.4fr 2fr 0.8fr 1fr 1fr"
          rows={PLAYERS.map((p) => ({
            key: p.nm,
            on: on.includes(p.nm),
            cells: [
              <input
                key="c"
                type="checkbox"
                checked={on.includes(p.nm)}
                onChange={() => flip(p.nm)}
                aria-label={p.nm}
                className="size-4 accent-blue-600"
              />,
              <span key="n" data-to="Э24.3">{`${p.nm} · ${p.y}`}</span>,
              p.r,
              <Pill key="f" t={p.fee ? 'оплачен' : 'не оплачен'} color={p.fee ? 'success' : 'danger'} />,
              <Pill key="m" t={p.med ? 'есть' : 'нет'} color={p.med ? 'success' : 'warning'} />,
            ],
          }))}
        />
      </Panel>
      <ActionBar>
        <Button variant="primary" isDisabled={on.length < 4}>
          <Send size={14} /> Передать на подачу
        </Button>
      </ActionBar>
    </>
  );
}

export const Squad24_2 = () => (
  <WebApp role={R24} nav="Мои команды" title="Номад-1 · состав на 2 тур" back={{ label: 'Мои команды', to: 'Э24.1' }}>
    <Squad24_2Body />
  </WebApp>
);

const Squad24_2States = () => (
  <States>
    <Shot tone="warning" title="Передан на подачу" text="На чтение, пока администратор не вернёт.">
      <Rows>
        <Row nm="Состав на 2 тур · 4 спортсмена" sub="передан Досжану М. · 20.11" pill={{ t: 'ПЕРЕДАН', cls: 'wait' }} />
      </Rows>
    </Shot>
    <Shot tone="danger" title="Возвращён" text="С комментарием администратора.">
      <Rows>
        <Row nm="Состав на 2 тур" sub="«Ли Д. без взноса — замените»" pill={{ t: 'ВОЗВРАЩЁН', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э24.3 · Карточка игрока ─────────────────────────────────────── */

const Card = () => (
  <>
    <Panel title="Абдрахманов Ерлан">
      <KV
        items={[
          ['Год рождения', '2004'],
          ['Разряд', 'МС'],
          ['Рейтинг', '61.20 · +3.40 за сезон'],
          ['Взнос', <Pill key="f" t="оплачен" color="success" />],
          ['Медицинский допуск', <Pill key="m" t="есть" color="success" />],
        ]}
      />
    </Panel>
    <Panel title="Последние результаты" flush>
      <Rows>
        <Row nm="1 тур · Номад-1 — Алатау" sub="против Каримова Д." val="3:1" />
        <Row nm="1 тур · Номад-1 — Шахтёр" sub="против Петрова И." val="2:3" />
      </Rows>
    </Panel>
  </>
);

export const Player24_3 = () => (
  <WebApp
    role={R24}
    nav="Мои команды"
    title="Карточка игрока"
    back={{ label: 'Состав на тур', to: 'Э24.2' }}
    actions={
      <>
        <Button variant="outline" isIconOnly aria-label="Предыдущий">
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline" isIconOnly aria-label="Следующий">
          <ChevronRight size={16} />
        </Button>
      </>
    }
  >
    <Card />
  </WebApp>
);

const Player24_3Phone = () => (
  <PhoneRoleApp role={R24} nav="Мои команды" title="Абдрахманов Е." back={{ label: 'Состав', to: 'Э24.2' }}>
    <Card />
  </PhoneRoleApp>
);

const Player24_3States = () => (
  <States>
    <Shot tone="danger" title="Нет медицинского допуска" text="Помечен, в туре не играет до допуска.">
      <Rows>
        <Row av={AW(5)} nm="Серикбаев А." sub="2007" pill={{ t: 'НЕТ ДОПУСКА', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Карта экранов ───────────────────────────────────────────────── */

export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э24.1': {
    cap: 'Мои команды',
    view: () => (
      <>
        <Teams24_1 />
        <Teams24_1States />
      </>
    ),
    alt: () => <Teams24_1Phone />,
    next: 'строка команды',
  },
  'Э24.2': {
    cap: 'Состав на тур',
    view: () => (
      <>
        <Squad24_2 />
        <Squad24_2States />
      </>
    ),
    next: 'строка спортсмена',
  },
  'Э24.3': {
    cap: 'Карточка игрока',
    view: () => (
      <>
        <Player24_3 />
        <Player24_3States />
      </>
    ),
    alt: () => <Player24_3Phone />,
  },
};

export function Role24Board() {
  return <Board role={R24} screens={SCREENS} />;
}
