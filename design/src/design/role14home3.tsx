/* Э14.1 · Главная спортсмена — варианты Ж, З, И, К.

   Первые шесть (А–Е) — в `role14home.tsx` и `role14home2.tsx`. Эти четыре
   строятся не вокруг раскладки, а вокруг вещи, на которую спортсмен смотрит и
   без нас: турнирная сетка, уведомления, афиша соревнования, соперник.

   Содержание то же и данные те же — импортируются из `role14home.tsx`. */

import { ArrowRight, Bell, CalendarDays, ChevronDown, Play, Scale, Trophy } from 'lucide-react';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { myBracket } from '../mockups/myBracket';
import { Cover, FOE, Form, NEWS, RESULTS, Sets, hero } from './role14home';
import './role14home.css';
import './role14home3.css';

/* ═══════════ Вариант Ж · «Сетка» ═══════════ */

export function HomeZ() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Ким Георгий" sub="Астана · СКА · КМС">
      <div className="o14">
        <div className="oz">
          <div className="oz-bar" data-to="Э14.5">
            <div className="tbl o14-disp">
              <b>5</b>
              <span>СТОЛ</span>
            </div>
            <span className="oa-live">
              <span className="d" /> ВАС ВЫЗВАЛИ
            </span>
            <div className="who">
              <div className="nm o14-disp">Жумабеков Расул</div>
              <div className="sub">1/8 финала · Кубок Алматы 2026 · рейтинг 2312</div>
            </div>
            <div className="at">начало 14:20</div>
            <button type="button" className="oa-go" data-to="Э14.5">
              <Play size={14} /> Открыть матч
            </button>
          </div>

          {/* Сетка настоящая — тот же компонент, что во фронте (React Flow), с
              панорамой и зумом. Нарисованная картинка не отвечает на вопрос
              «а с кем я играю дальше, если пройду». */}
          <div className="oz-net">
            <div className="oz-net-h">
              <span className="o14-eyebrow">Мой путь · Кубок Алматы 2026</span>
              <span className="grow" />
              <span className="path">
                1/8 <b>сейчас</b> · дальше 1/4 с победителем пары Оралбек — Смагулов
              </span>
            </div>
            <BracketFlow bracket={myBracket} minZoom={0.15} fitPadding={0.06} />
          </div>

          <div className="oz-foot">
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
                <span className="k">за турнир</span>
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

            <div className="o14-plate">
              <div className="o14-eyebrow">Следующий старт</div>
              <div className="oa-tour">
                <div className="oa-tour-row" data-to="Э14.4">
                  <Cover />
                  <div>
                    <div className="nm">Чемпионат Республики Казахстан</div>
                    <div className="sub">Астана · 18–22 сентября</div>
                    <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══════════ Вариант З · «Разговор» ═══════════ */

export function HomeC() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="oc">
          <div className="oc-day">
            Сегодня <span className="ln" />
          </div>

          <div className="oc-msg">
            <span className="oc-ava ok"><Bell size={17} /></span>
            <div className="oc-body hot">
              <div className="oc-from">
                Главный судья
                <span className="at">14:12</span>
              </div>
              <div className="oc-text">
                Вас вызвали. Подойдите к <b>столу 5</b> — 1/8 финала Кубка Алматы 2026,
                соперник Жумабеков Расул.
              </div>
              <Sets />
              <div className="oc-act">
                <button type="button" className="oc-btn ok" data-to="Э14.5">
                  <Play size={14} /> Открыть матч
                </button>
                <span className="oc-from" style={{ letterSpacing: 0, textTransform: 'none' }}>
                  начало 14:20
                </span>
              </div>
            </div>
          </div>

          <div className="oc-msg">
            <span className="oc-ava"><Scale size={17} /></span>
            <div className="oc-body">
              <div className="oc-from">
                Судейская коллегия
                <span className="at">вчера</span>
              </div>
              <div className="oc-text">
                Заявка на <b>Кубок Алматы 2026</b> принята. Жеребьёвка — 11 сентября,
                посев по рейтингу.
              </div>
              <div className="oc-act">
                <button type="button" className="oc-btn ghost" data-to="Э14.4">
                  Моя заявка
                </button>
              </div>
            </div>
          </div>

          <div className="oc-day">
            28 августа <span className="ln" />
          </div>

          <div className="oc-msg">
            <span className="oc-ava ok"><Trophy size={17} /></span>
            <div className="oc-body">
              <div className="oc-from">
                Рейтинг
                <span className="at">28.08</span>
              </div>
              <div className="oc-text">Открытый турнир Астаны завершён, рейтинг пересчитан.</div>
              <div className="oc-big o14-disp">
                2456 <span className="u">+24</span>
              </div>
              <div className="oc-text" style={{ fontSize: 13 }}>
                7 место в РК · 1/4 финала · 3 победы, 1 поражение
              </div>
              <div className="oc-act">
                <button type="button" className="oc-btn ghost" data-to="Э14.6">
                  Как сложилась дельта
                </button>
              </div>
            </div>
          </div>

          <div className="oc-msg">
            <span className="oc-ava warn"><CalendarDays size={17} /></span>
            <div className="oc-body">
              <div className="oc-from">
                Пресс-служба ФНТ РК
                <span className="at">15.04</span>
              </div>
              <div className="oc-media">
                <Cover />
                <div>
                  <div className="oc-text" style={{ fontSize: 15 }}>{NEWS[0].nm}</div>
                  <div className="oc-text" style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>
                    {NEWS[0].sub}
                  </div>
                </div>
              </div>
              <div className="oc-act">
                <button type="button" className="oc-btn ghost" data-to="Э14.2">
                  Календарь сезона
                </button>
              </div>
            </div>
          </div>

          <div className="oc-day">
            <span className="ln" /> Показать раньше <span className="ln" />
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══════════ Вариант И · «Афиша» ═══════════ */

export function HomeI() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="oi-poster" data-to="Э14.5" style={{ backgroundImage: `url(${hero})` }}>
          <div className="oi-in">
            <span className="oi-tag">
              <span className="d" /> ВАС ВЫЗВАЛИ
            </span>
            <div className="oi-main">
              <div className="oi-table o14-disp">
                <b>5</b>
                <span>СТОЛ</span>
              </div>
              <div className="oi-who">
                <div className="nm o14-disp">Жумабеков Расул</div>
                <div className="sub">
                  Кубок Алматы 2026 · 1/8 финала · рейтинг 2312 · личные встречи 3 : 2
                </div>
              </div>
              <div className="oi-when o14-disp">
                <b>14:20</b>
                <span>НАЧАЛО</span>
              </div>
            </div>
            <div className="oi-act">
              <button type="button" className="oi-go" data-to="Э14.5">
                <Play size={16} /> Открыть матч
              </button>
              <span className="oi-scroll">
                <ChevronDown size={14} /> Рейтинг, турниры и новости — ниже
              </span>
            </div>
          </div>
        </div>

        {/* За сгибом — обычная сводка. Она есть, но экран не начинается с неё. */}
        <div className="oi-below">
          <div className="o14-plate">
            <div className="o14-eyebrow">Рейтинг</div>
            <div className="oa-rail" style={{ padding: 0, gridTemplateColumns: 'auto auto', gap: 'var(--s-5)' }}>
              <div className="cell">
                <span className="v o14-disp">2456</span>
                <span className="k">7 место в РК</span>
              </div>
              <div className="cell">
                <span className="v o14-disp up">+24</span>
                <span className="k">за турнир</span>
              </div>
            </div>
          </div>
          <div className="o14-plate">
            <div className="o14-eyebrow">Ближайший старт</div>
            <div className="oa-tour">
              <div className="oa-tour-row" data-to="Э14.4">
                <Cover />
                <div>
                  <div className="nm">Кубок Алматы 2026</div>
                  <div className="sub">ОРТ · Алматы · 12–14 сентября</div>
                </div>
              </div>
            </div>
          </div>
          <div className="o14-plate">
            <div className="o14-eyebrow">Последние результаты</div>
            <div className="oa-res">
              {RESULTS.slice(0, 2).map((r) => (
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

/* ═══════════ Вариант К · «Соперник» ═══════════ */

const MEETS = [
  { at: '24.02.2026', nm: 'Кубок Казахстана · 1/4 финала', sc: '4:2', win: true },
  { at: '11.11.2025', nm: 'Открытый турнир Астаны · 1/2', sc: '2:4', win: false },
  { at: '03.09.2025', nm: 'Кубок Алматы · 1/8 финала', sc: '3:1', win: true },
  { at: '17.05.2025', nm: 'Чемпионат РК · группа', sc: '1:3', win: false },
  { at: '02.03.2025', nm: 'Открытый турнир Шымкента · 1/4', sc: '3:0', win: true },
];

export function HomeK() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="osop">
          {/* Кто напротив. Портрет крупно: перед матчем спортсмен смотрит не в
              сводку сезона, а на соперника. */}
          <div className="o14-plate ok-card">
            <div className="ok-photo" style={{ backgroundImage: `url(${FOE.av})` }}>
              <div className="in">
                <div className="k">Соперник · 1/8 финала</div>
                <div className="nm o14-disp">Жумабеков Расул</div>
                <div className="sub">Шымкент · «Кайрат» · МС · посев 13</div>
              </div>
            </div>
            <div className="ok-kv">
              <span className="k">Рейтинг</span>
              <span className="v">2312 · 14 место</span>
            </div>
            <div className="ok-kv">
              <span className="k">Форма</span>
              <Form />
            </div>
            <div className="ok-kv">
              <span className="k">Игровая рука</span>
              <span className="v">правая, хватка европейская</span>
            </div>
            <div className="ok-kv">
              <span className="k">В этом турнире</span>
              <span className="v">3 матча, ни одного поражения</span>
            </div>
          </div>

          <div className="ok-right">
            <div className="o14-plate ok-when" data-to="Э14.5">
              <div className="tbl o14-disp">
                <b>5</b>
                <span>СТОЛ</span>
              </div>
              <span className="oa-live">
                <span className="d" /> ВАС ВЫЗВАЛИ
              </span>
              <div className="at">
                <b className="o14-disp">14:20</b>
                <span>Кубок Алматы 2026 · 1/8 финала</span>
              </div>
              <button type="button" className="oa-go" data-to="Э14.5">
                <Play size={14} /> Открыть матч
              </button>
            </div>

            <div className="o14-plate ok-h2h">
              <div className="o14-eyebrow">Личные встречи</div>
              <div className="ok-h2h-head">
                <span className="v o14-disp">3 : 2</span>
                <span className="s">
                  в мою пользу · пять встреч с 2025 года · последняя — 4:2 в мою
                </span>
              </div>
              <div className="o14-h2h-bar">
                <i className="me" style={{ width: '60%' }} />
                <i className="foe" style={{ width: '40%' }} />
              </div>
              <div className="ok-meets">
                {MEETS.map((m) => (
                  <div className="ok-meet" key={m.at}>
                    <span className="at">{m.at}</span>
                    <span className="nm">{m.nm}</span>
                    <span className={'o14-score o14-disp ' + (m.win ? 'win' : 'lose')}>{m.sc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="o14-plate oa-rail">
              <div className="cell">
                <span className="v o14-disp">2456</span>
                <span className="k">мой рейтинг</span>
              </div>
              <div className="oa-vrule" />
              <div className="cell">
                <span className="v o14-disp">7</span>
                <span className="k">место в РК</span>
              </div>
              <div className="oa-vrule" />
              <div className="cell">
                <span className="v o14-disp up">+24</span>
                <span className="k">за турнир</span>
              </div>
              <div className="cell">
                <Form />
                <span className="k">моя форма</span>
              </div>
              <div />
              <button type="button" className="o14-link" data-to="Э14.6">
                Аналитика <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}
