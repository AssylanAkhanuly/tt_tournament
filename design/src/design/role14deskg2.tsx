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

import { ArrowRight, ChevronRight } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import type { DeskVariant } from '../deskShell';
import { DAY, TOURS_FIELD } from './role14day';
import { NEWS, RESULTS } from './role14home';
import './role14deskg2.css';

const OPEN = TOURS_FIELD.filter((t) => t.kind === 'open');

export function HomeG2Desk({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Главная" title="Ким Георгий" sub="Астана · СКА · КМС">
      <div className="g2d">
        {/* ── Поле: текущий турнир ─────────────────────────────────
            Слева турнир, справа ближайший матч. На телефоне это два этажа,
            здесь — две колонки: ширина есть, а прокрутка дорога. */}
        <div className="g2d-field">
          <div className="g2d-band" />
          <div className="g2d-field-in">
            <div className="g2d-l">
              <div className="g2d-eyebrow">Текущий турнир</div>
              <div className="g2d-title o14-disp">Кубок Алматы 2026</div>
              <div className="g2d-sub">ОРТ · Алматы · одиночный, парный, микст · 12–14.09</div>
            </div>

            <div className="g2d-r">
              <div className="g2d-eyebrow">Ближайший матч</div>
              <div className="g2d-next">
                <span className="t o14-disp">5</span>
                <span className="tx">
                  <span className="nm">Жумабеков Расул</span>
                  <span className="ss">1/8 финала · одиночный</span>
                </span>
                <span className="tm o14-disp">14:20</span>
              </div>
            </div>
          </div>

          {/* Действие сидит верхом на границе планов — как на телефоне. */}
          <button type="button" className="g2d-go" data-to="Э14.5">
            Мой турнир <ArrowRight size={17} />
          </button>
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
