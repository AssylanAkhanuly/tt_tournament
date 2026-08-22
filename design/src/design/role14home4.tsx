/* Э14.1 · Главная спортсмена — варианты Л, М, Н, О, П.

   У первых десяти общее не только содержание, но и оболочка: сайдбар слева,
   шапка сверху, обои под содержимым. С двух шагов все десять читаются как
   «одна и та же страница с разной начинкой», и выбирать по ним трудно именно
   поэтому. В этой пачке оболочка тоже становится предметом выбора: телефон
   вместо десктопа (Л), верхнее меню вместо сайдбара (М и П).

   Содержание и данные те же — импортируются из `role14home.tsx`. */

import type { ReactNode } from 'react';
import {
  ArrowRight, Bell, CalendarDays, Check, ChevronRight, Play, Trophy,
} from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { DeskFrame } from '../deskShell';
import { Frame, TabBar } from '../PlayerApp';
import { Brand } from '../ui';
import { R14 } from '../mockups/roles';
import { Cover, FOE, Form, ME, NEWS, RESULTS, Sets, hero } from './role14home';
import './role14home.css';
import './role14home4.css';

/* ── Оболочка с верхним меню (М и П) ────────────────────────────── */

function WideShell({ children }: { children: ReactNode }) {
  const nav = ['Главная', 'Календарь', 'Мой турнир', 'Аналитика', 'Новости', 'Профиль'];
  return (
    <DeskFrame>
      <div className="ow">
        <div className="ow-top">
          <Brand />
          <div className="grow" />
          <button type="button" className="iconbtn dot" data-to="Э0.3">
            <Bell size={16} />
          </button>
          <div className="ow-me">
            <img src={ME.av} alt="" />
            <div>
              <div className="nm">Ким Георгий</div>
              <div className="sub">рейтинг 2456 · 7 место</div>
            </div>
          </div>
        </div>
        <div className="ow-nav">
          {nav.map((t) => (
            <button type="button" key={t} className={t === 'Главная' ? 'on' : ''}>
              {t}
            </button>
          ))}
        </div>
        <div className="ow-body">
          <div className="ow-wrap">{children}</div>
        </div>
      </div>
    </DeskFrame>
  );
}

/* ═══════════ Вариант М · «Полоса матча» ═══════════ */

export function HomeM() {
  return (
    <WideShell>
      {/* Без сайдбара верх страницы — широкая полоса: я слева, соперник
          справа, стол и время посередине. Так подают матч на спортивных
          сайтах, и читается это одним движением слева направо. */}
      <div className="om-duel" data-to="Э14.5">
        <div className="om-side me">
          <img src={ME.av} alt="" />
          <div>
            <div className="nm o14-disp">Ким Георгий</div>
            <div className="sub">рейтинг 2456 · посев 4 · Астана, СКА</div>
            <div style={{ marginTop: 8 }}>
              <Form />
            </div>
          </div>
        </div>

        <div className="om-mid">
          <span className="rnd">Кубок Алматы · 1/8 финала</span>
          <div className="tbl o14-disp">
            <b>5</b>
            <span>СТОЛ</span>
          </div>
          <div className="at">начало 14:20 · личные встречи 3 : 2</div>
          <button type="button" className="oa-go" data-to="Э14.5">
            <Play size={14} /> Открыть матч
          </button>
        </div>

        <div className="om-side right">
          <img src={FOE.av} alt="" />
          <div>
            <div className="nm o14-disp">Жумабеков Расул</div>
            <div className="sub">рейтинг 2312 · посев 13 · Шымкент, «Кайрат»</div>
            <div style={{ marginTop: 8, justifyContent: 'flex-end', display: 'flex' }}>
              <Form />
            </div>
          </div>
        </div>
      </div>

      <div className="om-cols">
        <div className="o14-plate">
          <div className="o14-eyebrow">Мой сезон</div>
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
                <div className="nm">Чемпионат Республики Казахстан</div>
                <div className="sub">Астана · 18–22 сентября</div>
                <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
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
    </WideShell>
  );
}

/* ═══════════ Вариант Н · «Месяц» ═══════════ */

type Cell = { d: number; out?: boolean; today?: boolean; ev?: { t: string; cls: string }[] };

/* Сентябрь 2026: 1-е — вторник. Сетка с понедельника, поэтому первая клетка —
   31 августа. */
const MONTH: Cell[] = [
  { d: 31, out: true },
  { d: 1 },
  { d: 2 },
  { d: 3, ev: [{ t: 'Заявка подана', cls: 'done' }] },
  { d: 4, today: true, ev: [{ t: '14:20 · стол 5', cls: 'match' }] },
  { d: 5, ev: [{ t: 'Приём закрывается', cls: 'warn' }] },
  { d: 6 },
  { d: 7 },
  { d: 8 },
  { d: 9 },
  { d: 10 },
  { d: 11, ev: [{ t: 'Жеребьёвка', cls: 'tour' }] },
  { d: 12, ev: [{ t: 'Кубок Алматы', cls: 'tour' }] },
  { d: 13, ev: [{ t: 'Кубок Алматы', cls: 'tour' }] },
  { d: 14, ev: [{ t: 'Кубок Алматы', cls: 'tour' }] },
  { d: 15 },
  { d: 16 },
  { d: 17 },
  { d: 18, ev: [{ t: 'Чемпионат РК', cls: 'tour' }] },
  { d: 19, ev: [{ t: 'Чемпионат РК', cls: 'tour' }] },
  { d: 20, ev: [{ t: 'Чемпионат РК', cls: 'tour' }] },
  { d: 21, ev: [{ t: 'Чемпионат РК', cls: 'tour' }] },
  { d: 22, ev: [{ t: 'Чемпионат РК', cls: 'tour' }] },
  { d: 23 },
  { d: 24 },
  { d: 25 },
  { d: 26 },
  { d: 27 },
  { d: 28 },
  { d: 29 },
  { d: 30 },
  { d: 1, out: true },
  { d: 2, out: true },
  { d: 3, out: true },
  { d: 4, out: true },
];

export function HomeN() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div>
          <div className="on-head">
            <span className="m o14-disp">Сентябрь</span>
            <span className="y">2026 · мой месяц</span>
            <span className="grow" />
            <button type="button" className="o14-link" data-to="Э14.2">
              <CalendarDays size={13} /> Весь календарь
            </button>
          </div>

          <div className="on-grid">
            {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((d) => (
              <div className="on-dow" key={d}>{d}</div>
            ))}
            {MONTH.map((c, i) => (
              <div
                className={'on-cell' + (c.out ? ' out' : '') + (c.today ? ' today' : '')}
                key={i}
              >
                <span className="d o14-disp">{c.d}</span>
                {c.ev?.map((e) => (
                  <span className={'on-ev ' + e.cls} key={e.t} data-to={e.cls === 'match' ? 'Э14.5' : 'Э14.4'}>
                    {e.t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="on-foot">
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
            <div className="o14-eyebrow">Сегодня</div>
            <div className="oz-bar" style={{ marginTop: 'var(--s-3)' }} data-to="Э14.5">
              <div className="tbl o14-disp">
                <b>5</b>
                <span>СТОЛ</span>
              </div>
              <span className="oa-live">
                <span className="d" /> ВЫЗВАЛИ
              </span>
              <div className="who">
                <div className="nm o14-disp">Жумабеков Р.</div>
                <div className="sub">1/8 финала · 14:20</div>
              </div>
              <div />
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══════════ Вариант О · «Дневник» ═══════════ */

export function HomeO() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="oo">
          <div style={{ display: 'grid', gap: 'var(--s-4)' }}>
            {/* Цель сезона и сколько до неё осталось. Экран отвечает не «что у
                тебя есть», а «куда ты идёшь». */}
            <div className="o14-plate oo-goal">
              <div className="o14-eyebrow">Цель сезона — пятёрка Казахстана</div>
              <div className="oo-goal-head">
                <span className="v o14-disp">2456</span>
                <span className="s">
                  7 место · до пятого не хватает <b>68 очков</b> — это одна победа
                  над игроком из первой десятки
                </span>
              </div>
              <div className="oo-track">
                <div className="oo-bar">
                  <i style={{ width: '72%' }} />
                </div>
                <div className="oo-scale">
                  <span>начало сезона 2312</span>
                  <span>сейчас 2456</span>
                  <span>цель 2524</span>
                </div>
              </div>
            </div>

            <div className="o14-plate">
              <div className="o14-eyebrow">Что для этого сделать</div>
              <div className="oo-steps">
                <div className="oo-step">
                  <span className="oo-mark done"><Check size={12} /></span>
                  <div>
                    <div className="nm done">Оплатить годовой взнос 2026</div>
                    <div className="sub">оплачено 12 февраля · без него заявки не проходят</div>
                  </div>
                  <span className="o14-pill ok">ГОТОВО</span>
                </div>
                <div className="oo-step">
                  <span className="oo-mark done"><Check size={12} /></span>
                  <div>
                    <div className="nm done">Подать заявку на Кубок Алматы</div>
                    <div className="sub">подана 3 сентября · решение судьи придёт уведомлением</div>
                  </div>
                  <span className="o14-pill ok">ГОТОВО</span>
                </div>
                <div className="oo-step" data-to="Э14.5">
                  <span className="oo-mark now" />
                  <div>
                    <div className="nm">Выиграть 1/8 финала — стол 5, 14:20</div>
                    <div className="sub">Жумабеков Расул (2312) · победа даёт примерно +18</div>
                  </div>
                  <span className="o14-pill on">СЕЙЧАС</span>
                </div>
                <div className="oo-step" data-to="Э14.2">
                  <span className="oo-mark" />
                  <div>
                    <div className="nm">Заявиться на Открытый турнир Шымкента</div>
                    <div className="sub">приём закрывается 5 сентября в 18:00</div>
                  </div>
                  <span className="o14-pill wait">ДО 05.09</span>
                </div>
                <div className="oo-step">
                  <span className="oo-mark" />
                  <div>
                    <div className="nm">Пройти отбор в состав региона</div>
                    <div className="sub">Чемпионат РК 18–22 сентября · состав подаёт старший тренер</div>
                  </div>
                  <span className="o14-pill wait">НЕ ОТ МЕНЯ</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 'var(--s-4)', alignContent: 'start' }}>
            <div className="o14-plate">
              <div className="o14-eyebrow">Форма</div>
              <div style={{ marginTop: 'var(--s-3)' }}>
                <Form />
              </div>
              <div className="ob-kv" style={{ borderTop: 0, padding: 'var(--s-3) 0 0' }}>
                <span className="k">Доля побед</span>
                <span className="v">64 %</span>
              </div>
              <div className="ob-kv" style={{ padding: '9px 0' }}>
                <span className="k">Матчей за сезон</span>
                <span className="v">128</span>
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

            <div className="o14-plate">
              <div className="o14-eyebrow">Новости федерации</div>
              <div className="oa-news" style={{ marginTop: 'var(--s-3)' }}>
                {NEWS.map((n) => (
                  <div className="oa-news-row" key={n.nm} data-to="Э14.13">
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

/* ═══════════ Вариант П · «Витрина» ═══════════ */

export function HomeP() {
  return (
    <WideShell>
      <div className="op-hero" data-to="Э14.5" style={{ backgroundImage: `url(${hero})` }}>
        <div className="op-in">
          <span className="tag">ВАС ВЫЗВАЛИ · СТОЛ 5</span>
          <div className="nm o14-disp">Ким — Жумабеков</div>
          <div className="sub">
            Кубок Алматы 2026 · 1/8 финала · начало 14:20 · личные встречи 3 : 2
          </div>
          <button type="button" className="oi-go" data-to="Э14.5">
            <Play size={15} /> Открыть матч
          </button>
        </div>
      </div>

      <div className="op-row">
        <div className="op-row-h">
          <span className="t o14-disp">Мой сезон</span>
          <span className="grow" />
          <button type="button" className="o14-link" data-to="Э14.6">
            Аналитика <ArrowRight size={13} />
          </button>
        </div>
        <div className="op-strip">
          <div className="op-card stat">
            <span className="v o14-disp">2456</span>
            <span className="k">рейтинг · 7 место</span>
          </div>
          <div className="op-card stat">
            <span className="v o14-disp" style={{ color: 'var(--c-success)' }}>+24</span>
            <span className="k">за последний турнир</span>
          </div>
          <div className="op-card stat">
            <span className="v o14-disp">64 %</span>
            <span className="k">побед · 128 матчей</span>
          </div>
          <div className="op-card stat">
            <Form />
            <span className="k">форма</span>
          </div>
        </div>
      </div>

      <div className="op-row">
        <div className="op-row-h">
          <span className="t o14-disp">Мои турниры</span>
          <span className="grow" />
          <button type="button" className="o14-link" data-to="Э14.2">
            <CalendarDays size={13} /> Календарь
          </button>
        </div>
        <div className="op-strip">
          {[
            { nm: 'Кубок Алматы 2026', sub: 'ОРТ · Алматы · 12–14 сентября', pill: 'ЗАЯВКА ПОДАНА', cls: 'on' },
            { nm: 'Чемпионат Республики Казахстан', sub: 'Астана · 18–22 сентября', pill: 'ЗАЯВЛЯЕТ РЕГИОН', cls: 'wait' },
            { nm: 'Открытый турнир Шымкента', sub: 'ОРТ · приём до 5 сентября', pill: 'МОЖНО ЗАЯВИТЬСЯ', cls: 'ok' },
            { nm: 'Кубок Караганды', sub: 'ОРТ · 3–5 октября', pill: 'МОЖНО ЗАЯВИТЬСЯ', cls: 'ok' },
          ].map((t) => (
            <div className="op-card" key={t.nm} data-to="Э14.4">
              <Cover />
              <div className="in">
                <span className={'o14-pill ' + t.cls} style={{ justifySelf: 'start' }}>{t.pill}</span>
                <div className="nm">{t.nm}</div>
                <div className="sub">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="op-row">
        <div className="op-row-h">
          <span className="t o14-disp">Последние матчи</span>
        </div>
        <div className="op-strip">
          {RESULTS.map((r) => (
            <div className="op-card" key={r.nm}>
              <div className="in" style={{ padding: 'var(--s-4)' }}>
                <span className={'sc o14-disp ' + (r.win ? 'win' : 'lose')}>{r.sc}</span>
                <div className="nm">{r.nm}</div>
                <div className="sub">{r.sub}</div>
              </div>
            </div>
          ))}
          <div className="op-card">
            <div className="in" style={{ padding: 'var(--s-4)' }}>
              <span className="sc o14-disp">
                <Trophy size={22} />
              </span>
              <div className="nm">Все матчи сезона</div>
              <div className="sub">история турниров и дельта рейтинга</div>
            </div>
          </div>
        </div>
      </div>

      <div className="op-row">
        <div className="op-row-h">
          <span className="t o14-disp">Новости федерации</span>
          <span className="grow" />
          <button type="button" className="o14-link" data-to="Э14.13">
            Все новости <ArrowRight size={13} />
          </button>
        </div>
        <div className="op-strip">
          {[...NEWS, ...NEWS].map((n, i) => (
            <div className="op-card" key={i} data-to="Э14.13">
              <Cover />
              <div className="in">
                <div className="nm">{n.nm}</div>
                <div className="sub">{n.at}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WideShell>
  );
}

/* ═══════════ Вариант Л · «Приложение» ═══════════ */

export function HomeL() {
  return (
    <div className="ol-wrap">
      <Frame>
        <div className="ol">
          <div className="ol-top">
            <img src={ME.av} alt="" />
            <div>
              <div className="nm">Ким Георгий</div>
              <div className="sub">Астана · СКА</div>
            </div>
            <div className="grow" />
            <div className="rt">
              <b className="o14-disp">2456</b>
              <span>7 место · +24</span>
            </div>
          </div>

          <div className="ol-call" data-to="Э14.5">
            <span className="t">ВАС ВЫЗВАЛИ</span>
            <div className="ol-call-main">
              <img src={FOE.av} alt="" />
              <div>
                <div className="nm">Жумабеков Р.</div>
                <div className="sub">1/8 финала · 14:20</div>
              </div>
              <div className="grow" />
              <div className="tbl o14-disp">
                <b>5</b>
                <span>СТОЛ</span>
              </div>
            </div>
            <Sets />
            <button type="button" className="ol-go" data-to="Э14.5">
              <Play size={15} /> Открыть матч
            </button>
          </div>

          <div className="ol-sec">
            <span className="t">Мои турниры</span>
            <span className="ln" />
          </div>
          <div>
            <div className="ol-row" data-to="Э14.4">
              <div>
                <div className="nm">Кубок Алматы 2026</div>
                <div className="sub">Алматы · 12–14 сентября</div>
              </div>
              <span className="o14-pill on">ПОДАНА</span>
            </div>
            <div className="ol-row">
              <div>
                <div className="nm">Чемпионат РК</div>
                <div className="sub">Астана · 18–22 сентября</div>
              </div>
              <span className="o14-pill wait">РЕГИОН</span>
            </div>
          </div>

          <div className="ol-sec">
            <span className="t">Последние результаты</span>
            <span className="ln" />
          </div>
          <div>
            {RESULTS.slice(0, 2).map((r) => (
              <div className="ol-row" key={r.nm}>
                <div>
                  <div className="nm">{r.nm}</div>
                  <div className="sub">{r.sub}</div>
                </div>
                <span className={'o14-score o14-disp ' + (r.win ? 'win' : 'lose')}>{r.sc}</span>
              </div>
            ))}
          </div>

          <div className="ol-sec">
            <span className="t">Новости</span>
            <span className="ln" />
          </div>
          <div className="ol-news" data-to="Э14.13">
            <Cover />
            <div className="nm">{NEWS[0].nm}</div>
            <div className="at">{NEWS[0].at}</div>
          </div>
        </div>
        <TabBar active="home" />
      </Frame>
    </div>
  );
}

