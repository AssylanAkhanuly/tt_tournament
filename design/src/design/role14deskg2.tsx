/* Э14.1 · Главная спортсмена — выбранный облик Г-2 на десктопе.

   Мобильный экран выбран 23.08.2026 (flows/14-sportsmen.md: «дизайн: вариант
   Г-2»). Десктоп — тот же облик, а не другой дизайн: тёмно-синее спокойное
   поле с лентой орнамента, на него наезжает белый лист, действие лежит на
   границе планов и покрашено цветом орнамента, только светлее (`--c-action`).
   Зелёный остаётся статусам — победа в счёте, «открыт приём».

   Что меняется от телефона к десктопу — не язык, а плотность: поле становится
   лентой во всю ширину (турнир слева, расписание справа), а лист раскладывается
   в три колонки вместо одной. Ни одного нового цвета и ни одной новой формы.

   Содержание — то же и оттуда же: flows/14-sportsmen.md, Э14.1. */

import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import type { DeskVariant } from '../deskShell';
import { DAY, TOURS_FIELD, type Tour } from './role14day';
import { Deck } from './role14mobile';
import { NEWS, RESULTS } from './role14home';
import './role14deskg2.css';

const OPEN = TOURS_FIELD.filter((t) => t.kind === 'open');

export function HomeG2Desk({ variant }: { variant?: DeskVariant } = {}) {
  /* Поле листается так же, как на телефоне: первый турнир — текущий, дальше
     открытые приёмы. Действие под полем при этом НЕ ЕЗДИТ со слайдом: кнопка
     стоит на своём месте у границы планов, меняются только её подпись и
     переход — к тому турниру, который человек видит. */
  const [slide, setSlide] = useState(0);
  const shown = TOURS_FIELD[Math.min(slide, TOURS_FIELD.length - 1)];

  return (
    <RoleScreen variant={variant} role={R14} nav="Главная" title="Ким Георгий" sub="Астана · СКА · КМС">
      <div className="g2d o14-nohead">
        {/* ── Поле: карусель турниров ──────────────────────────────
            Фон, лента орнамента и грань принадлежат самому полю, а не слайду:
            плоскость под текстом остаётся неподвижной, едет только содержание.
            Так у кнопки не уезжает из-под ног подложка. */}
        <div className="g2d-field">
          <div className="g2d-clip">
            <div className="g2d-band" />
          </div>

          <Deck
            id="g2d-dots"
            items={TOURS_FIELD}
            onIndex={setSlide}
            card={(t: Tour) => (
              /* На слайде только сам турнир: подпись, название, разряды и
                 даты. Расписание и сроки приёма с поля убраны — они уже стоят
                 в колонках листа («Мои матчи сегодня», «Куда можно
                 заявиться»), и на широком поле повторялись вторым столбцом. */
              <div className="g2d-field-in">
                <div className="g2d-l">
                  <div className="g2d-eyebrow">
                    {t.kind === 'current' ? 'Текущий турнир' : 'Можно заявиться'}
                  </div>
                  <div className="g2d-title o14-disp">{t.nm}</div>
                  <div className="g2d-sub">
                    {t.sub} · {t.dates}
                  </div>
                </div>
              </div>
            )}
          />

          {/* Кнопка живёт у поля, а не у слайда: место постоянное. */}
          {shown.kind === 'current' ? (
            <button type="button" className="g2d-go" data-to="Э14.5">
              Мой турнир <ArrowRight size={17} />
            </button>
          ) : (
            <button type="button" className="g2d-go" data-to="Э14.3">
              Заявиться <ArrowRight size={17} />
            </button>
          )}
        </div>

        {/* ── Лист: три колонки ────────────────────────────────────── */}
        <div className="g2d-sheet">
          <div className="g2d-cols">
            <section className="g2d-group">
              <div className="g2d-sec">Мои матчи сегодня</div>
              {DAY.map((m) => (
                <div className="g2d-row" key={m.round} data-to="Э14.5">
                  <span className="t o14-disp">{m.table}</span>
                  <span className="tx">
                    <span className="nm">{m.foe ?? 'соперник после жеребьёвки'}</span>
                    <span className="ss">{m.round}</span>
                  </span>
                  <span className="tm o14-disp">{m.time}</span>
                </div>
              ))}
            </section>

            <section className="g2d-group">
              <div className="g2d-sec">Последние результаты</div>
              {RESULTS.map((r) => (
                <div className="g2d-row" key={r.nm} data-to="Э14.6">
                  <span className="tx">
                    <span className="nm">{r.nm}</span>
                    <span className="ss">{r.sub}</span>
                  </span>
                  <span className={'g2d-sc ' + (r.win ? 'w' : 'l')}>{r.sc}</span>
                </div>
              ))}
              <button type="button" className="g2d-more" data-to="Э14.6">
                Вся аналитика <ChevronRight size={15} />
              </button>
            </section>

            <section className="g2d-group">
              <div className="g2d-sec">Куда можно заявиться</div>
              {OPEN.map((t) => (
                <div className="g2d-row" key={t.nm} data-to="Э14.2">
                  <span className="tx">
                    <span className="nm">{t.nm}</span>
                    <span className="ss">
                      {t.sub} · {t.till}
                    </span>
                  </span>
                  <span className="g2d-tag on">ОТКРЫТ</span>
                </div>
              ))}
              <button type="button" className="g2d-more" data-to="Э14.2">
                Календарь <ChevronRight size={15} />
              </button>
            </section>
          </div>

          {/* Новости федерации — то же, что на публичном сайте, но читать их
              человек должен не выходя из системы. */}
          <section className="g2d-group g2d-news">
            <div className="g2d-sec">Новости федерации</div>
            {NEWS.slice(0, 2).map((n) => (
              <div className="g2d-row" key={n.nm} data-to="Э14.13">
                <span className="tx">
                  <span className="nm">{n.nm}</span>
                  <span className="ss">{n.sub}</span>
                </span>
                <span className="g2d-at">{n.at}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ── Облик Г-2 для остальных экранов роли ────────────────────────────
   Главная (выше) задала язык: тёмное поле во всю ширину с лентой орнамента,
   на него наезжает лист, действие — на границе планов. Остальным экранам
   роли не нужна карусель, но нужен тот же язык, иначе маршрут разваливается
   на «главную по-новому» и «всё остальное по-старому».

   Поэтому поле выносится в обёртку: подпись, название экрана и строка под
   ним — на тёмном; всё содержание — на листе. Шапка оболочки с именем при
   этом снята (`o14-nohead`), как и на главной: название экрана теперь стоит
   в поле, и дублировать его сверху незачем. */
export function G2Page({
  nav,
  eyebrow,
  title,
  sub,
  action,
  back,
  variant,
  children,
}: {
  nav: string;
  eyebrow: string;
  title: string;
  sub?: string;
  /** Возврат для экранов, куда приходят из списка: стоит на поле над подписью,
      потому что шапка оболочки у роли снята. */
  back?: { label: string; to: string };
  /** Главное действие экрана — на границе планов, как на главной. */
  action?: { label: string; to: string };
  variant?: DeskVariant;
  children: ReactNode;
}) {
  return (
    <RoleScreen variant={variant} role={R14} nav={nav} title={title} sub={sub}>
      <div className="g2d o14-nohead">
        <div className="g2d-field">
          <div className="g2d-clip">
            <div className="g2d-band" />
          </div>
          <div className="g2d-field-in">
            <div className="g2d-l">
              {back && (
                <button type="button" className="g2d-back" data-to={back.to}>
                  <ArrowLeft size={14} /> {back.label}
                </button>
              )}
              <div className="g2d-eyebrow">{eyebrow}</div>
              <div className="g2d-title o14-disp">{title}</div>
              {sub && <div className="g2d-sub">{sub}</div>}
            </div>
          </div>

          {action && (
            <button type="button" className="g2d-go" data-to={action.to}>
              {action.label} <ArrowRight size={17} />
            </button>
          )}
        </div>

        <div className="g2d-sheet">
          <div className="g2d-body">{children}</div>
        </div>
      </div>
    </RoleScreen>
  );
}
