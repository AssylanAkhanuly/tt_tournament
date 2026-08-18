import { Board as RespBoard, Col } from '../respShell';
import { Role07Board, Desk7_1 } from './role07';

export default {
  title: 'Макеты/07 · Главный секретарь соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 7 экранов', render: () => <Role07Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="7 · ГЛАВНЫЙ СЕКРЕТАРЬ — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э7.1 · Рабочий стол секретаря">
        <Desk7_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
