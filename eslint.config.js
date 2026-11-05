import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
export default [
  { ignores: ['build/**', 'coverage/**', 'node_modules/**', 'cypress/**', 'test/sample-music/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: ts.parser } } },
  {
    files: ['**/*.{js,ts,mjs,cjs,vue}'],
    languageOptions: { globals: {
      window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly',
      console: 'readonly', process: 'readonly', URL: 'readonly', HTMLCanvasElement: 'readonly',
      HTMLInputElement: 'readonly', MouseEvent: 'readonly', Storage: 'readonly',
      describe: 'readonly', it: 'readonly', test: 'readonly', expect: 'readonly',
      beforeEach: 'readonly', afterEach: 'readonly', vi: 'readonly', structuredClone: 'readonly',
      CanvasRenderingContext2D: 'readonly', setTimeout: 'readonly', fetch: 'readonly',
    } },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
];
