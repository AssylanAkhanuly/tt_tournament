import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

// Смоук интеграционной обвязки: RTL + jsdom + jest-dom + user-event.
// Убеждаемся, что рендер компонента, запросы по роли/тексту, событие клика и
// матчеры jest-dom работают. Реальные компоненты покрываем поверх этой базы.
function Counter() {
  const [n, setN] = useState(0);
  return (
    <div>
      <span>Счёт: {n}</span>
      <button type="button" onClick={() => setN((v) => v + 1)}>
        Плюс
      </button>
    </div>
  );
}

describe('RTL + jsdom + jest-dom + user-event', () => {
  it('рендерит компонент и реагирует на клик', async () => {
    render(<Counter />);
    expect(screen.getByText('Счёт: 0')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Плюс' }));

    expect(screen.getByText('Счёт: 1')).toBeInTheDocument();
  });
});
