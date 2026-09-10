/* Адрес импортированной картинки ✳ (10.09.2026).

   Кит собирают два сборщика, и импорт `*.svg` / `*.png` у них разный: Vite
   (Storybook) отдаёт адрес строкой, Next — объект `{ src, width, height }`.
   Объект, отданный в `src` или в `url(…)`, превращается в «[object Object]»:
   так в приложении вместо знака ФНТ показывалась подпись. Один помощник на
   весь кит — чтобы следующая картинка не наступила на то же. */

export const assetUrl = (imported: unknown): string =>
  typeof imported === 'string' ? imported : (imported as { src: string }).src;
