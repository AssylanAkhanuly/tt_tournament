import { Board as RespBoard, Col } from '../respShell';
import { Role10Board, Tours10_1 } from './role10';

export default {
  title: 'Макеты/10 · Инспектор / супервайзер',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 5 экранов', render: () => <Role10Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="10 · ИНСПЕКТОР — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э10.1 · Соревнования на контроле">
        <Tours10_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
