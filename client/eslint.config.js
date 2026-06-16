import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  { ignores: ['dist/**', '.astro/**', 'node_modules/**'] },
];
