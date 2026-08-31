/* Предложение 3 — роль «Региональная/областная федерация» ✳ (31.08.2026).

   Федерация просит роль, которая вносит и обновляет статистику своего региона —
   инфраструктура, отделения настольного тенниса, сколько спортсменов, тренеров и
   судей по категориям, — а система собирает из этого сводку по стране и
   показывает дашборд.

   Два экрана, потому что действия два и они у разных людей: **регион вносит**
   свои цифры (и отвечает за их свежесть), **федерация смотрит** сводку по всем.
   Один экран на оба не годится: у вносящего это форма с полями и датой
   актуализации, у смотрящего — сравнение регионов, где поля не нужны вовсе.

   ⚠ Открытый вопрос, который придётся задать федерации: как эта роль относится
   к уже заведённым — старший тренер региона (12) и председатель судейской
   коллегии региона (15). Это третья организация со своим кабинетом или права
   добавляются кому-то из них? От ответа зависит, заводим мы роль или раздел. */

import { useState } from 'react';
import { Building2, ChartPie, MapPin, Save, Users } from 'lucide-react';
import { Button } from '@heroui/react';
import {
  A, AW, Bar, Bars, ChartRow, Donut, Facts, FilterBar, FilterSeg, FormGrid, Panel, PhoneRoleApp,
  Pill, Row, Rows, SearchInput, Sheet, StatTiles, TextInput, WebApp,
  type RoleUI,
} from '../kit/hero/app';
import type { ScreenMap } from '../mockups/shell';

/* Роль региона: свой кабинет, свой регион в шапке. */
const RREG: RoleUI = {
  num: '17',
  title: 'Региональная федерация',
  person: { nm: 'Жумабеков Р.', rl: 'Федерация Павлодарской области', av: A(75) },
  brandName: 'Федерация настольного тенниса Павлодарской области',
  brandSub: 'Статистика региона · инфраструктура · кадры',
  badge: false,
  nav: [
    [<MapPin size={16} key="s" />, 'Статистика региона'],
    [<Building2 size={16} key="i" />, 'Инфраструктура'],
    [<Users size={16} key="k" />, 'Кадры региона'],
  ],
};

/* Роль федерации: сводка по всем регионам — это её экран, не региональный. */
const RFED: RoleUI = {
  num: '1',
  title: 'Администратор Федерации',
  person: { nm: 'Абаева Д.', rl: 'Администратор Федерации', av: AW(44) },
  brandName: 'Федерация настольного тенниса РК',
  brandSub: 'Календарь · пользователи · статистика',
  badge: false,
  nav: [
    [<ChartPie size={16} key="s" />, 'Статистика регионов'],
    [<Users size={16} key="u" />, 'Пользователи'],
    [<Building2 size={16} key="o" />, 'Организации'],
  ],
  roles: ['Администратор Федерации', 'Менеджер · только чтение'],
};

/* ── П3.1 · Статистика своего региона ────────────────────────────── */

const JUDGE_CATS = [
  { t: 'Высшая национальная', v: '2' },
  { t: 'Национальная', v: '5' },
  { t: 'Первая категория', v: '11' },
  { t: 'Вторая категория', v: '9' },
  { t: 'Без категории', v: '4' },
];

const COACH_CATS = [
  { t: 'Высшая категория', v: '3' },
  { t: 'Первая категория', v: '7' },
  { t: 'Вторая категория', v: '6' },
  { t: 'Без категории', v: '5' },
];

export const Region3_1 = () => (
  <WebApp
    role={RREG}
    nav="Статистика региона"
    title="Статистика Павлодарской области"
    sub="Данные на 31.08.2026 · вносит региональная федерация"
    hint="Предложение 3: внесение и актуализация статистики по региону — инфраструктура, отделения, спортсмены, тренеры и судьи по категориям."
  >
    <StatTiles
      items={[
        { v: '412', k: 'Спортсменов' },
        { v: '21', k: 'Тренеров' },
        { v: '31', k: 'Судей' },
        { v: '7', k: 'Отделений настольного тенниса' },
        { v: '9', k: 'Залов' },
        { v: '54', k: 'Столов' },
      ]}
    />

    {/* Дата актуализации — не подпись, а состояние ✳: цифры без неё врут молча.
        Сводка по стране складывается из регионов, и один просроченный регион
        портит её целиком, поэтому срок виден и здесь, и в сводке. */}
    <Panel
      title="Актуальность данных"
      extra={<Pill t="ОБНОВЛЕНО СЕГОДНЯ" color="success" />}
    >
      <Facts
        items={[
          { k: 'обновил', v: 'Жумабеков Р.' },
          { k: 'дата', v: '31.08.2026' },
          { k: 'следующее обновление', v: 'до 31.12.2026', hot: true },
        ]}
      />
    </Panel>

    <Panel
      title="Инфраструктура"
      sub="Залы, столы и отделения — то, чем регион располагает"
      extra={
        <Button size="sm" variant="primary">
          <Save size={14} /> Сохранить
        </Button>
      }
    >
      <FormGrid>
        <TextInput label="Спортивных залов" value="9" />
        <TextInput label="Игровых столов" value="54" />
        <TextInput label="Отделений настольного тенниса" value="7" />
        <TextInput label="Спортшкол с отделением" value="4" />
        <TextInput label="Клубов" value="6" />
        <TextInput label="Залов с постоянным доступом" value="5" />
      </FormGrid>
    </Panel>

    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Судьи по квалификационным категориям" flush>
        <Rows>
          {JUDGE_CATS.map((c) => (
            <Row key={c.t} nm={c.t} sub="действующая категория" val={c.v} />
          ))}
        </Rows>
      </Panel>
      <Panel title="Тренеры по категориям" flush>
        <Rows>
          {COACH_CATS.map((c) => (
            <Row key={c.t} nm={c.t} sub="по данным региона" val={c.v} />
          ))}
        </Rows>
      </Panel>
    </div>

    <Bar tone="warning">
      ✳ Наше предположение: часть этих чисел система знает сама — судей с категориями она ведёт в
      реестре (TZ §9.1), спортсменов тоже. Вносить руками стоит только то, чего в системе нет:
      залы, столы, отделения. Иначе регион будет переписывать в форму то, что уже посчитано, и
      два числа разойдутся. Какие поля считать вводимыми, а какие — считаемыми, решает федерация.
    </Bar>
  </WebApp>
);

export const Region3_1Phone = () => (
  <PhoneRoleApp
    role={RREG}
    nav="Статистика региона"
    title="Статистика области"
    sub="Данные на 31.08.2026"
  >
    <Panel title="Инфраструктура" flush>
      <Rows>
        <Row nm="Спортивных залов" sub="вносит регион" val="9" />
        <Row nm="Игровых столов" sub="вносит регион" val="54" />
        <Row nm="Отделений настольного тенниса" sub="вносит регион" val="7" />
      </Rows>
    </Panel>
    <Panel title="Кадры" flush>
      <Rows>
        <Row nm="Спортсменов" sub="из реестра системы" val="412" />
        <Row nm="Тренеров" sub="из реестра системы" val="21" />
        <Row nm="Судей" sub="из реестра системы" val="31" />
      </Rows>
    </Panel>
  </PhoneRoleApp>
);

/* ── П3.2 · Сводка по регионам ───────────────────────────────────── */

type Reg = {
  nm: string;
  players: number;
  coaches: number;
  judges: number;
  halls: number;
  tables: number;
  /** Когда регион последний раз обновлял данные. */
  upd: string;
  stale?: boolean;
};

const REGIONS: Reg[] = [
  { nm: 'Алматы', players: 1240, coaches: 58, judges: 74, halls: 22, tables: 168, upd: '28.08.2026' },
  { nm: 'Астана', players: 980, coaches: 44, judges: 61, halls: 18, tables: 134, upd: '30.08.2026' },
  { nm: 'Шымкент', players: 720, coaches: 33, judges: 40, halls: 14, tables: 96, upd: '19.08.2026' },
  { nm: 'Караганда', players: 610, coaches: 28, judges: 35, halls: 12, tables: 84, upd: '02.06.2026', stale: true },
  { nm: 'Павлодар', players: 412, coaches: 21, judges: 31, halls: 9, tables: 54, upd: '31.08.2026' },
  { nm: 'Тараз', players: 305, coaches: 16, judges: 22, halls: 7, tables: 41, upd: '14.03.2026', stale: true },
];

const REG_GRID = 'minmax(0,1.4fr) 96px 96px 84px 84px 88px 132px';
const REG_SORTS = ['По спортсменам', 'По судьям', 'По столам'];

export function Region3_2() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(REG_SORTS[0]);
  const rows = REGIONS.filter((r) => r.nm.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) =>
    sort === 'По судьям' ? b.judges - a.judges : sort === 'По столам' ? b.tables - a.tables : b.players - a.players,
  );
  return (
    <WebApp
      role={RFED}
      nav="Статистика регионов"
      title="Статистика по регионам"
      sub="Сводка складывается из данных, которые вносят региональные федерации"
      hint="Предложение 3: автоматическая сводная статистика по регионам и аналитическая панель по этим показателям."
    >
      <StatTiles
        items={[
          { v: '4 267', k: 'Спортсменов в стране' },
          { v: '200', k: 'Тренеров' },
          { v: '263', k: 'Судей' },
          { v: '82', k: 'Залов' },
          { v: '577', k: 'Столов' },
          { v: '2', k: 'Регионов не обновляли данные', tone: 'a' },
        ]}
      />

      <ChartRow>
        <Panel title="Где сосредоточены спортсмены" sub="Доли регионов в общем числе">
          <Donut
            label="Спортсмены по регионам"
            total="4 267"
            totalNote="спортсменов"
            parts={[
              { t: 'Алматы', v: 1240 },
              { t: 'Астана', v: 980 },
              { t: 'Шымкент', v: 720 },
              { t: 'Остальные регионы', v: 1327 },
            ]}
          />
        </Panel>
        <Panel title="Судьи по регионам" sub="Столбик — регион; свой выделен">
          <Bars
            label="Число судей по регионам"
            suffix="судей в регионе"
            items={REGIONS.map((r) => ({ t: r.nm, v: r.judges, on: r.nm === 'Павлодар' }))}
          />
        </Panel>
      </ChartRow>

      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Регион" className="w-64" />
        <FilterSeg items={REG_SORTS} active={sort} onPick={setSort} />
      </FilterBar>

      <Panel title={`Регионы · ${rows.length}`} sub="Строка ведёт в карточку региона" flush>
        <Sheet
          flush
          grid={REG_GRID}
          cols={['Регион', 'Спортсмены', 'Тренеры', 'Судьи', 'Залы', 'Столы', 'Данные на']}
        >
          {rows.map((r) => (
            <div
              key={r.nm}
              data-row
              className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] tabular-nums"
              style={{ gridTemplateColumns: REG_GRID }}
            >
              <span className="truncate font-medium">{r.nm}</span>
              <span className="text-right">{r.players}</span>
              <span className="text-right">{r.coaches}</span>
              <span className="text-right">{r.judges}</span>
              <span className="text-right">{r.halls}</span>
              <span className="text-right">{r.tables}</span>
              <span>
                <Pill t={r.upd} color={r.stale ? 'warning' : 'default'} />
              </span>
            </div>
          ))}
        </Sheet>
      </Panel>

      <Bar tone="warning">
        Сводка честна ровно настолько, насколько свежи данные регионов. Поэтому дата обновления
        стоит колонкой в самой таблице, а не прячется в карточке: два региона здесь не обновлялись с
        весны, и их числа в общую сумму входят как есть. ⚠ Как часто регион обязан обновлять данные
        и что делать с просроченными — федерация не сказала.
      </Bar>
    </WebApp>
  );
}

export const REGION_SCREENS: ScreenMap = {
  'П3.1': {
    cap: 'Статистика своего региона — вносит регион',
    view: () => <Region3_1 />,
    alt: () => <Region3_1Phone />,
  },
  'П3.2': {
    cap: 'Сводка по регионам — смотрит федерация',
    view: () => <Region3_2 />,
  },
};
