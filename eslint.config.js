import js from '@eslint/js';
import tseslint from 'typescript-eslint';
// import prettierPlugin from 'eslint-plugin-prettier';
// import prettierConfig from 'eslint-config-prettier';

export default [
  // Add a specific ignore config at the beginning
  {
    ignores: ['dist/', 'node_modules/', 'coverage/']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // prettierConfig,
  {
    languageOptions: {
      globals: {
        // Convert your "env" settings to globals
        browser: true,
        commonjs: true,
        jest: true,
        node: true,
        // For ES2022 (equivalent to ecmaVersion 13)
        es2022: true,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'quotes': ['error', 'single', { 'allowTemplateLiterals': true }]
    }
  }
];