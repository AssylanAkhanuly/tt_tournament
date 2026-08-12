/* Показ одного документа проекта. Разметка — `docs.css`, содержимое — `docs.ts`.

   Markdown рендерим react-markdown + remark-gfm: без gfm не работают таблицы, а
   в наших документах их много (роли, категории турниров, значения рейтинга).

   Ссылки открываем в новой вкладке: история живёт в iframe Storybook, и переход
   внутри него выкинул бы читателя из интерфейса без кнопки «назад». */

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Doc } from './docs';
import './docs.css';

export function DocPage({ doc }: { doc: Doc }) {
  return (
    <div className="doc">
      <div className="doc-head">
        <span className="doc-path">{doc.path}</span>
        <div className="doc-hint">{doc.hint}</div>
      </div>
      <div className="doc-body">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ children, ...p }) => (
              <a {...p} target="_blank" rel="noreferrer">{children}</a>
            ),
            // Широкую таблицу прокручиваем внутри её обёртки, иначе страница
            // получает горизонтальную прокрутку целиком.
            table: ({ children, ...p }) => (
              <div className="doc-table"><table {...p}>{children}</table></div>
            ),
          }}
        >
          {doc.text}
        </Markdown>
      </div>
    </div>
  );
}
