/* Э14.3 · Заявка на десктопе — решения Д, Е, Ж (26.08.2026).

   Г был показан один, и это ошибка порядка: варианты смотрят полкой, иначе
   выбирать не из чего. Здесь ещё три решения на той же исправленной отделке
   (чистая рабочая область без обоев, плоское действие, шкала кеглей,
   изображения там, где они в системе есть), но с разной идеей экрана:

     Д «Афиша»   — турнир как событие: обложка во всю ширину, разряд карточками.
     Е «Сводка»  — турнир как данные: лента фактов вместо картинки, плотно.
     Ж «Пропуск» — заявка как пропуск в зал: корешок с игроком, линия отрыва.

   Содержание у всех одно и то же и взято из flows/14-sportsmen.md.
   Разбор решений — рядом со стилями в role14deskopt2.css. */

import { ArrowRight, Check, ChevronRight, Minus } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { A } from '../fedCommon';
import type { DeskVariant } from '../deskShell';
import hero from '../assets/tt-hero.jpg';
import './role14deskopt2.css';

const RAZR = [
  { t: 'Одиночный', s: 'взрослые · сетка на 128 · группы, затем плей-офф', on: true },
  { t: 'Парный', s: 'нужен партнёр — он подтверждает пару ✳', tag: 'ЕЩЁ МОЖНО' },
  { t: 'Микст', s: 'приём в этом разряде уже закрыт', off: true },
];

const TERMS = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', ok: true },
  { nm: 'Удостоверение личности', ss: 'приложено при регистрации', ok: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', ok: true },
  { nm: 'Ценз по рейтингу', ss: 'у этого турнира не требуется', ok: false },
];

const NOTE = 'Заявка уходит главному судье турнира — решение придёт уведомлением. Пока приём открыт, её можно отозвать.';

/* ═══ Д · «Афиша» ══════════════════════════════════════════════════ */
export function ApplyPosterD({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="o2-clean o14-nohead">
        <div className="opd-hero" style={{ '--opd-shot': `url(${hero})` } as React.CSSProperties}>
          <div className="in">
            <div>
              <div className="opd-eyebrow">Заявка на турнир</div>
              <div className="opd-h o14-disp">Кубок Алматы 2026</div>
              <div className="opd-mt">
                ОРТ · Алматы, ЦСКА · 12–14 сентября 2026 · главный судья Сериков Нуржан
              </div>
            </div>
            <div className="opd-till">
              <div className="v o14-disp">до 05.09</div>
              <div className="k">приём заявок · 3 дня</div>
            </div>
          </div>
        </div>

        <div className="o2-pad opd-body">
          <div>
            <div className="o2-sec">В каком разряде играете</div>
            <div className="opd-picks">
              {RAZR.map((r) => (
                <button
                  type="button"
                  className={'opd-pick' + (r.on ? ' on' : '') + (r.off ? ' off' : '')}
                  key={r.t}
                >
                  <span className="t o14-disp">{r.t}</span>
                  <span className="s">{r.s}</span>
                  {r.tag && <span className="tag">{r.tag}</span>}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'var(--s-6)' }}>
              <div className="o2-sec">Остальное в заявке</div>
              <div className="opd-row">
                <span className="k">Возрастная группа</span>
                <span className="v">Взрослые</span>
                <ChevronRight size={17} />
              </div>
              <div className="opd-row">
                <span className="k">Партнёр для пары ✳</span>
                <span className="v quiet">не выбран</span>
                <ChevronRight size={17} />
              </div>
            </div>

            <div className="opd-go">
              <span className="note">{NOTE}</span>
              <button type="button" className="o2-btn" data-to="Э14.4">
                Подать заявку <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <aside className="opd-side">
            <div className="o2-sec">Допуск · проверено системой</div>
            {TERMS.map((t) => (
              <div className={'opd-t' + (t.ok ? '' : ' off')} key={t.nm}>
                <span className="ic">{t.ok ? <Check size={12} /> : <Minus size={12} />}</span>
                <span className="tx">
                  <span className="nm">{t.nm}</span>
                  <span className="ss">{t.ss}</span>
                </span>
              </div>
            ))}
            <div style={{ marginTop: 'var(--s-5)' }}>
              <div className="o2-sec">Состав</div>
              <div className="opd-t">
                <span className="tx">
                  <span className="nm">96 из 128 уже заявились</span>
                  <span className="ss">приём закроется раньше, если наберётся сетка</span>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Е · «Сводка» ═════════════════════════════════════════════════ */
export function ApplyStripE({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="o2-clean o2-pad o14-nohead">
        <div style={{ marginBottom: 'var(--s-5)' }}>
          <div className="o2-sec">Заявка на турнир</div>
          <div className="oz-h o14-disp" style={{ marginTop: 0 }}>Кубок Алматы 2026</div>
        </div>

        {/* Лента фактов вместо картинки: перед подачей нужны цифры. */}
        <div className="oe-strip">
          <div className="oe-cell till">
            <div className="v o14-disp">до 05.09</div>
            <div className="k">приём заявок</div>
          </div>
          <div className="oe-cell">
            <div className="v o14-disp">12–14.09</div>
            <div className="k">когда играют</div>
          </div>
          <div className="oe-cell">
            <div className="v o14-disp">Алматы</div>
            <div className="k">ЦСКА, ул. Абая 48</div>
          </div>
          <div className="oe-cell">
            <div className="v o14-disp">96 / 128</div>
            <div className="k">уже заявились</div>
            <div className="bar">
              <i style={{ width: '75%' }} />
            </div>
          </div>
          <div className="oe-cell">
            <div className="v o14-disp">группы</div>
            <div className="k">затем плей-офф</div>
          </div>
        </div>

        <div className="oe-cols">
          <div className="oe-col">
            <div className="o2-sec">Прошу допустить к участию</div>
            <div className="oe-f">
              <span className="k">Разряд</span>
              <span className="v">Одиночный</span>
              <ChevronRight size={17} />
            </div>
            <div className="oe-f">
              <span className="k">Возрастная группа</span>
              <span className="v">Взрослые</span>
              <ChevronRight size={17} />
            </div>
            <div className="oe-f">
              <span className="k">Парный разряд ✳</span>
              <span className="v quiet">партнёр не выбран</span>
              <ChevronRight size={17} />
            </div>
          </div>

          <div className="oe-col">
            <div className="o2-sec">Допуск · проверено системой</div>
            <div className="oe-chips">
              {TERMS.map((t) => (
                <span className={'oe-chip' + (t.ok ? '' : ' off')} key={t.nm}>
                  {t.ok ? <Check size={12} /> : <Minus size={12} />} {t.nm}
                </span>
              ))}
            </div>

            <div style={{ marginTop: 'var(--s-5)' }}>
              <div className="o2-sec">Кто подаёт</div>
              <div className="oe-f" style={{ cursor: 'default' }}>
                <span className="k">Спортсмен</span>
                <span className="v">Ким Георгий · рейтинг 2456</span>
              </div>
            </div>

            <div className="oe-go">
              <span className="note">{NOTE}</span>
              <button type="button" className="o2-btn" data-to="Э14.4">
                Подать заявку <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Ж · «Пропуск» ════════════════════════════════════════════════ */
export function ApplyPassZh({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="o2-clean o2-pad o14-nohead">
        <div className="oz-wrap">
          <div className="oz">
            {/* Корешок: кто идёт. */}
            <div className="oz-stub">
              <div className="cap">Заявку подаёт</div>
              <img src={A(44)} alt="" />
              <div className="nm o14-disp">Ким Георгий</div>
              <div className="ss">мастер спорта · Астана, клуб СКА</div>
              <div className="oz-nums">
                <div>
                  <b className="o14-disp">2456</b>
                  <span>рейтинг</span>
                </div>
                <div>
                  <b className="o14-disp">7</b>
                  <span>место в РК</span>
                </div>
              </div>
            </div>

            {/* Основная часть: куда идёт и что выбрано. */}
            <div className="oz-perf oz-main">
              <div className="oz-eyebrow">Заявка на турнир</div>
              <div className="oz-h o14-disp">Кубок Алматы 2026</div>
              <div className="oz-mt">
                ОРТ · Алматы, ЦСКА · 12–14 сентября 2026 · приём заявок до 05.09
              </div>

              <div className="oz-grid">
                {[
                  ['Разряд', 'Одиночный', false],
                  ['Возрастная группа', 'Взрослые', false],
                  ['Парный разряд ✳', 'партнёр не выбран', true],
                  ['Сетка', '96 из 128 заявились', false],
                ].map(([k, v, quiet]) => (
                  <div className="oz-d" key={k as string}>
                    <div className="k">{k as string}</div>
                    <div className={'v' + (quiet ? ' quiet' : '')}>{v as string}</div>
                  </div>
                ))}
              </div>

              <div className="oz-terms">
                {TERMS.map((t) => (
                  <span className={'oz-chip' + (t.ok ? '' : ' off')} key={t.nm}>
                    {t.ok ? <Check size={12} /> : <Minus size={12} />} {t.nm}
                  </span>
                ))}
              </div>

              <div className="oz-go">
                <span className="note">Решение принимает главный судья турнира</span>
                <button type="button" className="o2-btn" data-to="Э14.4">
                  Подать заявку <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}
