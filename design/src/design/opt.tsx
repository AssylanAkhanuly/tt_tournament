/* Полка вариантов экрана — новый шаг пайплайна: экран сначала рисуется
   несколькими решениями, из них выбирается одно, и уже выбранное раскатывается
   на остальные экраны роли.

   Здесь только оболочка полки. Сами варианты живут в файлах роли
   (`design/role14home.tsx` и далее), а требование к экрану — в `flows/*.md`:
   вариант отличается решением, а не содержанием, и содержание у всех одно. */

import type { ReactNode } from 'react';
import './opt.css';

export function OptionBoard({
  code,
  title,
  tag,
  children,
}: {
  /** Код экрана Э№.№ — тот же, что в flows/, на карте роли и в макетах. */
  code: string;
  title: string;
  /** Одной строкой: на какой вопрос человека отвечает экран. */
  tag: string;
  children: ReactNode;
}) {
  return (
    <div className="opt-board">
      <div className="opt-h">
        <span className="opt-h-code">{code}</span>
        <span className="opt-h-title">{title}</span>
        <span className="opt-h-tag">{tag}</span>
      </div>
      {children}
    </div>
  );
}

export function Option({
  letter,
  name,
  idea,
  pros,
  cons,
  adds,
  children,
}: {
  /** А, Б, В — как на них ссылаются в разговоре и в решении. */
  letter: string;
  name: string;
  /** Что за решение зашито в вариант — одной фразой. */
  idea: string;
  pros: string[];
  cons: string[];
  /** Чего нет в flows/ и появится, если вариант выберут: честно и списком. */
  adds?: string[];
  children: ReactNode;
}) {
  return (
    <section className="opt-item">
      <div className="opt-cap">
        <span className="opt-letter">{letter}</span>
        <span className="opt-name">{name}</span>
        <span className="opt-idea">{idea}</span>
      </div>
      <div className="opt-body">
        <div>{children}</div>
        <aside className="opt-notes">
          <h4>За что</h4>
          <ul>
            {pros.map((p) => (
              <li className="plus" key={p}>{p}</li>
            ))}
          </ul>
          <h4>Чем платим</h4>
          <ul>
            {cons.map((c) => (
              <li className="minus" key={c}>{c}</li>
            ))}
          </ul>
          {adds && adds.length > 0 && (
            <>
              <h4>Сверх флоу</h4>
              <ul>
                {adds.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
