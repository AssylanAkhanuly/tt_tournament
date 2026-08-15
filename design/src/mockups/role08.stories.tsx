import { Board as RespBoard, Col } from '../respShell';
import { Role08Board, Shift8_1 } from './role08';

export default {
  title: 'Макеты/08 · Заместитель главного судьи',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 3 экрана', render: () => <Role08Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="8 · ЗАМЕСТИТЕЛЬ ГЛАВНОГО СУДЬИ — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э8.1 · Мой турнир — режим замещения">
        <Shift8_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
