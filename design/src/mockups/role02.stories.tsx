import { Board as RespBoard, Col } from '../respShell';
import { Fees2_1Tablet, Role02Board } from './role02';

export default {
  title: 'Макеты/02 · Экономист / бухгалтер',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 5 экранов', render: () => <Role02Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="2 · ЭКОНОМИСТ — ПЛАНШЕТ" tag="веб · планшет · та же таблица, раскладка не меняется">
      <Col cap="Э2.1 · Взносы за сезон">
        <Fees2_1Tablet />
      </Col>
    </RespBoard>
  ),
};
