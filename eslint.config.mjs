import eslintPluginAstro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default defineConfig(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.astro'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.{ts,mts,tsx,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.strict.rules,
    },
  }
);
