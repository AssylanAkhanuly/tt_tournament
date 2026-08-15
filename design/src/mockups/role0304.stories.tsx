import { Board as RespBoard, Col } from '../respShell';
import { Role0304Board, Dash3_1 } from './role0304';

export default {
  title: 'Макеты/03–04 · Менеджеры-наблюдатели',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 4 экрана', render: () => <Role0304Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="3 и 4 · МЕНЕДЖЕРЫ-НАБЛЮДАТЕЛИ — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э3.1 · Обзорная панель">
        <Dash3_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
