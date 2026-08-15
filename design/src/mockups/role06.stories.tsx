import { Board as RespBoard, Col } from '../respShell';
import { Role06Board, Tournament6_1 } from './role06';

export default {
  title: 'Макеты/06 · Главный судья соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 10 экранов', render: () => <Role06Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="6 · ГЛАВНЫЙ СУДЬЯ — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э6.1 · Мой турнир">
        <Tournament6_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
