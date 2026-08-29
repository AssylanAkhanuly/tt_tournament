/* Э14.7 · Мой профиль — четыре варианта (29.08.2026).

   Повод: разбор спортивных профилей (Mobbin — FotMob, theScore, MLS, Premier
   League, DAZN, UFC, Tonal). Нынешний макет профиля собран как страница
   настроек: круглый аватар 64 px, под ним полоса из четырёх равных чисел и две
   колонки панелей. Ни один спортивный продукт так профиль не строит, и три
   приёма оттуда наш экран прямо чинят:

     1. фото игрока — во всю ширину шапки, имя лежит поверх него;
     2. одно число главное (рейтинг), остальные при нём; равной полосы из
        четырёх чисел не встречается нигде;
     3. место в рейтинге — не плитка, а строка в таблице с соседями.

   Содержание у всех четырёх ОДНО и берётся из flows/14-sportsmen.md, Э14.7:
   фото и ФИО, разряд, регион, клуб с отметкой кто и когда подтвердил, тренер,
   дата рождения, телефон, почта, подтверждение личности, годовой взнос
   (год, сумма, срок, состояние, где он требуется), история платежей, пароль,
   язык интерфейса и выход на правку данных (Э14.9). Отличается — что на экране
   главное и во что это обходится.

     А «Карточка бойца»  — фото во всю шапку, фамилия поверх, регалии строкой.
     Б «Вкладки лиги»    — компактная шапка и вкладки: профиль / сезон / взнос.
     В «Моё место»       — экран строится вокруг позиции в таблице рейтинга.
     Г «Удостоверение»   — профиль как членский билет, взнос продлевает его.

   Разбор «за что / чем платим / сверх флоу» — в role14.stories.tsx, рядом с
   макетами. Цвет и радиусы — только токены. */

import type { CSSProperties } from 'react';
import {
  BadgeCheck, ChevronRight, CreditCard, Minus, Pencil, Receipt, ShieldAlert, TrendingUp,
} from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { A } from '../fedCommon';
import './role14prof.css';

const ME = A(44);

/* ── Содержание экрана: одно на все четыре варианта ─────────────── */

/** Паспортная часть. Только на чтение: правка — отдельным экраном Э14.9,
    потому что телефон меняется сразу, а клуб — после подтверждения клубом. */
const DATA: [string, string][] = [
  ['Дата рождения', '14.06.2003'],
  ['Разряд', 'мастер спорта'],
  ['Регион', 'Астана'],
  ['Тренер', 'Гладун Игорь'],
  ['Телефон', '+7 705 118 44 03'],
  ['Почта', 'g.kim@mail.kz'],
  ['Клуб', 'СКА · Астана'],
  ['Принадлежность к клубу', 'подтвердил клуб «СКА», 12.01.2026'],
];

/** Числа при имени. Рейтинг главный, остальные при нём.
    Во flows Э14.7 этих чисел нет (пришли из Э14.6) — помечено «сверх флоу». */
const NUMS: [string, string][] = [
  ['2456', 'рейтинг'],
  ['7', 'место в РК'],
  ['27', 'матчей за сезон'],
  ['19', 'побед'],
];

/** Последние восемь матчей: победа / поражение. Свежий матч справа. */
const FORM = [true, true, false, true, true, true, false, true];

const FEE = {
  year: '2026',
  sum: '₸ 10 000',
  till: 'до 31 марта',
  state: 'не оплачен',
  where: 'Без взноса не допускают на ОРТ и чемпионат РК',
};

const BANK =
  'Оплата идёт на платёжной странице Халык Банка. Состояние поставится само, по подтверждению банка: держать вкладку открытой не нужно.';

/* ── Мелкие куски, общие для вариантов ──────────────────────────── */

/** Строка подтверждения личности. Сверка с государственной базой физических
    лиц: ИИН → SMS с номера 1414 → код. Показано состояние «не подтверждена» —
    то, в котором виден выход на действие. */
const Identity = () => (
  <div className="pf-id">
    <ShieldAlert size={17} />
    <span className="tx">
      <span className="nm">Личность не подтверждена</span>
      <span className="ss">ИИН и код из SMS с номера 1414 · сверка с базой физических лиц</span>
    </span>
    <button type="button" className="pf-btn">Подтвердить</button>
  </div>
);

/** Паспортные поля плоским списком: подпись сверху мелко, значение под ней.
    Так устроен таб «Инфо» в theScore — без рамок и разделителей; читается
    быстрее сетки «подпись слева, значение справа». */
const DataFlat = ({ cols = 3 }: { cols?: number } = {}) => (
  <div className="pf-flat" style={{ '--pf-cols': cols } as CSSProperties}>
    {DATA.map(([k, v]) => (
      <div key={k}>
        <span className="k">{k}</span>
        <span className="v">{v}</span>
      </div>
    ))}
  </div>
);

const EditRow = () => (
  <div className="pf-edit">
    <span>Клуб и регион меняются только по приглашению</span>
    <button type="button" className="pf-btn" data-to="Э14.9">
      <Pencil size={14} /> Изменить данные
    </button>
  </div>
);

/** Взнос, история платежей, пароль, язык — «доступ» одним листом. */
const Access = () => (
  <div className="pf-acc">
    <div className="pf-row pay" data-to="Э14.8">
      <span className="tx">
        <span className="nm">Годовой взнос {FEE.year}</span>
        <span className="ss">срок {FEE.till} · {FEE.state}</span>
      </span>
      {/* Сумма и кнопка отдельной строкой: в колонке 380 px они не встают
          рядом с подписью, не разрывая её посреди слова. */}
      <span className="go">
        <span className="amt o14-disp">{FEE.sum}</span>
        <button type="button" className="pf-btn accent">
          <CreditCard size={14} /> Оплатить
        </button>
      </span>
    </div>
    <div className="pf-row" data-to="Э14.12">
      <span className="tx">
        <span className="nm">История платежей</span>
        <span className="ss">взносы за все сезоны и квитанции</span>
      </span>
      <Receipt size={16} className="ch" />
      <ChevronRight size={17} className="ch" />
    </div>
    <div className="pf-row">
      <span className="tx">
        <span className="nm">Пароль</span>
        <span className="ss">изменён 02.02.2026</span>
      </span>
      <button type="button" className="pf-btn">Сменить</button>
    </div>
    <div className="pf-row">
      <span className="tx">
        <span className="nm">Язык интерфейса</span>
        <span className="ss">письма и уведомления приходят на нём же</span>
      </span>
      <span className="val">Русский</span>
    </div>
  </div>
);

const FeeNote = () => (
  <p className="pf-note">
    <b>{FEE.where}.</b> {BANK}
  </p>
);

/* ═══ А · «Карточка бойца» ═════════════════════════════════════════
   Приём из DAZN («Усик»), UFC на Paramount+ и MLS («Месси»): фото во всю
   ширину шапки, фамилия дисплейной гарнитурой поверх тёмной шторки, под именем
   рекорд строкой, эмблема клуба водяным знаком на фоне. Разряд вынесен
   отдельным знаком у имени, как пояс чемпиона, а не строкой в сетке цифр.

   Взнос лежит плашкой на нижней границе шапки — на границе планов, там же, где
   у выбранной главной Г-2 стоит действие. */
export function ProfA() {
  return (
    <RoleScreen role={R14} nav="Профиль" title="Мой профиль">
      <div className="pf pfa o14-nohead">
        {/* Фото не растягивается на всю ширину: исходник у федерации
            квадратный, и в полосе 3.8:1 от него остаётся ухо. Поэтому фото —
            своя колонка в 400 px с натуральным кадром, а слева тёмная
            плоскость, в которую фотография втекает градиентом. */}
        <header className="pfa-hero">
          <span className="pfa-crest o14-disp">СКА</span>

          <div className="pfa-l">
            <div className="pfa-belt">
              <BadgeCheck size={14} /> мастер спорта
            </div>
            <h1 className="pfa-name o14-disp">
              <span className="f">Ким</span>
              <span className="n">Георгий</span>
            </h1>
            <div className="pfa-rec">
              {NUMS.map(([v, k]) => (
                <span key={k}>
                  <b className="o14-disp">{v}</b>
                  {k}
                </span>
              ))}
            </div>
            <div className="pfa-meta">Астана · СКА · 2003 · тренер Гладун Игорь</div>
          </div>

          <div className="pfa-r">
            <img src={ME} alt="" />
          </div>

          <div className="pfa-fee">
            <div className="l">
              <span className="k">Годовой взнос {FEE.year}</span>
              <span className="v o14-disp">{FEE.sum}</span>
              <span className="st">срок {FEE.till} · {FEE.state}</span>
            </div>
            <button type="button" className="pf-btn accent big" data-to="Э14.8">
              <CreditCard size={15} /> Оплатить картой
            </button>
          </div>
        </header>

        <div className="pfa-body">
          <section>
            <div className="pf-sec">Данные<span>только на чтение</span></div>
            <DataFlat cols={3} />
            <Identity />
            <EditRow />
          </section>
          <aside>
            <div className="pf-sec">Взнос и доступ</div>
            <Access />
            <FeeNote />
          </aside>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Б · «Вкладки лиги» ═══════════════════════════════════════════
   Как устроены профили игроков во всех найденных спортивных продуктах: шапка с
   фото стоит на месте, а содержимое переключается вкладками — FotMob
   («Профиль / Матчи / Статистика / Карьера»), theScore («Новости / Сезон /
   Журнал игр / Инфо»), MLS и Premier League («Обзор / Статистика»).

   У нас три вкладки. Открыта «Профиль»; рейтинг стоит цветным чипом с дельтой
   — приём FotMob, где оценка за сезон покрашена по значению, а не набрана тем
   же кеглем, что остальные числа. Взнос уезжает в свою вкладку, и на неё
   повешена красная точка: это и есть цена варианта. */
export function ProfB() {
  return (
    <RoleScreen role={R14} nav="Профиль" title="Мой профиль">
      <div className="pf pfb o14-nohead">
        <header className="pfb-head">
          <img src={ME} alt="" />
          <div className="pfb-who">
            <h1 className="o14-disp">Ким Георгий</h1>
            <div className="pfb-sub">мастер спорта · Астана · СКА · 2003</div>
          </div>
          <div className="pfb-rat">
            <span className="chip o14-disp">
              2456 <TrendingUp size={15} />
            </span>
            <span className="k">рейтинг · +8 после последнего турнира</span>
          </div>
        </header>

        <nav className="pfb-tabs">
          <button type="button" className="on">Профиль</button>
          <button type="button">Сезон</button>
          <button type="button">
            Взнос и доступ <i className="dot" />
          </button>
        </nav>

        <div className="pfb-body">
          {/* Карточка сезона: подпись под числом, как в спортивных карточках. */}
          <div className="pfb-card">
            <div className="pfb-cap">Сезон 2026</div>
            <div className="pfb-cardin">
              <div className="pfb-nums">
                {NUMS.slice(1).map(([v, k]) => (
                  <div key={k}>
                    <b className="o14-disp">{v}</b>
                    <span>{k}</span>
                  </div>
                ))}
              </div>
              {/* Форма квадратиками, а не строкой «19 из 27»: так её рисуют в
                  спортивных карточках, и последние матчи читаются подряд. */}
              <div className="pfb-form">
                <span className="cap">Форма · последние восемь матчей</span>
                <span className="sq">
                  {FORM.map((won, i) => (
                    <i className={won ? 'w' : 'l'} key={i} />
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div className="pf-sec">Данные<span>только на чтение</span></div>
          <DataFlat cols={4} />
          <Identity />
          <EditRow />

          {/* Что стоит за вкладкой — видно строкой, чтобы человек не искал. */}
          <div className="pfb-peek" data-to="Э14.8">
            <span className="tx">
              <span className="nm">Годовой взнос {FEE.year} — {FEE.state}</span>
              <span className="ss">
                {FEE.sum} · срок {FEE.till} · без него не допускают на ОРТ и чемпионат РК
              </span>
            </span>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ В · «Моё место» ══════════════════════════════════════════════
   Место в рейтинге во всех продуктах — не плитка с числом, а строка в списке,
   где своя подсвечена, а соседи видны сверху и снизу: Tonal («15 581 из
   79 393»), Brilliant, Speak, Uxcel. У нас «7-е место в РК» стоит тупиковым
   числом, хотя за ним есть таблица рейтинга и есть ответ на вопрос «сколько до
   шестого».

   Здесь профиль строится вокруг этого: слева кто я, справа где я стою. */
const NEAR: { p: number; nm: string; club: string; r: number; d: number; me?: boolean }[] = [
  { p: 5, nm: 'Ахметов Д.', club: 'Алматы · Алатау', r: 2531, d: 12 },
  { p: 6, nm: 'Ли С.', club: 'Шымкент · Отан', r: 2490, d: 0 },
  { p: 7, nm: 'Ким Георгий', club: 'Астана · СКА', r: 2456, d: 8, me: true },
  { p: 8, nm: 'Оспанов Р.', club: 'Караганда · Шахтёр', r: 2431, d: -5 },
  { p: 9, nm: 'Тлеу А.', club: 'Астана · СКА', r: 2402, d: 3 },
];

export function ProfV() {
  return (
    <RoleScreen role={R14} nav="Профиль" title="Мой профиль">
      <div className="pf pfv o14-nohead">
        <header className="pfv-hero">
          <div className="pfv-me">
            <img src={ME} alt="" />
            <div>
              <div className="pfv-belt">мастер спорта</div>
              <h1 className="o14-disp">Ким Георгий</h1>
              <div className="pfv-sub">Астана · СКА · тренер Гладун Игорь</div>
            </div>
          </div>

          <div className="pfv-place">
            <b className="o14-disp">7</b>
            <span>
              место в рейтинге РК
              <i>рейтинг 2456 · +8 после последнего турнира</i>
            </span>
          </div>

          <div className="pfv-tab">
            <div className="pfv-tab-cap">Рейтинг РК · мужчины · взрослые</div>
            {NEAR.map((n) => (
              <div className={'pfv-r' + (n.me ? ' me' : '')} key={n.p}>
                <span className="p o14-disp">{n.p}</span>
                <span className="nm">
                  {n.nm}
                  <i>{n.club}</i>
                </span>
                <span className="r o14-disp">{n.r}</span>
                <span className={'d' + (n.d > 0 ? ' up' : n.d < 0 ? ' dn' : '')}>
                  {n.d === 0 ? <Minus size={13} /> : (n.d > 0 ? '+' : '') + n.d}
                </span>
              </div>
            ))}
            <div className="pfv-gap">До шестого места — 34 очка · 27 матчей за сезон, 19 побед</div>
          </div>
        </header>

        <div className="pfv-body">
          <section>
            <div className="pf-sec">Данные<span>только на чтение</span></div>
            <DataFlat cols={2} />
            <Identity />
            <EditRow />
          </section>
          <aside>
            <div className="pf-sec">Взнос и доступ</div>
            <Access />
            <FeeNote />
          </aside>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Г · «Удостоверение» ══════════════════════════════════════════
   Единственный вариант, который не заимствует раскладку, а меняет предмет
   разговора. У DAZN и UFC регалия нарисована вещью — поясом; у федерации такая
   вещь тоже есть: членство. Взнос перестаёт быть строкой в списке и становится
   сроком действия билета — «действителен до 31.03.2026», а неоплата гасит
   билет и печатью говорит, куда с ним не пустят.

   Подтверждение личности здесь тоже вещь: печать на билете. */
export function ProfG() {
  return (
    <RoleScreen role={R14} nav="Профиль" title="Мой профиль">
      <div className="pf pfg o14-nohead">
        <div className="pfg-top">
          {/* Билет не оплачен — поэтому погашен: приглушён и перечёркнут
              печатью. Оплата возвращает ему цвет. */}
          <div className="pfg-card off">
            <div className="pfg-card-h">
              <span className="fed">Федерация настольного тенниса РК</span>
              <span className="no o14-disp">№ 026-1183</span>
            </div>
            <div className="pfg-card-b">
              <img src={ME} alt="" />
              <div className="pfg-card-tx">
                <div className="rank">мастер спорта</div>
                <div className="nm o14-disp">Ким Георгий</div>
                <div className="cl">СКА · Астана · с 12.01.2026</div>
                <div className="dob">14.06.2003 · Астана · тренер Гладун Игорь</div>
              </div>
              <div className="pfg-card-r">
                <span className="k">действителен до</span>
                <span className="v o14-disp">31.03.2026</span>
                <span className="k">взнос {FEE.year}</span>
                <span className="v o14-disp">{FEE.sum}</span>
              </div>
            </div>
            <div className="pfg-stamp o14-disp">взнос не оплачен</div>
          </div>

          <aside className="pfg-side">
            <div className="pfg-pay">
              <div className="k">Чтобы продлить билет</div>
              <div className="v o14-disp">{FEE.sum}</div>
              <div className="s">взнос {FEE.year} · срок {FEE.till}</div>
              <button type="button" className="pf-btn accent big" data-to="Э14.8">
                <CreditCard size={15} /> Оплатить картой
              </button>
              <p className="n">
                {FEE.where}. {BANK}
              </p>
            </div>
            <div className="pfg-seal">
              <ShieldAlert size={18} />
              <span className="tx">
                <span className="nm">Личность не подтверждена</span>
                <span className="ss">ИИН и код из SMS с номера 1414</span>
              </span>
              <button type="button" className="pf-btn">Подтвердить</button>
            </div>
          </aside>
        </div>

        <div className="pfg-body">
          <section>
            <div className="pf-sec">Данные<span>только на чтение</span></div>
            <DataFlat cols={3} />
            <EditRow />
          </section>
          <aside>
            <div className="pf-sec">Платежи и доступ</div>
            <div className="pf-acc">
              <div className="pf-row" data-to="Э14.12">
                <span className="tx">
                  <span className="nm">История платежей</span>
                  <span className="ss">взносы за все сезоны и квитанции</span>
                </span>
                <Receipt size={16} className="ch" />
                <ChevronRight size={17} className="ch" />
              </div>
              <div className="pf-row">
                <span className="tx">
                  <span className="nm">Пароль</span>
                  <span className="ss">изменён 02.02.2026</span>
                </span>
                <button type="button" className="pf-btn">Сменить</button>
              </div>
              <div className="pf-row">
                <span className="tx">
                  <span className="nm">Язык интерфейса</span>
                  <span className="ss">письма и уведомления приходят на нём же</span>
                </span>
                <span className="val">Русский</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </RoleScreen>
  );
}
