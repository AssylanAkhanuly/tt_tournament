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

import { useState, type ReactNode } from 'react';
import {
  ArrowUpRight, BarChart3, Bell, ChevronRight, CreditCard, KeyRound, Languages, Pencil,
  Receipt, Settings, ShieldAlert, Trophy, User, Wallet, X,
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


/* ═══ Настройки модальным окном (29.08.2026) ═══════════════════════
   Третий присланный референс: белое окно поверх страницы, слева заголовок
   «Settings» и список разделов с иконками (активный подсвечен серым), справа
   заголовок раздела с подписью, поля формы, синяя кнопка «Save changes» и
   строки-действия со стрелкой ↗ — часть из них погашена.

   Переведено на наши сущности без выдумок (flows/14-sportsmen.md, Э14.7 и
   Э14.9): телефон и почта меняются сразу, поэтому они полями с кнопкой
   «Сохранить»; клуб и разряд меняются только по приглашению — поэтому строка
   погашена, ровно как погашенные строки в референсе.

   Окно светлое, как в референсе, поверх тёмного профиля — цвета берутся из
   светлой группы токенов (`--c-surface`, `--c-line`, `--c-text`, `--c-primary`). */

const SET_NAV: [ReactNode, string][] = [
  [<User size={16} key="u" />, 'Аккаунт'],
  [<Wallet size={16} key="w" />, 'Взнос и платежи'],
  [<Languages size={16} key="l" />, 'Язык'],
  [<ShieldAlert size={16} key="s" />, 'Личность'],
];

/** Строки-действия внизу окна. `off` — погашенная, как в референсе. */
const SET_LINKS: { nm: string; ic?: ReactNode; off?: boolean; to?: string }[] = [
  { nm: 'Сменить пароль', ic: <KeyRound size={15} /> },
  { nm: 'История платежей', ic: <Receipt size={15} />, to: 'Э14.12' },
  { nm: 'Клуб и разряд — меняются только по приглашению', ic: <Trophy size={15} />, off: true },
];

function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="p2-ovl" onClick={onClose}>
      <div className="p2-modal" onClick={(e) => e.stopPropagation()}>
        <aside className="p2-mnav">
          <div className="cap">Настройки</div>
          {SET_NAV.map(([ic, t], i) => (
            <button type="button" className={i === 0 ? 'on' : ''} key={t}>
              {ic}
              {t}
            </button>
          ))}
        </aside>

        <section className="p2-mbody">
          <button type="button" className="p2-mx" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>

          <h2>Аккаунт</h2>
          <p className="sub">Телефон и почта меняются сразу, без подтверждения клуба.</p>

          <label className="p2-f">
            <span>Фамилия и имя</span>
            <input value="Ким Георгий" readOnly />
          </label>
          <label className="p2-f">
            <span>Телефон</span>
            <input value="+7 705 118 44 03" readOnly />
          </label>
          <label className="p2-f">
            <span>Почта</span>
            <input value="g.kim@mail.kz" readOnly />
          </label>

          <button type="button" className="p2-save" data-to="Э14.9">
            Сохранить изменения
          </button>

          <div className="p2-links">
            {SET_LINKS.map((l) => (
              <button type="button" className={'p2-link' + (l.off ? ' off' : '')} key={l.nm} data-to={l.to}>
                {l.ic}
                <span>{l.nm}</span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ═══ Д · «Личный кабинет» — десктоп ═══════════════════════════════
   Обложка во всю ширину, портрет поверх её нижнего края, имя и чипы под ним —
   как в референсе. Дальше список входов; на ширине он идёт двумя группами,
   иначе правая половина экрана пустует (эту цену мы уже платили на Э14.3). */
export function ProfD({ variant }: { variant?: DeskVariant } = {}) {
  /* Настройки живут в модальном окне, а не отдельным экраном: их открывает
     шестерёнка в углу профиля (третий референс). */
  const [set, setSet] = useState(false);
  return (
    <RoleScreen variant={variant} role={R14} nav="Профиль" title="Мой профиль">
      <div className="pf2 o14-nohead">
        {/* Обложки нет: у федерации есть один портрет, а отдельной съёмки под
            баннер она не выдаёт — заглушка из того же кадра только мешала.
            Экран открывается портретом на поле. */}
        <div className="p2-who">
          <button
            type="button"
            className="edit"
            onClick={() => setSet(true)}
            aria-label="Настройки"
          >
            <Settings size={16} />
          </button>
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

        {set && <SettingsModal onClose={() => setSet(false)} />}
      </div>
    </RoleScreen>
  );
}

/** Тот же профиль с открытым окном настроек — для истории в Storybook: на
    статичном скриншоте состояние иначе не увидеть. */
export function ProfDSettings({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Профиль" title="Мой профиль">
      <div className="pf2 o14-nohead">
        <div className="p2-who">
          <button type="button" className="edit" aria-label="Настройки">
            <Settings size={16} />
          </button>
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

        <SettingsModal onClose={() => {}} />
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
        {/* bare: шапка «ФНТ РК · Спортсмен» снята — в референсе её нет, экран
            начинается портретом. */}
        <Chrome bare>
          <div className="mb-body m5-body">
            <div className="p2-who">
              <button type="button" className="edit" data-to="Э14.9">
                <Pencil size={14} />
              </button>
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
