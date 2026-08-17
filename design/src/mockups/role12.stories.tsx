import { Board as RespBoard, Col } from '../respShell';
import { Role12Board, Region12_1 } from './role12';

export default {
  title: 'Макеты/12 · Старший тренер региона',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 8 экранов', render: () => <Role12Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="12 · СТАРШИЙ ТРЕНЕР РЕГИОНА — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э12.1 · Мой регион">
        <Region12_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
