/* Э14.1 · Главная спортсмена — варианты Г, Д, Е.

   Содержание то же, что у А, Б и В (flows/14-sportsmen.md, Э14.1), и данные
   те же — они импортируются из `role14home.tsx`, чтобы варианты нельзя было
   сравнивать «по разному наполнению». Отличается только решение. */

import { ArrowRight, CalendarDays, Newspaper, Play } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { Cover, FOE, Form, NEWS, RESULTS, Sets } from './role14home';
import './role14home.css';
import './role14home2.css';

/* ═══════════ Вариант Г · «Протокол» ═══════════ */

export function HomeG() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="og">
          <div className="og-head">
            <div>
              <div className="nm o14-disp">Ким Георгий</div>
              <div className="sub">Астана · СКА «Астана» · кандидат в мастера спорта · сезон 2026</div>
            </div>
            <div className="rt">
              <div>
                <div className="v o14-disp">2456</div>
                <span className="k">рейтинг</span>
              </div>
              <div>
                <div className="v o14-disp">7</div>
                <span className="k">место в РК</span>
              </div>
              <div>
                <div className="v o14-disp up">+24</div>
                <span className="k">за турнир</span>
              </div>
            </div>
          </div>

          <div className="og-sec">
            <div className="og-sec-h">
              Сейчас
              <span className="ln" />
              <span className="note">счёт ведёт судья стола</span>
            </div>
            <div className="og-now" data-to="Э14.5">
              <div className="tbl o14-disp">
                <b>5</b>
                <span>СТОЛ</span>
              </div>
              <div>
                <div className="vs o14-disp">Ким Г. — Жумабеков Р.</div>
                <div className="rnd">Кубок Алматы 2026 · 1/8 финала · одиночный разряд</div>
              </div>
              <Sets />
              <div className="at">начало 14:20</div>
              <button type="button" className="oa-go" data-to="Э14.5">
                <Play size={14} /> Открыть матч
              </button>
            </div>
          </div>

          <div className="og-sec">
            <div className="og-sec-h">
              Заявки и старты
              <span className="ln" />
              <button type="button" className="o14-link" data-to="Э14.2">
                <CalendarDays size={13} /> Календарь
              </button>
            </div>
            <table className="og-tab">
              <thead>
                <tr>
                  <th>Соревнование</th>
                  <th>Категория</th>
                  <th>Город</th>
                  <th className="num">Даты</th>
                  <th className="num">Состояние заявки</th>
                </tr>
              </thead>
              <tbody>
                <tr data-to="Э14.4">
                  <td className="nm">Кубок Алматы 2026</td>
                  <td className="dim">ОРТ</td>
                  <td className="dim">Алматы</td>
                  <td className="num">12–14.09</td>
                  <td className="num">
                    <span className="o14-pill on">ПОДАНА 03.09</span>
                  </td>
                </tr>
                <tr>
                  <td className="nm">Чемпионат Республики Казахстан</td>
                  <td className="dim">Главный старт</td>
                  <td className="dim">Астана</td>
                  <td className="num">18–22.09</td>
                  <td className="num">
                    <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="og-sec">
            <div className="og-sec-h">
              Последние матчи
              <span className="ln" />
              <button type="button" className="o14-link" data-to="Э14.6">
                Аналитика <ArrowRight size={13} />
              </button>
            </div>
            <table className="og-tab">
              <thead>
                <tr>
                  <th>Соперник</th>
                  <th>Круг и соревнование</th>
                  <th className="num">Счёт</th>
                  <th className="num">Рейтинг</th>
                </tr>
              </thead>
              <tbody>
                {RESULTS.map((r, i) => (
                  <tr key={r.nm}>
                    <td className="nm">{r.nm}</td>
                    <td className="dim">{r.sub}</td>
                    <td className={'num sc o14-disp ' + (r.win ? 'win' : 'lose')}>{r.sc}</td>
                    <td className={'num ' + (r.win ? 'up' : 'down')}>{['+12', '−8', '+20'][i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="og-sec">
            <div className="og-sec-h">
              Объявления федерации
              <span className="ln" />
              <button type="button" className="o14-link" data-to="Э14.13">
                <Newspaper size={13} /> Все новости
              </button>
            </div>
            <div className="og-notes">
              {NEWS.map((n) => (
                <div className="og-note" key={n.nm} data-to="Э14.13">
                  <div className="at">{n.at.split(' · ')[0]}</div>
                  <div>
                    <div className="nm">{n.nm}</div>
                    <div className="sub">{n.sub}</div>
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

/* ═══════════ Вариант Д · «Табло» ═══════════ */

export function HomeD() {
  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="od">
          <div className="od-t od-call" data-to="Э14.5">
            <div className="tbl o14-disp">
              <b>5</b>
              <span>СТОЛ</span>
            </div>
            <Sets />
            <div className="who">
              <div className="nm o14-disp">Жумабеков Расул</div>
              <div className="sub">1/8 финала · Кубок Алматы 2026 · рейтинг 2312</div>
            </div>
            <div className="at o14-disp">
              <b>14:20</b>
              <span>НАЧАЛО</span>
            </div>
          </div>

          <div className="od-t big od-half" data-to="Э14.6">
            <span className="k">Рейтинг</span>
            <span className="v o14-disp">2456</span>
            <span className="s">7 место в РК</span>
          </div>
          <div className="od-t od-half">
            <span className="k">За турнир</span>
            <span className="v o14-disp up">+24</span>
            <span className="s">+144 за сезон</span>
          </div>
          <div className="od-t od-half">
            <span className="k">Форма</span>
            <Form />
            <span className="s">64 % побед · 128 матчей</span>
          </div>

          <div className="od-t od-tour" data-to="Э14.4">
            <div className="row">
              <span className="k">Ближайший старт</span>
              <span className="o14-pill on">ЗАЯВКА ПОДАНА</span>
            </div>
            <span className="d o14-disp">12–14.09</span>
            <span className="nm">Кубок Алматы 2026 · ОРТ · Алматы</span>
          </div>
          <div className="od-t od-tour">
            <div className="row">
              <span className="k">Следующий</span>
              <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
            </div>
            <span className="d o14-disp">18–22.09</span>
            <span className="nm">Чемпионат Республики Казахстан · Астана</span>
          </div>

          <div className="od-t od-half">
            <span className="k">Взнос 2026</span>
            <span className="v o14-disp" style={{ fontSize: 28 }}>Оплачен</span>
            <span className="s">до 31 марта следующего года</span>
          </div>
          <div className="od-t od-wide" data-to="Э14.13">
            <span className="k">Новость федерации</span>
            <span className="s" style={{ fontSize: 17, color: 'var(--c-ink)', fontWeight: 700 }}>
              {NEWS[0].nm}
            </span>
            <span className="s">{NEWS[0].at}</span>
          </div>
          <div className="od-t" data-to="Э14.2">
            <span className="k">Открытых приёмов</span>
            <span className="v o14-disp">6</span>
            <span className="s">можно заявиться</span>
          </div>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══════════ Вариант Е · «Моя неделя» ═══════════ */

type Day = {
  d: string;
  m: string;
  tone?: 'now' | 'accent' | 'warn';
  ev: React.ReactNode;
};

export function HomeE() {
  const days: Day[] = [
    {
      d: '04',
      m: 'сентября · сегодня',
      tone: 'now',
      ev: (
        <div className="oe-ev now" data-to="Э14.5">
          <div className="oe-ev-top">
            <span className="oa-live">
              <span className="d" /> ВАС ВЫЗВАЛИ
            </span>
            <div className="grow" />
            <span className="sub">14:20 · 1/8 финала · Кубок Алматы 2026</span>
          </div>
          <div className="oe-ev-main">
            <img src={FOE.av} alt="" />
            <div>
              <div className="nm o14-disp">Жумабеков Расул</div>
              <div className="sub">{FOE.sub}</div>
            </div>
            <div className="grow" />
            <Sets />
            <div className="tbl o14-disp">
              <b>5</b>
              <span>СТОЛ</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      d: '05',
      m: 'сентября',
      tone: 'warn',
      ev: (
        <div className="oe-ev warn" data-to="Э14.2">
          <div className="oe-ev-top">
            <div>
              <div className="nm o14-disp">Закрывается приём заявок</div>
              <div className="sub">Открытый турнир Шымкента · заявиться можно до 18:00</div>
            </div>
            <div className="grow" />
            <span className="o14-pill wait">ОСТАЛСЯ ДЕНЬ</span>
          </div>
        </div>
      ),
    },
    {
      d: '12',
      m: '–14 сентября',
      tone: 'accent',
      ev: (
        <div className="oe-ev" data-to="Э14.4">
          <div className="oe-ev-top">
            <div>
              <div className="nm o14-disp">Кубок Алматы 2026</div>
              <div className="sub">ОРТ · Алматы · одиночный и парный разряд</div>
            </div>
            <div className="grow" />
            <span className="o14-pill on">ЗАЯВКА ПОДАНА</span>
          </div>
        </div>
      ),
    },
    {
      d: '18',
      m: '–22 сентября',
      tone: 'accent',
      ev: (
        <div className="oe-ev">
          <div className="oe-ev-top">
            <div>
              <div className="nm o14-disp">Чемпионат Республики Казахстан</div>
              <div className="sub">Главный старт · Астана · состав подаёт регион</div>
            </div>
            <div className="grow" />
            <span className="o14-pill wait">ЗАЯВЛЯЕТ РЕГИОН</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <RoleScreen role={R14} nav="Главная" title="Главная">
      <div className="o14 o14-nohead">
        <div className="oe">
          <div>
            <div className="oe-strip">
              <div>
                <span className="v o14-disp">2456</span> <span className="k">рейтинг</span>
              </div>
              <div>
                <span className="v o14-disp">7</span> <span className="k">место в РК</span>
              </div>
              <div>
                <span className="v o14-disp up">+24</span> <span className="k">за турнир</span>
              </div>
              <Form />
              <div className="grow" />
              <button type="button" className="o14-link" data-to="Э14.6">
                Аналитика <ArrowRight size={13} />
              </button>
            </div>

            <div className="oe-axis">
              {days.map((day) => (
                <div className={'oe-day ' + (day.tone ?? '')} key={day.d + day.m}>
                  <div className={'oe-when ' + (day.tone === 'now' ? 'now' : '')}>
                    <div className="d o14-disp">{day.d}</div>
                    <div className="m">{day.m}</div>
                  </div>
                  <div className="oe-line" />
                  <div>{day.ev}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="oe-side">
            <div className="o14-plate">
              <div className="o14-eyebrow">Последние результаты</div>
              <div className="oe-res">
                {RESULTS.map((r) => (
                  <div className="oe-res-row" key={r.nm}>
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
              <div className="ob-fee-head">
                <div className="o14-eyebrow">Новости федерации</div>
                <button type="button" className="o14-link" data-to="Э14.13">
                  <Newspaper size={13} /> Все
                </button>
              </div>
              <div className="oe-news">
                {NEWS.map((n) => (
                  <div className="oe-news-card" key={n.nm} data-to="Э14.13">
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

