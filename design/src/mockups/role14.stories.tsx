import { Board as RespBoard, Col } from '../respShell';
import { Calendar14_2, Role14Board } from './role14';
import { Role14AppBoard } from './role14app';

/* Тема прибита к светлой, как в разделе «Дизайн»: роль проектируется и
   принимается на светлой (решение 22.08.2026, flows/14-sportsmen.md). Без
   этого макеты роли показывались на теме из тулбара, и один и тот же экран
   выглядел то светлым, то тёмным. Переключатель в тулбаре при этом работает:
   посмотреть роль на тёмной по-прежнему можно. */
export default {
  title: 'Макеты/14 · Спортсмен',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

export const Flow = { name: 'Макеты по флоу · 15 экранов', render: () => <Role14Board /> };

/* Главной (Э14.1) в роли больше нет ✳ (30.08.2026), и первым экраном стоит
   объединённая вкладка «Турниры» — на планшете показываем её. */
export const Tablet = {
  name: 'Адаптив · планшет',
  render: () => (
    <RespBoard title="14 · СПОРТСМЕН — ПЛАНШЕТ" tag="веб · планшет · тот же экран, раскладка плотнее">
      <Col cap="Э14.2 · Турниры">
        <Calendar14_2 variant="land" />
      </Col>
    </RespBoard>
  ),
};

/* Приложение проектируем после веба (TZ §10) — экраны нарисованы впрок. */
export const App = { name: 'Приложение · позже', render: () => <Role14AppBoard /> };
