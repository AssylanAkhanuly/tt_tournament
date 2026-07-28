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
    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias as Record<string, string> | undefined),
      '@': resolve(process.cwd(), '../front/src'),
    };
    cfg.resolve.dedupe = [...(cfg.resolve.dedupe ?? []), 'react', 'react-dom', '@xyflow/react'];
    return cfg;
  },
};

export default config;
