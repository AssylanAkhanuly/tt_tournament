import { Board as RespBoard, Col } from '../respShell';
import { Home14_1, Role14Board } from './role14';
import { Role14AppBoard } from './role14app';

/* Тема прибита к светлой (23.08.2026): экраны роли собраны обликом Г-2, а он
   рисовался и выбирался на светлой теме — «светлая на синем знака ФНТ»
   (flows/14-sportsmen.md). На тёмной лист перестаёт быть листом, и два плана
   схлопываются в один. Переключатель в тулбаре при этом работает. */
export default {
  title: 'Макеты/14 · Спортсмен',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

export const Flow = { name: 'Макеты по флоу · 16 экранов', render: () => <Role14Board /> };

export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="14 · СПОРТСМЕН — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э14.1 · Главная">
        <Home14_1 variant="land" />
      </Col>
    </RespBoard>
  ),
};

/* Приложение проектируем после веба (TZ §10) — экраны нарисованы впрок. */
export const App = { name: 'Приложение · позже', render: () => <Role14AppBoard /> };
