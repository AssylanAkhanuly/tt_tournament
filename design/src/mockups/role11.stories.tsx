import { Board as RespBoard, Col } from '../respShell';
import { Role11Board, Cands11_1 } from './role11';

export default {
  title: 'Макеты/11 · Главный тренер национальной команды',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 3 экрана', render: () => <Role11Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="11 · ГЛАВНЫЙ ТРЕНЕР СБОРНОЙ — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э11.1 · Кандидаты в сборную">
        <Cands11_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};
