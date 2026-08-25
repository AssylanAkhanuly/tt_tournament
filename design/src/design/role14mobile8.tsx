/* Э14.5 · Сетка на телефоне — настоящий холст, во весь экран.

   ПОЧЕМУ ПЕРЕДЕЛАНО. Первый заход показывал сетку списком пар по кругам —
   «сетка без сетки». Решение федерации: сетка — главная вещь системы, и на
   телефоне она должна быть той же самой, что на компьютере: тот же компонент
   `widgets/bracket/BracketFlow` на React Flow, те же данные, те же связи.
   Список пар остаётся, но как второй вид, а не как замена.

   ЧТО СДЕЛАНО ДЛЯ ТЕЛЕФОНА. Холст живёт во весь экран: шапка сайта снята
   (`Chrome bare`), навигации роли нет — на карте она только отнимает высоту.
   Сверху узкая полоса: назад, турнир, круг. Дальше — сам холст. Управление
   переписано под палец (в самом компоненте, режим `touch`):

     · «Мой матч» — крупная кнопка внизу справа: возвращает к своей паре и
       приближает до читаемых фамилий. Это главное действие экрана: из
       шестидесяти четырёх пар человек ищет одну.
     · ± и «вся сетка» — столбиком под ней, кнопки 46 px, а не 26 px, как у
       стандартных Controls React Flow, и в зоне большого пальца, а не в
       противоположном углу.
     · щипок и перетаскивание работают штатно — это и есть привычный жест
       карты, ничего изобретать не нужно.

   Своя пара помечена на холсте кольцом акцента: цветом её пометить нельзя —
   цвета уже заняты состояниями матча (идёт, сыгран).

   Внизу — полоса своего матча: соперник, стол, время и переход на «Мой матч».
   Она не перекрывает холст, потому что холст и так занимает всё, а знать
   «где я играю» нужно, не выходя с карты. */

import { ArrowLeft, ChevronRight, List } from 'lucide-react';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { Frame } from '../PlayerApp';
import { Chrome } from './role14mobile';
import { MY_MATCH_ID, myBracket } from '../mockups/myBracket';
import './role14mobile8.css';

export function MobBracketFull() {
  return (
    <div className="mb-wrap m8">
      <Frame>
        <Chrome bare>
          <div className="m8-body">
            {/* Узкая полоса: откуда пришли и что смотрим. Всё остальное место
                отдано холсту. */}
            <div className="m8-bar">
              <button type="button" className="back" data-to="Э14.5">
                <ArrowLeft size={16} />
              </button>
              <span className="tx">
                <span className="nm">Кубок Алматы 2026</span>
                <span className="ss">сетка · 32 участника · 1/8 финала</span>
              </span>
              <button type="button" className="alt" data-to="Э14.5" aria-label="Список пар">
                <List size={17} />
              </button>
            </div>

            {/* Тот же компонент, что на десктопе и во фронте: настоящая сетка,
                а не картинка. minZoom ниже десктопного — на 393 px общий план
                иначе не помещается. */}
            <div className="m8-canvas">
              <BracketFlow
                bracket={myBracket}
                mineId={MY_MATCH_ID}
                touch
                focusMine
                minZoom={0.12}
                fitPadding={0.12}
              />
            </div>

            {/* Подсказка про жест — один раз, тихо, поверх холста. */}
            <div className="m8-hint">Щипком — масштаб · «Мой матч» вернёт к вашей паре</div>

            <div className="m8-mine" data-to="Э14.5">
              <span className="k">Мой матч</span>
              <span className="tx">
                <span className="nm">Жумабеков Расул</span>
                <span className="ss">1/8 финала · стол 5 · 14:20</span>
              </span>
              <ChevronRight size={18} />
            </div>
          </div>
        </Chrome>
      </Frame>
    </div>
  );
}
