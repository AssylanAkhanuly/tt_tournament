/* Э14.5 · Сетка на телефоне — настоящий холст, во весь экран.

   Сетка — главная вещь системы, и на телефоне она та же самая, что на
   компьютере: тот же компонент `widgets/bracket/BracketFlow` на React Flow, те
   же данные и связи. Список пар по кругам остаётся вторым видом (кнопка в
   шапке), но заменять сетку списком неправильно.

   ЭКРАН ОЧИЩЕН ДО ХОЛСТА (решение федерации от 25.08.2026):

     · шапка одна строка — назад, название турнира, переход к списку пар.
       Подзаголовок «сетка · 32 участника · 1/8 финала» снят: круг и так виден
       на самой сетке, а число участников на карте не нужно;
     · органов управления нет вовсе — ни ±, ни «мой матч», ни подсказки, ни
       нижней полосы. Щипок и перетаскивание привычны без объяснений, а кнопки
       закрывали собой ровно то, ради чего экран открывают;
     · подсвечен ВЕСЬ мой путь: каждый матч, где я участник, — сыгранные,
       идущий и следующий, когда он определится. Раньше кольцо стояло только
       на текущем, и путь по сетке приходилось искать глазами;
     · экран открывается на моём матче с читаемым масштабом — общий план на
       393 px нечитаем. Отдалить до всей сетки можно щипком. */

import { ArrowLeft, List } from 'lucide-react';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { Frame } from '../PlayerApp';
import { Chrome } from './role14mobile';
import { ME_ID, myBracket } from '../mockups/myBracket';
import './role14mobile8.css';

export function MobBracketFull() {
  return (
    <div className="mb-wrap m8">
      <Frame>
        <Chrome bare>
          <div className="m8-body">
            <div className="m8-bar">
              <button type="button" className="back" data-to="Э14.5">
                <ArrowLeft size={16} />
              </button>
              <span className="nm">Кубок Алматы 2026</span>
              <button type="button" className="alt" data-to="Э14.5" aria-label="Список пар">
                <List size={17} />
              </button>
            </div>

            <div className="m8-canvas">
              <BracketFlow
                bracket={myBracket}
                minePlayerId={ME_ID}
                focusMine
                controls={false}
                minZoom={0.12}
                fitPadding={0.12}
              />
            </div>
          </div>
        </Chrome>
      </Frame>
    </div>
  );
}
