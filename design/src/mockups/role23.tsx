/* Роль 23 · Руководитель клуба / спортшколы — макеты по флоу. Источник —
   `flows/23-rukovoditel-kluba.md`.

   Роль заведена решением владельца продукта 16.11.2026 по документу Тимура
   «Роли и права доступа — ЕЛНТ»: владелец организации с несколькими
   командами (у академии в документе их четыре, в разных лигах).

   Что макеты обязаны передать:
   1. руководитель — над администратором клуба: организация, команды и доступ
      сотрудникам, а не составы на туры;
   2. доступ выдаётся каждому человеку отдельно — общего пароля команды нет;
   3. удалить команду с принятой заявкой нельзя, передать — только заявкой и
      только вне сезона. */

import type { ReactNode } from 'react';
import { Send, UserPlus } from 'lucide-react';
import { Button } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  ActionBar,
  DataTable,
  FormGrid,
  KV,
  Panel,
  PickField,
  Pill,
  Row,
  Rows,
  ScreenScope,
  StatTiles,
  TextInput,
  WebApp,
} from '@/shared/kit/app';
import { R23 } from './roles';
import { Board, States, Shot, type ScreenMap } from './shell';
import { Login0_1, LoginPhone0_1 } from './role00';

const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

type Team = { nm: string; league: string; app: 'допущена' | 'подана' | 'черновик' | 'архив'; coach: string; n: number };

const TEAMS: Team[] = [
  { nm: 'Номад-1', league: 'Суперлига · мужчины', app: 'допущена', coach: 'Сапарова А.', n: 6 },
  { nm: 'Номад-2', league: '3 лига · мужчины', app: 'допущена', coach: 'Сапарова А.', n: 5 },
  { nm: 'Номад-юниор', league: '5 лига · мужчины', app: 'подана', coach: 'Ким В.', n: 5 },
  { nm: 'Номад-W', league: 'Суперлига · женщины', app: 'черновик', coach: '—', n: 4 },
];

const APP: Record<Team['app'], 'success' | 'warning' | 'accent' | 'default'> = {
  допущена: 'success',
  подана: 'warning',
  черновик: 'accent',
  архив: 'default',
};

/* ── Э23.1 · Моя организация ─────────────────────────────────────── */

export const Org23_1 = () => (
  <WebApp role={R23} nav="Организация" title="Академия «Номад»" sub="Сезон 2026/27">
    <StatTiles
      items={[
        { v: '4', k: 'Команд · допущено 2' },
        { v: '23', k: 'Спортсменов' },
        { v: '19', k: 'Взнос оплачен', tone: 'a' },
        { v: '3', k: 'Сотрудников' },
      ]}
    />
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Очередь" flush>
          <Rows>
            <Row nm="Номад-W — заявка на сезон не подана" sub="приём до 01.12" pill={{ t: 'ДО 01.12', cls: 'wait' }} to="Э23.3" />
            <Row nm="Ким В. — приглашение не принято" sub="отправлено 12.11" pill={{ t: 'ЖДЁТ', cls: 'wait' }} to="Э23.2" />
          </Rows>
        </Panel>
        <Panel title="Команды" flush>
          <DataTable
            cols={['Команда', 'Лига', 'Заявка', 'Тренер']}
            grid="1.4fr 1.6fr 1fr 1.2fr"
            rows={TEAMS.map((t) => ({
              key: t.nm,
              to: 'Э23.3',
              cells: [t.nm, t.league, <Pill key="a" t={t.app} color={APP[t.app]} />, t.coach],
            }))}
          />
        </Panel>
      </div>
      <Panel title="Организация">
        <KV
          items={[
            ['Тип', 'Спортшкола'],
            ['Город', 'Алматы'],
            ['№ в реестре', 'ОРГ-0142'],
            ['Руководитель', 'Ермеков С.'],
            ['Телефон', '+7 701 *** 41 18'],
          ]}
        />
      </Panel>
    </div>
  </WebApp>
);

const Org23_1States = () => (
  <States>
    <Shot tone="warning" title="Организация не зарегистрирована" text="Одна форма регистрации.">
      <Frag>
        <FormGrid>
          <PickField label="Тип" value="Клуб / спортшкола" />
          <TextInput label="Название" placeholder="Академия «Номад»" />
          <PickField label="Город" value="Алматы" />
          <TextInput label="БИН" placeholder="12 цифр" />
        </FormGrid>
        <div className="mt-3 flex justify-end">
          <Button variant="primary">Зарегистрировать организацию</Button>
        </div>
      </Frag>
    </Shot>
    <Shot tone="info" title="Команд ещё нет" text="Пустое состояние с «Завести команду».">
      <Frag w={420}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-neutral-500">Команд нет</span>
          <Button size="sm" variant="outline">Завести команду</Button>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э23.2 · Сотрудники и доступ ─────────────────────────────────── */

const STAFF = [
  { av: A(45), nm: 'Досжан М.', role: 'Администратор клуба', teams: 'все', ok: true, by: 'Ермеков С. · 02.09' },
  { av: AW(33), nm: 'Сапарова А.', role: 'Главный тренер клуба', teams: 'все', ok: true, by: 'Ермеков С. · 02.09' },
  { av: A(61), nm: 'Ким В.', role: 'Тренер клуба', teams: 'Номад-юниор', ok: false, by: 'Ермеков С. · 12.11' },
];

export const Staff23_2 = () => (
  <WebApp
    role={R23}
    nav="Сотрудники"
    title="Сотрудники и доступ"
    actions={
      <Button variant="primary">
        <UserPlus size={14} /> Выдать доступ
      </Button>
    }
  >
    <Panel flush>
      <DataTable
        cols={['Сотрудник', 'Роль', 'Команды', 'Вход', 'Выдал']}
        grid="1.5fr 1.5fr 1.1fr 0.8fr 1.3fr"
        rows={STAFF.map((s) => ({
          key: s.nm,
          cells: [
            s.nm,
            s.role,
            s.teams,
            <Pill key="v" t={s.ok ? 'принят' : 'приглашён'} color={s.ok ? 'success' : 'warning'} />,
            s.by,
          ],
        }))}
      />
    </Panel>
  </WebApp>
);

const Staff23_2States = () => (
  <States>
    <Shot tone="warning" title="Тренер без подтверждённого документа" text="Доступ ждёт подтверждения роли тренера федерацией.">
      <Frag>
        <Rows>
          <Row nm="Ким В." sub="Тренер клуба · Номад-юниор" pill={{ t: 'ЖДЁТ ФЕДЕРАЦИЮ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э23.3 · Команды организации ─────────────────────────────────── */

export const Teams23_3 = () => (
  <WebApp role={R23} nav="Команды" title="Команды" sub="Приём заявок сезона — до 01.12" actions={<Button variant="primary">Завести команду</Button>}>
    <Panel flush>
      <DataTable
        cols={['Команда', 'Лига', 'Заявка', 'Тренер', 'Состав']}
        grid="1.3fr 1.6fr 1fr 1.2fr 0.7fr"
        rows={TEAMS.map((t) => ({
          key: t.nm,
          cells: [t.nm, t.league, <Pill key="a" t={t.app} color={APP[t.app]} />, t.coach, String(t.n)],
        }))}
      />
    </Panel>
    <ActionBar>
      <Button variant="outline">В архив</Button>
      <Button variant="outline" data-to="Э23.4">
        <Send size={14} /> Передать команду
      </Button>
      <Button variant="primary">Подать заявку команды</Button>
    </ActionBar>
  </WebApp>
);

const Teams23_3States = () => (
  <States>
    <Shot tone="warning" title="Сезон идёт" text="«Передать» и «В архив» недоступны до конца сезона.">
      <Frag>
        <div className="flex justify-end gap-2">
          <Button variant="outline" isDisabled>В архив</Button>
          <Button variant="outline" isDisabled>Передать команду</Button>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э23.4 · Передача команды ────────────────────────────────────── */

export const Transfer23_4 = () => (
  <WebApp role={R23} nav="Команды" title="Передача команды" back={{ label: 'Команды', to: 'Э23.3' }}>
    <Panel title="Команда">
      <KV items={[['Команда', 'Номад-2'], ['Лига', '3 лига · мужчины'], ['Состав на сезон', '5 спортсменов']]} />
    </Panel>
    <Panel title="Кому">
      <FormGrid>
        <PickField label="Организация" value="Клуб «Алатау», Алматы" wide />
        <TextInput label="Причина" placeholder="Причина передачи" wide />
      </FormGrid>
    </Panel>
    <ActionBar>
      <Button variant="primary">
        <Send size={14} /> Отправить на подтверждение
      </Button>
    </ActionBar>
  </WebApp>
);

const Transfer23_4States = () => (
  <States>
    <Shot tone="warning" title="Ждёт подтверждения" text="У обеих сторон.">
      <Frag>
        <Rows>
          <Row nm="Номад-2 → Клуб «Алатау»" sub="подана 14.11" pill={{ t: 'ЖДЁТ ФЕДЕРАЦИЮ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
    <Shot tone="success" title="Принята" text="Команда у получателя, запись в журнал действий.">
      <Frag>
        <Rows>
          <Row nm="Номад-2 → Клуб «Алатау»" sub="подтверждена 16.11" pill={{ t: 'ПЕРЕДАНА', cls: 'done' }} />
        </Rows>
      </Frag>
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
  'Э23.1': {
    cap: 'Моя организация',
    view: () => (
      <>
        <Org23_1 />
        <Org23_1States />
      </>
    ),
    next: 'пункт меню «Сотрудники»',
  },
  'Э23.2': {
    cap: 'Сотрудники и доступ',
    view: () => (
      <>
        <Staff23_2 />
        <Staff23_2States />
      </>
    ),
    next: 'пункт меню «Команды»',
  },
  'Э23.3': {
    cap: 'Команды организации',
    view: () => (
      <>
        <Teams23_3 />
        <Teams23_3States />
      </>
    ),
    next: '«Передать команду»',
  },
  'Э23.4': {
    cap: 'Передача команды',
    view: () => (
      <>
        <Transfer23_4 />
        <Transfer23_4States />
      </>
    ),
  },
};

export function Role23Board() {
  return <Board role={R23} screens={SCREENS} />;
}
