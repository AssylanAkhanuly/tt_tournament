# Фронт (веб) — Claude Context

**Чистый каркас.** Прежнее приложение удалено целиком (не переиспользуется).
Собираем заново по решениям из корневого `ARCHITECTURE.md`.

## Стек
- **Next.js 16** (App Router), **React 19**, **TypeScript**.
- **Стили — нативный CSS + CSS Modules** (встроено в Next, PostCSS по умолчанию).
  Токены — CSS custom properties в `app/globals.css`, каскад через `@layer`.
  **Tailwind не используем** (осознанно, см. ARCHITECTURE.md → «Стили»); никакого
  runtime CSS-in-JS. Стили компонента — рядом, в `*.module.css`.
- **Структура — Feature-Sliced Design**: `src/{shared,entities,features,widgets,views}`,
  импорт только «вниз» (`views → widgets → features → entities → shared`).
  `app/` — только Next-роутинг (тонкие `page.tsx`/`layout.tsx`), зовёт `views`.
  Алиас `@/* → src/*` (плюс fallback `./*` для `app/`).
- **Мультиязычность — i18next + react-i18next** (RU/KK/EN). Ресурсы —
  `src/shared/i18n/locales/{ru,kk,en}/*.json`. Детект — `i18next-browser-languagedetector`.
  Проводку см. `src/shared/i18n/README.md`.
- **API** — проксируется через `next.config.ts` (`/api/*` → Django), JWT в
  httpOnly-куках первой стороны.

## Команды
- `npm install` — после смены зависимостей (i18next добавлен, Tailwind убран).
- dev: `npm run dev` · build: `npm run build`
- typecheck: `node node_modules/typescript/lib/tsc.js -p tsconfig.json --noEmit`

## Конвенции
- Один компонент — своя папка в нужном слое FSD + `Component.module.css` рядом.
- Общие примитивы UI — `src/shared/ui`; бизнес-сущности — `src/entities`;
  пользовательские действия — `src/features`; составные блоки — `src/widgets`;
  композиции страниц — `src/views`.
- Никаких хардкод-цветов: только `var(--token)` из `globals.css`.
