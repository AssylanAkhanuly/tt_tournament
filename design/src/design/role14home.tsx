/* Э14.1 · Главная спортсмена — три варианта дизайна.

   Содержание задано флоу (flows/14-sportsmen.md, Э14.1) и у всех трёх одно:
   мой рейтинг (значение, место, дельта), ближайший турнир с состоянием заявки,
   «сейчас играю» во время турнира, лента последних результатов и новостей
   федерации. Варианты отличаются одним — что на экране главное.

   Оболочка роли (шапка, сайдбар, пункт «Главная») у всех одна и та же:
   сравнивать надо решение, а не хром вокруг него. */

import { useCallback } from 'react';
import type { ChartConfiguration } from 'chart.js/auto';
import {
  ArrowRight, CalendarDays, ChevronRight, CreditCard, Newspaper, Play,
} from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { ChartBox, soft, token } from '../mockups/chart';
import { A } from '../fedCommon';
import { R14 } from '../mockups/roles';
import hero from '../assets/tt-hero.jpg';
export { hero };
import './role14home.css';

/* Данные макета — те же, что в существующих макетах роли 14: спортсмен
   Ким Георгий, соперник Жумабеков Расул, Кубок Алматы 2026. Правдоподобные,
   но выдуманные. */
export const ME = { nm: 'Ким Георгий', sub: 'Астана · СКА · КМС', av: A(44) };
export const FOE = { nm: 'Жумабеков Расул', sub: 'рейтинг 2312 · Шымкент · посев 13', av: A(22) };

/* Форма: последние восемь матчей. Победа — В, поражение — П. */
export const FORM = [1, 1, 0, 1, 1, 1, 0, 1];

/* Счёт идущего матча по партиям. Ведёт его судья стола: спортсмен счёт не
   вводит и не подтверждает (flows/14-sportsmen.md, Э14.5). */
const SETS = [
  { me: 11, foe: 8 },
  { me: 9, foe: 11 },
  { me: 11, foe: 6 },
  { me: 7, foe: 5, now: true },
];

export const RESULTS = [
  { nm: 'Оралбек Диас', sub: '1/4 финала · Кубок Алматы', sc: '3:1', win: true },
  { nm: 'Смагулов Ерлан', sub: 'финал · Открытый турнир Астаны', sc: '2:4', win: false },
  { nm: 'Тлеуберди Асан', sub: '1/2 финала · Открытый турнир Астаны', sc: '4:2', win: true },
];

export const NEWS = [
  {
    tag: 'КАЛЕНДАРЬ',
    nm: 'Календарь сезона 2026 опубликован',
    sub: 'Восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых республиканских турниров.',
    at: '15 апреля · Пресс-служба ФНТ РК',
  },
  {
    tag: 'ВЗНОСЫ',
    nm: 'Годовой взнос: срок до 31 марта',
    sub: 'Без оплаты заявки на турниры, где взнос обязателен, не проходят.',
    at: '2 марта · Исполком',
  },
];

/* ── Мелочи, общие для вариантов ────────────────────────────────── */

export const Form = () => (
  <div className="o14-form" title="Последние восемь матчей">
    {FORM.map((w, i) => (
      <i className={w ? 'w' : 'l'} key={i}>
        {w ? 'В' : 'П'}
      </i>
    ))}
  </div>
);

export const Sets = () => (
  <div className="o14-sets o14-disp">
    {SETS.map((s, i) => (
      <div className={'st ' + (s.now ? 'now' : s.me > s.foe ? 'w' : 'l')} key={i}>
        <b>{s.me}</b>
        <b>{s.foe}</b>
      </div>
    ))}
  </div>
);

/* Личные встречи с соперником: полоса отвечает «кто в перевесе» одним взглядом,
   а список этих встреч живёт на своём экране (Э14.6). */
export const H2H = () => (
  <div className="o14-h2h">
    <div className="o14-h2h-bar">
      <i className="me" style={{ width: '60%' }} />
      <i className="foe" style={{ width: '40%' }} />
    </div>
    <div className="o14-h2h-cap">
      <span>личные встречи 3 : 2</span>
      <span>последняя — 4:2 в мою</span>
    </div>
  </div>
);

/* Обложка турнира или новости. В системе она есть: материалы федерации
   публикуются с обложкой (Э1.14), карточка турнира — с изображением.

   `plain` — слот без снимка: заливка с орнаментом, настоящую картинку кладёт
   организатор. Так нарисован вариант А после решения «фона-картинки нет»
   (22.08.2026): одна и та же дежурная фотография в двух карточках подряд была
   тем же самым стоком, только мельче. Остальные варианты пока со снимком —
   по ним решения нет. */
export const Cover = ({
  className = '',
  plain,
  children,
}: {
  className?: string;
  plain?: boolean;
  children?: React.ReactNode;
}) => (
  <div
    className={'o14-cover ' + (plain ? 'plain ' : '') + className}
    style={plain ? undefined : { backgroundImage: `url(${hero})` }}
  >
    {children}
  </div>
);

/* ═══════════ Вариант А · «Вызов на стол» ═══════════ */

/* Состояния героя. Верх экрана у А — весь экран, и держать его в одном
   состоянии нельзя: спортсмен живёт в турнире три дня в месяц, а на главную
   заходит каждый день. Поэтому герой нарисован во всех четырёх положениях, а
   не описан словами (правило «состояния рисуем, а не описываем»).

   Фона-картинки под героем нет: решение от 22.08.2026 — из шести нарисованных
   заполнений (`role14hero.tsx`) выбрана плоскость. Весь вес держат типографика
   и структура; шторки, которая раньше гасила фотографию, тоже нет.

   `off` — межсезонье, и по нему решение ещё не принято: два героя на выбор,
   `offHero='next'` (обратный отсчёт до старта) и `'season'` (итог сезона). */
export type HeroState = 'called' | 'playing' | 'soon' | 'off';
export type OffHero = 'next' | 'season';

export function HeroA({ state = 'called', offHero = 'next' }: { state?: HeroState; offHero?: OffHero }) {
  /* Межсезонье: турнира нет, и зелёная рамка «вас вызвали» здесь
     врала бы. Рамка нейтральная, вместо номера стола — то, ради чего человек
     зашёл: когда ближайший старт либо чем кончился сезон. */
  if (state === 'off') {
    return (
      <div className="oa-hero quiet">
        <div className="oa-hero-l">
          {offHero === 'next' ? (
            <>
              <span className="oa-live quiet">
                <CalendarDays size={13} /> БЛИЖАЙШИЙ СТАРТ
              </span>
              <div className="oa-table o14-disp quiet">
                <span className="t">8</span>
                <span className="k">дней</span>
              </div>
              <div className="oa-meta">
                <b>Кубок Алматы 2026</b> · ОРТ · Алматы · 12–14 сентября
              </div>
              <div className="oa-act">
                <button type="button" className="oa-go accent" data-to="Э14.4">
                  <ChevronRight size={15} /> Моя заявка
                </button>
                <div className="oa-at">
                  <b>03.09</b>
                  заявка подана
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="oa-live quiet">СЕЗОН 2026</span>
              <div className="oa-table o14-disp quiet">
                <span className="t">2456</span>
                <span className="k">рейтинг</span>
              </div>
              <div className="oa-meta">
                <b>7 место в РК</b> · +144 за сезон · 8 турниров · 64 % побед
              </div>
              <div className="oa-act">
                <button type="button" className="oa-go accent" data-to="Э14.2">
                  <CalendarDays size={15} /> Куда могу заявиться
                </button>
                <div className="oa-at">
                  <b>6</b>
                  открытых приёмов
                </div>
              </div>
            </>
          )}
        </div>

        {/* Личных встреч здесь нет намеренно: соперник не назначен, и полоса
            «3 : 2» была бы про неизвестно кого. Вместо неё — сезон. */}
        <div className="oa-foe">
          <div className="o14-eyebrow">Форма сезона</div>
          <Form />
          <div className="oa-season">
            <div>
              <b className="o14-disp">8</b>
              <span>турниров</span>
            </div>
            <div>
              <b className="o14-disp">64 %</b>
              <span>побед</span>
            </div>
            <div>
              <b className="o14-disp">128</b>
              <span>матчей</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const live = state === 'playing';
  return (
    <div className={'oa-hero' + (live ? ' live' : '')} data-to="Э14.5">
      <div className="oa-hero-l">
        <span className={'oa-live' + (live ? ' now' : '')}>
          <span className="d" />
          {live ? 'ИДЁТ МАТЧ · ПАРТИЯ 4' : state === 'soon' ? 'ВЫ СЛЕДУЮЩИЕ' : 'ВАС ВЫЗВАЛИ'}
        </span>
        <div className="oa-table o14-disp">
          <span className="t">5</span>
          <span className="k">стол</span>
        </div>
        <div className="oa-meta">
          <b>Кубок Алматы 2026</b> · 1/8 финала · одиночный разряд
        </div>
        <div className="oa-act">
          <button type="button" className={'oa-go' + (live ? ' now' : '')} data-to="Э14.5">
            <Play size={15} /> {live ? 'Смотреть счёт' : 'Открыть матч'}
          </button>
          <div className="oa-at">
            {state === 'soon' ? (
              <>
                <b>≈ 20 мин</b>
                после матча Оралбек — Смагулов
              </>
            ) : (
              <>
                <b>14:20</b>
                {live ? 'идёт 32 минуты' : 'начало'}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="oa-foe">
        <div className="oa-foe-top">
          <img src={FOE.av} alt="" />
          <div>
            <div className="nm o14-disp">Жумабеков Р.</div>
            <div className="sub">{FOE.sub}</div>
          </div>
        </div>
        {/* Идёт матч — вместо личных встреч счёт по партиям: он важнее истории,
            пока история пишется прямо сейчас. Ведёт его судья стола. */}
        {live ? <Sets /> : <H2H />}
      </div>
    </div>
  );
}

export function HomeA({
  state = 'called',
  offHero = 'next',
  hero: heroSlot,
}: {
  state?: HeroState;
  offHero?: OffHero;
  /** Подмена героя целиком: варианты фона (role14hero.tsx) отличаются только
      им, и остальной экран им незачем переписывать. */
  hero?: React.ReactNode;
} = {}) {
  return (
    <RoleScreen role={R14} nav="Главная" title="Ким Георгий" sub="Астана · СКА · КМС">
      <div className="o14">
        {/* Во время турнира экран отвечает на один вопрос: куда идти и с кем
            играть. Поэтому вызов занимает верх целиком и набран так, чтобы
            читаться с двух метров. Вне турнира тот же верх занимает то, ради
            чего человек зашёл, — см. HeroA. */}
        {heroSlot ?? <HeroA state={state} offHero={offHero} />}

        {/* Рейтинг во время турнира — справка, а не заголовок экрана: одна
            лента вместо четырёх плиток. */}
        <div className="o14-plate oa-rail">
          <div className="cell">
            <span className="v o14-disp">2456</span>
            <span className="k">рейтинг</span>
          </div>
          <div className="oa-vrule" />
          <div className="cell">
            <span className="v o14-disp">7</span>
            <span className="k">место в РК</span>
          </div>
          <div className="oa-vrule" />
          <div className="cell">
            <span className="v o14-disp up">+24</span>
            <span className="k">за последний турнир</span>
          </div>
          <div className="cell">
            <Form />
            <span className="k">форма</span>
          </div>
          <div />
          <button type="button" className="o14-link" data-to="Э14.6">
            Аналитика <ArrowRight size={13} />
          </button>
        </div>

        <div className="oa-cols">
          <div className="o14-plate">
            <div className="o14-eyebrow">Ближайшие турниры</div>
            <div className="oa-tour">
              <div className="oa-tour-row" data-to="Э14.4">
                <Cover plain />
                <div>
                  <div className="nm">Кубок Алматы 2026</div>
                  <div className="sub">ОРТ · Алматы · 12–14 сентября</div>
                  <span className="o14-pill on">ЗАЯВКА ПОДАНА</span>
                </div>
              </div>
              <div className="oa-tour-row">
                <Cover plain />
                <div>
                  <div className="nm">Чемпионат Республики Казахстан</div>
                  <div className="sub">Главный старт · Астана · 18–22 сентября</div>
                  <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
                </div>
              </div>
            </div>
          </div>

          <div className="o14-plate">
            <div className="o14-eyebrow">Последние результаты</div>
            <div className="oa-res">
              {RESULTS.map((r) => (
                <div className="oa-res-row" key={r.nm}>
                  <div>
                    <div className="nm">{r.nm}</div>
                    <div className="sub">{r.sub}</div>
                  </div>
                  <span className={'o14-score o14-disp ' + (r.win ? 'win' : 'lose')}>{r.sc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══════════ Вариант Б · «Карточка спортсмена» ═══════════ */

/* Кривая рейтинга по сыгранным турнирам — те же данные, что в аналитике
   (Э14.6), и тем же Chart.js. Своими прямоугольниками график не рисуем: по
   нарисованному не видно ни пика, ни провала. На главной он без осей —
   показывает направление, читают его на своём экране. */
const CURVE = [2312, 2298, 2340, 2361, 2355, 2402, 2432, 2456];

function RatingCurve() {
  const make = useCallback((el: HTMLCanvasElement): ChartConfiguration => {
    const line = token('--c-success', el);
    return {
      type: 'line',
      data: {
        labels: CURVE.map((_, i) => `турнир ${i + 1}`),
        datasets: [
          {
            data: CURVE,
            borderColor: line,
            borderWidth: 2,
            fill: true,
            backgroundColor: soft('--c-success', 14, el),
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: line,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 6, bottom: 0 } },
        plugins: { legend: { display: false }, tooltip: { displayColors: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    };
  }, []);
  return (
    <div className="ob-chart">
      <ChartBox make={make} height={92} label="Динамика рейтинга по турнирам сезона" />
      <div className="cap">
        <span>8 турниров сезона</span>
        <span>+144 за сезон</span>
      </div>
    </div>
  );
}

export function HomeB() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="ob">
          {/* Кто я — постоянный столбец. Экран осмыслен и вне турнира:
              рейтинг, динамика, форма и взнос никуда не деваются. */}
          <div className="o14-plate ob-card">
            <div className="ob-face">
              <img src={ME.av} alt="" />
              <div className="nm o14-disp">Ким Георгий</div>
              <div className="sub">{ME.sub}</div>
            </div>

            <div className="ob-rating">
              <div className="v o14-disp">2456</div>
              <div className="k">рейтинг · 7 место в РК</div>
              <div className="ob-delta">+24 за последний турнир</div>
            </div>

            <RatingCurve />

            <div className="ob-kv">
              <span className="k">Форма</span>
              <Form />
            </div>
            <div className="ob-kv">
              <span className="k">Матчей сыграно</span>
              <span className="v">128</span>
            </div>
            <div className="ob-kv">
              <span className="k">Доля побед</span>
              <span className="v">64 %</span>
            </div>

            <div className="ob-fee">
              <div className="ob-fee-head">
                <span className="k">Годовой взнос 2026</span>
                <span className="o14-pill ok">ОПЛАЧЕН</span>
              </div>
              <button type="button" className="ob-pay" data-to="Э14.7">
                <CreditCard size={14} /> Профиль и платежи
              </button>
            </div>
          </div>

          <div className="ob-right">
            {/* Матч идёт — счёт по партиям в реальном времени. Ведёт его судья
                стола, спортсмен только смотрит. */}
            <div className="o14-plate ob-now" data-to="Э14.5">
              <div className="ob-now-head">
                <span className="oa-live">
                  <span className="d" /> ВАС ВЫЗВАЛИ · СТОЛ 5
                </span>
                <div className="grow" />
                <span className="oa-at">14:20 · 1/8 финала · Кубок Алматы 2026</span>
              </div>
              <div className="ob-now-main">
                <div className="ob-now-foe">
                  <img src={FOE.av} alt="" />
                  <div>
                    <div className="nm o14-disp">Жумабеков Р.</div>
                    <div className="sub">{FOE.sub}</div>
                  </div>
                </div>
                <Sets />
                <div className="ob-now-table o14-disp">
                  <div className="t">5</div>
                  <div className="k">СТОЛ</div>
                </div>
              </div>
            </div>

            {/* Что дальше — одной хроникой: заявка, старт, пересчёт рейтинга.
                Каждое событие ведёт на свой экран. */}
            <div className="o14-plate">
              <div className="o14-eyebrow">Что дальше</div>
              <div className="ob-rail">
                <div className="ob-ev" data-to="Э14.4">
                  <div className="ob-when">вчера</div>
                  <div className="ob-dot-wrap"><span className="ob-dot wait" /></div>
                  <div>
                    <div className="nm">Заявка ждёт решения судьи</div>
                    <div className="sub">Кубок Алматы 2026 · подана 3 сентября</div>
                  </div>
                  <span className="o14-pill wait">ПОДАНА</span>
                </div>

                <div className="ob-ev">
                  <div className="ob-when">18 сентября</div>
                  <div className="ob-dot-wrap"><span className="ob-dot accent" /></div>
                  <div>
                    <div className="nm">Чемпионат Республики Казахстан</div>
                    <div className="sub">Главный старт · Астана · состав подаёт регион</div>
                  </div>
                  <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
                </div>

                <div className="ob-ev" data-to="Э14.6">
                  <div className="ob-when">28 августа</div>
                  <div className="ob-dot-wrap"><span className="ob-dot" /></div>
                  <div>
                    <div className="nm">Рейтинг пересчитан: +24</div>
                    <div className="sub">Открытый турнир Астаны · 1/4 финала · 3 победы, 1 поражение</div>
                  </div>
                  <span className="o14-pill ok">2456</span>
                </div>
              </div>
            </div>

            <div className="o14-plate">
              <div className="ob-fee-head">
                <div className="o14-eyebrow">Новости федерации</div>
                <button type="button" className="o14-link" data-to="Э14.13">
                  <Newspaper size={13} /> Все новости
                </button>
              </div>
              <div className="ob-news">
                {NEWS.map((n) => (
                  <div className="ob-news-card" key={n.nm} data-to="Э14.13">
                    <Cover>
                      <span className="tag">{n.tag}</span>
                    </Cover>
                    <div className="nm">{n.nm}</div>
                    <div className="at">{n.at}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══════════ Вариант В · «Лента» ═══════════ */

export function HomeV() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="ov">
          <div className="ov-head">
            <img src={ME.av} alt="" />
            <div>
              <div className="nm o14-disp">Ким Георгий</div>
              <div className="sub">{ME.sub}</div>
            </div>
            <div className="grow" />
            <div className="rt">
              <b className="o14-disp">2456</b>
              <span>7 место в РК · +24</span>
            </div>
          </div>

          {/* Единственная заливка на ленте — «сейчас»: остальное одинаково
              тихое, и глаз находит её без поиска. */}
          <div className="ov-now" data-to="Э14.5" style={{ backgroundImage: `url(${hero})` }}>
            <div className="ov-now-top">
              <span className="oa-live">
                <span className="d" /> ВАС ВЫЗВАЛИ
              </span>
              <div className="grow" />
              <span className="at">14:20 · 1/8 финала · Кубок Алматы 2026</span>
            </div>
            <div className="ov-now-main">
              <img src={FOE.av} alt="" />
              <div>
                <div className="nm o14-disp">Жумабеков Расул</div>
                <div className="sub">{FOE.sub}</div>
              </div>
              <div className="grow" />
              <div className="ov-now-table o14-disp">
                <div className="t">5</div>
                <div className="k">СТОЛ</div>
              </div>
            </div>
            <Sets />
          </div>

          <div className="ov-block">
            <div className="ov-rule">
              <span className="o14-eyebrow">Мои турниры</span>
              <span className="ln" />
              <button type="button" className="o14-link" data-to="Э14.2">
                <CalendarDays size={13} /> Календарь
              </button>
            </div>
            <div>
              <div className="ov-tour" data-to="Э14.4">
                <Cover />
                <div>
                  <div className="nm o14-disp">Кубок Алматы 2026</div>
                  <div className="sub">ОРТ · Алматы · 12–14 сентября</div>
                  <span className="o14-pill on">ЗАЯВКА ПОДАНА</span>
                </div>
              </div>
              <div className="ov-tour">
                <Cover />
                <div>
                  <div className="nm o14-disp">Чемпионат Республики Казахстан</div>
                  <div className="sub">Главный старт · Астана · 18–22 сентября</div>
                  <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ov-block">
            <div className="ov-rule">
              <span className="o14-eyebrow">Последние результаты</span>
              <span className="ln" />
              <button type="button" className="o14-link" data-to="Э14.6">
                Аналитика <ArrowRight size={13} />
              </button>
            </div>
            <div>
              {RESULTS.map((r) => (
                <div className="ov-row" key={r.nm}>
                  <div>
                    <div className="nm">{r.nm}</div>
                    <div className="sub">{r.sub}</div>
                  </div>
                  <span className={'o14-score o14-disp ' + (r.win ? 'win' : 'lose')}>{r.sc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ov-block">
            <div className="ov-rule">
              <span className="o14-eyebrow">Новости федерации</span>
              <span className="ln" />
              <button type="button" className="o14-link" data-to="Э14.13">
                <Newspaper size={13} /> Все новости
              </button>
            </div>
            <div className="ov-lead" data-to="Э14.13">
              <Cover>
                <div className="in">
                  <span className="tag">{NEWS[0].tag}</span>
                  <div className="nm o14-disp">{NEWS[0].nm}</div>
                  <div className="at">{NEWS[0].at}</div>
                </div>
              </Cover>
            </div>
            <div className="ov-row" data-to="Э14.13">
              <div>
                <div className="nm">{NEWS[1].nm}</div>
                <div className="sub">{NEWS[1].sub}</div>
              </div>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}
