/* Роли 3 и 4 · Менеджеры-наблюдатели — макеты по флоу.
   Экраны Э3.1–Э3.3 (см. `flows/03-04-menedzhery-nablyudateli.md` и схему роли).

   Правило, из которого следует весь дизайн роли: **ни одной кнопки, меняющей
   данные**. Экраны — те же, что у администратора Федерации (Э1.1, Э1.2, Э2.1),
   поэтому строки списков берём тем же компонентом; отличие видно по полосе
   действий: остались только фильтр, поиск, выгрузка/печать и подписка.
   Недоступное действие не показывается вовсе — не серой кнопкой, а её
   отсутствием. */

import { Bell, Download, Printer } from 'lucide-react';
import { A, ActionBar, Arrow, AW, Board, Chips, Hint, P, Panel, RoleScreen, Row, Rows, Screen } from './shell';
import type { ScreenMap } from './shell';
import { R0304 } from './roles';
import { Login0_1 } from './role00';
import { Attention, Btn, KPI, TourRow, TodayRows } from './role01';

/* Те же соревнования, что у администратора Федерации (Э1.2) — здесь на чтение. */
type Tour = { nm: string; mt: string; apps: string; judge?: string; st: string; cls: string };

const TOURS: Tour[] = [
  { nm: 'Кубок Республики Казахстан 2026', mt: 'Главный старт · Астана · 18–20 мая', apps: '128 / 96', judge: 'Оспанов Т.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'Первенство РК · 2010 г.р. и моложе', mt: 'Главный старт · Алматы · 3–5 июня', apps: '96 / 71', judge: 'Токаев М.', st: 'ЗАЯВКИ ИГРОКОВ', cls: 'live' },
  { nm: 'Евразийская лига · 2-й тур', mt: 'Лига · Караганда · 14–16 апреля', apps: '12 команд', judge: 'Пак С.', st: 'ИДЁТ', cls: 'live' },
  { nm: 'ОРТ «Кубок Иртыша»', mt: 'ОРТ · Павлодар · 25 апреля', apps: '34 / 34', st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' },
  { nm: 'ОРТ «Шымкент Open»', mt: 'ОРТ · Шымкент · 9 мая', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
];

/* ── Э3.1 · Обзорная панель ────────────────────────────────────── */

export function Dash3_1() {
  return (
    <RoleScreen
      role={R0304}
      nav="Обзор"
      title="Обзорная панель"
      sub="Сезон 2026 · только чтение"
    >
      <Chips items={KPI} to="Э3.2" />
      <div className="dactionbar">
        <Attention act={false} />
        <Btn>
          <Download size={14} /> Выгрузить сводку
        </Btn>
      </div>
      <div className="mkcols">
        <Panel title="Ближайшие старты">
          <Rows>
            {TOURS.map((t) => (
              <TourRow key={t.nm} t={t} />
            ))}
          </Rows>
        </Panel>
        <Panel title="Сегодня идут">
          <TodayRows act={false} />
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э3.2 · Модули в режиме чтения ─────────────────────────────── */

export function Read3_2() {
  return (
    <RoleScreen
      role={R0304}
      nav="Календарь"
      title="Календарь сезона · чтение"
      sub="Календарь сезона · только чтение"
    >
      <Chips
        items={[
          { v: '11', k: 'Модулей на чтение', tone: 'b' },
          { v: '0', k: 'Кнопок, меняющих данные', tone: 'g' },
          { v: 'все', k: 'Категории и состояния видны' },
          { v: '32', k: 'Соревнования сезона' },
        ]}
      />
      <div className="dactionbar">
        <div className="dseg2">
          <span className="on">Все категории</span>
          <span>Главный старт</span>
          <span>Лига</span>
          <span>ОРТ</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>
            <Download size={14} /> Выгрузить
          </Btn>
          <Btn>
            <Printer size={14} /> Печать
          </Btn>
        </div>
      </div>
      <div className="mkcols">
        <Panel title="Календарь сезона · экран-источник Э1.2">
          <Rows>
            {TOURS.slice(0, 4).map((t) => (
              <TourRow key={t.nm} t={t} judge />
            ))}
          </Rows>
        </Panel>

        <Panel title="Взносы · экран-источник Э2.1">
          <Rows>
            <Row av={A(32)} nm="Смагулов Алан" sub="Алматы · «Алатау»" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
            <Row av={A(22)} nm="Жумабеков Расул" sub="Караганда · «Шахтёр»" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }} />
            <Row av={AW(21)} nm="Тлеуова Аружан" sub="Шымкент · «Достык»" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }} />
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э3.3 · Подписки ───────────────────────────────────────────── */

type Sub = { nm: string; st: string; cls: string; next: string; on: boolean };

const SUBS: Sub[] = [
  { nm: 'Кубок Республики Казахстан 2026', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg', next: 'публикация и приём заявок — 20 апреля', on: true },
  { nm: 'Первенство РК · 2010 г.р. и моложе', st: 'ЗАЯВКИ ИГРОКОВ', cls: 'live', next: 'закрытие приёма — 27 мая', on: true },
  { nm: 'Евразийская лига · 2-й тур', st: 'ИДЁТ', cls: 'live', next: 'день 2 из 3 · сыграно 34 матча из 60', on: true },
  { nm: 'ОРТ «Кубок Иртыша»', st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait', next: 'выбор главного судьи — 18 апреля', on: true },
  { nm: 'ОРТ «Шымкент Open»', st: 'ЧЕРНОВИК', cls: 'done', next: 'дата не назначена', on: false },
];

export function Subs3_3() {
  return (
    <RoleScreen
      role={R0304}
      nav="Подписки"
      title="Мои подписки"
      sub="4 соревнования из 32"
    >
      <ActionBar count="Отслеживается 4 из 32 соревнований сезона">
        <Btn>
          <Download size={14} /> Выгрузить список
        </Btn>
      </ActionBar>
      <div className="mkcols">
        <Panel title="Отслеживаемые соревнования">
          <Rows>
            {SUBS.map((s) => (
              <div className="drow" key={s.nm}>
                <div className="who">
                  <div className="nm">{s.nm}</div>
                  <div className="rl">ближайшее событие: {s.next}</div>
                </div>
                <P t={s.st} cls={s.cls} />
                <button className="dpickbtn">{s.on ? 'Отписаться' : 'Подписаться'}</button>
              </div>
            ))}
          </Rows>
        </Panel>

        <Panel title="Уведомления · Кубок РК 2026" extra={<span className="pill live" style={{ margin: 0 }}>ПОДПИСКА ВКЛ</span>}>
          <Rows>
            <Row nm="Смена состояния" sub="публикация, начало игр, протокол" pill={{ t: 'ПРИХОДИТ', cls: 'live' }} />
            <Row nm="Итоговый протокол" sub="как только протокол закрыт" pill={{ t: 'ПРИХОДИТ', cls: 'live' }} />
            <Row nm="Отмена или перенос" sub="с причиной и новой датой" pill={{ t: 'ПРИХОДИТ', cls: 'live' }} />
          </Rows>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={13} /> Уведомления — всё, что даёт подписка
            </div>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Борд ролей ────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э3.1': {
    cap: 'Обзорная панель',
    view: () => <Dash3_1 />,
    next: 'пункт меню модуля',
  },
  'Э3.2': {
    cap: 'Модули в режиме чтения',
    view: () => <Read3_2 />,
    next: '«Подписаться» в карточке',
  },
  'Э3.3': {
    cap: 'Подписки',
    view: () => <Subs3_3 />,
  },
};

export function Role0304Board() {
  return <Board role={R0304} screens={SCREENS} />;
}
