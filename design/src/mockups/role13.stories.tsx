import { Board as RespBoard, Col } from '../respShell';
import { Role13Board, Club13_1 } from './role13';

export default {
  title: 'Макеты/13 · Администратор клуба',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 5 экранов', render: () => <Role13Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="13 · АДМИНИСТРАТОР КЛУБА — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э13.1 · Мой клуб">
        <Club13_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
