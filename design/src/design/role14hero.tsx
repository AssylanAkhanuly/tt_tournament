/* Э14.1 · вариант А — чем закрыт фон героя.

   Отдельный предмет выбора. У А верх экрана занимает вызов на стол, и сейчас
   под ним лежит одна дежурная фотография ракетки на столе
   (`src/assets/tt-hero.jpg`). Фотография попала туда не как решение, а как
   средство: варианты браковали за «плоские прямоугольники», и слой-картинка
   был самым коротким способом получить слои. Она же стоит обложкой турнира,
   постером в варианте И и промо в П — то есть одна и та же картинка играет
   четыре роли.

   Здесь шесть заполнений одного и того же героя. Содержание не меняется
   (ВАС ВЫЗВАЛИ · стол 5 · Кубок Алматы · открыть матч · соперник) — меняется
   только то, что лежит под текстом, и вместе с ним ответ на три вопроса:
   откуда картинка берётся, что показывать, когда её нет, и кто отвечает за
   права на неё. */

import { FOE, H2H, hero } from './role14home';
import { Play } from 'lucide-react';
import './role14hero.css';

/* `empty` — не решение, а состояние двух первых: обложки у турнира нет. */
export type HeroBackdrop = 'photo' | 'band' | 'table' | 'hall' | 'foe' | 'board' | 'empty';

/* Стол в зале: свой — пятый. Плана зала в системе нет, поэтому у варианта
   «план» честно стоит ⚠ в разборе. */
const HALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function Art({ bg }: { bg: HeroBackdrop }) {
  if (bg === 'empty') return null;

  if (bg === 'photo' || bg === 'band') {
    return <div className={'obh-art obh-art--' + bg} style={{ backgroundImage: `url(${hero})` }} />;
  }

  if (bg === 'foe') {
    /* Портрет соперника размыт намеренно: это атмосфера, а не карточка. Сама
       карточка с резким фото стоит справа — иначе одно и то же лицо
       показывалось бы дважды в одном размере. */
    return (
      <div className="obh-art obh-art--foe">
        <div className="obh-foebg" style={{ backgroundImage: `url(${FOE.av})` }} />
      </div>
    );
  }

  if (bg === 'table') {
    /* Стол сверху в перспективе: синее полотно, белая линия одиночной игры,
       сетка поперёк. Всё рисованное — картинка не нужна, разрешение любое. */
    return (
      <div className="obh-art obh-art--table">
        <div className="obh-tbl">
          <div className="obh-tbl-plane">
            <div className="obh-tbl-mid" />
            <div className="obh-tbl-net" />
          </div>
        </div>
      </div>
    );
  }

  if (bg === 'hall') {
    /* План зала: двенадцать столов, мой — пятый. Отвечает буквально на «куда
       идти», а не «в каком виде спорта я нахожусь». */
    return (
      <div className="obh-art obh-art--hall">
        <div className="obh-hall">
          {HALL.map((n) => (
            <i className={n === 5 ? 'mine' : ''} key={n}>
              {n}
            </i>
          ))}
        </div>
      </div>
    );
  }

  /* board — фотографии нет вовсе: плотная плоскость, лента орнамента со щита
     ФНТ и одно свечение акцента. */
  return (
    <div className="obh-art obh-art--board">
      <div className="obh-band" />
    </div>
  );
}

export function HeroBg({ bg }: { bg: HeroBackdrop }) {
  return (
    <div className={'obh obh--' + bg} data-to="Э14.5">
      <Art bg={bg} />
      <div className="obh-veil" />

      <div className="oa-hero-l obh-l">
        <span className="oa-live">
          <span className="d" />
          ВАС ВЫЗВАЛИ
        </span>
        <div className="oa-table o14-disp">
          <span className="t">5</span>
          <span className="k">стол</span>
        </div>
        <div className="oa-meta">
          <b>Кубок Алматы 2026</b> · 1/8 финала · одиночный разряд
        </div>
        <div className="oa-act">
          <button type="button" className="oa-go" data-to="Э14.5">
            <Play size={15} /> Открыть матч
          </button>
          <div className="oa-at">
            <b>14:20</b>
            начало
          </div>
        </div>
      </div>

      <div className="oa-foe obh-foe">
        <div className="oa-foe-top">
          <img src={FOE.av} alt="" />
          <div>
            <div className="nm o14-disp">Жумабеков Р.</div>
            <div className="sub">{FOE.sub}</div>
          </div>
        </div>
        <H2H />
      </div>
    </div>
  );
}

/* Тот же герой, когда у турнира обложки нет: содержание всё на месте, слоя под
   ним — нет. Вопрос «что показывать без фотографии» — главный при выборе:
   рисованным фонам (стол, план, табло) он не задаётся вовсе, а фотографическим
   приходится отвечать вот этим. */
export const HeroNoCover = () => <HeroBg bg="empty" />;
