import { useState } from 'react';

/* Переключатели внутри экранов-макетов: сегмент в шапке панели («Сетка · Группы»)
   и сегмент в форме («По рейтингу · Вручную»). Раньше это была статичная
   разметка со `span.on`; теперь кнопки с состоянием, чтобы по макету можно было
   кликать. Вид не изменился — классы те же (`gen/desktop.css`). */

export function PanelSeg({ items, active }: { items: string[]; active?: string }) {
  const [cur, setCur] = useState(active ?? items[0]);
  return (
    <span className="seg">
      {items.map((it) => (
        <button key={it} type="button" className={it === cur ? 'on' : undefined} onClick={() => setCur(it)}>
          {it}
        </button>
      ))}
    </span>
  );
}

export function FormSeg({ items, active }: { items: string[]; active?: string }) {
  const [cur, setCur] = useState(active ?? items[0]);
  return (
    <div className="dseg2">
      {items.map((it) => (
        <button key={it} type="button" className={it === cur ? 'on' : undefined} onClick={() => setCur(it)}>
          {it}
        </button>
      ))}
    </div>
  );
}
