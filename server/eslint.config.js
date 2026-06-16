import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['src/tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**'],
  },
];
