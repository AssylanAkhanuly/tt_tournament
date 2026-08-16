/* Карточка компонента: описание рядом с живым примером.

   Витрины по разделам («Формы», «Данные», …) показывают, что у нас есть, но не
   отвечают на вопросы, из-за которых компоненты и используют неправильно:
   зачем он, когда не нужен, какие у него состояния и что задаётся снаружи.
   Поэтому у каждого компонента своя история и одна и та же структура:

   зачем → когда не нужен → состояния (живьём) → свойства.

   Ничего нового про цвет и форму здесь не заводится: страница собрана на тех
   же токенах и примитивах, что и макеты. */

import type { ReactNode } from 'react';
import './spec.css';

export type SpecProp = { name: string; type: string; what: string };
export type SpecCase = { t: string; note?: string; view: ReactNode };

export function Spec({
  name,
  lead,
  why,
  not,
  cases,
  props,
  where,
}: {
  /** Название по-русски и в коде: «Поле ввода · Input». */
  name: string;
  /** Одна фраза: что это. */
  lead: string;
  /** Зачем он нужен и какое решение в нём зашито. */
  why: string[];
  /** Когда его брать не надо — и что вместо. */
  not?: string[];
  /** Состояния и варианты: подпись, пояснение и сам компонент живьём. */
  cases: SpecCase[];
  /** Свойства: имя, тип, что задаёт. */
  props?: SpecProp[];
  /** Где применяется в макетах ролей. */
  where?: string;
}) {
  return (
    <div className="spec">
      <div className="spec-head">
        <h2>{name}</h2>
        <p>{lead}</p>
      </div>

      <div className="spec-cols">
        <section className="spec-sec">
          <h3>Зачем</h3>
          <ul>
            {why.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>

        {not && (
          <section className="spec-sec">
            <h3>Когда не нужен</h3>
            <ul>
              {not.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section className="spec-sec">
        <h3>Состояния и варианты</h3>
        <div className="spec-cases">
          {cases.map((c) => (
            <div className="spec-case" key={c.t}>
              <div className="spec-case-h">
                <b>{c.t}</b>
                {c.note && <span>{c.note}</span>}
              </div>
              <div className="spec-case-b">{c.view}</div>
            </div>
          ))}
        </div>
      </section>

      {props && (
        <section className="spec-sec">
          <h3>Свойства</h3>
          <div className="spec-props">
            {props.map((p) => (
              <div className="spec-prop" key={p.name}>
                <code>{p.name}</code>
                <span className="ty">{p.type}</span>
                <span>{p.what}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {where && <div className="spec-where">Где применяется: {where}</div>}
    </div>
  );
}
