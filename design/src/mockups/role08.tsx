/* Роль 8 · Заместитель главного судьи — макеты по флоу.
   Экраны Э8.1–Э8.3 (см. `flows/08-zam-glavnogo-sudi.md` и схему роли).

   ⚠ Вся роль — рабочая гипотеза: функционал в документе федерации не заполнен
   (вопрос 12.1). Единственный твёрдый факт — коэффициент 1,5 за судейство в
   роли заместителя (TZ §7.2), он и держит экран Э8.3.

   Отсюда весь дизайн роли: заместитель видит ровно те же блоки, что главный
   судья (они импортируются из `role06.tsx` — это не копия, а тот же экран), но
   поверх них живёт ИНДИКАТОР СМЕНЫ. Пока смена у главного, кнопок действий нет:
   на макете это видно на каждой строке — «ЧТЕНИЕ» вместо «Открыть». */

import { ArrowRightLeft, Ban, Clock, Lock, Megaphone, Pencil, Shield, Upload } from 'lucide-react';
import {
  A, Alert, Arrow, Board, Chips, Hint, Panel, RoleScreen, Row, Rows, Screen, Shot, States, Submit,
} from './shell';
import type { DeskVariant } from '../deskShell';
import type { ScreenMap } from './shell';
import { LiveCards, NeedRow, QueuePanel, Stages, TableMap, type Need } from './role06';
import { R08 } from './roles';
/* Маршрут судейской роли начинается раньше входа: судья заводит себя сам
   (Э0.7), а роль в наряде ему выдают уже потом. Без этой колонки борд и карта
   начинались с «Вход», и откуда взялся человек, из них было не видно. */
import { Login0_1, SignUpJudge0_7, SignUpJudge0_7States } from './role00';

const CHIEF = A(76);   // Оспанов Талғат — главный судья турнира (роль 6)
const DEP = A(37);     // Сагинтаев Дархан — заместитель, пользователь этих экранов

/* ── Э8.1 · Мой турнир — режим замещения ────────────────────────── */

/* Та же зона «что сейчас требуется», что у главного судьи (Э6.1), но в
   состоянии «Идёт» и без кнопок: смена не передана — экран на чтение. */
const NEEDS: Need[] = [
  {
    ic: <Megaphone size={16} />, t: '3 пары ждут стола дольше 20 минут',
    s: 'Э8.2 · вызвать на освободившиеся столы', p: 'СРОЧНО', cls: 'bad',
  },
  {
    ic: <Shield size={16} />, t: 'На столе 7 нет судьи',
    s: 'Э8.2 · матч не стартует, пока стол без судьи', p: 'БЛОКИРУЕТ', cls: 'wait',
  },
  {
    ic: <Clock size={16} />, t: 'Стол 11 — задержка старта 12 минут',
    s: 'Э8.2 · карта столов', p: 'ПРОВЕРИТЬ', cls: 'wait',
  },
];

export function Shift8_1({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen
      variant={variant}
      role={R08}
      nav="Мой турнир"
      title="Чемпионат Казахстана 2026"
      sub="Заместитель главного судьи · смена у главного судьи — экран только на чтение"
    >
      <Stages cur="Идёт" />
      <Chips
        items={[
          { v: '112', k: 'Участников в составе', tone: 'b' },
          { v: '20', k: 'Столов в зале' },
          { v: '14', k: 'Судей в наряде' },
          { v: '60 / 127', k: 'Матчей сыграно', tone: 'g' },
          { v: '8', k: 'Пар ждут стола', tone: 'a' },
        ]}
      />

      <div className="mkcols">
        <Panel
          title="Что сейчас требуется"
          extra={<span className="pill reg" style={{ margin: 0 }}><Lock size={10} /> ДЕЙСТВИЯ НЕДОСТУПНЫ</span>}
        >
          <Rows>
            {NEEDS.map((n) => <NeedRow key={n.t} n={n} read />)}
          </Rows>
          <div style={{ marginTop: 10 }}>
          </div>
        </Panel>

        <Panel
          title="Смена"
          extra={<span className="pill live" style={{ margin: 0 }}>ВЕДЁТ ГЛАВНЫЙ СУДЬЯ</span>}
        >
          <Rows>
            <Row
              av={CHIEF}
              nm="Оспанов Талғат"
              sub="Главный судья турнира · за пультом с 09:00"
              pill={{ t: 'ЗА ПУЛЬТОМ', cls: 'live' }}
            />
            <Row
              av={DEP}
              nm="Сагинтаев Дархан — это вы"
              sub="Заместитель главного судьи · замещаю по передаче"
              pill={{ t: 'СМЕНА НЕ ПЕРЕДАНА', cls: 'wait' }}
              action="Принять смену"
            />
          </Rows>
          <div style={{ marginTop: 10 }}>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э8.2 · Ход турнира — когда замещает ────────────────────────── */

export function Live8_2() {
  return (
    <RoleScreen
      role={R08}
      nav="Ход турнира"
      title="Ход турнира — замещаю"
      sub="12 столов в игре · 8 пар ждут стола · сыграно 60 из 127 матчей"
    >
      <div className="dactionbar">
        <div className="dcount">
          <ArrowRightLeft size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
          Смена принята в 14:20 · передал Оспанов Т., главный судья
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pill live" style={{ margin: 0 }}>ЗАМЕЩАЮ</span>
          <button className="dpickbtn">Вернуть смену главному</button>
        </div>
      </div>

      <TableMap />

      <div className="dcols">
        <Panel title="Идут сейчас" extra={<span className="pill live" style={{ margin: 0 }}>12 СТОЛОВ В ИГРЕ</span>}>
          <LiveCards />

          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">В журнал — с именем заместителя</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="dpickbtn">
                <Megaphone size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
                Вызвать пару
              </button>
              <button className="dpickbtn">
                <Pencil size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
                Исправить счёт
              </button>
              <button className="dpickbtn">
                <Ban size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
                Техническая победа
              </button>
            </div>
          </div>

          <div className="dactionbar" style={{ marginTop: 10 }}>
            <div className="dcount">
              <Lock size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
              Сформировать протокол · Утвердить сетку
            </div>
            <span className="pill bad" style={{ margin: 0 }}>⚠ ТОЛЬКО У ГЛАВНОГО СУДЬИ</span>
          </div>
        </Panel>

        <QueuePanel />
      </div>
    </RoleScreen>
  );
}

/* ── Борд роли ──────────────────────────────────────────────────── */

const Shift8_1States = () => (
  <States>
    <Shot tone="info" title="Смена не передана" text="Всё на чтение, кнопок действий нет." wide>
      <Rows>
        <Row nm="Смена главного судьи" sub="Оспанов Т. · за пультом сейчас" pill={{ t: 'НЕ ПЕРЕДАНА', cls: 'done' }} />
      </Rows>
      <Alert>Пока смена не передана, заместитель видит турнир, но ничего в нём не меняет.</Alert>
    </Shot>
  </States>
);

const Live8_2States = () => (
  <States>
    <Shot
      tone="warning"
      title="Смена не активна"
      text="Действия открыты только при активной смене (Э8.1) — иначе экран на просмотр."
    >
      <Rows>
        <Row nm="Вызвать пару на стол" sub="доступно при активной смене" pill={{ t: 'ЗАКРЫТО', cls: 'done' }} />
        <Row nm="Правка счёта" sub="доступно при активной смене" pill={{ t: 'ЗАКРЫТО', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot
      tone="warning"
      title="Протокол и утверждение сетки"
      text="⚠ Может ли их заместитель — не знаем; до ответа федерации кнопки только у главного судьи."
    >
      <Alert>
        Вопрос 12.1: функционал роли в документе федерации не заполнен. Дальше описанного не
        проектируем — место помечено.
      </Alert>
    </Shot>
  </States>
);

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  /* Борд роли начинается со входа — как у всех ролей (flows/00): маршрут не
     должен обрываться на середине. Регистрация стоит следом: это путь ДО
     входа, и на карте она ветка входа, а не его корень. */
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
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
    next: 'принять смену',
  },
  'Э8.2': {
    cap: 'Ход турнира — когда замещает',
    view: () => (
      <>
        <Live8_2 />
        <Live8_2States />
      </>
    ),
    next: 'ветка роли',
  },
};

export function Role08Board() {
  return <Board role={R08} screens={SCREENS} />;
}
