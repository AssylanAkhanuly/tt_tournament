/* Э14.1 · мобильный экран — три варианта облика.

   Прежний мобильный макет забраковали целиком, и по делу: белая карточка на
   бледном сине-сером градиенте, всё одного веса, единственное цветное пятно —
   зелёная пятёрка, а между блоками волосяные линии. Это не облик, а вёрстка.

   По пайплайну проекта экран сначала проектируется вариантами, поэтому здесь
   три разных решения одного и того же экрана. Содержание у всех одно и то же и
   задано флоу (Э14.1): матчи дня каруселью, показатели, ближайшие турниры,
   последние результаты. Отличается язык:

     А · Тёмное табло — экран зала: тёмная плоскость, свет только там, где
         число; так выглядят табло и трансляции, и так же выглядит наше
         приложение в тёмной теме.
     Б · Цветной блок — вызов занимает верх сплошным цветом ФНТ, всё остальное
         белым списком: цвет вместо рамок.
     В · Крупная типографика — ни карточек, ни линеек: иерархию держит одна
         шкала кегля, как в спортивной афише.

   Фотографий нет ни в одном — решение «фона-картинки нет» от 22.08.2026
   держится. Хром браузера и шапка сайта у всех трёх одинаковые, чтобы
   сравнивать облик, а не оболочку. */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { ArrowLeft, ArrowRight, CalendarDays, LayoutDashboard, MoreHorizontal, Plus, Share, Sparkles, Timer, User } from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Brand } from '../ui';
import { FORM, ME, RESULTS } from './role14home';
import { DAY, TOURS, TOURS_FIELD, type Tour } from './role14day';
import 'swiper/css';
import 'swiper/css/pagination';
import './role14mobile.css';
export const NAV: [ReactNode, string][] = [
  [<LayoutDashboard size={19} />, 'Главная'],
  [<CalendarDays size={19} />, 'Календарь'],
  [<Timer size={19} />, 'Мой турнир'],
  [<User size={19} />, 'Профиль'],
];

/* Оболочка одна на все три.

   Хром браузера нарисован с натуры (снимок мобильного браузера от федерации):
   тёмная панель сверху, адрес по центру пилюлей, слева круглая кнопка со
   значком, справа «поделиться»; снизу — тёмная панель браузера: назад, вперёд,
   новая вкладка, счётчик вкладок, меню. Системный статус-бар при таком хроме
   тоже тёмный, с белым временем.

   Считать по макету теперь можно честно: сверху уходит статус-бар и панель
   адреса, снизу — панель браузера, и только между ними живёт страница со своей
   шапкой и своей навигацией. */
export function Chrome({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  return (
    <>
      <div className="mbb-top">
        <span className="mbb-round">
          <Sparkles size={15} />
          <i />
        </span>
        <span className="mbb-pill">fnt.kz</span>
        <Share size={17} />
      </div>

      {/* Профиль один: отдельной кнопки-колокола нет, уведомления открываются
          из профиля, а метка непрочитанного стоит на самом фото. Так в шапке
          одна цель вместо двух, и красная точка не спорит с фотографией за
          соседнее место. */}
      {!bare && (
      <div className="mb-site">
        <Brand size="sm" sub="Спортсмен" />
        <button type="button" className="mb-me" aria-label="Профиль и уведомления" data-to="Э14.7">
          <img src={ME.av} alt="" />
          <i className="mb-me-dot" />
        </button>
      </div>
      )}

      {children}

      {/* Нижняя панель браузера — поверх навигации сайта: она принадлежит
          браузеру, а не странице, и страница уезжает под неё. */}
      <div className="mbb-bottom">
        <ArrowLeft size={20} />
        <ArrowRight size={20} className="off" />
        <span className="mbb-plus">
          <Plus size={18} />
        </span>
        <span className="mbb-tabs">6</span>
        <MoreHorizontal size={20} />
      </div>
    </>
  );
}

/* Карусель матчей дня — общая для всех вариантов, вид карточки задаёт вариант. */
export function Deck<T>({ id, card, items, onIndex }: {
  id: string;
  card: (m: T) => ReactNode;
  items?: T[];
  /** Сообщает наружу, какой слайд открыт: действие под полем должно
      относиться к тому турниру, который человек сейчас видит. */
  onIndex?: (i: number) => void;
}) {
  return (
    <>
      <Swiper
        modules={[Pagination]}
        slidesPerView={1}
        speed={420}
        onSlideChange={(sw) => onIndex?.(sw.activeIndex)}
        pagination={{ el: `.${id}`, clickable: true, bulletClass: 'mb-dot', bulletActiveClass: 'on' }}
      >
        {((items ?? (DAY as unknown as T[]))).map((m, i) => (
          <SwiperSlide key={i}>{card(m)}</SwiperSlide>
        ))}
      </Swiper>
      <div className={'mb-dots ' + id} />
    </>
  );
}
/* ═══ Г · «Знак» — рабочая версия ═══════════════════════════════════
   Поле фирменного градиента знака ФНТ с лентой орнамента со щита, на него
   наезжает белый лист, действие лежит на границе планов.

   ВЫЗОВА КАК СОБЫТИЯ НЕТ (решение от 22.08.2026): судья не зовёт конкретного
   человека кнопкой, и рисовать под это состояния — значит рисовать процесс,
   которого нет. В поле стоит ТУРНИР.

   ПОЛЕ ЛИСТАЕТСЯ, полоски прогресса сверху — те самые «сторисы». Листаются не
   состояния, а турниры: первым мой текущий, дальше открытые приёмы, куда можно
   заявиться самому (ОРТ, §8.2). Так свайп получил смысл, которого у него не
   было, когда листались выдуманные состояния.

   ТРИ СОСТОЯНИЯ ЭКРАНА:
     current — турнир идёт: поле про него, под полем мои матчи сегодня;
     open    — текущего нет, но есть куда заявиться: поле про ближайший
               открытый приём, действие «Заявиться» → Э14.3;
     none    — ни текущего, ни открытых: так и написано словами, и экран ведёт
               в календарь, а не притворяется, что что-то есть. */
export function MobileBrand({
  state = 'current',
  look = 'г2',
}: { state?: 'current' | 'open' | 'none'; look?: 'г' | 'г2' } = {}) {
  const field = state === 'current' ? TOURS_FIELD : TOURS_FIELD.filter((t) => t.kind === 'open');
  /* Какой турнир человек сейчас видит в поле. Действие относится к нему, а не
     к первому: пролистав на открытый приём, нельзя предлагать «Мой турнир» —
     турнира, который можно открыть, у меня там ещё нет. */
  const [slide, setSlide] = useState(0);
  const shown = field[Math.min(slide, field.length - 1)];

  /* `mbr-ds` — выбранное решение цвета (Г-2, 23.08.2026): поле спокойное,
     акцент отдан кнопке, зелёный остаётся статусам. Прежний облик Г (поле в
     акценте, кнопка зелёная) остаётся доступным через `look="г"` — по нему
     сравнивают решения на полке, но в макете роли он больше не стоит. */
  return (
    <div className={'mb-wrap mbr' + (look === 'г2' ? ' mbr-ds' : '')}>
      <Frame>
        <Chrome>
          <div className="mb-body">
            {state === 'none' ? (
              /* Турниров нет вовсе. Первый заход показывал в поле надпись
                 «Сейчас заявиться некуда» — экран читался как ошибка: цветное
                 поле во весь верх, а в нём сообщение об отсутствии.

                 Теперь поле занято не отсутствием, а ИТОГОМ СЕЗОНА: рейтинг,
                 место, набранное за сезон и форма последних восьми матчей.
                 Между турнирами это ровно то, ради чего человек и заходит; а
                 то, что заявиться пока некуда, сказано строкой в листе, где
                 обычно стоит расписание. Заодно закрывается старый открытый
                 вопрос по межсезонному герою: из двух решений («до старта» и
                 «итог сезона») здесь работает второе, потому что отсчитывать
                 нечего. */
              <div className="mbr-card quiet">
                <div className="mbr-band" />
                <div className="mbr-in">
                  <div className="mbr-top">
                    <span className="mbr-state">Сезон 2026</span>
                    <span className="mbr-time o14-disp">8 турниров</span>
                  </div>

                  <div className="mbr-rate">
                    <span className="v o14-disp">2456</span>
                    <span className="k">рейтинг</span>
                  </div>
                  <div className="mbr-tour-sub">7 место в РК · +144 · 64 % побед</div>

                  {/* Форма сезона: восемь последних матчей штрихами. На поле
                      это единственная графика, и она из данных, а не украшение. */}
                  <div className="mbr-when">
                    <span className="mbr-form">
                      {FORM.map((w, i) => (
                        <i className={w ? 'w' : 'l'} key={i} />
                      ))}
                    </span>
                    <span className="d" />
                    <span className="t">последние 8</span>
                  </div>
                </div>
              </div>
            ) : (
              <Deck
                id="mbr-dots"
                items={field}
                onIndex={setSlide}
                card={(t: Tour) => (
                  <div className={'mbr-card' + (t.kind === 'open' ? ' quiet' : '')} data-to={t.kind === 'current' ? 'Э14.5' : 'Э14.2'}>
                    <div className="mbr-band" />
                    <div className="mbr-in">
                      <div className="mbr-top">
                        <span className="mbr-state">
                          {t.kind === 'current' ? 'Текущий турнир' : 'Можно заявиться'}
                        </span>
                        <span className="mbr-time o14-disp">{t.dates}</span>
                      </div>

                      <div className="mbr-tour o14-disp">{t.nm}</div>
                      <div className="mbr-tour-sub">{t.sub}</div>

                      {/* У текущего — расписание: круг, стол, время. У открытого —
                          срок приёма заявок: это единственное, что от него нужно. */}
                      <div className="mbr-when">
                        {/* Строка расписания набрана обычным гротеском, а не
                            дисплейной узкой: на 16 px она читалась сжатой и
                            чужой. Дисплейная осталась только на крупном. */}
                        {t.kind === 'current' ? (
                          <>
                            <span className="r">{t.round}</span>
                            <span className="d" />
                            <span className="t">{t.table}</span>
                            <span className="d" />
                            <span className="t">{t.time}</span>
                          </>
                        ) : (
                          <span className="r">{t.till}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            <div className="mbr-sheet">
              {state !== 'none' && shown?.kind === 'current' && (
                <button type="button" className="mbr-go" data-to="Э14.5">
                  Мой турнир <ArrowRight size={17} />
                </button>
              )}
              {state !== 'none' && shown?.kind === 'open' && (
                <button type="button" className="mbr-go" data-to="Э14.3">
                  Заявиться <ArrowRight size={17} />
                </button>
              )}
              {state === 'none' && (
                <button type="button" className="mbr-go" data-to="Э14.2">
                  Открыть календарь <ArrowRight size={17} />
                </button>
              )}

              {state === 'current' && (
                <>
                  <div className="mbr-group">
                  <div className="mbr-sec">Мои матчи сегодня</div>
                  {DAY.map((m) => (
                    <div className="mbr-row" key={m.round} data-to="Э14.5">
                      <span className="t o14-disp">{m.table}</span>
                      <span className="tx">
                        <span className="nm">{m.foe ?? 'соперник после жеребьёвки'}</span>
                        <span className="ss">{m.round}</span>
                      </span>
                      <span className="tm">{m.time}</span>
                    </div>
                  ))}
                  </div>
                </>
              )}

              {state === 'none' && (
                <div className="mbr-empty">
                  Открытых приёмов сейчас нет. Новые появятся в календаре — там же будут даты и
                  сроки подачи заявок.
                </div>
              )}

              {/* На экране 393×852 после турниров остаётся место — отдаём его
                  последним результатам, чтобы низ не пустовал обоями. */}
              {state === 'current' && (
                <>
                  <div className="mbr-group">
                  <div className="mbr-sec">Последние результаты</div>
                  {RESULTS.slice(0, 2).map((r) => (
                    <div className="mbr-row" key={r.nm} data-to="Э14.6">
                      <span className="tx">
                        <span className="nm">{r.nm}</span>
                        <span className="ss">{r.sub}</span>
                      </span>
                      <span className={'mbr-sc' + (r.win ? ' w' : ' l')}>{r.sc}</span>
                    </div>
                  ))}
                  </div>
                </>
              )}

              {/* В состоянии «есть куда заявиться» под полем идёт список
                  остальных открытых приёмов: одна карусель их все не покажет, а
                  снизу иначе остаётся пустая полоса обоев. */}
              {state === 'open' && (
                <div className="mbr-group">
                  <div className="mbr-sec">Куда ещё можно заявиться</div>
                  {TOURS_FIELD.filter((t) => t.kind === 'open').map((t) => (
                    <div className="mbr-row" key={t.nm} data-to="Э14.2">
                      <span className="tx">
                        <span className="nm">{t.nm}</span>
                        <span className="ss">{t.sub} · {t.till}</span>
                      </span>
                      <span className="mbr-tag on">ОТКРЫТ</span>
                    </div>
                  ))}
                </div>
              )}

              {state !== 'current' && (
                <div className="mbr-group">
                  <div className="mbr-sec">Последние результаты</div>
                  {RESULTS.map((r) => (
                    <div className="mbr-row" key={r.nm} data-to="Э14.6">
                      <span className="tx">
                        <span className="nm">{r.nm}</span>
                        <span className="ss">{r.sub}</span>
                      </span>
                      <span className={'mbr-sc' + (r.win ? ' w' : ' l')}>{r.sc}</span>
                    </div>
                  ))}
                </div>
              )}

              {state === 'current' && (
                <>
                  <div className="mbr-group">
                  <div className="mbr-sec">Ближайшие турниры</div>
                  {TOURS.map((t) => (
                    <div className="mbr-row" key={t.nm} data-to="Э14.2">
                      <span className="tx">
                        <span className="nm">{t.nm}</span>
                        <span className="ss">{t.sub}</span>
                      </span>
                      <span className={'mbr-tag' + (t.on ? ' on' : '')}>{t.on ? 'ПОДАНА' : 'РЕГИОН'}</span>
                    </div>
                  ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </Chrome>
        <MiniTabBar items={NAV} active="Главная" />
      </Frame>
    </div>
  );
}
