'use client';

/* Формула у коэффициента ✳ (03.11.2026, решение владельца продукта): в
   подсказке у значка — формула Положения, в которой стоит этот коэффициент,
   и он в ней выделен. Формулы — из движка (`back/rating/engine.py`,
   RATING.md, раздел 3): п. 9.2–9.3 — изменение за матч и ожидаемый результат,
   п. 11 — переходный период, п. 12.1 — потолок, п. 17.4 — перевод из ITTF. */

import type { ReactNode } from 'react';

/** Выделенное обозначение — то, что правит строка. */
const H = ({ children }: { children: ReactNode }) => (
  <b className="rounded-sm bg-blue-100 px-1 font-semibold text-blue-700" data-testid="formula-mark">
    {children}
  </b>
);

const Line = ({ children }: { children: ReactNode }) => <span className="block whitespace-nowrap">{children}</span>;

type Mark = 'D' | 'K' | 'C' | 'P' | 'R' | 'cap' | 'N' | 'Rmax' | 'k';

/** Rнов = Rстар + P × K × C × (S − E); E = 1 / (1 + 10^((Rсоп − R) / D)). */
function Main({ mark }: { mark: Mark }) {
  const t = (m: Mark, text: ReactNode) => (mark === m ? <H>{text}</H> : text);
  return (
    <>
      <Line>
        Rнов = {t('R', 'Rстар')} + {t('P', 'P')} × {t('K', 'K')} × {t('C', 'C')} × (S − E)
      </Line>
      <Line>
        E = 1 / (1 + 10<sup>(Rсоп − R) / {t('D', 'D')}</sup>)
      </Line>
    </>
  );
}

/** Формула для коэффициента по имени поля (`d`, `k_standard`, `c_top`…). */
export function formulaFor(key: string): ReactNode | null {
  if (key === 'd') return <Main mark="D" />;
  if (key === 'k_standard') return <Main mark="K" />;
  if (key === 'k_transition')
    return (
      <>
        <Main mark="K" />
        <Line>
          <H>K</H> = Kперех в первых N матчах новичка
        </Line>
      </>
    );
  if (key === 'transition_matches')
    return (
      <Line>
        K = Kперех в первых <H>N</H> матчах, дальше K = Kстанд
      </Line>
    );
  if (key === 'max_delta' || key === 'cap_in_transition')
    return (
      <Line>
        |P × K × C × (S − E)| ≤ <H>Δmax</H>
      </Line>
    );
  if (key === 'baseline') return <Main mark="R" />;
  if (key === 'prize_mode' || key.startsWith('p_')) return <Main mark="P" />;
  if (key.startsWith('c_')) return <Main mark="C" />;
  if (key === 'ittf_r_max')
    return (
      <Line>
        Rстарт = <H>Rmax</H> − k × ln(N)
      </Line>
    );
  if (key === 'ittf_k')
    return (
      <Line>
        Rстарт = Rmax − <H>k</H> × ln(N)
      </Line>
    );
  return null;
}
