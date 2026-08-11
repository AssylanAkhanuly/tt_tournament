/* Просмотр схемы флоу: картинка и ничего больше.

   Раздел «Флоу» показывает СХЕМУ роли (PNG из `diagrams/out/`), а не свёрстанный
   макет: экраны, зоны, действия и состояния нарисованы на одном полотне.
   Источник — `diagrams/flow-role-NN.d2`, который генерируется из данных ролей
   (`npm run gen:diagrams`), а те перенесены из корневого `flows/*.md`. */

import './flows.css';

export function Scheme({ src, alt, source }: { src: string; alt: string; source: string }) {
  return (
    <div className="fs-scheme">
      {/* Натуральный размер: схему смотрят с прокруткой и зумом браузера,
          вписывание в окно делает подписи нечитаемыми. Клик открывает PNG
          отдельной вкладкой — там масштаб уже за браузером. */}
      <a href={src} target="_blank" rel="noreferrer" title="Открыть схему отдельно">
        <img src={src} alt={alt} />
      </a>
      <div className="fs-scheme-src">
        Схема собрана из <code>{source}</code> · исходник:{' '}
        <code>diagrams/{schemeFile(src)}.d2</code> · клик по схеме открывает её отдельной вкладкой
      </div>
    </div>
  );
}

/** Имя исходника схемы по пути картинки — для подписи под ней. */
function schemeFile(src: string) {
  return src.split('/').pop()?.replace(/\.png.*$/, '') ?? 'flow-role';
}
