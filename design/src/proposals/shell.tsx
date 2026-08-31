/* Раздел «Предложения» ✳ (31.08.2026).

   Федерация прислала документ с шестью дополнениями («Предложения.pdf»,
   первоисточник — `docs/refs/predlozheniya-dopolneniya-2026-08-31.md`). Пять
   пунктов из шести — новый объём, а не уточнение существующего, и один из них
   сам документ помечает словами «как вариант». Пока владелец продукта не выбрал
   объём, разносить это по `TZ.md`, `ROLES.md` и `flows/*.md` нельзя: там живут
   принятые решения, а не заявки на них.

   Поэтому экраны предложений собраны отдельным разделом. Коды у них **П№.№**, а
   не Э№.№: это не экраны маршрута, и `lint:flows` их не проверяет — проверять
   нечего, сценария в `flows/` у них ещё нет. Приняли предложение — экран
   переезжает в роль, получает код Э№.№ и всё, что к нему положено.

   Кадры показываются так же, как в бордах ролей: колонка с кодом и подписью,
   под макетом — врезки других кадров того же экрана. */

import { Fragment, type ReactNode } from 'react';
import { Also, Screen, type ScreenMap } from '../mockups/shell';

export function PropBoard({
  num,
  title,
  tag,
  screens,
}: {
  /** Номер пункта в документе федерации: по нему сверяются с первоисточником. */
  num: string;
  title: string;
  tag: string;
  screens: ScreenMap;
}) {
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">
          ПРЕДЛОЖЕНИЕ {num} · {title.toUpperCase()}
        </div>
        <div className="board-tag">{tag}</div>
      </div>
      <div className="row">
        {Object.entries(screens).map(([code, s]) => (
          <Fragment key={code}>
            <Screen code={code} cap={s.cap}>
              {s.view()}
              {s.alt && <Also cap="Тот же экран во втором формате">{s.alt()}</Also>}
              {s.frames?.map((f) => (
                <Also key={f.t} cap={f.t}>
                  {f.view()}
                </Also>
              ))}
            </Screen>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** Плашка над бордом: что именно просила федерация — дословно. Разбор рядом с
    макетом, а не в отдельном файле: смотреть предложение и читать его текст
    человек будет одновременно. */
export const Ask = ({ children }: { children: ReactNode }) => (
  <div className="mkask">{children}</div>
);
