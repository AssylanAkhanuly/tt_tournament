/* Э14.7 · Мой профиль — вариант Д «Личный кабинет» (29.08.2026).

   Присланный референс: тёмное фитнес-приложение, где профиль устроен хабом —
   обложка с фотографией, круглый портрет поверх неё, три чипа с параметрами
   (рост / вес / возраст), дальше заголовок «Account» и СПИСОК ПУНКТОВ:
   Personal Data, Achievement, Activity History, Workout Progress и тумблер
   уведомлений. То есть на экране почти нет самих данных — есть входы в них.

   Что взято, а что нет:

     взято  — обложка с фотографией и портрет поверх неё; чипы с числами;
              «Аккаунт» + список строк с иконкой, подписью и шевроном;
              тумблер последней строкой.
     не взято — тёмная тема и скруглённые углы. Роль рисуется на светлой
              (решение 22.08.2026), а углы в системе прямые: это рабочий
              инструмент федерации, а не потребительское приложение. Круглым
              остаётся круглое по сути — портрет и тумблер.

   Содержание — то же, что у А–Г, из flows/14-sportsmen.md, Э14.7. Разница в
   том, что паспортные поля здесь не показаны, а лежат за пунктом «Личные
   данные»: это и есть решение варианта и его цена. Разбор — в role14.stories.tsx. */

import type { ReactNode } from 'react';
import {
  BarChart3, Bell, ChevronRight, CreditCard, KeyRound, Pencil, Receipt, Settings,
  ShieldAlert, Trophy, User, Wallet,
} from 'lucide-react';
import type { DeskVariant } from '../deskShell';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { A } from '../fedCommon';
import { Chrome, NAV } from './role14mobile';
import './role14prof2.css';

const ME = A(44);

/* ── Содержание ─────────────────────────────────────────────────── */

/** Чипы под именем — как «рост / вес / возраст» в референсе. Числа при имени
    во flows Э14.7 не описаны (пришли из Э14.6) — помечено «сверх флоу». */
const CHIPS: [string, string][] = [
  ['2456', 'рейтинг'],
  ['7', 'место в РК'],
  ['МС', 'разряд'],
];

type Row = {
  ic: ReactNode;
  nm: string;
  ss: string;
  /** Значение справа вместо шеврона — там, где входить некуда. */
  val?: string;
  to?: string;
  tone?: 'pay' | 'warn';
  /** Тумблер вместо перехода — последняя строка референса. */
  toggle?: boolean;
};

/** Левая группа: всё про меня как про спортсмена. */
const MINE: Row[] = [
  {
    ic: <BarChart3 size={17} />,
    nm: 'Аналитика',
    ss: 'рейтинг по турнирам, форма, соперники',
    to: 'Э14.6',
  },
  {
    ic: <User size={17} />,
    nm: 'Личные данные',
    ss: 'дата рождения, телефон, почта, тренер',
    to: 'Э14.9',
  },
  {
    ic: <Trophy size={17} />,
    nm: 'Клуб и разряд',
    ss: 'СКА · Астана · подтвердил клуб 12.01.2026',
    to: 'Э14.9',
  },
  {
    ic: <ShieldAlert size={17} />,
    nm: 'Личность не подтверждена',
    ss: 'ИИН и код из SMS с номера 1414',
    tone: 'warn',
  },
];

/** Правая группа: деньги и доступ. */
const ACCESS: Row[] = [
  {
    ic: <Wallet size={17} />,
    nm: 'Годовой взнос 2026 — не оплачен',
    ss: 'срок до 31 марта · ₸ 10 000',
    to: 'Э14.8',
    tone: 'pay',
  },
  {
    ic: <Receipt size={17} />,
    nm: 'История платежей',
    ss: 'взносы за все сезоны и квитанции',
    to: 'Э14.12',
  },
  { ic: <KeyRound size={17} />, nm: 'Пароль', ss: 'изменён 02.02.2026', val: 'Сменить' },
  {
    ic: <Settings size={17} />,
    nm: 'Язык интерфейса',
    ss: 'письма и уведомления приходят на нём же',
    val: 'Русский',
  },
  {
    ic: <Bell size={17} />,
    nm: 'Уведомления',
    ss: 'вызов на стол, решение по заявке, пересчёт рейтинга',
    toggle: true,
  },
];

const MenuRow = ({ r }: { r: Row }) => (
  <div className={'p2-row' + (r.tone ? ' ' + r.tone : '')} data-to={r.to}>
    <span className="ic">{r.ic}</span>
    <span className="tx">
      <span className="nm">{r.nm}</span>
      <span className="ss">{r.ss}</span>
    </span>
    {r.toggle ? (
      <span className="sw" />
    ) : r.val ? (
      <span className="val">{r.val}</span>
    ) : (
      <ChevronRight size={18} className="ch" />
    )}
  </div>
);

const Group = ({ cap, rows }: { cap: string; rows: Row[] }) => (
  <section>
    <div className="p2-cap">{cap}</div>
    <div className="p2-list">
      {rows.map((r) => (
        <MenuRow r={r} key={r.nm} />
      ))}
    </div>
  </section>
);

/* ═══ Д · «Личный кабинет» — десктоп ═══════════════════════════════
   Обложка во всю ширину, портрет поверх её нижнего края, имя и чипы под ним —
   как в референсе. Дальше список входов; на ширине он идёт двумя группами,
   иначе правая половина экрана пустует (эту цену мы уже платили на Э14.3). */
export function ProfD({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Профиль" title="Мой профиль">
      <div className="pf2 o14-nohead">
        <header className="p2-hero">
          <img className="cover" src={ME} alt="" />
          <span className="scrim" />
          <button type="button" className="edit" data-to="Э14.9">
            <Pencil size={15} />
          </button>
        </header>

        <div className="p2-who">
          <img className="ava" src={ME} alt="" />
          <h1 className="o14-disp">Ким Георгий</h1>
          <div className="sub">мастер спорта · Астана · клуб СКА</div>
          <div className="chips">
            {CHIPS.map(([v, k]) => (
              <span key={k}>
                <b className="o14-disp">{v}</b>
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="p2-cols">
          <Group cap="Мой спорт" rows={MINE} />
          <Group cap="Взнос и доступ" rows={ACCESS} />
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Д · «Личный кабинет» — телефон ═══════════════════════════════
   Референс — телефонный, и роль единственная, у кого есть приложение: тот же
   экран одной колонкой, обе группы подряд, тумблер последней строкой. */
export function ProfDPhone() {
  return (
    <div className="mb-wrap m5 pf2 pf2m">
      <Frame>
        <Chrome>
          <div className="mb-body m5-body">
            <header className="p2-hero">
              <img className="cover" src={ME} alt="" />
              <span className="scrim" />
              <button type="button" className="edit" data-to="Э14.9">
                <Pencil size={14} />
              </button>
            </header>

            <div className="p2-who">
              <img className="ava" src={ME} alt="" />
              <h1 className="o14-disp">Ким Георгий</h1>
              <div className="sub">мастер спорта · Астана · клуб СКА</div>
              <div className="chips">
                {CHIPS.map(([v, k]) => (
                  <span key={k}>
                    <b className="o14-disp">{v}</b>
                    {k}
                  </span>
                ))}
              </div>
            </div>

            <Group cap="Мой спорт" rows={MINE} />
            <Group cap="Взнос и доступ" rows={ACCESS} />
          </div>
        </Chrome>
        <MiniTabBar items={NAV} active="Профиль" />
      </Frame>
    </div>
  );
}
