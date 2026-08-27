import { Board as RespBoard, Col } from '../respShell';
import { Role05Board, Queues5_1 } from './role05';

export default {
  title: 'Макеты/05 · Председатель ГСК',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 14 экранов', render: () => <Role05Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="5 · ПРЕДСЕДАТЕЛЬ ГСК — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э5.1 · Панель ГСК">
        <Queues5_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
