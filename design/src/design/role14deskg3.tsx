/* Э14.3 · Заявка на десктопе — решение Г «Чистая рабочая область» (26.08.2026).

   Четвёртый заход. Три предыдущих (А бланк, Б тёмное поле, В шаги) федерации
   не подошли — и это само по себе ответ: три разные раскладки подряд мимо
   означает, что вопрос не в расстановке блоков, а в отделке.

   Что здесь сделано другого — по пунктам и с причинами — в role14deskg3.css.
   Коротко: убраны обои и лента орнамента из рабочей области, действие стало
   плоским, вторая колонка занята карточкой турнира с настоящей фотографией,
   и на экране появилась шкала кеглей вместо одного веса на всё.

   Содержание то же, что у А, Б и В, и взято из flows/14-sportsmen.md. */

import { ArrowRight, Check, ChevronRight, Minus } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { A } from '../fedCommon';
import type { DeskVariant } from '../deskShell';
import hero from '../assets/tt-hero.jpg';
import './role14deskg3.css';

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
  ['Где', 'Алматы, ЦСКА · ул. Абая 48'],
  ['Когда', '12–14 сентября 2026'],
  ['Разряды', 'одиночный, парный, микст'],
  ['Формат', 'группы, затем плей-офф'],
  ['Главный судья', 'Сериков Нуржан'],
];

export function ApplyCleanG({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="g3-clean o14-nohead">
        <div className="g3-head">
          <button type="button" className="g3-back" data-to="Э14.2">
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Календарь сезона
          </button>
          <div className="g3-eyebrow">Заявка на турнир</div>
          <div className="g3-h o14-disp">Кубок Алматы 2026</div>
        </div>

        <div className="g3">
          {/* ── Бланк ── */}
          <div>
            <div className="g3-sec">Прошу допустить к участию</div>
            {FIELDS.map(([k, v, quiet]) => (
              <div className="g3-f" key={k}>
                <span className="k">{k}</span>
                <span className={'v' + (quiet ? ' quiet' : '')}>{v}</span>
                <ChevronRight size={18} />
              </div>
            ))}

            <div className="g3-sec">Условия допуска · проверено системой</div>
            {TERMS.map((t) => (
              <div className={'g3-t' + (t.ok ? '' : ' off')} key={t.nm}>
                <span className="ic">{t.ok ? <Check size={12} /> : <Minus size={12} />}</span>
                <span className="nm">{t.nm}</span>
                <span className="ss">{t.ss}</span>
              </div>
            ))}

            <div className="g3-go">
              <span className="note">
                Заявка уходит главному судье турнира — решение придёт уведомлением.
                <br />
                Пока приём открыт, её можно отозвать.
              </span>
              <button type="button" className="g3-btn" data-to="Э14.4">
                Подать заявку <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {/* ── Карточка турнира ── */}
          <aside className="g3-card">
            <div className="g3-cover" style={{ '--g3-shot': `url(${hero})` } as React.CSSProperties}>
              <div>
                <div className="t o14-disp">Кубок Алматы 2026</div>
                <div className="s">Открытый республиканский турнир</div>
              </div>
            </div>

            <div className="g3-till">
              <span className="v o14-disp">до 05.09</span>
              <span className="k">приём заявок · осталось 3 дня</span>
            </div>

            <div className="g3-facts">
              {FACTS.map(([k, v]) => (
                <div className="g3-fact" key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>

            {/* Полоса заполнения: «96 из 128» само по себе ничего не говорит. */}
            <div className="g3-fill">
              <div className="row">
                <span className="n o14-disp">96 из 128</span>
                <span className="k">уже заявились</span>
              </div>
              <div className="bar">
                <i style={{ width: '75%' }} />
              </div>
            </div>

            <div className="g3-me">
              <img src={A(44)} alt="" />
              <span className="tx">
                <span className="nm">Ким Георгий</span>
                <span className="ss">заявляетесь вы сами · Астана, СКА</span>
              </span>
              <span className="r o14-disp">2456</span>
            </div>
          </aside>
        </div>
      </div>
    </RoleScreen>
  );
}
