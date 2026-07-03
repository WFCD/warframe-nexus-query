import { defineConfig, globalIgnores } from 'eslint/config';
import airbnb from 'eslint-stylistic-airbnb';
import importX from 'eslint-plugin-import-x';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import noNull from 'eslint-plugin-no-null';
import globals from 'globals';

/** WFCD base + ESM overrides (formerly @wfcd/eslint-config/esm). */
const wfcdRules = {
  strict: ['error', 'safe'],
  'func-names': 'off',
  'global-require': 'off',
  'no-await-in-loop': 'off',
  'no-param-reassign': 'off',
  'no-continue': 'off',
  'no-underscore-dangle': ['error', { allow: ['__basedir'] }],
  'no-fallthrough': 'off',
  'no-case-declarations': 'off',
  '@stylistic/lines-between-class-members': 'off',
  'default-case': 'off',
  'max-classes-per-file': 'off',
  'consistent-return': 'off',
  'class-methods-use-this': 'off',
  '@stylistic/linebreak-style': ['error', 'unix'],
  '@stylistic/max-len': [
    'error',
    {
      code: 120,
      tabWidth: 2,
      ignoreComments: false,
      ignoreTemplateLiterals: true,
      ignoreStrings: true,
      ignoreRegExpLiterals: true,
    },
  ],
  'import-x/no-unresolved': 'off',
  'import-x/no-extraneous-dependencies': [
    'error',
    {
      devDependencies: [
        '**/*.test.{js,cjs,mjs}',
        '**/*.spec.{js,cjs,mjs}',
        'build/**/*.{js,cjs,mjs}',
        'test/**',
      ],
    },
  ],
  'import-x/extensions': ['error', 'ignorePackages'],
  'import-x/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    },
  ],
  'no-null/no-null': 'error',
};

export default defineConfig([
  globalIgnores(['.github/**', 'docs/**', 'resources/**', 'types/**']),
  importX.configs['flat/recommended'],
  airbnb.configs['flat/recommended'],
  airbnb.configs['flat/addon-import'],
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'no-null': noNull,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: wfcdRules,
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
    rules: {
      'prefer-arrow-callback': 'off',
      'no-new': 'off',
      'no-unused-expressions': 'off',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
          optionalDependencies: false,
          peerDependencies: false,
        },
      ],
      'no-console': 'off',
    },
  },
  {
    files: ['lib/market/v2/**/*.js'],
    rules: {
      'no-null/no-null': 'off',
      'no-use-before-define': ['error', { functions: false }],
    },
  },
]);
