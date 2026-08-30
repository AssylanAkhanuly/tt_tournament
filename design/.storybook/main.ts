import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-links'],
  framework: { name: '@storybook/react-vite', options: {} },
  // Подключаем настоящий компонент сетки из front/ (React Flow), а не мокап.
  // Алиас `@` резолвит его импорты `@/entities/*`; dedupe — один React на всех
  // (design 18, front 19), иначе invalid hook call.
  async viteFinal(cfg) {
    // Tailwind подключаем плагином Vite, а не через postcss.config.js: свой
    // конфиг Storybook ищет от собственного корня и наш не находит — классы
    // молча не генерировались, компоненты HeroUI приезжали без стилей.
    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias as Record<string, string> | undefined),
      '@': resolve(process.cwd(), '../front/src'),
    };
    cfg.resolve.dedupe = [...(cfg.resolve.dedupe ?? []), 'react', 'react-dom', '@xyflow/react'];
    // Раздел «Флоу» подключает схемы прямо из `diagrams/out/*.png` — это вне
    // корня проекта, и dev-серверу нужно разрешить чтение оттуда. Копии в
    // `design/` не держим: те же мегабайты лежали бы в репозитории дважды.
    cfg.server ??= {};
    cfg.server.fs = { ...(cfg.server.fs ?? {}), allow: [resolve(process.cwd(), '..')] };
    return cfg;
  },
};

export default config;
