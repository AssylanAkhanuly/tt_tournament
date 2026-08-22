/* Э14.1 · Главная спортсмена — три варианта дизайна.

   Содержание задано флоу (flows/14-sportsmen.md, Э14.1) и у всех трёх одно:
   мой рейтинг (значение, место, дельта), ближайший турнир с состоянием заявки,
   «сейчас играю» во время турнира и лента новостей федерации. Варианты
   отличаются одним — что на экране главное.

   Оболочка роли (шапка, сайдбар, пункт «Главная») у всех одна и та же:
   сравнивать надо решение, а не хром вокруг него. */

import { ArrowRight, CalendarDays, ChevronRight, CreditCard, Newspaper, Play } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { A } from '../fedCommon';
import { R14 } from '../mockups/roles';
import './role14home.css';

/* Данные макета — те же, что в существующих макетах роли 14: спортсмен
   Ким Георгий, соперник Жумабеков Расул, Кубок Алматы 2026. Правдоподобные,
   но выдуманные. */
const ME = { nm: 'Ким Георгий', sub: 'Астана · СКА · КМС', av: A(44) };
const FOE = { nm: 'Жумабеков Расул', sub: 'рейтинг 2312 · Шымкент', av: A(22) };

/* Последние результаты — их требует флоу в ленте главной. Счёт по партиям
   ведёт судья, спортсмен его не вводит: здесь он только показан. */
const RESULTS = [
  { nm: 'Оралбек Диас', sub: '1/4 финала · Кубок Алматы', sc: '3:1', win: true },
  { nm: 'Смагулов Ерлан', sub: 'финал · Открытый турнир Астаны', sc: '2:4', win: false },
  { nm: 'Тлеуберди Асан', sub: '1/2 финала · Открытый турнир Астаны', sc: '4:2', win: true },
];

const NEWS = [
  {
    tag: 'КАЛЕНДАРЬ',
    nm: 'Календарь сезона 2026 опубликован',
    sub: 'Восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых республиканских турниров.',
    at: '15 апреля',
  },
  {
    tag: 'ВЗНОСЫ',
    nm: 'Годовой взнос: срок до 31 марта',
    sub: 'Без оплаты заявки на турниры, где взнос обязателен, не проходят.',
    at: '2 марта',
  },
];

/* ═══════════ Вариант А · «Вызов на стол» ═══════════ */

export function HomeA() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Ким Георгий" sub="Астана · СКА · КМС">
      <div className="o14">
        {/* Во время турнира экран отвечает на один вопрос: куда идти и с кем
            играть. Поэтому вызов занимает верх целиком, а не панель в ряду. */}
        <div className="oa-call" data-to="Э14.5">
          <div className="oa-table">
            <b>5</b>
            <span>СТОЛ</span>
          </div>

          <div className="oa-vs">
            <img className="oa-face" src={ME.av} alt="" />
            <div className="oa-side">
              <div className="nm">Ким Г.</div>
              <div className="sub">рейтинг 2456 · посев 4</div>
            </div>
            <span className="oa-x">—</span>
            <img className="oa-face" src={FOE.av} alt="" />
            <div className="oa-side">
              <div className="nm">Жумабеков Р.</div>
              <div className="sub">рейтинг 2312 · посев 13</div>
            </div>
          </div>

          <div className="oa-when">
            <div className="t">14:20</div>
            <div className="r">1/8 финала · Кубок Алматы</div>
            <button type="button" className="oa-go" data-to="Э14.5">
              <Play size={14} /> Открыть матч
            </button>
          </div>
        </div>

        {/* Рейтинг во время турнира — справка, а не заголовок экрана: строка
            вместо четырёх плиток. */}
        <div className="oa-rating">
          <div>
            <span className="big">2456</span> <span className="lbl">рейтинг</span>
          </div>
          <div className="oa-sep" />
          <div>
            <span className="big">7</span> <span className="lbl">место в РК</span>
          </div>
          <div className="oa-sep" />
          <div>
            <span className="up">+24</span> <span className="lbl">за последний турнир</span>
          </div>
          <div className="oa-sep" />
          <div>
            <span className="big">128</span> <span className="lbl">матчей</span>
          </div>
          <div className="grow" />
          <button type="button" className="oa-link" data-to="Э14.6">
            Аналитика <ArrowRight size={13} />
          </button>
        </div>

        <div className="oa-cols">
          <div className="o14-card">
            <div className="o14-eyebrow">Ближайшие турниры</div>
            <div className="oa-tour">
              <div className="oa-tour-row" data-to="Э14.4">
                <span className="o14-pill on">ЗАЯВКА ПОДАНА</span>
                <div className="nm">Кубок Алматы 2026</div>
                <div className="sub">ОРТ · Алматы · 12–14 сентября</div>
              </div>
              <div className="oa-tour-row">
                <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
                <div className="nm">Чемпионат Республики Казахстан</div>
                <div className="sub">Главный старт · Астана · 18–22 сентября</div>
              </div>
            </div>
          </div>

          <div className="o14-card">
            <div className="o14-eyebrow">Последние результаты</div>
            <div className="oa-res">
              {RESULTS.map((r) => (
                <div className="oa-res-row" key={r.nm}>
                  <div>
                    <div className="nm">{r.nm}</div>
                    <div className="sub">{r.sub}</div>
                  </div>
                  <span className={'oa-score ' + (r.win ? 'win' : 'lose')}>{r.sc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="o14-card">
            <div className="o14-eyebrow">Новости федерации</div>
            <div className="oa-news">
              {NEWS.map((n) => (
                <div className="oa-news-row" key={n.nm} data-to="Э14.13">
                  <div className="nm">{n.nm}</div>
                  <div className="sub">{n.sub}</div>
                  <div className="at">{n.at}</div>
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

/* Кривая рейтинга по последним турнирам — те же данные, что в аналитике
   (Э14.6). На главной она без осей и подписей: показывает направление, а
   читают её на своём экране. */
const SPARK = [2312, 2298, 2340, 2361, 2355, 2402, 2432, 2456];

function Spark() {
  const min = Math.min(...SPARK);
  const max = Math.max(...SPARK);
  const pts = SPARK.map((v, i) => {
    const x = (i / (SPARK.length - 1)) * 100;
    const y = 38 - ((v - min) / (max - min)) * 34;
    return `${x},${y}`;
  });
  return (
    <div className="ob-spark">
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden>
        <polyline
          points={pts.join(' ')}
          fill="none"
          stroke="var(--c-success)"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="cap">
        <span>8 турниров сезона</span>
        <span>+144 за сезон</span>
      </div>
    </div>
  );
}

export function HomeB() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная" sub="">
      <div className="o14 o14-nohead">
        <div className="ob">
          {/* Кто я — постоянный столбец. Экран осмыслен и вне турнира: рейтинг,
              динамика, взнос никуда не деваются. */}
          <div className="ob-card">
            <div className="ob-face">
              <img src={ME.av} alt="" />
              <div>
                <div className="nm">{ME.nm}</div>
                <div className="sub">{ME.sub}</div>
              </div>
            </div>

            <div className="ob-rating">
              <div className="v">2456</div>
              <div className="k">Рейтинг · 7 место в РК</div>
              <div className="ob-delta">+24 за последний турнир</div>
            </div>

            <Spark />

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

          {/* Что дальше — одной хроникой: вызов, заявка, турнир, пересчёт
              рейтинга. Каждое событие ведёт на свой экран. */}
          <div>
            <div className="o14-eyebrow">Что дальше</div>
            <div className="ob-rail">
              <div className="ob-ev" data-to="Э14.5">
                <div className="ob-when">сейчас</div>
                <div className="ob-dot-wrap"><span className="ob-dot live" /></div>
                <div>
                  <div className="nm">Вас вызвали — подойдите к столу 5</div>
                  <div className="sub">
                    1/8 финала · Жумабеков Расул (2312) · Кубок Алматы 2026
                  </div>
                </div>
                <span className="o14-pill ok">СТОЛ 5</span>
              </div>

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

            <div className="ob-news">
              <div className="ob-news-head">
                <div className="o14-eyebrow">Новости федерации</div>
                <button type="button" className="oa-link" data-to="Э14.13">
                  <Newspaper size={13} /> Все новости
                </button>
              </div>
              {NEWS.map((n) => (
                <div className="ov-row" key={n.nm} data-to="Э14.13">
                  <div>
                    <div className="nm">{n.nm}</div>
                    <div className="sub">{n.sub}</div>
                  </div>
                  <ChevronRight size={16} />
                </div>
              ))}
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
    <RoleScreen role={R14} nav="Главная" title="Главная" sub="">
      <div className="o14 o14-nohead">
        <div className="ov">
          <div className="ov-head">
            <img src={ME.av} alt="" />
            <div>
              <div className="nm">{ME.nm}</div>
              <div className="sub">{ME.sub}</div>
            </div>
            <div className="grow" />
            <div className="rt">
              <b>2456</b>
              <span>рейтинг · 7 место · +24</span>
            </div>
          </div>

          {/* Сейчас — единственный блок с заливкой: всё остальное на ленте
              одинаково тихое, и глаз находит его без поиска. */}
          <div className="ov-now" data-to="Э14.5">
            <div className="ov-now-top">
              <span className="t">ВАС ВЫЗВАЛИ</span>
              <div className="grow" />
              <span className="at">14:20 · 1/8 финала</span>
            </div>
            <div className="ov-now-main">
              <img src={FOE.av} alt="" />
              <div>
                <div className="nm">{FOE.nm}</div>
                <div className="sub">{FOE.sub}</div>
              </div>
              <div className="grow" />
              <div className="ov-now-table">
                <b>5</b>
                <span>СТОЛ</span>
              </div>
            </div>
          </div>

          <div className="ov-block">
            <div className="ov-rule">
              <span className="o14-eyebrow">Мои турниры</span>
              <span className="ln" />
              <button type="button" className="oa-link" data-to="Э14.2">
                <CalendarDays size={13} /> Календарь
              </button>
            </div>
            <div>
              <div className="ov-row" data-to="Э14.4">
                <div>
                  <div className="nm">Кубок Алматы 2026</div>
                  <div className="sub">ОРТ · Алматы · 12–14 сентября</div>
                </div>
                <span className="o14-pill on">ЗАЯВКА ПОДАНА</span>
              </div>
              <div className="ov-row">
                <div>
                  <div className="nm">Чемпионат Республики Казахстан</div>
                  <div className="sub">Главный старт · Астана · 18–22 сентября</div>
                </div>
                <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
              </div>
            </div>
          </div>

          <div className="ov-block">
            <div className="ov-rule">
              <span className="o14-eyebrow">Последние результаты</span>
              <span className="ln" />
              <button type="button" className="oa-link" data-to="Э14.6">
                <ArrowRight size={13} /> Аналитика
              </button>
            </div>
            <div>
              {RESULTS.map((r) => (
                <div className="ov-row" key={r.nm}>
                  <div>
                    <div className="nm">{r.nm}</div>
                    <div className="sub">{r.sub}</div>
                  </div>
                  <span className={'oa-score ' + (r.win ? 'win' : 'lose')}>{r.sc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ov-block">
            <div className="ov-rule">
              <span className="o14-eyebrow">Новости федерации</span>
              <span className="ln" />
              <button type="button" className="oa-link" data-to="Э14.13">
                <Newspaper size={13} /> Все новости
              </button>
            </div>
            <div>
              {NEWS.map((n, i) => (
                <div className="ov-news-card" key={n.nm} data-to="Э14.13">
                  <div className={'ov-cover' + (i ? ' alt' : '')} />
                  <div>
                    <div className="tag">{n.tag}</div>
                    <div className="nm">{n.nm}</div>
                    <div className="at">{n.at}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}
