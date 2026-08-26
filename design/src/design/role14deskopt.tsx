/* Э14.3 · Заявка на десктопе — три решения экрана (26.08.2026).

   Федерация посмотрела перенос роли на десктоп и сказала: не нравится. Что
   именно — не уточнили. Гадать не стали: у нас в порядке работы записано, что
   экран сначала проектируется вариантами, и выбирает федерация. Здесь три
   решения одного экрана. Содержание у всех одно и то же и взято из
   flows/14-sportsmen.md; отличается решение.

   Экран взят тот, про который спрашивали последним, — заявка. Он
   показательный: в нём есть всё, из чего собраны остальные экраны роли
   (контекст, поля, проверка допуска, одно действие). Что выберут здесь, то и
   раскатаем на Э14.4, Э14.6, Э14.7, Э14.9, Э14.12–Э14.14.

   Разбор решений — в role14deskopt.css рядом с каждым блоком стилей. */

import { ArrowRight, Check, ChevronRight, Send, X } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import type { DeskVariant } from '../deskShell';
/* Вариант Б собран из того же набора, что и нынешний десктоп (поля строкой,
   галочки допуска), поэтому его стили нужны и здесь: истории вариантов
   открываются отдельно от «Макетов», где этот файл подключает role14.tsx. */
import './role14deskbody.css';
import './role14deskopt.css';

/* Одно содержание на все три варианта: разряды, условия допуска и срок. */
const RAZR = [
  { t: 'Одиночный', s: 'взрослые · сетка на 128', on: true },
  { t: 'Парный', s: 'нужен партнёр — он подтверждает пару ✳' },
  { t: 'Микст', s: 'приём в этом разряде закрыт', off: true },
];

const TERMS = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', ok: true },
  { nm: 'Удостоверение личности', ss: 'приложено при регистрации', ok: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', ok: true },
  { nm: 'Ценз по рейтингу', ss: 'у этого турнира не требуется', ok: false },
];

/* ═══ А · «Бланк федерации» ════════════════════════════════════════
   Заявка — документ, который подают в организацию. Значит, у неё мера строки,
   поля по краям, номер и отметка о том, кто решает. Поверхностей нет вовсе:
   бумага — сам экран, разделы разделены линейками. */
export function ApplyDocA({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="oa3 o14-nohead">
        <div className="oa3-top">
          <div>
            <div className="oa3-to">В главную судейскую коллегию турнира</div>
            <div className="oa3-nm o14-disp">Кубок Алматы 2026</div>
            <div className="oa3-mt">ОРТ · Алматы · 12–14 сентября 2026</div>
          </div>
          <div className="oa3-no">
            <div className="n">заявка № 100416</div>
            <div className="till o14-disp">до 05.09</div>
          </div>
        </div>

        <div className="oa3-sec">Прошу допустить к участию</div>
        {[
          ['Разряд', 'Одиночный', false],
          ['Возрастная группа', 'Взрослые', false],
          ['Парный разряд ✳', 'партнёр не выбран', true],
        ].map(([k, v, quiet]) => (
          <div className="oa3-f" key={k as string}>
            <span className="k">{k as string}</span>
            <span className="ln" />
            <span className={'v' + (quiet ? ' quiet' : '')}>{v as string}</span>
          </div>
        ))}

        <div className="oa3-sec">Условия допуска проверены</div>
        {TERMS.map((t) => (
          <div className="oa3-t" key={t.nm}>
            <span className={'ok' + (t.ok ? '' : ' off')}>{t.ok ? '✓' : '—'}</span>
            <span>{t.nm}</span>
            <span className="ss">{t.ss}</span>
          </div>
        ))}

        <div className="oa3-foot">
          <div className="oa3-stamp">
            РЕШАЕТ
            <br />
            ГЛАВНЫЙ
            <br />
            СУДЬЯ
          </div>
          <div className="oa3-sign">
            <div className="note">
              Заявка уходит главному судье турнира. Решение придёт уведомлением; пока приём
              открыт, её можно отозвать.
            </div>
          </div>
          <button className="dsubmit" style={{ padding: '13px 20px' }} data-to="Э14.4">
            <Send size={15} /> Подать заявку
          </button>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Б · «Тёмное поле» ════════════════════════════════════════════
   Связь с главной: тот же тёмно-синий с лентой орнамента, что у Э14.1 в
   облике Г-2, но полосой контекста, а не витриной. Бланк — белым листом,
   наезжающим на поле: два плана, как на главной. */
export function ApplyFieldB({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="ob3 o14-nohead">
        <div className="ob3-field">
          <div className="ob3-orn" />
          <div className="ob3-in">
            <div>
              <div className="ob3-eyebrow">Заявка на турнир</div>
              <div className="ob3-nm o14-disp">Кубок Алматы 2026</div>
              <div className="ob3-mt">ОРТ · Алматы · 12–14 сентября · одиночный, парный, микст</div>
            </div>
            <div className="ob3-till">
              <div className="v o14-disp">до 05.09</div>
              <div className="k">приём заявок</div>
            </div>
          </div>
        </div>

        <div className="ob3-sheet">
          <div className="ob3-cols">
            <div>
              <div className="ob3-cap">Заявка</div>
              <div style={{ marginTop: 'var(--s-2)' }}>
                <div className="db-f">
                  <span className="k">Разряд</span>
                  <span className="v">Одиночный</span>
                  <ChevronRight size={17} />
                </div>
                <div className="db-f">
                  <span className="k">Возрастная группа</span>
                  <span className="v">Взрослые</span>
                  <ChevronRight size={17} />
                </div>
                <div className="db-f">
                  <span className="k">Парный разряд ✳</span>
                  <span className="v quiet">партнёр не выбран</span>
                  <ChevronRight size={17} />
                </div>
              </div>
              <div className="db-act">
                <span className="note">Решение принимает главный судья турнира</span>
                <button className="dsubmit" style={{ padding: '11px 16px' }} data-to="Э14.4">
                  <Send size={15} /> Подать заявку
                </button>
              </div>
            </div>

            <div>
              <div className="ob3-cap">Условия допуска</div>
              <div style={{ marginTop: 'var(--s-2)' }}>
                {TERMS.map((t) => (
                  <div className={'db-t' + (t.ok ? '' : ' off')} key={t.nm}>
                    <span className="ic">{t.ok ? <Check size={13} /> : <X size={13} />}</span>
                    <span className="tx">
                      <span className="nm">{t.nm}</span>
                      <span className="ss">{t.ss}</span>
                    </span>
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

/* ═══ В · «Шаги» ═══════════════════════════════════════════════════
   Заявка — процесс, а не форма. Слева рельс: где я, что позади, что впереди.
   Справа один активный шаг крупно: разряды показаны развилкой целиком, потому
   что на десктопе для этого есть место, а выбирают их один раз. «Подать
   заявку» становится последним шагом, а не кнопкой в углу. */
const STEPS = [
  { n: '✓', t: 'Турнир выбран', s: 'Кубок Алматы 2026 · ОРТ', done: true },
  { n: '2', t: 'Разряд и группа', s: 'выбираете сейчас', on: true },
  { n: '3', t: 'Проверка допуска', s: 'система проверила — всё сходится' },
  { n: '4', t: 'Решение судьи', s: 'придёт уведомлением' },
];

export function ApplyStepsV({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="ov3 o14-nohead">
        <aside className="ov3-rail">
          {STEPS.map((s) => (
            <div className={'ov3-step' + (s.done ? ' done' : '') + (s.on ? ' on' : '')} key={s.t}>
              <span className="n">{s.n}</span>
              <span className="tx">
                <span className="t">{s.t}</span>
                <span className="s">{s.s}</span>
              </span>
            </div>
          ))}
        </aside>

        <div>
          <div className="ov3-h o14-disp">В каком разряде играете</div>
          <div className="ov3-sub">
            Кубок Алматы 2026 · приём заявок до 05.09 · заявляетесь вы сами
          </div>

          <div className="ov3-picks">
            {RAZR.map((r) => (
              <button
                type="button"
                className={'ov3-pick' + (r.on ? ' on' : '') + (r.off ? ' off' : '')}
                key={r.t}
              >
                <span className="t">{r.t}</span>
                <span className="s">{r.s}</span>
              </button>
            ))}
          </div>

          <div className="ov3-terms">
            <div className="cap">Допуск проверен системой</div>
            <div className="ov3-chips">
              {TERMS.map((t) => (
                <span className={'ov3-chip' + (t.ok ? '' : ' off')} key={t.nm}>
                  {t.ok ? <Check size={12} /> : <X size={12} />} {t.nm}
                </span>
              ))}
            </div>
          </div>

          <div className="ov3-go">
            <span className="note">
              Решение принимает главный судья турнира. Пока приём открыт, заявку можно отозвать.
            </span>
            <button className="dsubmit" style={{ padding: '13px 20px' }} data-to="Э14.4">
              Подать заявку <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}
