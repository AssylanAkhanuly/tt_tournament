/* Э14.3 · Заявка — четыре разных ОСНОВЫ на одном экране (26.08.2026).

   Семь решений экрана подряд не приняты. Дальше перебирать раскладки смысла
   нет: у всех семи была одна основа — системный гротеск, синий акцент, белые
   поверхности, прямые углы. Решение федерации — посмотреть рядом несколько
   разных основ.

   Поэтому раскладка и содержание у всех четырёх ОДИНАКОВЫЕ (взяты из
   flows/14-sportsmen.md и повторяют решение Г). Отличается только основа:
   палитра, форма углов, гарнитура, плотность и роль цвета. Разбор каждой —
   в role14base.css.

   Гарнитура берётся из общего списка `src/fonts.ts` — того самого, которым
   работает переключатель «Шрифт» в тулбаре. Своих строк font-family здесь
   нет: список гарнитур один на проект. */

import { ArrowRight, Check, ChevronRight, Minus } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { fontStack } from '../fonts';
import type { DeskVariant } from '../deskShell';
import './role14base.css';

const FIELDS: [string, string, boolean][] = [
  ['Разряд', 'Одиночный', false],
  ['Возрастная группа', 'Взрослые', false],
  ['Парный разряд ✳', 'партнёр не выбран', true],
];

const TERMS = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', ok: true },
  { nm: 'Удостоверение личности', ss: 'приложено при регистрации', ok: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', ok: true },
  { nm: 'Ценз по рейтингу', ss: 'у этого турнира не требуется', ok: false },
];

const FACTS: [string, string][] = [
  ['Где', 'Алматы, ЦСКА'],
  ['Когда', '12–14 сентября'],
  ['Разряды', 'одиночный, парный, микст'],
  ['Формат', 'группы, затем плей-офф'],
];

/** Один и тот же экран; `cls` — какая основа, `font` — её гарнитура. */
function Screen({
  cls,
  font,
  variant,
}: {
  cls: string;
  font: string;
  variant?: DeskVariant;
}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className={'pb o14-nohead ' + cls} style={{ fontFamily: font }}>
        <div className="pb-head">
          <div className="pb-eyebrow">Заявка на турнир</div>
          <div className="pb-h">Кубок Алматы 2026</div>
          <div className="pb-mt">ОРТ · Алматы, ЦСКА · 12–14 сентября 2026</div>
        </div>

        <div className="pb-cols">
          <div>
            <div className="pb-sec">Прошу допустить к участию</div>
            <div className="pb-sheet">
              {FIELDS.map(([k, v, quiet]) => (
                <div className="pb-f" key={k}>
                  <span className="k">{k}</span>
                  <span className={'v' + (quiet ? ' quiet' : '')}>{v}</span>
                  <ChevronRight size={17} />
                </div>
              ))}
            </div>

            <div className="pb-sec" style={{ marginTop: 'var(--s-6)' }}>
              Условия допуска · проверено системой
            </div>
            <div className="pb-sheet">
              {TERMS.map((t) => (
                <div className={'pb-t' + (t.ok ? '' : ' off')} key={t.nm}>
                  <span className="ic">{t.ok ? <Check size={12} /> : <Minus size={12} />}</span>
                  <span className="tx">
                    <span className="nm">{t.nm}</span>
                    <span className="ss">{t.ss}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="pb-go">
              <span className="note">
                Заявка уходит главному судье турнира — решение придёт уведомлением.
              </span>
              <button type="button" className="pb-btn" data-to="Э14.4">
                Подать заявку <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <aside className="pb-sheet">
            <div className="pb-till">
              <div className="v">до 05.09</div>
              <div className="k">приём заявок · осталось 3 дня</div>
            </div>
            {FACTS.map(([k, v]) => (
              <div className="pb-fact" key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </div>
            ))}
            <div className="pb-fill">
              <div className="row">
                <span className="n">96 из 128</span>
                <span className="k">уже заявились</span>
              </div>
              <div className="bar">
                <i style={{ width: '75%' }} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </RoleScreen>
  );
}

/* 1 · Мягкая — Onest: гуманистический гротеск, тот же, что примеряли в тулбаре. */
export const Base1Soft = ({ variant }: { variant?: DeskVariant } = {}) => (
  <Screen cls="pb1" font={fontStack('onest')} variant={variant} />
);

/* 2 · Спортивная тёмная — Geologica: плотный, «табличный» гротеск. */
export const Base2Sport = ({ variant }: { variant?: DeskVariant } = {}) => (
  <Screen cls="pb2" font={fontStack('geologica')} variant={variant} />
);

/* 3 · Газетная — PT Serif: сериф с кириллицей и казахскими буквами. */
export const Base3Paper = ({ variant }: { variant?: DeskVariant } = {}) => (
  <Screen cls="pb3" font={fontStack('ptserif')} variant={variant} />
);

/* 4 · Фирменная — Inter: нейтральный гротеск, чтобы работал цвет, а не шрифт. */
export const Base4Brand = ({ variant }: { variant?: DeskVariant } = {}) => (
  <Screen cls="pb4" font={fontStack('inter')} variant={variant} />
);
