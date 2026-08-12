/* Парный вид: маршрут роли, где под каждым узлом стоит его макет.

   Обёртка вокруг готового борда роли из `src/mockups/roleNN.tsx`. Она только
   подаёт данные роли в контекст — дальше колонка борда (`Screen` в
   `mockups/shell.tsx`) сама находит свой узел по коду `Э№.№` и рисует под
   макетом карточку требования.

   Поэтому борды ролей не переписывались: тот же `Role14Board` в разделе
   «Макеты» показывается без узлов, а здесь — с ними. */

import type { ReactNode } from 'react';
import { FlowSpecContext } from './nodeSpec';
import type { RoleFlow } from './types';
import './nodeSpec.css';

export function Paired({ flow, children }: { flow: RoleFlow; children: ReactNode }) {
  return (
    <FlowSpecContext.Provider value={flow}>
      <div className="fpaired">
        <div className="fpaired-lead">
          <div className="fpaired-route">
            <b>Маршрут.</b> {flow.route}
          </div>
          <div className="fpaired-meta">
            <span><b>{flow.screens.length}</b> экранов · {flow.device}</span>
            {flow.scope && <span>область: {flow.scope}</span>}
            <span>источник: <code>{flow.source}</code></span>
          </div>
          {flow.hypothesis && (
            <div className="fpaired-warn">
              <b>⚠ Роль не описана в документе федерации.</b> {flow.hypothesis}
            </div>
          )}
          <div className="fpaired-legend">
            <span><b className="ours">✳</b> наше решение, ждёт подтверждения федерации</span>
            <span><b className="open">⚠</b> открытый вопрос</span>
            <span>Схема этой же роли — соседняя история «Схема».</span>
          </div>
        </div>
        {children}
        {(flow.cannot.length > 0 || flow.questions.length > 0) && (
          <div className="fpaired-foot">
            {flow.cannot.length > 0 && (
              <div className="fpaired-col">
                <h4>Чего роль не может</h4>
                <ul>{flow.cannot.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
            {flow.questions.length > 0 && (
              <div className="fpaired-col">
                <h4>Открытые вопросы к федерации</h4>
                <ul>{flow.questions.map((q) => <li key={q}>{q}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </FlowSpecContext.Provider>
  );
}
