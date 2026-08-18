/* Правая половина карты флоу: макет выбранного экрана, его переходы и
   требование к нему.

   Отдельным файлом, потому что карт две: маршрут одной роли (`map.tsx`) и
   сквозной ход турнира через все роли (`tournament.tsx`). Левые половины у них
   разные — дерево маршрута против состояний турнира, — а правая одна и та же:
   тот же макет, те же подсвеченные переходы, то же требование. Две копии этого
   кода разъехались бы на первой же правке. */

import { useEffect, useRef, useState } from 'react';
import type { Screen } from './types';
import type { ScreenMap } from '../mockups/shell';
import { NodeSpec } from './nodeSpec';
import { role00 } from './data/role00';
import './map.css';

/** Подпись действия и подпись кнопки к общему виду: ««Выдать роль»» → «выдать роль». */
export const norm = (s: string) =>
  s.toLowerCase().replace(/[«»"'`]/g, '').replace(/[·—–]/g, ' ').replace(/\s+/g, ' ').trim();

export function ScreenPane({
  screens,
  selected,
  onSelect,
  tab,
  spec,
  byId,
}: {
  /** Макеты, доступные карте: переход внутри макета срабатывает только на них —
      уводить на экран, которого на карте нет, некуда. */
  screens: ScreenMap;
  selected: string;
  onSelect: (code: string) => void;
  /** Открытая вкладка выбранного экрана; `null` — экран как есть. */
  tab: string | null;
  /** Требование к экрану из данных роли. */
  spec?: Screen;
  /** Экраны по кодам: по ним размечаются пункты сайдбара внутри макета. */
  byId: Map<string, Screen>;
}) {
  const [fit, setFit] = useState(true);

  /* Макет нарисован в натуральную величину (ноутбук — 1200 px), а панель у́же:
     ужимаем его целиком, иначе видно левую треть экрана. Масштаб считаем от
     реальной ширины содержимого — у планшета и телефона она другая. */
  const pane = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const box = pane.current;
    const content = inner.current;
    if (!box || !content) return;
    const measure = () => {
      const w = content.scrollWidth || 1;
      const k = fit ? Math.min(1, (box.clientWidth - 36) / w) : 1;
      setScale(k);
      setHeight(content.scrollHeight * k);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(content);
    return () => ro.disconnect();
  }, [selected, fit]);

  /* Переходы прямо в макете: кнопка на экране ведёт туда же, куда написано в
     данных. Ищем её по подписи действия — так проверяется и сам макет: у
     действия с переходом нашлась кнопка или нарисовать её забыли. Элемент, у
     которого переход задан руками (строка списка, плитка), помечается
     атрибутом `data-to` — по нему совпадение точное. */
  const [links, setLinks] = useState<
    { el: string; to: string; when?: string; found: boolean; common: boolean }[]
  >([]);

  /* Открыть нужную вкладку — значит нажать её в макете: переключатель рабочий,
     и карта пользуется им так же, как человек. */
  useEffect(() => {
    const root = inner.current;
    if (!root || !tab) return;
    const want = norm(tab);
    const hit = [...root.querySelectorAll<HTMLElement>('.dseg2 button, .seg button')].find((b) => {
      const label = norm(b.textContent ?? '');
      return label === want || label.startsWith(want);
    });
    if (hit && !hit.classList.contains('on')) hit.click();
  }, [tab, selected, scale]);

  useEffect(() => {
    const root = inner.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-goto], .fmap-hot').forEach((el) => {
      el.removeAttribute('data-goto');
      el.classList.remove('fmap-hot');
    });
    /* Пункты сайдбара тоже ведут по разделам: какой пункт открывает экран,
       написано в самих данных («Пункт меню «Календарь»»). Не нашли по меню —
       пробуем по названию экрана: в макете пункт называется «Новости», а экран
       — «Новости и страницы». */
    const menu = (code: string, screen: Screen) => {
      const byMenu = screen.entry.join(' ').match(/Пункт меню «(.+?)»/)?.[1];
      return { code, byMenu: byMenu ? norm(byMenu) : null, title: norm(screen.title) };
    };
    const sections = [...byId.entries()].map(([code, sc]) => menu(code, sc));
    root.querySelectorAll<HTMLElement>('.dni, .tabbar .tab').forEach((nav) => {
      const label = norm(nav.textContent ?? '');
      if (!label) return;
      const hit =
        sections.find((x) => x.byMenu === label) ??
        sections.find((x) => x.title === label) ??
        sections.find((x) => label.length > 3 && x.title.startsWith(label));
      if (hit && hit.code !== selected) {
        nav.dataset.goto = hit.code;
        nav.classList.add('fmap-hot');
      }
    });

    /* Элемент с явным `data-to` — уже переход, и ждать для него действия в
       данных не нужно: раньше размечались только те элементы, которым нашлось
       действие с `to:`, и возврат «← Календарь сезона» в карте не работал.
       Так же устроены колокольчик и имя в шапке.

       Метку `data-goto` таким элементам не ставим — только подсветку. Метку
       вешает эффект, а он не знает про состояние внутри макета: на четвёртом
       шаге мастера возврат ведёт на предыдущий шаг и `data-to` у него уже нет,
       но метка с первого шага осталась бы висеть и уводила в календарь. */
    root.querySelectorAll<HTMLElement>('[data-to]').forEach((el) => {
      const to = el.dataset.to;
      if (to && to !== selected && screens[to]) el.classList.add('fmap-hot');
    });

    const targets = (spec?.actions ?? []).filter((a) => a.to);
    const cands = [
      ...root.querySelectorAll<HTMLElement>(
        'button, .drow, .item, .ttab, .dchip, .dseg2 span, .jstart, .jbtn, [data-to]',
      ),
    ];
    setLinks(
      targets.map((a) => {
        const want = norm(a.el);
        /* Три способа узнать элемент, по порядку надёжности: переход задан
           руками; строка списка сама называет код экрана («Э6.2 · приём открыт
           до 12.03» — так подписаны строки «что сейчас требуется»); подпись
           кнопки совпадает с подписью действия. */
        const hit =
          cands.find((c) => c.dataset.to === a.to) ??
          cands.find(
            (c) =>
              (c.classList.contains('drow') || c.classList.contains('item')) &&
              (c.textContent ?? '').includes(a.to!),
          ) ??
          cands.find((c) => want.length > 2 && norm(c.textContent ?? '').includes(want));
        if (hit) {
          if (!hit.dataset.to) hit.dataset.goto = a.to!;
          hit.classList.add('fmap-hot');
        }
        return {
          el: a.el,
          to: a.to!,
          when: a.when,
          found: !!hit,
          // Сквозной экран может жить в разделе 00, а не в борде этой роли.
          common: !screens[a.to!] && role00.screens.some((sc) => sc.id === a.to),
        };
      }),
    );
    /* `tab` в зависимостях: после переключения вкладки в макете другие кнопки,
       и переходы надо разметить заново. */
  }, [selected, spec, scale, byId, screens, tab]);

  const go = (e: React.MouseEvent) => {
    const hit = (e.target as HTMLElement).closest<HTMLElement>('[data-to], [data-goto]');
    /* Живой `data-to` важнее метки: метку ставит эффект, и она устаревает при
       смене состояния внутри макета. Он же ловит переходы, которые появились
       после отрисовки, — меню профиля и ленту уведомлений. */
    const to = hit?.dataset.to ?? hit?.dataset.goto;
    if (to && screens[to]) {
      e.preventDefault();
      onSelect(to);
      pane.current?.scrollTo({ top: 0 });
    }
  };


  return (
      <div className="fmap-view" ref={pane}>
        <div className="fmap-bar">
          <div>
            <span className="mkcode">{selected}</span> {screens[selected]?.cap}
          </div>
          <div className="fmap-zoom">
            <button type="button" className={fit ? 'on' : undefined} onClick={() => setFit(true)}>
              Вписать
            </button>
            <button type="button" className={fit ? undefined : 'on'} onClick={() => setFit(false)}>
              100%
            </button>
          </div>
        </div>

        <div className="fmap-shot" style={{ height: height || undefined }} onClickCapture={go}>
          <div
            ref={inner}
            className="fmap-scale"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            {/* Экран на выбранной вкладке: если роль отдала `tabView`, карта
                показывает именно его — иначе тот же экран, а вкладку в нём
                нажимает эффект ниже. */}
            {(tab && screens[selected]?.tabView?.(tab)) || screens[selected]?.view()}
          </div>
        </div>

        {links.length > 0 && (
          <div className="fmap-links">
            <h4>Переходы с этого экрана — подсвечены прямо в макете</h4>
            {links.map((l) => (
              <button
                key={l.el + l.to}
                type="button"
                className={
                  'fmap-link' + (l.found ? '' : l.common ? ' cond' : l.when ? ' cond' : ' miss')
                }
                onClick={() => screens[l.to] && onSelect(l.to)}
              >
                <b>{l.el}</b>
                <span>
                  → {l.to} ·{' '}
                  {screens[l.to]?.cap ?? (l.common ? 'сквозной экран — раздел 00' : 'экрана нет в макетах')}
                </span>
                {!l.found && (
                  <em>
                    {l.common
                      ? 'экран описан в сквозных (раздел 00) — в борде этой роли его нет'
                      : l.when
                      ? `кнопки на этом кадре нет — она доступна: ${l.when}`
                      : 'кнопки на макете не нашлось — действие не нарисовано'}
                  </em>
                )}
              </button>
            ))}
          </div>
        )}

        {spec && (
          <div className="fmap-spec">
            <NodeSpec screen={spec} />
          </div>
        )}
      </div>
  );
}
