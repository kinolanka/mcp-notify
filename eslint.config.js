import { dirname } from 'path';
import { fileURLToPath } from 'url';

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base configuration for all files
const baseConfig = {
  languageOptions: {
    globals: {
      ...globals.node,
    },
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: {
    import: importPlugin,
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // Import rules
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'warn',
    // Basic safety rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    'no-var': 'error',

    // Simple class formatting
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: false }],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: '*' },
      {
        blankLine: 'any',
        prev: ['import', 'cjs-import'],
        next: ['import', 'cjs-import'],
      },
      {
        blankLine: 'any',
        prev: ['export', 'cjs-export'],
        next: ['export', 'cjs-export'],
      },
    ],
  },
  ignores: ['dist/**', 'node_modules/**', 'assets/**'],
};

// TypeScript specific configuration
const tsConfig = {
  files: ['**/*.ts'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
  },
  rules: {
    // Essential TypeScript rules only
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        caughtErrors: 'none',
      },
    ],
    '@typescript-eslint/consistent-type-imports': 'warn',
    'no-unused-vars': 'off', // Use TypeScript version instead
  },
};

export default [js.configs.recommended, baseConfig, tsConfig];
