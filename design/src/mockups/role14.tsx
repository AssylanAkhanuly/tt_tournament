/* Роль 14 · Спортсмен — макеты по флоу.
   Экраны Э14.1–Э14.7 (см. `flows/14-sportsmen.md` и схему роли).

   Единственная роль с мобильным приложением (TZ §10), поэтому макеты рисуем на
   телефоне: `RolePhone` — тот же корпус и те же карточки, что у принятых экранов
   игрока (`PlayerApp.tsx`). Два правила, которые макет обязан показывать:
   спортсмен не вводит и не подтверждает счёт своего матча, а заявиться сам он
   может только на открытый республиканский турнир (§8.2). */

import type { ReactNode } from 'react';
import {
  BarChart3, CalendarDays, CircleCheckBig, Home, Lock, Megaphone, Paperclip, Pencil,
  ShieldCheck, Swords, TriangleAlert, User, Wallet, ZoomIn,
} from 'lucide-react';
import { Board, RolePhone, Screen, Arrow, Submit, A } from './shell';
import { FormSeg } from '../segs';
import { R14 } from './roles';
import { LoginPhone0_1 } from './role00';

/* Спортсмен макета — Ким Георгий (тот же, что в реестрах ролей 2 и 12). */
const ME = A(44);

const TABS: [ReactNode, string][] = [
  [<Home size={20} />, 'Главная'],
  [<CalendarDays size={20} />, 'Календарь'],
  [<Swords size={20} />, 'Матч'],
  [<BarChart3 size={20} />, 'Аналитика'],
  [<User size={20} />, 'Профиль'],
];

const Ph = ({ tab, children }: { tab: string; children: ReactNode }) => (
  <RolePhone brand="ФНТ РК" tabs={TABS} active={tab}>{children}</RolePhone>
);

/* ── мелочи телефона ──────────────────────────────────────────── */

const Stat = ({ v, k, tone }: { v: string; k: string; tone?: 'g' | 'r' | 'b' }) => (
  <div className={'stat' + (tone ? ' ' + tone : '')}>
    <div className="v">{v}</div>
    <div className="k">{k}</div>
  </div>
);

/** Строка списка на телефоне: аватар, кто, справа — значение. */
const MRow = ({ av, nm, mt, right }: { av?: string; nm: string; mt?: string; right?: ReactNode }) => (
  <div className="match">
    {av && <img className="avatar sm" src={av} alt="" />}
    <div className="who">
      <div className="nm">{nm}</div>
      {mt && <div className="mt">{mt}</div>}
    </div>
    {right && <div className="sc">{right}</div>}
  </div>
);

/** Подсказка-плашка на телефоне; значок не должен рвать строку (svg — display: block). */
const HintBox = ({ icon, top, children }: { icon?: ReactNode; top?: number; children: ReactNode }) => (
  <div
    className="dhintbox"
    style={{ marginTop: top, display: 'flex', gap: 7, alignItems: 'flex-start' }}
  >
    {icon && <span style={{ flex: 'none', marginTop: 1 }}>{icon}</span>}
    <span>{children}</span>
  </div>
);

/** Строка «поле — значение» в карточке профиля. */
const KRow = ({ k, v }: { k: string; v: string }) => (
  <div className="match">
    <div className="who">
      <div className="mt">{k}</div>
      <div className="nm">{v}</div>
    </div>
  </div>
);

/** График рейтинга — тот же приём, что на принятых экранах игрока. */
function Chart({ pts }: { pts: string }) {
  const last = pts.trim().split(' ').pop()!.split(',');
  return (
    <svg className="chart" viewBox="0 0 260 68" preserveAspectRatio="none">
      <defs>
        <linearGradient id="r14g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--c-accent)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--c-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="url(#r14g)" stroke="none" points={`0,68 ${pts} 260,68`} />
      <polyline
        fill="none"
        stroke="var(--c-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--c-accent)" />
    </svg>
  );
}

/** Карточка турнира в календаре: категория, условия и то, что стоит вместо кнопки. */
function TourCard({
  cat, nm, mt, rule, ruleIcon, btn,
}: {
  cat: string;
  nm: string;
  mt: string;
  rule: string;
  ruleIcon: ReactNode;
  btn?: string;
}) {
  return (
    <div className="card">
      <span className="pill reg">{cat}</span>
      <div className="nm2">{nm}</div>
      <div className="mt2">{mt}</div>
      <HintBox icon={ruleIcon} top={10}>{rule}</HintBox>
      {btn && <div style={{ marginTop: 10 }}><Submit>{btn}</Submit></div>}
    </div>
  );
}

/* ── Э14.1 · Главная ──────────────────────────────────────────── */
export function Home14_1() {
  return (
    <Ph tab="Главная">
      <div className="card pcard">
        <img className="avatar" src={ME} alt="" />
        <div className="who">
          <div className="nm">Ким Георгий</div>
          <div className="mt">г. Астана · клуб СКА · КМС</div>
        </div>
        <div className="rt">
          <div className="k">Рейтинг</div>
          <div className="v">2456</div>
        </div>
      </div>

      <div className="stats">
        <Stat v="2456" k="Рейтинг" tone="b" />
        <Stat v="7" k="Место в РК" />
        <Stat v="+24" k="За турнир" tone="g" />
        <Stat v="128" k="Матчей" />
      </div>

      <div className="sect">Сейчас играю</div>
      <div className="card" style={{ borderColor: 'var(--c-success-line-2)' }}>
        <span className="pill live"><span className="d" />ВАС ВЫЗВАЛИ · СТОЛ 5</span>
        <MRow
          av={A(22)}
          nm="Жумабеков Расул"
          mt="1/8 финала · рейтинг 2312"
          right="14:20"
        />
      </div>

      <div className="sect">Ближайший турнир</div>
      <div className="card">
        <span className="pill reg">ОТКРЫТЫЙ РЕСПУБЛИКАНСКИЙ</span>
        <div className="nm2">Кубок Алматы 2026</div>
        <div className="mt2">г. Алматы · 12–14.09 · заявка на рассмотрении</div>
      </div>

      <div className="sect">Лента</div>
      <div className="item live">
        <div className="ic"><Megaphone size={18} /></div>
        <div className="tx">
          <div className="tt">Пара вызвана на стол 5</div>
          <div className="ss">Чемпионат Астаны · 1/8 финала</div>
        </div>
        <div className="rt">2 мин</div>
      </div>
      <div className="item">
        <div className="ic"><CircleCheckBig size={18} /></div>
        <div className="tx">
          <div className="tt">Заявка принята</div>
          <div className="ss">Чемпионат Астаны · подал тренер</div>
        </div>
        <div className="rt">1 ч</div>
      </div>
    </Ph>
  );
}

/* ── Э14.2 · Календарь: как в турнир попадают — прямо в карточке ── */
export function Calendar14_2() {
  return (
    <Ph tab="Календарь">
      <div className="title">Календарь</div>

      <TourCard
        cat="ГЛАВНЫЙ СТАРТ"
        nm="Чемпионат Республики Казахстан"
        mt="г. Астана · 18–22.09.2026 · без возрастной границы"
        ruleIcon={<Lock size={13} />}
        rule="Состав подаёт старший тренер региона — заявиться самому нельзя, кнопки нет."
      />

      <TourCard
        cat="ЕВРАЗИЙСКАЯ ЛИГА"
        nm="Евразийская лига · 3-й тур"
        mt="г. Шымкент · 16–18.05.2026 · командное соревнование"
        ruleIcon={<ShieldCheck size={13} />}
        rule="Заявляет клуб. Вы заявлены за команду «СКА» — мужская 2 лига."
      />

      <TourCard
        cat="ОТКРЫТЫЙ РЕСПУБЛИКАНСКИЙ"
        nm="Кубок Алматы 2026"
        mt="г. Алматы · 12–14.09.2026 · приём заявок до 05.09"
        ruleIcon={<CircleCheckBig size={13} />}
        rule="Допуск: возраст без границы · ценз рейтинга от 1800 — ваш 2456 проходит · нужен годовой взнос — оплачен · нужна медсправка."
        btn="Заявиться"
      />

      <TourCard
        cat="ОТКРЫТЫЙ РЕСПУБЛИКАНСКИЙ"
        nm="Мангистау кап 2026"
        mt="г. Актау · 03–05.10.2026 · приём заявок до 25.09"
        ruleIcon={<TriangleAlert size={13} />}
        rule="Ценз по рейтингу: от 2600. Ваш рейтинг 2456 — не проходит, заявиться нельзя."
      />
    </Ph>
  );
}

/* ── Э14.3 · Заявка на ОРТ ────────────────────────────────────── */
export function Apply14_3() {
  return (
    <Ph tab="Календарь">
      <div className="title">Заявка</div>
      <div className="card">
        <span className="pill reg">ОТКРЫТЫЙ РЕСПУБЛИКАНСКИЙ</span>
        <div className="nm2">Кубок Алматы 2026</div>
        <div className="mt2">г. Алматы · 12–14.09.2026 · приём до 05.09</div>
      </div>

      <div className="sect">Разряд</div>
      <FormSeg items={['Одиночный', 'Парный']} active="Парный" />

      <div className="card">
        <MRow av={A(13)} nm="Пак Сергей" mt="партнёр по паре · рейтинг 2201 · СКА" right="выбран" />
        <HintBox icon={<TriangleAlert size={13} />} top={8}>
          Как партнёр подтверждает пару — в документе федерации не описано; дальше этот шаг не
          проектируем.
        </HintBox>
      </div>

      <div className="sect">Документы</div>
      <div className="card">
        <div className="mt2" style={{ marginTop: 0 }}>Турнир требует медицинскую справку.</div>
        <div style={{ marginTop: 10 }}>
          <button className="dpickbtn"><Paperclip size={14} /> Приложить файл</button>
        </div>
      </div>

      <div className="sect">Проверки перед подачей</div>
      <div className="card list">
        <MRow nm="Возрастная граница" mt="без ограничений" right={<CircleCheckBig size={16} />} />
        <MRow nm="Ценз по рейтингу" mt="от 1800 · ваш 2456" right={<CircleCheckBig size={16} />} />
        <MRow nm="Годовой взнос 2026" mt="оплачен 09.01.2026" right={<CircleCheckBig size={16} />} />
      </div>

      <Submit>Подать заявку</Submit>
      <HintBox>
        Заявка уходит главному судье турнира, решение придёт уведомлением. Тренер может подать
        заявку за вас — тогда в «Моей заявке» видно, кто подал.
      </HintBox>
    </Ph>
  );
}

/* ── Э14.4 · Моя заявка ───────────────────────────────────────── */
export function MyApp14_4() {
  return (
    <Ph tab="Календарь">
      <div className="title">Мои заявки</div>

      <div className="sect">Активные</div>
      <div className="card">
        <span className="pill wait">НА РАССМОТРЕНИИ</span>
        <div className="nm2">Кубок Алматы 2026</div>
        <div className="mt2">подана 02.09.2026 · вами · парный разряд</div>
        <div style={{ marginTop: 10 }}>
          <button className="dpickbtn">Отозвать заявку</button>
        </div>
      </div>

      <div className="card">
        <span className="pill live">ПРИНЯТА</span>
        <div className="nm2">Чемпионат Астаны 2026</div>
        <div className="mt2">подана 12.08.2026 · тренером Оспановым Т. · одиночный</div>
      </div>

      <div className="sect">Отклонённые</div>
      <div className="card">
        <span className="pill bad">ОТКЛОНЕНА</span>
        <div className="nm2">Кубок Тараза 2026</div>
        <div className="mt2">подана 20.07.2026 · вами · одиночный</div>
        <HintBox top={10}>
          Причина судьи: приложена медицинская справка не того образца — нужна справка с допуском
          к соревнованиям.
        </HintBox>
        <div style={{ marginTop: 10 }}>
          <Submit>Исправить и подать снова</Submit>
        </div>
      </div>
    </Ph>
  );
}

/* ── Э14.5 · Мой турнир и мой матч ────────────────────────────── */
export function Match14_5() {
  return (
    <Ph tab="Матч">
      <div className="card" style={{ borderColor: 'var(--c-success-line-2)' }}>
        <span className="pill live"><span className="d" />ВАС ВЫЗВАЛИ</span>
        <div className="title" style={{ padding: 0 }}>Подойдите к столу 5</div>
        <div className="mt2">1/8 финала · вызов главного судьи в 14:18</div>
      </div>

      <div className="sect">Мой матч</div>
      <div className="card list">
        <MRow av={ME} nm="Ким Георгий" mt="рейтинг 2456 · вы" right="2" />
        <MRow av={A(22)} nm="Жумабеков Расул" mt="рейтинг 2312 · Караганда" right="1" />
      </div>
      <HintBox icon={<Swords size={13} />}>Личные встречи с соперником: 3 : 1 в вашу пользу.</HintBox>

      <div className="sect">Счёт</div>
      <div className="card">
        <div className="chart-h">
          <span className="t">Партии · в реальном времени</span>
          <span className="pill reg" style={{ margin: 0 }}>СЧЁТ ВЕДЁТ СУДЬЯ</span>
        </div>
        <div className="stats">
          <Stat v="11:7" k="1-я партия" tone="g" />
          <Stat v="9:11" k="2-я партия" tone="r" />
          <Stat v="11:8" k="3-я партия" tone="g" />
          <Stat v="6:4" k="идёт" tone="b" />
        </div>
        <HintBox icon={<Lock size={13} />} top={10}>
          Счёт ведёт судья на столе. Вы его не вводите и не подтверждаете — на этом экране счёт
          только показывается, кнопок ввода и подтверждения здесь нет.
        </HintBox>
      </div>

      <div className="sect">Моя сетка</div>
      <div className="card list">
        <MRow nm="1/32 финала" mt="Оспанов Тимур" right="3:0" />
        <MRow nm="1/16 финала" mt="Ерлан Бекзат" right="3:1" />
        <MRow nm="1/8 финала" mt="Жумабеков Расул · идёт" right="2:1" />
        <MRow nm="1/4 финала" mt="соперник определяется" right="—" />
      </div>
      <HintBox icon={<ZoomIn size={13} />}>
        Сетка целиком открывается щипком — ваш путь подсвечен.
      </HintBox>
    </Ph>
  );
}

/* ── Э14.6 · Аналитика ────────────────────────────────────────── */
export function Stats14_6() {
  return (
    <Ph tab="Аналитика">
      <div className="title">Аналитика</div>

      <div className="card">
        <div className="chart-h">
          <span className="t">Динамика рейтинга · сезон 2026</span>
          <span className="pill live" style={{ margin: 0 }}>+24</span>
        </div>
        <Chart pts="4,54 40,50 76,52 112,38 148,42 184,26 220,30 256,12" />
      </div>

      <div className="stats">
        <Stat v="128" k="Матчи" />
        <Stat v="98" k="Победы" tone="g" />
        <Stat v="30" k="Поражения" tone="r" />
        <Stat v="76%" k="Винрейт" tone="b" />
      </div>

      <div className="sect">Личные встречи</div>
      <div className="card list">
        <MRow av={A(22)} nm="Жумабеков Расул" mt="Караганда · «Шахтёр»" right="5:2" />
        <MRow av={A(56)} nm="Гладун Игорь" mt="Тараз" right="1:3" />
        <MRow av={A(13)} nm="Пак Сергей" mt="Астана · СКА" right="4:4" />
      </div>

      <div className="sect">История матчей</div>
      <div className="card list">
        <MRow nm="Чемпионат Астаны · 1/8" mt="Жумабеков Р. · 11:7, 9:11, 11:8, 11:6" right="3:1" />
        <MRow nm="Кубок Алматы 2025 · 1/4" mt="Гладун И. · 8:11, 11:9, 6:11, 9:11" right="1:3" />
      </div>

      <div className="sect">Расширенная аналитика</div>
      <div className="card">
        <span className="pill reg">ПЛАТНАЯ</span>
        <div className="nm2">Длина розыгрышей и ход партий</div>
        <div className="mt2">Считается по вводу счёта по очкам, если судья вёл матч по очкам.</div>
        <HintBox icon={<TriangleAlert size={13} />} top={10}>
          Состав расширенной аналитики и способ оплаты пока не зафиксированы — кнопка ведёт на
          заглушку.
        </HintBox>
        <div style={{ marginTop: 10 }}>
          <Submit>Подключить расширенную</Submit>
        </div>
      </div>
    </Ph>
  );
}

/* ── Э14.7 · Профиль и взнос ──────────────────────────────────── */
export function Profile14_7() {
  return (
    <Ph tab="Профиль">
      <div className="card pcard">
        <img className="avatar" src={ME} alt="" />
        <div className="who">
          <div className="nm">Ким Георгий</div>
          <div className="mt">2003 г.р. · г. Астана</div>
        </div>
        <div className="rt">
          <div className="k">Рейтинг</div>
          <div className="v">2456</div>
        </div>
      </div>

      <div className="sect">Мои данные</div>
      <div className="card list">
        <KRow k="Клуб" v="СКА · г. Астана" />
        <KRow k="Тренер" v="Оспанов Тимур" />
        <KRow k="Разряд" v="Кандидат в мастера спорта" />
        <KRow k="Регион" v="Астана" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="dpickbtn"><Pencil size={14} /> Править контакты</button>
      </div>

      <div className="sect">Годовой взнос</div>
      <div className="card">
        <span className="pill live">ОПЛАЧЕН · 2026</span>
        <div className="nm2">Членский взнос ФНТ РК · ₸ 10 000</div>
        <div className="mt2">оплачен картой 09.01.2026 · Halyk ePay · платёж 4172‑8830</div>
        <HintBox icon={<Wallet size={13} />} top={10}>
          Взнос нужен на главных стартах и на тех турнирах, где организатор включил требование.
          Состояние видно и вашему тренеру.
        </HintBox>
        <HintBox icon={<CircleCheckBig size={13} />} top={10}>
          Оплатили — состояние меняется само, по подтверждению банка. Бухгалтер ничего не
          подтверждает вручную, ждать его не нужно.
        </HintBox>
      </div>

      <div className="sect">Взнос за 2027 год</div>
      <div className="card">
        <span className="pill wait">НЕ ОПЛАЧЕН</span>
        <div className="nm2">Членский взнос ФНТ РК · ₸ 10 000</div>
        <div className="mt2">приём открыт с 01.01.2027</div>
        <div style={{ marginTop: 10 }}>
          <Submit>Оплатить взнос картой</Submit>
        </div>
        <HintBox icon={<Lock size={13} />} top={10}>
          Оплата на защищённой странице Халык Банка, с возвратом обратно в приложение. Приложение
          можно закрыть сразу после оплаты — взнос всё равно станет оплаченным.
        </HintBox>
      </div>
    </Ph>
  );
}

export function Role14Board() {
  return (
    <Board role={R14}>
      <Screen code="Э0.1" cap="Вход в приложении">
        <LoginPhone0_1 />
      </Screen>
      <Arrow lbl="первый экран роли" />
      <Screen code="Э14.1" cap="Главная">
        <Home14_1 />
      </Screen>
      <Arrow lbl="вкладка «Календарь»" />
      <Screen code="Э14.2" cap="Календарь">
        <Calendar14_2 />
      </Screen>
      <Arrow lbl="«Заявиться» на ОРТ" />
      <Screen code="Э14.3" cap="Заявка на ОРТ">
        <Apply14_3 />
      </Screen>
      <Arrow lbl="подал заявку" />
      <Screen code="Э14.4" cap="Моя заявка">
        <MyApp14_4 />
      </Screen>
      <Arrow lbl="вызвали на стол" />
      <Screen code="Э14.5" cap="Мой турнир и мой матч">
        <Match14_5 />
      </Screen>
      <Arrow lbl="рейтинг пересчитан" />
      <Screen code="Э14.6" cap="Аналитика">
        <Stats14_6 />
      </Screen>
      <Arrow lbl="вкладка «Профиль»" />
      <Screen code="Э14.7" cap="Профиль и взнос">
        <Profile14_7 />
      </Screen>
    </Board>
  );
}
