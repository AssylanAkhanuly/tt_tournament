/* Роль 13 · Администратор клуба — макеты по флоу.
   Экраны Э13.1–Э13.3 (см. `flows/13-admin-kluba.md` и схему роли).

   «Клубные соревнования» из документа федерации читаем как заявку в Евразийскую
   лигу: командное соревнование в четыре тура с дивизионами, где заявляет клуб, а
   игрок сам не заявляется (TZ §4.1, §4.10). */

import type { ReactNode } from 'react';
import { ShieldCheck, TriangleAlert, UserPlus } from 'lucide-react';
import {
  ActionBar, Board, Chips, Hint, Panel, Row, Rows, RoleScreen, Screen, Arrow, Submit,
  Form, Field, A, AW,
} from './shell';
import { FormSeg } from '../segs';
import { R13 } from './roles';

/** Подсказка со значком: значок не должен рвать строку (svg у нас display: block). */
const IconHint = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <Hint>
    <span style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
      <span style={{ flex: 'none', marginTop: 1 }}>{icon}</span>
      <span>{children}</span>
    </span>
  </Hint>
);

/* Три списка состава клуба «Алатау» (г. Алматы). */
const ATHLETES = [
  { av: A(32), nm: 'Абдрахманов Данияр', sub: '2004 г.р. · МС · рейтинг 2456', pill: { t: 'ВЗНОС ОПЛАЧЕН', cls: 'live' as const } },
  { av: A(51), nm: 'Байжанов Ерасыл', sub: '2011 г.р. · 1 разряд · 1786', pill: { t: 'ВЗНОС ОПЛАЧЕН', cls: 'live' as const } },
  { av: AW(35), nm: 'Жақсылық Аружан', sub: '2012 г.р. · 2 разряд · 1654', pill: { t: 'НЕТ ВЗНОСА', cls: 'wait' as const } },
];

const COACHES = [
  { av: A(56), nm: 'Гладун Игорь', sub: 'подопечных: 12' },
  { av: AW(21), nm: 'Тлеуова Аружан', sub: 'подопечных: 9' },
  { av: A(60), nm: 'Сериков Нурлан', sub: 'подопечных: 7' },
];

const OTHERS = [
  { av: A(45), nm: 'Досжан Мади', sub: 'администратор клуба' },
  { av: AW(44), nm: 'Абаева Дина', sub: 'методист' },
  { av: A(75), nm: 'Ерлан Бекзат', sub: 'механик-настройщик инвентаря' },
];

/* Э13.1 — карточка клуба и три списка состава. */
export function Club13_1() {
  return (
    <RoleScreen
      role={R13}
      nav="Мой клуб"
      title="Клуб «Алатау»"
      sub="г. Алматы · клуб · в реестре организаций ФНТ РК"
      hint="Пока клуб не зарегистрирован, остальные экраны роли закрыты."
    >
      <Chips
        items={[
          { v: '48', k: 'Людей в клубе' },
          { v: '2', k: 'Команды в Лиге', tone: 'b' },
          { v: '21–23.03', k: 'Ближайший тур · Астана' },
          { v: '1', k: 'Состав на тур не подтверждён', tone: 'a' },
        ]}
      />

      <Panel
        title="Карточка клуба"
        extra={<span className="pill live" style={{ margin: 0 }}>В РЕЕСТРЕ ОРГАНИЗАЦИЙ</span>}
      >
        <Form>
          <Field label="Город" value="г. Алматы" />
          <Field label="Тип организации" value="Клуб (не спортшкола)" />
          <Field label="Администратор" value="Досжан Мади · с 12.11.2019" />
          <Field label="Зарегистрирован" value="12.11.2019 · запись в реестре № 41" />
        </Form>
      </Panel>

      <ActionBar count="Состав клуба: 38 спортсменов · 6 тренеров · 4 иных лица">
        <button className="dpickbtn">
          <UserPlus size={14} /> Завести человека
        </button>
      </ActionBar>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'start' }}>
        <Panel title="Спортсмены · 38">
          <Rows>
            {ATHLETES.map((a) => (
              <Row key={a.nm} av={a.av} nm={a.nm} sub={a.sub} pill={a.pill} />
            ))}
          </Rows>
        </Panel>
        <Panel title="Тренеры · 6">
          <Rows>
            {COACHES.map((c) => (
              <Row key={c.nm} av={c.av} nm={c.nm} sub={c.sub} />
            ))}
          </Rows>
        </Panel>
        <Panel title="Иные лица · 4">
          <Rows>
            {OTHERS.map((o) => (
              <Row key={o.nm} av={o.av} nm={o.nm} sub={o.sub} />
            ))}
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* Э13.2 — форма заведения человека; привязка к клубу автоматическая. */
export function Person13_2() {
  return (
    <RoleScreen
      role={R13}
      nav="Люди клуба"
      title="Завести человека"
      sub="Клуб «Алатау» · привязка к клубу проставляется автоматически"
      hint="Заведённый человек виден в реестрах федерации с источником записи — клубом."
    >
      <div className="mkcols">
        <Panel
          title="Карточка спортсмена"
          extra={<FormSeg items={['Спортсмен', 'Тренер', 'Иное лицо']} />}
        >
          <Form>
            <Field label="Фамилия" value="Нұрланұлы" />
            <Field label="Имя" value="Алихан" />
            <Field label="Дата рождения" value="14.05.2011" />
            <Field label="Пол" value="Мужской" />
            <Field label="Разряд" value="2 разряд" />
            <Field label="Клуб" value="«Алатау» · подставлен автоматически" />
            <Field label="Город" value="г. Алматы · из клуба" wide />
          </Form>
          <div style={{ marginTop: 12 }}>
            <Submit>Завести</Submit>
          </div>
        </Panel>

        <Panel title="Что произойдёт после «Завести»">
          <Rows>
            <Row
              nm="Человек привязан к клубу"
              sub="появляется в списке состава на экране «Мой клуб»"
              pill={{ t: 'СРАЗУ', cls: 'live' }}
            />
            <Row
              nm="Запись видна в реестрах федерации"
              sub="с источником записи: клуб «Алатау»"
              pill={{ t: 'СРАЗУ', cls: 'live' }}
            />
            <Row
              nm="Годовой взнос"
              sub="выставляется отдельно, отметку ставит экономист федерации"
              pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }}
            />
            <Row
              nm="Состав команды Лиги"
              sub="спортсмена можно заявить в состав команды клуба"
              pill={{ t: 'ПОЗЖЕ', cls: 'reg' }}
            />
          </Rows>
          <IconHint icon={<TriangleAlert size={13} />}>
            Если спортсмен уже зарегистрировался сам или заведён регионом, пути записи сходятся
            неизвестно как и владелец записи не определён (вопрос 12.10) — экран слияния до ответа
            не проектируем.
          </IconHint>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* Э13.3 — Евразийская лига: команды по дивизионам, четыре тура, таблица. */
export function League13_3() {
  return (
    <RoleScreen
      role={R13}
      nav="Команды Лиги"
      title="Евразийская лига · команды клуба"
      sub="Командное соревнование · четыре тура за сезон · заявляет клуб, не игрок"
      hint="Дивизионы: мужские — Суперлига и лиги со 2-й по 6-ю; женские — Суперлига и 2 лига."
    >
      <Panel
        title="Мои команды по дивизионам"
        extra={
          <button className="dpickbtn">
            <ShieldCheck size={14} /> Заявить команду в лигу
          </button>
        }
      >
        <Rows>
          <Row
            av={A(32)}
            nm="«Алатау» · мужская Суперлига"
            sub="состав: 8 спортсменов · капитан Абдрахманов Д."
            val="3-е место"
            pill={{ t: 'ДОПУЩЕНА', cls: 'live' }}
          />
          <Row
            av={AW(41)}
            nm="«Алатау» · женская 2 лига"
            sub="состав: 6 спортсменок · капитан Ахметова Д."
            val="5-е место"
            pill={{ t: 'ДОПУЩЕНА', cls: 'live' }}
          />
          <Row
            av={A(51)}
            nm="«Алатау-2» · мужская 4 лига"
            sub="состав: 6 спортсменов · заявлен 18.12.2025"
            val="—"
            pill={{ t: 'ПОДАНА, ЖДЁТ ДОПУСКА', cls: 'wait' }}
            action="Заявить состав"
          />
        </Rows>
      </Panel>

      <div className="mkcols">
        <Panel
          title="Календарь четырёх туров · «Алатау», мужская Суперлига"
          extra={<span className="dcount">состав подтверждается на каждый тур отдельно</span>}
        >
          <Rows>
            <Row
              nm="1-й тур"
              sub="24–26.01.2026 · г. Алматы"
              val="3 победы из 4"
              pill={{ t: 'СЫГРАН', cls: 'reg' }}
            />
            <Row
              nm="2-й тур"
              sub="21–23.03.2026 · г. Астана"
              val="8 игроков"
              pill={{ t: 'СОСТАВ ПОДТВЕРЖДЁН', cls: 'live' }}
            />
            <Row
              nm="3-й тур"
              sub="16–18.05.2026 · г. Шымкент"
              val="окно до 08.05"
              pill={{ t: 'ОКНО ОТКРЫТО', cls: 'wait' }}
              action="Подтвердить состав"
            />
            <Row
              nm="4-й тур"
              sub="19–21.09.2026 · г. Караганда"
              val="окно с 05.09"
              pill={{ t: 'ОКНО НЕ ОТКРЫТО', cls: 'reg' }}
            />
          </Rows>
          <Hint>
            Состав может меняться от тура к туру; после подтверждения тур переходит в чтение. Пока
            окно не открыто, состав тоже только на чтение — с датой окна.
          </Hint>
        </Panel>

        <Panel
          title="Таблица дивизиона"
          extra={<span className="pill reg" style={{ margin: 0 }}>МУЖСКАЯ СУПЕРЛИГА</span>}
        >
          <Rows>
            <Row nm="1 · «Астана»" sub="г. Астана · 1 тур сыгран" val="6 очков" />
            <Row nm="2 · «Иртыш»" sub="г. Павлодар · 1 тур сыгран" val="5 очков" />
            <Row
              nm="3 · «Алатау»"
              sub="г. Алматы · 1 тур сыгран"
              val="4 очка"
              pill={{ t: 'МОЯ КОМАНДА', cls: 'reg' }}
            />
            <Row nm="4 · «Шахтёр»" sub="г. Караганда · 1 тур сыгран" val="2 очка" />
          </Rows>
          <IconHint icon={<TriangleAlert size={13} />}>
            Таблица копится по всем четырём турам, но схема командной встречи, начисление очков и
            переходы между лигами не получены (вопросы 11.1–11.5) — дальше экраны встречи и
            таблицы не проектируем.
          </IconHint>
        </Panel>
      </div>
    </RoleScreen>
  );
}

export function Role13Board() {
  return (
    <Board role={R13}>
      <Screen code="Э13.1" cap="Мой клуб">
        <Club13_1 />
      </Screen>
      <Arrow lbl="«завести человека»" />
      <Screen code="Э13.2" cap="Регистрация людей">
        <Person13_2 />
      </Screen>
      <Arrow lbl="меню «Команды Лиги»" />
      <Screen code="Э13.3" cap="Команды Лиги">
        <League13_3 />
      </Screen>
    </Board>
  );
}
