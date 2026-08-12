/* Узел флоу рядом со своим макетом.

   Раздел «Флоу» показывал схему роли, раздел «Макеты» — её экраны, и требование
   с картинкой лежали в разных местах дерева: чтобы понять, всё ли нарисовано,
   приходилось держать два экрана открытыми. Здесь узел и макет стоят вместе.

   Связь — код `Э№.№`: он один и тот же в `flows/*.md`, в данных роли, на схеме
   и в подписи колонки борда. Поэтому карточка не требует никакой новой разметки
   в макетах: борд отдаёт код, мы находим по нему узел в данных роли.

   Данные подаются через контекст, а не пропом: борды ролей (`Role14Board` и
   остальные двенадцать) уже написаны и в разделе «Макеты» показываются без
   узлов. Контекст позволяет обернуть тот же борд и получить парный вид, ничего
   в тринадцати файлах не трогая. */

import { createContext, useContext } from 'react';
import type { Mark, RoleFlow, Screen } from './types';
import './nodeSpec.css';

/** Флоу роли для парного вида. `null` — обычный борд «Макетов», без узлов. */
export const FlowSpecContext = createContext<RoleFlow | null>(null);

/** Узел флоу по коду экрана — `null`, если показываем борд сам по себе. */
export function useNodeSpec(code: string): Screen | null {
  const flow = useContext(FlowSpecContext);
  return flow?.screens.find((s) => s.id === code) ?? null;
}

const MARK: Record<Mark, string> = { ours: '✳', open: '⚠' };

const MarkSign = ({ mark }: { mark?: Mark }) =>
  mark ? <sup className={`fnode-mark ${mark}`} title={mark === 'ours' ? 'наше решение, ждёт подтверждения федерации' : 'открытый вопрос'}>{MARK[mark]}</sup> : null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fnode-sec">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

/** Требование к экрану: как попадает, зоны, действия, состояния. */
export function NodeSpec({ screen }: { screen: Screen }) {
  return (
    <div className="fnode">
      {screen.note && <p className="fnode-lead">{screen.note}<MarkSign mark={screen.mark} /></p>}

      {screen.entry.length > 0 && (
        <Section title="Как попадает">
          <ul>{screen.entry.map((e) => <li key={e}>{e}</li>)}</ul>
        </Section>
      )}

      {screen.zones.length > 0 && (
        <Section title="Зоны экрана">
          <div className="fnode-sec">
            {screen.zones.map((z) => (
              <div className="fnode-zone" key={z.title}>
                <b>{z.title}</b><MarkSign mark={z.mark} />
                {z.items.length > 0 && <span> — {z.items.join(', ')}</span>}
                {z.note && <em className="fnode-note">{z.note}</em>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {screen.actions.length > 0 && (
        <Section title="Действия">
          <div className="fnode-sec">
            {screen.actions.map((a) => (
              <div className="fnode-act" key={a.el + a.effect}>
                <b>{a.el}</b><MarkSign mark={a.mark} /> — {a.effect}
                {a.when && <span className="fnode-when">когда: {a.when}</span>}
                {a.to && <span className="fnode-to">→ {a.to}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {screen.states.length > 0 && (
        <Section title="Состояния">
          <div className="fnode-sec">
            {screen.states.map((s) => (
              <div className={`fnode-state ${s.tone ?? ''}`} key={s.title}>
                <b>{s.title}</b>
                {s.text && <span> — {s.text}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
