// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist', 'node_modules'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 🌍 GLOBAL RULES - Progressively stricter type safety
  {
    rules: {
      // Type safety - warn first, then error
      '@typescript-eslint/no-explicit-any': 'warn',

      // Unsafe operations - enabled as warnings for gradual migration
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Method binding - keep off for NestJS patterns
      '@typescript-eslint/unbound-method': 'off',

      // Async safety - critical for catching unhandled promises
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // 🎯 CONTROLLERS (HTTP LAYER) - Stricter rules for API surface
  {
    files: ['src/interface/http/**/*.ts'],
    rules: {
      // Allow any only where absolutely necessary (DTOs from external sources)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/unbound-method': 'off',
      // Keep async rules enabled for proper promise handling
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  // 🧱 INFRASTRUCTURE (Prisma, external services)
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // 🧪 TESTS
  {
    files: ['test/**/*.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // 🧩 DECORATORS (NestJS)
  {
    files: ['src/interface/**/decorators/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  // 🧠 DOMAIN & APPLICATION LAYER REALITY MODE
  {
    files: ['src/core/domain/**/*.ts', 'src/core/application/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },

  // ☁️ STORAGE / CLOUD / EXTERNAL PROVIDERS
  {
    files: ['src/core/application/**/storage/**/*.ts'],
    rules: {
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
    },
  },

  // 📊 REPORTING / ANALYTICS
  {
    files: ['src/infrastructure/**/reports/**/*.ts'],
    rules: {
      '@typescript-eslint/no-base-to-string': 'off',
    },
  },
);
