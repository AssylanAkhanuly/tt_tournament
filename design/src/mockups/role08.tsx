/* Роль 8 · Заместитель главного судьи — макеты по флоу.
   Экраны Э8.1–Э8.3 (см. `flows/08-zam-glavnogo-sudi.md` и схему роли).

   ⚠ Вся роль — рабочая гипотеза: функционал в документе федерации не заполнен
   (вопрос 12.1). Единственный твёрдый факт — коэффициент 1,5 за судейство в
   роли заместителя (TZ §7.2), он и держит экран Э8.3.

   Отсюда весь дизайн роли: заместитель видит ровно те же блоки, что главный
   судья (они импортируются из `role06.tsx` — это не копия, а тот же экран), но
   поверх них живёт ИНДИКАТОР СМЕНЫ. Пока смена у главного, кнопок действий нет:
   на макете это видно на каждой строке — «ЧТЕНИЕ» вместо «Открыть». */

import {
  ArrowRightLeft, Ban, Clock, Lock, Megaphone, Pencil, Shield, Upload,
} from 'lucide-react';
import {
  A, Arrow, Board, Chips, Hint, Panel, Row, Rows, RoleScreen, Screen, Submit,
} from './shell';
import { LiveCards, NeedRow, QueuePanel, Stages, TableMap, type Need } from './role06';
import { R08 } from './roles';

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

export function Shift8_1() {
  return (
    <RoleScreen
      role={R08}
      nav="Мой турнир"
      title="Чемпионат Казахстана 2026"
      sub="Заместитель главного судьи · смена у главного судьи — экран только на чтение"
      hint="Пока смена не передана, действий нет: заместитель видит всё, но ничего не меняет ✳."
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
            <Hint>
              Список тот же, что у главного судьи (Э6.1), но каждая строка помечена «ЧТЕНИЕ»:
              без переданной смены заместитель не вызывает пары, не правит счёт и не ставит
              техническую победу.
            </Hint>
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
          <div style={{ marginTop: 12 }}>
            <Hint>
              Кто сейчас за пультом, видно всем в наряде. Передача и возврат смены пишутся в журнал
              с временем ✳.
            </Hint>
          </div>
          <div style={{ marginTop: 10 }}>
            <Hint>
              ⚠ Функционал роли в документе федерации не заполнен (вопрос 12.1). Режим смены —
              наша гипотеза: права те же, что у главного, но только когда он передал смену.
            </Hint>
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
      hint="Каждое действие при замещении пишется в журнал с именем заместителя — видно, кто из двоих решал."
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

/* ── Э8.3 · Мой рейтинг судьи ───────────────────────────────────── */

/* R = S1 + S2 + S3 + S4 (TZ §7.2). S1 и S2 система начисляет сама, S3 и S4 —
   по документам, их подтверждает председатель ГСК. Коэффициент 1,5 за роль
   заместителя — тот самый единственный твёрдый факт о роли. */
const RATING = {
  ...R08,
  brandName: 'Мой профиль судьи',
  brandSub: 'Рейтинг судей ФНТ РК · сезон 2026',
  badge: false as const,
};

export function Rating8_3() {
  return (
    <RoleScreen
      role={RATING}
      nav="Мой рейтинг"
      title="Мой рейтинг судьи"
      sub="Сагинтаев Дархан · судья национальной категории · сезон 2026"
      hint="S1 и S2 система начисляет сама; S3 и S4 — по загруженным документам, их подтверждает председатель ГСК."
    >
      <Chips
        items={[
          { v: '25,0', k: 'R — подтверждено за 2026', tone: 'b' },
          { v: '7 / 96', k: 'Место в реестре судей' },
          { v: '× 1,5', k: 'Коэффициент заместителя', tone: 'g' },
          { v: '4', k: 'Турнира отсужено' },
          { v: '3 / 4', k: 'Категорий с баллами', tone: 'a' },
        ]}
      />

      <div className="mkcols">
        <Panel
          title="Из чего сложился R = S1 + S2 + S3 + S4"
          extra={<span className="pill live" style={{ margin: 0 }}>+ 2,0 НА ПРОВЕРКЕ</span>}
        >
          <Rows>
            <Row
              nm="S1 · Судейство соревнований"
              sub="4 республиканских турнира × 3 балла × коэффициент 1,5 за роль заместителя"
              val="18,0"
              pill={{ t: 'НАЧИСЛЕНО СИСТЕМОЙ', cls: 'live' }}
            />
            <Row
              nm="S2 · Квалификационная категория"
              sub="национальная категория — базовый балл, пока категория действует"
              val="4,0"
              pill={{ t: 'НАЧИСЛЕНО СИСТЕМОЙ', cls: 'live' }}
            />
            <Row
              nm="S3 · Повышение квалификации"
              sub="семинар ФНТ РК, 02.2026 — документ подтверждён комиссией"
              val="3,0"
              pill={{ t: 'ПОДТВЕРЖДЁН', cls: 'live' }}
            />
            <Row
              nm="S4 · Иная деятельность"
              sub="работа в судейской коллегии региона — документ на проверке"
              val="2,0"
              pill={{ t: 'НА ПРОВЕРКЕ', cls: 'wait' }}
            />
          </Rows>
          <div style={{ marginTop: 12 }}>
            <Hint>
              S1 и S2 обязательны, зачёт — при баллах не меньше чем в трёх категориях из четырёх
              (§7.2). Коэффициент 1,5 применяется за судейство в роли главного судьи, заместителя
              или секретаря — это единственное, что Положение говорит о заместителе.
            </Hint>
          </div>
        </Panel>

        <Panel title="Документы и апелляция">
          <div className="qsec">Поданные документы</div>
          <Rows>
            <Row nm="Свидетельство о категории" sub="национальная · 14.01.2026" pill={{ t: 'ПРИНЯТ', cls: 'live' }} />
            <Row nm="Семинар ФНТ РК" sub="02.2026 · 16 часов" pill={{ t: 'ПРИНЯТ', cls: 'live' }} />
            <Row nm="Благодарственное письмо" sub="подано 03.03.2026" pill={{ t: 'НА ПРОВЕРКЕ', cls: 'wait' }} />
          </Rows>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Начисление проверяет председатель ГСК</div>
            <button className="dpickbtn">
              <Upload size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
              Загрузить документ
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <Submit>Подать апелляцию по начислению</Submit>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Борд роли ──────────────────────────────────────────────────── */

export function Role08Board() {
  return (
    <Board role={R08}>
      <Screen code="Э8.1" cap="Мой турнир — режим замещения">
        <Shift8_1 />
      </Screen>
      <Arrow lbl="принять смену" />
      <Screen code="Э8.2" cap="Ход турнира — когда замещает">
        <Live8_2 />
      </Screen>
      <Arrow lbl="ветка роли" />
      <Screen code="Э8.3" cap="Мой рейтинг судьи">
        <Rating8_3 />
      </Screen>
    </Board>
  );
}
